import { randomUUID } from "crypto";
import Logger from "@golf-district/shared/src/logger";
import axios from "axios";
import type {
  BookingCreationData,
  ClubProphetBookingResponse,
  ClubProphetCustomerCreationData,
  ClubProphetCustomerCreationResponse,
  ClubProphetGetCustomerResponse,
  ClubProphetTeeTimeResponse,
} from "./types/clubprophet.types";
import type { TeeTimeUpdateRequest } from "./types/foreup.type";
import type { BookingNameChangeOptions, BookingResponse, BuyerData, CustomerCreationData, CustomerData, GetCustomerResponse, NameChangeCustomerDetails, ProviderAPI, SalesDataOptions, TeeTimeData, TeeTimeResponse } from "./types/interface";
import { BaseProvider } from "./types/interface";
import { db, eq } from "@golf-district/database";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { courses } from "@golf-district/database/schema/courses";
import isEqual from "lodash.isequal";
import type { CacheService } from "../../infura/cache.service";
import { loggerService } from "../../webhooks/logging.service";

export class clubprophet extends BaseProvider {
  providerId = "club-prophet";
  public providerConfiguration: string;
  logger = Logger(clubprophet.name);
  cacheService: CacheService | undefined;

  constructor(providerConfiguration: string) {
    super(
      undefined,
      providerConfiguration,
      undefined
    );
    this.providerConfiguration = providerConfiguration;
  }

  async getTeeTimes(
    token: string,
    courseId: string,
    _teesheetId: string | null,
    _startTime: string,
    _endTime: string,
    date: string,
    rateCode?: string
  ): Promise<TeeTimeResponse[]> {
    const baseEndpoint = this.getBasePoint();

    const url = `${baseEndpoint}/thirdpartyapi/api/v1/TeeSheet/TeeSheets`;

    const headers = this.getHeaders(token);
    const data = JSON.stringify({
      fromDate: `${date}T00:00:04.192Z`,
      toDate: `${date}T23:59:04.192Z`,
      courseId: courseId,
      rateCode: rateCode || "sticks",
    });

    const config = {
      method: "GET",
      maxBodyLength: Infinity,
      url,
      headers,
      data,
    };
    const resp = await axios.request(config as any);
    return resp.data as TeeTimeResponse[];
  }

