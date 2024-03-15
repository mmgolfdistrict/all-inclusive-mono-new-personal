import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, desc, eq, lt, sql } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { auctions } from "@golf-district/database/schema/auctions";
import type { SelectAuctions } from "@golf-district/database/schema/auctions";
import { bids } from "@golf-district/database/schema/bids";
import { users } from "@golf-district/database/schema/users";
import { assetToURL, currentUtcTimestamp, dateToUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { HyperSwitchService } from "../payment-processor/hyperswitch.service";

/**
 * Provides methods for creating, managing, and querying auctions.
 *
 * This service uses a provided `Db` instance to interact with the database to perform
 * operations related to auctions, such as creating an auction, canceling an auction, and others.
 */
export class AuctionService {
  private readonly logger = Logger(AuctionService.name);

  /**
   * Initializes a new instance of the `AuctionService`.
   *
   * @param database - The database client used to perform auction-related operations.
   */
  constructor(private readonly database: Db, private readonly hyperSwitch: HyperSwitchService) {}

  /**
   * Creates a new auction for a specified course ID.
   *
   * @param createdById - The ID of the user who creates the auction.
   * @param courseId - The ID of the course for which the auction is being created.
   * @param entityId - The ID of the entity associated with the auction.
   * @param startDate - The start date of the auction.
   * @param endDate - The end date of the auction.
   * @param imageAssetIds - An array of IDs of image assets associated with the auction.
   * @param description - A description of the auction.
   * @param startingPrice - The starting price for the auction.
   * @param buyNowPrice - [Optional] A "Buy Now" price for the auction.
   * @returns A promise that resolves when the auction is created.
   * @throws Will throw an error if the auction creation fails or if the start date is in the past.
   */
  createAuctionForCourseId = async (
    createdById: string,
    courseId: string,
    entityId: string,
    startDate: Date,
    endDate: Date,
    imageAssetIds: string[],
    description: string,
    startingPrice: number,
    buyNowPrice?: number
  ): Promise<void> => {
    if (startDate.getTime() < new Date().getTime()) {
      console.log("error");
      this.logger.error("Starting bid time cannot be in the past");
      throw new Error("Starting bid time cannot be in the past");
    }
    if (startDate.getTime() > endDate.getTime()) {
      this.logger.error("Starting bid time cannot be after end bid time");
      throw new Error("Starting bid time cannot be after end bid time");
    }
    this.logger.info(`Creating auction for course ${courseId}`);
    const auction = {
      id: randomUUID(),
      createdById,
      courseId,
      entityId,
      startDate: dateToUtcTimestamp(startDate),
      endDate: dateToUtcTimestamp(endDate),
      imageAssetIds,
      description,
      startingPrice,
      buyNowPrice,
      createdAt: currentUtcTimestamp,
    };
    await this.database
      .insert(auctions)
      .values(auction)
      .catch((err) => {
        this.logger.error(`Error creating auction: ${err}`);
        throw new Error("Error creating auction");
      });
  };

  /**
   * Cancels an ongoing auction.
   *
   * This method updates the `endDate` of the auction to the current UTC timestamp and sets the `canceledBy` field.
   *
   * @param canceledBy - The ID of the user who is canceling the auction.
   * @param auctionId - The ID of the auction to be canceled.
   * @returns A promise that resolves when the auction is canceled.
   * @throws Will throw an error if the auction cancelation fails.
   */
  cancelAuction = async (canceledBy: string, auctionId: string): Promise<void> => {
    this.logger.info(`Cancelling auction ${auctionId}`);
    await this.database
      .update(auctions)
      .set({
        endDate: currentUtcTimestamp(),
        canceledBy: canceledBy,
      })
      .where(and(eq(auctions.id, auctionId), lt(auctions.endDate, currentUtcTimestamp())))
      .execute()
      .catch((err) => {
        this.logger.error(`Error cancelling auction: ${err}`);
        throw new Error("Error cancelling auction");
      });
  };

  /**
   * Retrieves auctions for a specified course with cursor-based pagination.
   *
   * This function fetches a list of auctions associated with a given course ID, ordered by the start date of the
   * auctions in descending order. Optionally, a cursor and a limit can be provided to paginate through the auctions.
   * If a cursor is provided, only auctions with a start date earlier than the cursor will be retrieved.
   *
   * @param courseId - The ID of the course for which to retrieve the auctions.
   * @param cursor - [Optional] A timestamp used as a cursor for pagination. If provided, only auctions with a start date
   * earlier than this timestamp will be retrieved.
   * @param limit - [Optional] The maximum number of auctions to retrieve. Defaults to 10.
   * @returns A promise that resolves to an object containing:
   *  - `auctions`: An array of up to `limit` auctions for the specified course.
   *  - `nextCursor`: A timestamp to be used as a cursor for fetching the next page of auctions, or `null` if there are no more pages.
   * @throws Will throw an error if there is an issue retrieving the auctions from the database.
   * @Todo add highest bid
   */
  getAuctionsForCourse = async (
    courseId: string,
    cursor?: string,
    limit = 10
  ): Promise<{ auctions: SelectAuctions[]; nextCursor: string | null }> => {
    this.logger.info(`Getting auctions for course ${courseId}`);

    let query = this.database
      .select()
      .from(auctions)
      .orderBy(desc(auctions.startDate))
      .limit(limit + 1);
    if (cursor) {
      query.where(lt(auctions.startDate, cursor));
    } else {
      query.where(eq(auctions.courseId, courseId));
    }

    const results = await query.execute().catch((err) => {
      this.logger.error(`Error getting auctions for course: ${err}`);
      throw new Error("Error getting auctions");
    });

    let nextCursor: null | string = null;
    if (results.length === limit + 1) {
      nextCursor = results[limit - 1]!.startDate;
      results.pop();
    }

    return { auctions: results, nextCursor };
  };

  /**
   * Places a bid on a specified auction by a user.
   *
   * The function validates the bid against several conditions including auction existence,
   * auction end date, starting price, and the current highest bid. If the bid is valid,
   * it is added to the database.
   *
   * @param userId - The ID of the user placing the bid.
   * @param auctionId - The ID of the auction being bid on.
   * @param bidAmount - The amount of the bid being placed.
   * @param paymentMethodId - The ID of the payment method to be used for the bid.
   * @returns A promise that resolves to void.
   * @throws Will throw an error if the bid is invalid or if there are issues placing the bid.
   */
  //@TODO fix
  placeBid = async (
    userId: string,
    auctionId: string,
    bidAmount: number,
    paymentMethodId?: string
  ): Promise<void> => {
    this.logger.info(`Placing bid for auction ${auctionId}`);
    const auction = await this.database
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting auction: ${err}`);
        throw new Error("Error getting auction");
      });
    if (!auction[0]) {
      this.logger.warn(`Auction ${auctionId} not found`);
      throw new Error("Auction not found");
    }
    if (auction[0].endDate < currentUtcTimestamp()) {
      this.logger.warn(`Auction ${auctionId} has ended`);
      throw new Error("Auction has ended");
    }
    if (auction[0].startingPrice > bidAmount) {
      this.logger.warn(`Bid amount must be greater than starting price`);
      throw new Error("Bid amount must be greater than starting price");
    }
    if (auction[0].buyNowPrice && auction[0].buyNowPrice < bidAmount) {
      this.logger.warn(`Bid amount must be less than buy now price`);
      throw new Error("Bid amount must be less than buy now price");
    }
    const [currentHighestBid] = await this.database
      .select({ value: sql<number>`max(${bids.amount})` })
      .from(bids)
      .where(eq(bids.id, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting highest bid: ${err}`);
        throw new Error("Error getting highest bid");
      });
    if (currentHighestBid && currentHighestBid.value > 0) {
      if (currentHighestBid.value >= bidAmount) {
        this.logger.warn(`Bid amount must be greater than current highest bid`);
        throw new Error("Bid amount must be greater than current highest bid");
      }
    }
    //Check to make sure the user has a card on file
    const paymentMethods = await this.hyperSwitch.retrievePaymentMethods(userId, {
      type: "card",
    });
    if (!paymentMethods?.data[0] || paymentMethods.data.length === 0) {
      this.logger.warn(`User ${userId} does not have a card on file`);
      throw new Error("User does not have a card on file");
    }
    // if (
    //   paymentMethodId &&
    //   !paymentMethods.data.find((paymentMethod) => paymentMethod.id === paymentMethodId)
    // ) {
    //   this.logger.warn(`User ${userId} does not have a card on file with id ${paymentMethodId}`);
    //   throw new Error(`User does not have a card with id: ${paymentMethodId} on file`);
    // }
    const [user] = await this.database
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, userId));
    //Create a payment intent
    const paymentIntent = await this.hyperSwitch
      .createPaymentIntent({
        customer_id: userId,
        amount: bidAmount,
        capture_method: "manual",
        currency: "USD",
        name: user?.name,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        //payment_method: paymentMethodId ? paymentMethodId : paymentMethods.data[0].id,
      })
      .catch((err) => {
        this.logger.error(`Error creating payment intent: ${err}`);
        throw new Error("Error creating payment intent");
      });
    if (!paymentIntent.client_secret) {
      this.logger.error(`Error creating payment intent: ${paymentIntent}`);
      throw new Error("Error creating payment intent");
    }
    await this.database
      .insert(bids)
      .values({
        id: randomUUID(),
        userId,
        auctionId,
        amount: bidAmount,
        paymentIntentClientSecret: paymentIntent.client_secret,
        createdAt: currentUtcTimestamp(),
      })
      .execute()
      .catch((err) => {
        console.log(err);
        this.logger.error(`Error placing bid: ${err}`);
        throw new Error("Error placing bid");
      });
  };

  /**
   * Executes a "Buy Now" operation for a specified auction by a user.
   *
   * The function validates the operation against several conditions including auction existence
   * and the availability of a "Buy Now" price. If the operation is valid, the auction is updated
   * and the purchase is recorded in the database.
   *
   * @param userId - The ID of the user making the purchase.
   * @param auctionId - The ID of the auction being purchased.
   * @returns A promise that resolves to void.
   * @throws Will throw an error if the purchase is invalid or if there are issues recording the purchase.
   */
  buyNow = async (userId: string, auctionId: string): Promise<{ clientSecret: string | null }> => {
    this.logger.info(`Buying now for auction ${auctionId}`);
    const [auction] = await this.database
      .select({ buyNowPrice: auctions.buyNowPrice })
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting auction: ${err}`);
        throw new Error("Error getting auction");
      });
    if (!auction) {
      this.logger.warn(`Auction ${auctionId} not found`);
      throw new Error("Auction not found");
    }
    if (!auction!.buyNowPrice) {
      this.logger.warn(`Auction ${auctionId} does not have a buy now price`);
      throw new Error("Auction does not have a buy now price");
    }
    const [user] = await this.database
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
      })
      .from(users)
      .where(eq(users.id, userId));
    //Create payment intent with expiration charge card on file
    const paymentIntent = await this.hyperSwitch
      .createPaymentIntent({
        customer: userId,
        amount: auction.buyNowPrice,
        currency: "USD",
        name: user?.name,
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        metadata: {
          auction_id: auctionId,
        },
      })
      .catch((err) => {
        this.logger.error(`Error creating payment intent: ${err}`);
        throw new Error("Error creating payment intent");
      });
    return {
      clientSecret: paymentIntent.client_secret,
    };
  };

  /**
   * Finalizes a specified auction, determining and handling the winning bid.
   * @notice This is called to finalize an auction at its end time and there has not been a "Buy Now" purchase.
   *
   * The function validates the operation against several conditions, including auction existence
   * and whether the auction has ended. If the operation is valid, the auction is finalized
   * and relevant actions (such as charging a payment card) are to be performed.
   *
   * @param finalizeById - The ID of the entity finalizing the auction.
   * @param auctionId - The ID of the auction being finalized.
   * @returns A promise that resolves to the value of the highest bid.
   * @throws Will throw an error if the auction cannot be finalized or if there are issues determining the winning bid.
   */
  finalizeAuction = async (auctionId: string) => {
    this.logger.info(`Finalizing auction ${auctionId}`);
    const auction = await this.database
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting auction: ${err}`);
        throw new Error("Error getting auction");
      });
    if (!auction[0]) {
      this.logger.warn(`Auction ${auctionId} not found`);
      throw new Error("Auction not found");
    }
    if (auction[0].endDate > currentUtcTimestamp()) {
      this.logger.warn(`Auction ${auctionId} has not ended`);
      throw new Error("Auction has not ended cancel the auction first");
    }
    const currentHighestBid = await this.database
      .select({
        value: bids.amount,
        paymentIntentClientSecret: bids.paymentIntentClientSecret,
      })
      .from(bids)
      .where(eq(auctions.id, auctionId))
      .limit(1) //only need the highest bid
      .orderBy(desc(bids.amount))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting highest bid: ${err}`);
        throw new Error("Error getting highest bid");
      });
    if (!currentHighestBid[0]) {
      this.logger.warn(`Auction ${auctionId} has no bids`);
      throw new Error("Auction has no bids");
    }
    //capture payment for highest bid
    const capturedPayment = await this.hyperSwitch
      .capturePaymentIntent(currentHighestBid[0].paymentIntentClientSecret)
      .catch((err) => {
        this.logger.error(`Error capturing payment intent: ${err}`);
        throw new Error("Error capturing payment intent");
      });
    return {
      highestBidder: currentHighestBid[0].value,
      paymentStatus: capturedPayment.status,
    };
  };

  /**
   * Finalizes a specified auction, from buyNow webhook.
   *
   * This method is called to finalize an auction based on a Buy Now operation.
   * It updates the `endDate` of the auction to the current UTC timestamp and records the purchase in the database.
   *
   * @param {string} auctionId - The ID of the auction being finalized.
   * @param {string} userId - The ID of the user making the purchase.
   * @param {string} payment_secret - The payment secret associated with the Buy Now operation.
   * @returns {Promise<void>} A promise that resolves when the auction is successfully finalized.
   * @throws {Error} Throws an error if there are issues finalizing the auction or recording the purchase.
   * @example
   * // Example usage:
   * await auctionService.buyNowCallBack("auction123", "user456", "paymentSecret789");
   */
  buyNowCallBack = async (auctionId: string, userId: string, payment_secret: string) => {
    const [auction] = await this.database
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting auction: ${err}`);
        throw new Error("Error getting auction");
      });
    if (!auction) {
      this.logger.fatal(`BuyNow callback auction not found: ${auctionId}`);
      throw new Error("Error getting auction");
    }
    if (!auction!.buyNowPrice) {
      this.logger.fatal(`BuyNow callback Auction ${auctionId} does not have a buy now price`);
      throw new Error("Auction does not have a buy now price");
    }
    await this.database
      .transaction(
        async (tx) => {
          await tx.update(auctions).set({ endDate: currentUtcTimestamp() }).where(eq(auctions.id, auctionId));
          await tx.insert(bids).values({
            id: randomUUID(),
            userId: userId,
            auctionId: auctionId,
            amount: auction.buyNowPrice!,
            createdAt: currentUtcTimestamp(),
            paymentIntentClientSecret: payment_secret,
          });
        },
        {
          isolationLevel: "read committed",
          accessMode: "read write",
          withConsistentSnapshot: true,
        }
      )
      .catch((err) => {
        this.logger.fatal(`Error buying now: ${err}`);
        throw new Error("Error buying now");
      });
  };

  /**
   * Retrieves details of a specified auction by its ID.
   *
   * The function fetches details including the auction itself, the highest bid amount, the asset URL, and the bid count.
   *
   * @param {string} auctionId - The ID of the auction for which to retrieve details.
   * @returns {Promise<{ auction: SelectAuctions; highestBid: number; assetUrl: string; bidCount: number }>} A promise that resolves to an object containing:
   *  - `auction`: Details of the auction.
   *  - `highestBid`: The amount of the highest bid on the auction.
   *  - `assetUrl`: The URL of the associated asset (image).
   *  - `bidCount`: The total count of bids on the auction.
   * @throws {Error} Throws an error if there are issues retrieving auction details.
   * @example
   * // Example usage:
   * const auctionDetails = await auctionService.getAuctionById("auction123");
   * console.log(auctionDetails);
   */
  getAuctionById = async (
    auctionId: string
  ): Promise<{ auction: SelectAuctions; highestBid: number; assetUrl: string; bidCount: number }> => {
    this.logger.info(`Getting auction ${auctionId}`);

    // Fetch auction details
    const [data] = await this.database
      .select({
        auction: auctions,
        asset: {
          assetId: assets.id,
          assetKey: assets.key,
          assetCdn: assets.cdn,
          assetExtension: assets.extension,
        },
      })
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .leftJoin(assets, eq(assets.auctionId, auctions.id))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting auction: ${err}`);
        throw new Error("Error getting auction");
      });

    if (!data) {
      this.logger.warn(`Auction ${auctionId} not found`);
      throw new Error("Auction not found");
    }
    const { auction, asset } = data;

    let imageUrl: string = "";
    if (!asset) {
      imageUrl = "/defaults/default-auction.webp";
    } else {
      imageUrl = assetToURL({
        key: asset.assetKey,
        cdn: asset.assetCdn,
        extension: asset.assetExtension,
      });
    }

    // Fetch highest bid and bid count
    const bidData = await this.database
      .select({
        highestBid: sql<number>`max(${bids.amount})`,
        bidCount: sql<number>`count(*)`,
      })
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting bid data: ${err}`);
        throw new Error("Error getting bid data");
      });

    let highestBid: number;
    let bidCount: number;
    if (bidData && bidData[0]) {
      highestBid = bidData[0].highestBid;
      bidCount = bidData[0].bidCount;
    } else {
      highestBid = 0;
      bidCount = 0;
    }

    return {
      auction,
      assetUrl: imageUrl,
      highestBid,
      bidCount,
    };
  };
}
