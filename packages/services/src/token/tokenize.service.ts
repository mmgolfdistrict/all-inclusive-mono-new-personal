import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, eq, inArray } from "@golf-district/database";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import { bookingslots, InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { entities } from "@golf-district/database/schema/entities";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import type { InsertTransfer } from "@golf-district/database/schema/transfers";
import { transfers } from "@golf-district/database/schema/transfers";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import { textChangeRangeIsUnchanged } from "typescript";
import type { ProductData } from "../checkout/types";
import { CustomerCart } from "../checkout/types";
import type { NotificationService } from "../notification/notification.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import { TeeTime } from "../tee-sheet-provider/sheet-providers/types/foreup.type";

/**
 * Service class for handling booking tokenization, transfers, and updates.
 */
export class TokenizeService {
  private logger = Logger(TokenizeService.name);

  /**
   * Constructor for the `TokenizeService` class.
   *
   * @param {Db} database - The database instance.
   * @example
   * const tokenizeService = new TokenizeService(database);
   */
  constructor(private readonly database: Db, private readonly notificationService: NotificationService) {}
  /**
   * Tokenize a booking for a user. This function either books an existing tee time or creates a new one based on the provided details.
   *
   * @param userId - The unique identifier of the user initiating the booking.
   * @param expiration - The date and time when the booking will expire.
   * @param numberOfHoles - The number of holes the user wants to play.
   * @param courseId - The unique identifier of the course where the booking is made.
   * @param purchasedFor - The amount for which the booking was purchased.
   * @param teeTimeInfo - Optional information related to the tee time. It can contain:
   *   - `teeTimeId`: An existing tee time ID if booking an existing slot.
   *   - `numberOfPlayers`: The number of players for the tee time.
   *   - `override`: Overrides for the booking details, which can include:
   *     - `carts`: Number of carts required.
   *     - `numberOfHoles`: Number of holes if different from the main parameter.
   *     - `maxBookings`: Maximum bookings allowed for the tee time.
   *     - `entityId`: Entity associated with the tee time.
   * @returns A promise that resolves once the booking is successfully tokenized.
   * @throws Error - Throws an error if:
   *   - The userId is not provided.
   *   - The specified tee time does not exist.
   *   - The maximum bookings for a tee time have been reached.
   *   - There are issues interacting with the underlying data store (Prisma).
   */
  async tokenizeBooking(
    userId: string,
    purchasePrice: number,
    players: number, //how many bookings to make
    providerBookingId: string, //the tee time ids to book
    providerTeeTimeId: string, //all tee times to be tokenized are purchased from a provider
    paymentId: string,
    withCart?: boolean,
    provider?: ProviderAPI,
    token?: string,
    teeTime?: {
      id: string;
      courseId: string;
      entityId: string;
      date: string;
      providerCourseId: string | null;
      providerTeeSheetId: string | null;
      providerId: string;
      internalId: string | null;
      providerDate: string;
      holes: number;
    }
  ): Promise<void> {
    this.logger.info(`tokenizeBooking tokenizing booking id: ${providerTeeTimeId} for user: ${userId}`);
    //@TODO add this to the transaction
    debugger
    const [existingTeeTime] = await this.database
      .select({
        id: teeTimes.id,
        entityId: teeTimes.entityId,
        date: teeTimes.date,
        courseId: teeTimes.courseId,
        numberOfHoles: teeTimes.numberOfHoles,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFee,
        courseName: courses.name,
        customerName: users.name,
        entityName: entities.name,
        providerDate: teeTimes.providerDate,
      })
      .from(teeTimes)
      .where(eq(teeTimes.id, providerTeeTimeId))
      .leftJoin(entities, eq(teeTimes.entityId, entities.id))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(users, eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        return [];
      });

    if (!existingTeeTime) {
      //how has a booking been created for a tee time that does not exist? big problem
      this.logger.fatal(`TeeTime with ID: ${providerTeeTimeId} does not exist.`);
      throw new Error(`TeeTime with ID: ${providerTeeTimeId} does not exist.`);
    }
    if (existingTeeTime.availableFirstHandSpots < players) {
      this.logger.fatal(`TeeTime with ID: ${providerTeeTimeId} does not have enough spots.`);
      throw new Error(`TeeTime with ID: ${providerTeeTimeId} does not have enough spots.`);
    }

    const [customerCartData]: any = await this.database
      .select({ cart: customerCarts.cart, cartId: customerCarts.id })
      .from(customerCarts)
      .where(
        and(
          eq(customerCarts.courseId, existingTeeTime.courseId),
          eq(customerCarts.userId, userId),
          eq(customerCarts.paymentId, paymentId)
        )
      )
      .execute();

    const bookingsToCreate: InsertBooking[] = [];
    const transfersToCreate: InsertTransfer[] = [];
    const transactionId = randomUUID();
    const bookingId = randomUUID();

    bookingsToCreate.push({
      id: bookingId,
      purchasedAt: currentUtcTimestamp(),
      purchasedPrice: purchasePrice,
      // time: existingTeeTime.date,
      providerBookingId: providerBookingId,
      // withCart: withCart,
      isListed: false,
      numberOfHoles: existingTeeTime.numberOfHoles,
      minimumOfferPrice: 0,
      ownerId: userId,
      // courseId: existingTeeTime.courseId,
      teeTimeId: existingTeeTime.id,
      nameOnBooking: "Guest",
      includesCart: withCart,
      listId: null,
      // entityId: existingTeeTime.entityId,
      cartId: customerCartData?.cartId
    });

    transfersToCreate.push({
      id: randomUUID(),
      amount: purchasePrice,
      bookingId: bookingId,
      transactionId: transactionId,
      fromUserId: "0x000", //first hand sales are from the platform
      toUserId: userId,
      courseId: existingTeeTime.courseId,
      purchasedPrice: purchasePrice,
    });

    //create bookings according to slot in bookingslot tables
    const bookingSlots =
      (await provider?.getSlotIdsForBooking(
        bookingId,
        players,
        userId,
        providerBookingId,
        provider.providerId,
        existingTeeTime.courseId
      )) || [];

    for (let i = 0; i < bookingSlots.length; i++) {
      if (i != 0) {
        await provider?.updateTeeTime(
          token || "",
          teeTime?.providerCourseId || "",
          teeTime?.providerTeeSheetId || "",
          providerBookingId,
          {
            data: {
              type: "Guest",
              id: providerBookingId,
              attributes: {
                type: "Guest",
                name: "Guest",
                paid: false,
                cartPaid: false,
                noShow: false,
              },
            },
          },
          bookingSlots[i]?.slotnumber
        );
      }
    }
    //create all booking in a transaction to ensure atomicity
    await this.database.transaction(async (tx) => {
      //create each booking
      await tx
        .insert(bookings)
        .values(bookingsToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          tx.rollback();
        });
      await tx
        .insert(bookingslots)
        .values(bookingSlots)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          tx.rollback();
        });
      await tx
        .update(teeTimes)
        .set({
          availableSecondHandSpots: existingTeeTime.availableSecondHandSpots + players,
          availableFirstHandSpots: existingTeeTime.availableFirstHandSpots - players,
        })
        .where(eq(teeTimes.id, existingTeeTime.id))
        .execute();
      await tx
        .insert(transfers)
        .values(transfersToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          tx.rollback();
        });
    });

    const message = `
${players} tee times have been purchased for ${existingTeeTime.date} at ${existingTeeTime.courseId}
    price per booking: ${purchasePrice} 

    ${providerBookingId}

    This is a first party purchase from the course
    `;

    const primaryGreenFeeCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "first_hand")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const convenienceCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "convenience_fee")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const taxCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "taxes")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const sensibleCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "sensible")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const charityCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "charity")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const taxes = taxCharge + sensibleCharge + charityCharge + convenienceCharge;
    const dateTime = dayjs(existingTeeTime.providerDate).utcOffset("-06:00");

    const template = {
      CustomerFirstName: existingTeeTime.customerName?.split(" ")[0],
      CourseName: existingTeeTime.courseName || "-",
      GolfDistrictReservationID: bookingsToCreate?.[0]?.id || "-",
      CourseReservationID: providerBookingId || "-",
      FacilityName: existingTeeTime.entityName || "-",
      PlayDateTime: dateTime.format("YYYY-MM-DD hh:mm A") || "-",
      NumberOfHoles: existingTeeTime.numberOfHoles,
      GreenFees:
        `$${primaryGreenFeeCharge.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}` || "-",
      TaxesAndOtherFees:
        `$${taxes.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}` || "-",
      SensibleWeatherIncluded: sensibleCharge ? "Yes" : "No",
      PurchasedFrom: existingTeeTime.courseName || "-",
    };

    await this.notificationService.createNotification(
      userId,
      "TeeTimes Purchased",
      message,
      existingTeeTime.courseId,
      process.env.SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID,
      template
    );
  }

  /**
   * Transfers a bookings from one user to another.
   * @param userId - The ID of the user initiating the transfer.
   * @param bookingId - array ID of the booking.
   * @param newUserId - The ID of the user to whom the booking is being transferred.
   * @returns A promise that resolves to the updated booking.
   */
  transferBookings = async (userId: string, bookingIds: string[], newOwnerId: string, price: number) => {
    //validate the user owns each booking
    const bookingsToTransfer = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        courseId: teeTimes.courseId,
      })
      .from(bookings)
      .leftJoin(teeTimes,eq(teeTimes.id,bookings.teeTimeId))
      .where(and(inArray(bookings.id, bookingIds), eq(bookings.ownerId, userId)))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error(`Error finding bookings with id: ${bookingIds}`);
      });
    if (!bookingsToTransfer) {
      throw new Error("No bookings found to transfer");
    }
    if (bookingsToTransfer.length !== bookingIds.length) {
      throw new Error("Not all bookings found to transfer");
    }
    if (!bookingsToTransfer.every((booking) => booking.ownerId === userId)) {
      throw new Error("Not all bookings found to transfer belong to the user");
    }
    const transactionId = randomUUID();
    //transfer the bookings
    // await this.database.transaction(async (tx) => {
    //   for (const booking of bookingsToTransfer) {
    //     await tx
    //       .update(bookings)
    //       .set({
    //         ownerId: newOwnerId,
    //         nameOnBooking: "Guest",
    //       })
    //       .where(eq(bookings.id, booking.id))
    //       .execute()
    //       .catch((err) => {
    //         this.logger.error(err);
    //         tx.rollback();
    //       });
    //     await tx
    //       .insert(transfers)
    //       .values({
    //         id: randomUUID(),
    //         transactionId: transactionId,
    //         amount: price,
    //         bookingId: booking.id,
    //         fromUserId: userId,
    //         toUserId: newOwnerId,
    //         courseId: booking.courseId??"",
    //         purchasedPrice: price,
    //       })
    //       .execute()
    //       .catch((err) => {
    //         this.logger.error(err);
    //         tx.rollback();
    //       });
    //   }
    // });

    const message1 = `
    ${bookingIds.length} tee times have been transferred to you This is to the new owner of the bookings the provider ids: ${bookingIds}
    `;

    // await this.notificationService.createNotification(
    //   newOwnerId,
    //   "TeeTimes Purchased",
    //   message1,
    //   bookingsToTransfer[0]?.courseId
    // );

    const message2 = `
    ${bookingIds.length} bookings have been purchased this is to the old owner of the bookings
    Transfers bookings: 
    `;
    // await this.notificationService.createNotification(
    //   userId,
    //   "TeeTimes Sold",
    //   message2,
    //   bookingsToTransfer[0]?.courseId
    // );
  };

  /**
   * Adds names to owned bookings.
   *
   * @param userId - The ID of the user updating the booking names.
   * @param bookingIds - An array of booking IDs to be updated.
   * @param names - An array of names to be added to the corresponding bookings.
   * @returns A promise that resolves once the names are added to the bookings.
   * @throws Error - Throws an error if there are issues interacting with the data store (Prisma).
   * @example
   * await tokenizeService.addNamesToOwnedBookings("user123", ["booking123", "booking456"], ["John", "Jane"]);
   */
  addNamesToOwnedBookings = async (
    userId: string,
    bookingIds: string[],
    names: { name: string; playerId?: string }[]
  ) => {
    //validate teh user owns each booking
    const data = await this.database
      .select({
        ownerId: bookings.ownerId,
      })
      .from(bookings)
      .where(and(inArray(bookings.id, bookingIds), eq(bookings.ownerId, userId)));
    if (!data) {
      this.logger.warn(`No bookings found to update`);
      throw new Error("No bookings found to update");
    }
    if (data.length !== bookingIds.length) {
      this.logger.warn(`Not all owned by user`);
      throw new Error("Not all bookings found to update");
    }
    const golfDistrictPlayers = names.map((name) => name.playerId);
    //const playerNames
    await this.database
      .transaction(async (tx) => {
        for (let i = 0; i < bookingIds.length; i++) {
          const toUpdate = bookingIds[i]!;
          await tx
            .update(bookings)
            .set({
              nameOnBooking: names[i]?.name,
            })
            .where(eq(bookings.id, toUpdate))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error updating booking with id: ${bookingIds[i]}`);
            });
        }
      })
      .catch((err) => {
        this.logger.error(err);
        throw new Error(`Error updating booking with id: ${bookingIds}`);
      });
  };
}