  // ----* starting here we are creating new booking for tee time *-----
  async createBooking(
    token: string,
    _coureId: string,
    _teesheetId: string,
    data: BookingCreationData,
    userId: string
  ): Promise<BookingResponse> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/BookReservation`;

    const headers = this.getHeaders(token);

    console.log("createBooking - ", url);
    console.log(data, JSON.stringify(data));

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      this.logger.error(`Error creating booking: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error creating booking: ${JSON.stringify(responseData)}`);
        await this.getToken();
      }
      loggerService.errorLog({
        userId,
        url: "/Clubprophet/createBooking",
        userAgent: "",
        message: "ERROR_CREATING_BOOKING",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          data,
        })
      })
      throw new Error(`Error creating booking: ${JSON.stringify(responseData)}`);
    }

    const bookingResponse = (await response.json());
    // await this.addSalesData(bookingResponse.participantIds, token);

    return bookingResponse as BookingResponse;
  }

  async getToken(): Promise<string> {
    const baseEndpoint = this.getBasePoint();
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, API_KEY } = JSON.parse(
      this.providerConfiguration ?? "{}"
    );

    const url = `${baseEndpoint}/identityapi/myconnect/token`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": CONTENT_TYPE },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        apikey: API_KEY,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Error fetching token: ${response.statusText}`);
      const responseData = await response.json();
      this.logger.fatal(`Error response from club-prophet: ${JSON.stringify(responseData)}`);
      throw new Error(`Error fetching token: ${JSON.stringify(responseData)}`);
    }

    const responseData = await response.json();
    return responseData.access_token as string;
  }

  private getHeaders(token: string) {
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, X_Component_Id, X_Module_Id } = JSON.parse(
      this.providerConfiguration ?? "{}"
    );
    return {
      "Content-Type": CONTENT_TYPE,
      Authorization: `bearer ${token}`,
      "client-secret": CLIENT_SECRET,
      "client-id": CLIENT_ID,
      "X-componentid": X_Component_Id,
      "x-moduleId": X_Module_Id
    };
  }

  private getBasePoint(): string {
    const { BASE_ENDPOINT } = JSON.parse(this.providerConfiguration ?? "{}");

    switch (process.env.NODE_ENV) {
      case "development":
        return BASE_ENDPOINT;
      case "production":
        return BASE_ENDPOINT;
      default:
        return BASE_ENDPOINT;
    }
  }

  async deleteBooking(
    token: string,
    _courseId: string,
    _teesheetId: string,
    bookingId: string
  ): Promise<void> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/CancelReservation`;
    const headers = this.getHeaders(token);

    console.log(`deleteBooking - ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({
        reservationId: bookingId,
      }),
    });

    const isError = !response.ok;
    const data = await response.json();

    if (isError || data === false) {
      this.logger.error(`Error deleting booking: ${response.statusText}`);
      this.logger.error(`Error response from club-prophet: ${JSON.stringify(data)}`);

      const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/ReservationDetailByConfirmId?reservationConfirmId=${bookingId}`
      const bookingResponse = await fetch(url, {
        method: "GET",
        headers: headers,
      });
      const reservation = await bookingResponse.json();

      this.logger.info(`Reservation: ${JSON.stringify(reservation)}`);
      loggerService.errorLog({
        userId: "",
        url: "/Clubprophet/deleteBooking",
        userAgent: "",
        message: "ERROR_DELETING_BOOKING",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          bookingId: bookingId,
          isError,
          data,
          reservation
        })
      })

      if (response.status === 403) {
        await this.getToken();
      }
      throw new Error(`Error deleting booking: ${JSON.stringify(reservation)}`);
    }
    this.logger.info(`Booking deleted successfully: ${bookingId}`);
  }

  async createCustomer(
    token: string,
    _courseId: string,
    customerData: CustomerCreationData
  ): Promise<CustomerData> {
    customerData = customerData as ClubProphetCustomerCreationData;
    //Create Customer
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/Customer/Customer`;

    console.log(`createCustomer - ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      this.logger.error(`Error creating customer: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from club-prophet: ${JSON.stringify(responseData)}`);
      }
      loggerService.errorLog({
        userId: "",
        url: "/Clubprophet/createCustomer",
        userAgent: "",
        message: "ERROR_CREATING_CUSTOMER",
        stackTrace: `Error creating customer`,
        additionalDetailsJSON: JSON.stringify({
          customerData: customerData,
          responseData
        })
      })
      throw new Error(`Error creating customer: ${JSON.stringify(responseData)}`);
    }

    return (await response.json()) as ClubProphetCustomerCreationResponse;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getSlotIdsForBooking(
    bookingId: string,
    slots: number,
    customerId: string,
    providerBookingIds: string | string[],
    _providerId: string,
    _courseId: string
  ) {
    const bookingSlots: {
      id: string;
      bookingId: string;
      slotnumber: string;
      name: string;
      customerId: string;
      isActive: boolean;
      slotPosition: number;
      lastUpdatedDateTime: string | null;
      createdDateTime: string | null;
    }[] = [];

    for (let i = 0; i < slots; i++) {
      bookingSlots.push({
        id: randomUUID(),
        bookingId: bookingId,
        slotnumber: providerBookingIds[i]!,
        name: i === 0 ? "" : "Guest",
        customerId: i === 0 ? customerId : "",
        isActive: true,
        slotPosition: i + 1,
        lastUpdatedDateTime: null,
        createdDateTime: null,
      });
    }
    return bookingSlots;
  }

  addSalesData = async (Options: SalesDataOptions): Promise<void> => {
  // try {
  //   if (bookingIds.length <= 0) {
  //     return;
  //   }
  //   const endpoint = this.getBasePoint();
  //   const headers = this.getHeaders(token);

    //   const addSalesUrl = `${endpoint}/thirdpartyapi/api/v1/Sale/SaleOnlineByBookingId`;
    //   this.logger.info(`Add sales url - ${addSalesUrl}`);
    //   this.logger.info(`Adding sales for booking Ids: ${bookingIds}`);

    //   const addSalesData = {
    //     bookingIds,
    //     approvalCode: "123123", // Fake value
    //     refNum: "1212", // Fake value
    //     cardIssuedBy: "",
    //   };

    //   const addSalesResponse = await fetch(addSalesUrl, {
    //     method: "POST",
    //     headers: headers,
    //     body: JSON.stringify(addSalesData),
    //   });
    //   if (!addSalesResponse.ok) {
    //     throw new Error(
    //       `Error adding sales data for booking Ids: ${JSON.stringify(bookingIds)}, status code: ${addSalesResponse.status
    //       }, status text: ${addSalesResponse.statusText}, response: ${JSON.stringify(
    //         await addSalesResponse.json()
    //       )}`
    //     );
    //   }
    //   const salesResponse = await addSalesResponse.json();

    //   this.logger.info(
    //     `Sales data added successfully for booking with ids: ${bookingIds}, cart data: ${JSON.stringify(
    //       salesResponse
    //     )}`
    //   );
    // } catch (error) {
    //   this.logger.error(`Error adding sales data: ${error}`);
    // }
  };

  //@ts-ignore
  async updateTeeTime(
    _token: string,
    _courseId: string,
    _teesheetId: string,
    _bookingId: string,
    _options?: TeeTimeUpdateRequest
  ): Promise<BookingResponse> {
    return {} as BookingResponse;
  }

  async getCustomer(token: string, courseId: string, email: string): Promise<ClubProphetGetCustomerResponse | undefined> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/Customer/MemberByEMail/${email}`;

    const headers = this.getHeaders(token);

    console.log(`getCustomer - ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      this.logger.error(`Error fetching customer: ${response.statusText}`);
      const responseData = await response.json();
      this.logger.error(`Error response from club-prophet: ${JSON.stringify(JSON.stringify(responseData))}`);
      loggerService.errorLog({
        userId: "",
        url: "/Clubprophet/getCustomer",
        userAgent: "",
        message: "ERROR_FETCHING_CUSTOMER",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          email,
          responseData
        })
      })
      throw new Error(`Error fetching customer: ${JSON.stringify(responseData)}`);
    }

    const customer = await response.json();

    return customer as ClubProphetGetCustomerResponse;
  }

  shouldAddSaleData(): boolean {
    return false;
  }

  getSalesDataOptions(): SalesDataOptions {
    return {} as SalesDataOptions;
  }

  supportsPlayerNameChange(): boolean {
    return false;
  }

  getCustomerCreationData(buyerData: BuyerData): ClubProphetCustomerCreationData {
    const nameOfCustomer = buyerData.name ? buyerData.name.split(' ') : ['', ''];
    const customer: ClubProphetCustomerCreationData = {
      email: buyerData.email ?? "",
      phone: buyerData.phone ?? "",
      firstName: nameOfCustomer?.[0] ? nameOfCustomer[0] : "guest",
      lastName: nameOfCustomer?.[1] ? nameOfCustomer[1] : "N/A",
    }
    return customer;
  }

  getCustomerId(customerData: ClubProphetCustomerCreationResponse): string {
    return (customerData.acct).toString();
  }

  getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData {
    const nameOfCustomer = teeTimeData.name ? teeTimeData.name.split(' ') : ['', ''];
    const bookingData: BookingCreationData = {
      teeSheetId: Number(teeTimeData.providerTeeTimeId),
      holes: Number(teeTimeData.holes),
      firstName: nameOfCustomer?.[0] ? nameOfCustomer[0] : "guest",
      lastName: nameOfCustomer?.[1] ? nameOfCustomer[1] : "N/A",
      email: teeTimeData.email ?? "",
      phone: teeTimeData.phone ?? "",
      players: teeTimeData.playerCount,
      notes: teeTimeData.notes ?? "",
      pskUserId: 0,
      terminalId: 0,
      bookingTypeId: 311,
      rateCode: "sticks",
    }
    return bookingData;
  }

  getBookingId(bookingData: BookingResponse): string {
    const data = bookingData as ClubProphetBookingResponse;
    return data.reservationId.toString();
  }

  getAvailableSpotsOnTeeTime(teeTimeData: ClubProphetTeeTimeResponse): number {
    return teeTimeData.freeSlots;
  }

  indexTeeTime = async (
    formattedDate: string,
    providerCourseId: string,
    _providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    _time: number,
    teeTimeId: string,
    providerTeeTimeId: string
  ) => {
    try {
      const teeTimeResponse = (await provider.getTeeTimes(
        token,
        providerCourseId,
        "",
        "",
        "",
        formattedDate
      )) as unknown as ClubProphetTeeTimeResponse[];

      let teeTime;
      if (teeTimeResponse && teeTimeResponse.length > 0) {
        teeTime = teeTimeResponse.find((teeTime) => teeTime.teeSheetId.toString() === providerTeeTimeId);
      }
      if (!teeTime) {
        throw new Error("Tee time not available for booking");
      }

      const [indexedTeeTime] = await db
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          courseProvider: courses.providerId,
          availableSecondHandSpots: teeTimes.availableSecondHandSpots,
          entityId: courses.entityId,
          greenFeeTaxPerPlayer: teeTimes.greenFeeTaxPerPlayer,
          cartFeeTaxPerPlayer: teeTimes.cartFeeTaxPerPlayer,
        })
        .from(teeTimes)
        .leftJoin(courses, eq(courses.id, teeTimes.courseId))
        .where(eq(teeTimes.providerTeeTimeId, teeTime.teeSheetId.toString()))
        .execute()
        .catch((err: Error) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/Clubprophet/indexTeeTime",
            userAgent: "",
            message: "ERROR_FINDING_INDEXED_TEE_TIME_BY_ID",
            stackTrace: ``,
            additionalDetailsJSON: JSON.stringify({
              teeTimeId,
              providerTeeTimeId,
            })
          })
          throw new Error(`Error finding tee time id`);
        });

      if (indexedTeeTime) {
        const hours = Number(teeTime.startTime?.split("T")?.[1]?.split(":")?.[0]);
        const minutes = Number(teeTime.startTime?.split("T")?.[1]?.split(":")?.[1]?.split(":")?.[0]);
        const militaryTime = hours * 100 + minutes;

        const providerTeeTime = {
          id: indexedTeeTime.id,
          courseId: indexedTeeTime.courseId,
          providerTeeTimeId: String(teeTime.teeSheetId),
          numberOfHoles: teeTime.is18HoleOnly ? 18 : teeTime.is9HoleOnly ? 9 : 18,
          date: teeTime.startTime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.freeSlots,
          availableFirstHandSpots: teeTime.freeSlots > 4 ? 4 : teeTime.freeSlots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          greenFeePerPlayer:
            (teeTime.greenFee18 ? teeTime.greenFee18 : teeTime.greenFee9 ? teeTime.greenFee9 : 0) * 100,
          cartFeePerPlayer:
            (teeTime.cartFee18 ? teeTime.cartFee18 : teeTime.cartFee9 ? teeTime.cartFee9 : 0) * 100,
          greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTaxPerPlayer ? indexedTeeTime.greenFeeTaxPerPlayer : 0,
          cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTaxPerPlayer,
          providerDate: teeTime.startTime,
        };
        const providerTeeTimeMatchingKeys = {
          id: indexedTeeTime.id,
          providerTeeTimeId: String(teeTime.teeSheetId),
          numberOfHoles: teeTime.is18HoleOnly ? 18 : teeTime.is9HoleOnly ? 9 : 18,
          date: teeTime.startTime,
          time: militaryTime,
          maxPlayersPerBooking: teeTime.freeSlots,
          greenFeePerPlayer:
            (teeTime.greenFee18 ? teeTime.greenFee18 : teeTime.greenFee9 ? teeTime.greenFee9 : 0) * 100,
          cartFeePerPlayer:
            (teeTime.cartFee18 ? teeTime.cartFee18 : teeTime.cartFee9 ? teeTime.cartFee9 : 0) * 100,
          greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTaxPerPlayer ? indexedTeeTime.greenFeeTaxPerPlayer : 0,
          cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTaxPerPlayer,
          courseId: indexedTeeTime.courseId,
          availableFirstHandSpots: teeTime.freeSlots > 4 ? 4 : teeTime.freeSlots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          courseProvider: indexedTeeTime.courseProvider,
          providerDate: teeTime.startTime,
          entityId: indexedTeeTime.entityId,
        };
        if (isEqual(indexedTeeTime, providerTeeTimeMatchingKeys)) {
          // no changes to tee time do nothing
          return;
        } else {
          await db
            .update(teeTimes)
            .set(providerTeeTime)
            .where(eq(teeTimes.id, indexedTeeTime.id))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              loggerService.errorLog({
                userId: "",
                url: "/Clubprophet/indexTeeTime",
                userAgent: "",
                message: "ERROR_UPDATING_INDEXED_TEE_TIME",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                  teeTimeId,
                  providerTeeTimeId,
                  indexedTeeTime,
                })
              })
              throw new Error(`Error updating tee time: ${err}`);
            });
        }
      }
    } catch (error) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: "",
        url: "/Clubprophet/indexTeeTime",
        userAgent: "",
        message: "ERROR_INDEXING_TEE_TIME",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          teeTimeId,
        })
      })
      // throw new Error(`Error indexing tee time: ${error}`);
      throw new Error(
        `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
      );
    }
  }

  getSlotIdsFromBooking = (bookingData: BookingResponse): string[] => {
    const data = bookingData as ClubProphetBookingResponse;
    const ids = data.participantIds.map((id) => id.toString());
    return ids;
  }

  getPlayerCount(bookingData: BookingResponse): number {
    const data = bookingData as ClubProphetBookingResponse;
    return data.participantIds.length;
  }

  findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): ClubProphetTeeTimeResponse | undefined {
    const teeTimes = teetimes as ClubProphetTeeTimeResponse[];
    const teeTime = teeTimes.find((teeTime) => teeTime.teeSheetId.toString() === teeTimeId);

    return teeTime;
  }

  getBookingNameChangeOptions(_customerDetails: NameChangeCustomerDetails): BookingNameChangeOptions {
    return {} as BookingNameChangeOptions;
  }

  getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): { customerId: string, accountNumber?: number } {
    const customer = getCustomerResponse as ClubProphetGetCustomerResponse;

    return { customerId: customer.memberNo.toString() };
  }

  requireToCreatePlayerSlots(): boolean {
    return false;
  }
}