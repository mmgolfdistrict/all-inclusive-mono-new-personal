import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, eq, sql } from "@golf-district/database";
import type { InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
import { userProviderCourseLink } from "@golf-district/database/schema/userProviderCourseLink";
import { users } from "@golf-district/database/schema/users";
import Logger from "@golf-district/shared/src/logger";
import { CacheService } from "../infura/cache.service";
import type { ForeUpCredentials } from "./sheet-providers";
import { foreUp, type ProviderAPI } from "./sheet-providers";
import type {
  BookingResponse,
  CustomerCreationData,
  TeeTimeResponse,
} from "./sheet-providers/types/foreup.type";

export interface Customer {
  playerNumber: number | null;
  customerId: number | null;
  name: string | null;
  username: string | null;
}
/**
 * Service class for handling Tee Sheet providers.
 */
export class ProviderService extends CacheService {
  private readonly teeSheetProviders: ProviderAPI[];

  /**
   * Constructor for the `ProviderService` class.
   *
   * @param {Db} database - The database instance.
   * @param {string} redisUrl - The URL of the Redis server.
   * @param {string} redisToken - The authentication token for Redis.
   * @param {ForeUpCredentials} foreUpCredentials - Credentials required for ForeUp provider.
   * @example
   * const providerService = new ProviderService(database, "redis://localhost:6379", "your-redis-token", foreUpCredentials);
   */
  constructor(
    private readonly database: Db,
    redisUrl: string,
    redisToken: string,
    foreUpCredentials: ForeUpCredentials,
  ) {
    super(redisUrl, redisToken, Logger(ProviderService.name));
    //this will need to be refactored to allow for providers with different credentials per course
    this.teeSheetProviders = [new foreUp(foreUpCredentials)]
  }

  /**
   * Retrieves a provider by its ID.
   * @param providerId - The ID of the provider to retrieve.
   * @throws Will throw an error if the provider is not found.
   * @returns The provider API instance.
   */
  getProviderAndKey = async (
    internalProviderIdentifier: string,
    courseId: string,
    providerCourseConfiguration?: string
  ): Promise<{ provider: ProviderAPI; token: string }> => {
    this.logger.info(`getProvider called with providerId: ${internalProviderIdentifier}`);
    const provider = this.teeSheetProviders.find((p) => p.providerId === internalProviderIdentifier);

    if (!provider) {
      this.logger.fatal(`Provider with ID ${internalProviderIdentifier} not found`);
      throw new Error(`Provider with ID ${internalProviderIdentifier} not found`);
    }

    provider.providerConfiguration = providerCourseConfiguration;
    let token = await this.getCache(
      `provider-${internalProviderIdentifier}-${courseId}-${process.env.NODE_ENV}`
    )!;
    if (!token) {
      token = await provider.getToken();
      await this.setCache(
        `provider-${internalProviderIdentifier}-${courseId}-${process.env.NODE_ENV}`,
        token,
        24 * 60 * 60
      );
    }
    return {
      provider: provider,
      token: token as string,
    };
  };

  /**
   * Fetches tee times for a given course from a specific provider.
   * @param courseId - The ID of the course.
   * @param providerId - The ID of the provider.
   * @returns An array of available tee times.
   */
  async getTeeTimes(
    courseId: string,
    providerId: string,
    teeSheetId: string,
    startTime: string,
    endTime: string,
    date: string
  ): Promise<TeeTimeResponse[]> {
    this.logger.info(`getTeeTimes called with courseId: ${courseId}`);
    const { provider, token } = await this.getProviderAndKey(providerId, courseId);
    return provider.getTeeTimes(token, courseId, teeSheetId, startTime, endTime, date);
  }

  /**
   * Books a tee time for a given course from a specific provider.
   * @param courseId - The ID of the course.
   * @param teeTimeId - The ID of the tee time to book.
   * @param providerId - The ID of the provider.
   * @returns Details of the booked tee time.
   */
  async createBooking(
    courseId: string,
    teeTimeId: string,
    providerId: string,
    options: { data: any }
  ): Promise<BookingResponse> {
    this.logger.info(`createBooking called with courseId: ${courseId}`);
    const { provider, token } = await this.getProviderAndKey(providerId, courseId);
    return provider.createBooking(token, courseId, teeTimeId, options);
  }

  /**
   * Updates a tee time for a given course from a specific provider.
   * @param courseId - The ID of the course.
   * @param teeTimeId - The ID of the tee time to update.
   * @param providerId - The ID of the provider.
   * @returns Details of the updated tee time.
   */
  async updateTeeTime(
    courseId: string,
    teeTimeId: string,
    providerId: string,
    bookingId: string,
    options: any,
    slotId: string
  ): Promise<BookingResponse> {
    this.logger.info(`updateTeeTime called with courseId: ${courseId}`);
    const { provider, token } = await this.getProviderAndKey(providerId, courseId);
    return provider.updateTeeTime(token, courseId, teeTimeId, bookingId, options, slotId);
  }

  async getSlotIdsForBooking(
    bookingId: string,
    slots: number,
    customerId: string,
    providerBookingId: string,
    providerId: string,
    courseId: string
  ): Promise<InsertBookingSlots[]> {
    // this.logger.info(`updateTeeTime called with courseId: ${courseId}`);
    const { provider } = await this.getProviderAndKey(providerId, courseId);
    return provider.getSlotIdsForBooking(
      bookingId,
      slots,
      customerId,
      providerBookingId,
      providerId,
      courseId
    );
  }

  findOrCreateCustomer = async (
    courseId: string,
    providerId: string,
    providerCourseId: string,
    userId: string,
    provider: ProviderAPI,
    token: string
  ) => {
    const [buyer] = await this.database
      .select({
        id: users.id,
        providerAccountNumber: userProviderCourseLink.accountNumber,
        providerCustomerId: userProviderCourseLink.customerId,
        name: users.name,
        email: users.email,
        address: users.address,
        phone: users.phoneNumber,
        phoneNotification: users.phoneNotifications,
        emailNotification: users.emailNotifications,
        handel: users.handle,
      })
      .from(users)
      .leftJoin(
        userProviderCourseLink,
        and(eq(userProviderCourseLink.userId, users.id), eq(userProviderCourseLink.courseId, courseId))
      )
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error(`Error finding user id`);
      });
    if (!buyer) {
      this.logger.fatal(`user not found id: ${userId}`);
      throw new Error(`Error finding user id`);
    }
    let customerInfo = {
      playerNumber: buyer.providerAccountNumber,
      customerId: buyer.providerCustomerId,
      name: buyer.name,
      username: buyer.handel,
      email: buyer.email,
    };
    if (buyer.providerAccountNumber && buyer.providerCustomerId) {
      return customerInfo;
    }
    if (!buyer.providerAccountNumber) {
      if (!buyer.name || !buyer.email) {
        this.logger.fatal(`user missing name or email id: ${userId}`);
        throw new Error(`Error finding user id`);
      }
      const accountNumber = Math.floor(Math.random() * 90000) + 10000;
      const nameOfCustomer = buyer.name.split(" ");
      const customer: CustomerCreationData = {
        type: "customer",
        //@ts-ignore
        attributes: {
          username: buyer.handel ?? "",
          email_subscribed: buyer.emailNotification ?? "",
          taxable: true,
          contact_info: {
            account_number: accountNumber,
            phone_number: buyer.phone ?? "",
            address_1: buyer.address ?? "",
            first_name: nameOfCustomer?.[0] ? nameOfCustomer[0] ?? "guest" : "guest",
            last_name: nameOfCustomer?.[1] ? nameOfCustomer[1] : "N/A",
            email: buyer.email,
          },
        },
      };
      //create customer on provider
      let customerId: number | null = null;
      try {
        const customerData = await provider.createCustomer(token, providerCourseId, customer);
        customerInfo = {
          playerNumber: accountNumber,
          customerId: customerData.data.id,
          name: buyer.name,
          username: buyer.handel,
          email: buyer.email,
        };
        customerId = customerData.data.id;
      } catch (error) {
        console.log("provider.createCustomer error: ", error);
        throw new Error(`Error creating customer on provider`);
      }
      if (!customerId) {
        throw new Error(`Error creating customer on provider: No Customer Id`);
      }
      const userProviderCourseLinkId: string = randomUUID();
      //update user with providerCustomerId
      await this.database
        .insert(userProviderCourseLink)
        .values({
          id: userProviderCourseLinkId,
          courseId: courseId,
          providerId: providerId,
          userId: userId,
          accountNumber: accountNumber,
          customerId: customerId,
        })
        .onDuplicateKeyUpdate({ set: { customerId: sql`customerId` } }) //no op on duplicate
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error(`Error updating user id`);
        });
    }
    return customerInfo;
  };
  /**
   * Links a provider to an entity and all the courses under that entity.
   * @Todd this will be complete at during creation of admin panel
   * @param courseId - The ID of the entity.
   * @param providerId - The ID of the provider.
   * @throws Will throw an error if the entity or provider is not found.
   */
  // async addProviderCourses(entityId: string, providerId: string, ) {
  //   this.logger.info(`addProviderCourses called with entityId: ${entityId}`);
  //   return this.database.insert(providerCourseLink).values({
  //     id: randomUUID(),
  //     courseId: entityId,
  //     providerId,
  //   });
  // }

  /**
   * Creates a new provider with the given details.
   * @todo admin panel
   * @param name - Name of the provider.
   * @param data - Additional details for the provider.
   * @throws Will throw an error if any of the required details are missing.
   * @returns Details of the created provider.
   */
  // async createProvider(
  //   name: string,
  //   data: { description: string; website: string; logoAssetId: string }
  // ): Promise<void> {
  //   this.logger.info(`createProvider called with name: ${name}`);
  //   if (!name || !data.description || !data.website || !data.logoAssetId) {
  //     this.logger.fatal(`Invalid provider details
  //     name: ${name}
  //     data: ${JSON.stringify(data)}
  //     logoAssetId: ${data.logoAssetId}
  //     website: ${data.website}
  //     description: ${data.description}`);
  //     throw new Error("Invalid provider details");
  //   }
  //   await this.database
  //     .insert(providers)
  //     .values({
  //       id: randomUUID(),
  //       name,
  //       description: data.description,
  //       website: data.website,
  //       logo: data.logoAssetId,
  //     })
  //     .execute()
  //     .catch((err) => {
  //       this.logger.fatal(`Error creating provider: ${err}`);
  //       throw new Error("Error creating provider");
  //     });
  // }

  //optimize
  // async getProviders(courseId: string): Promise<SelectProviders[]> {
  //   const [poviders] = await this.database
  //     .select({
  //       internalProviderId: providers.internalId,
  //     })
  //     .from(providers)
  //     .where(eq(providerCourseLink.courseId, courseId));

  //   return await this.database
  //     .select()
  //     .from(providers)
  //     .where(
  //       inArray(
  //         providers.id,
  //         _providers.map((p) => p.providerId)
  //       )
  //     );
  // }
}
