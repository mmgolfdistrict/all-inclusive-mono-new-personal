import { randomUUID } from "crypto";
import Logger from "@golf-district/shared/src/logger";
import type {
  BookingCreationData,
  BookingResponse as ForeupBookingResponse,
  CartData,
  CustomerCreationData as ForeUpCustomerCreationData,
  CustomerData as ForeUpCustomerCreationResponse,
  ForeupSaleDataOptions,
  TeeTimeUpdateRequest,
  TeeTimeResponse as ForeupTeeTimeResponse,
  ForeUpBookingNameChangeOptions,
  ForeUpGetCustomerResponse,
  ForeupGetCustomers,
} from "./types/foreup.type";
import type { BookingResponse, CustomerCreationData, GetCustomerResponse, NameChangeCustomerDetails, SalesDataOptions, TeeTimeResponse } from "./types/interface";
import type { BuyerData, ProviderAPI, TeeTimeData } from "./types/interface";
import { BaseProvider, type BookingDetails } from "./types/interface";
import { db, eq } from "@golf-district/database";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { dateToUtcTimestamp } from "@golf-district/shared";
import isEqual from "lodash.isequal";
import { loggerService } from "../../webhooks/logging.service";

export class foreUp extends BaseProvider {
  providerId = "fore-up";
  logger = Logger(foreUp.name);

  async getTeeTimes(
    token: string,
    courseId: string,
    teesheetId: string,
    startTime: string,
    endTime: string,
    date: string
  ): Promise<TeeTimeResponse[]> {
    const { defaultPriceClassID } = JSON.parse(this.providerConfiguration ?? "{}");
    const endpoint = this.getBasePoint();
    let url = "";
    if (defaultPriceClassID) {
      url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/teetimes?startTime=${startTime}&endTime=${endTime}&date=${date}&priceClassId=${defaultPriceClassID}`;
    } else {
      url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/teetimes?startTime=${startTime}&endTime=${endTime}&date=${date}`;
    }
    const headers = this.getHeaders(token);

    console.log(`getTeeTimes - ${url}`);

    const response = await fetch(url, { headers, method: "GET" });

    if (!response.ok) {
      this.logger.error(`Error fetching tee time: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
        await this.getToken();
      }
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/getTeeTimes",
        userAgent: "",
        message: "ERROR_FETCHING_TEE_TIMES",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          teesheetId,
          startTime,
          endTime,
          date,
          responseData
        })
      })
      throw new Error(`Error fetching tee times: ${JSON.stringify(responseData)}`);
    }

    return (await response.json()).data as TeeTimeResponse[];
  }

  deleteBooking = async (
    token: string,
    courseId: string,
    teesheetId: string,
    bookingId: string
  ): Promise<void> => {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings/${bookingId}`;
    const headers = this.getHeaders(token);

    console.log(`deleteBooking - ${url}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: headers,
    });

    if (!response.ok) {
      this.logger.error(`Error deleting booking: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
        await this.getToken();
      }
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/deleteBooking",
        userAgent: "",
        message: "ERROR_DELETING_BOOKING",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          teesheetId,
          bookingId,
          responseData
        })
      })
      throw new Error(`Error deleting booking: ${JSON.stringify(responseData)}`);
    }
    this.logger.info(`Booking deleted successfully: ${bookingId}`);
  };

  async createBooking(
    token: string,
    courseId: string,
    teesheetId: string,
    data: BookingCreationData,
    userId: string
  ): Promise<BookingResponse> {
    const { defaultBookingClassID } = JSON.parse(this.providerConfiguration ?? "{}");
    const { totalAmountPaid, ...bookingData } = data;
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings`;
    console.log(`createBooking - ${url}`);

    bookingData.data.attributes.booking_class_id = defaultBookingClassID;
    const headers = this.getHeaders(token);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      this.logger.error(`Error creating booking: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
        await this.getToken();
      }
      loggerService.errorLog({
        userId,
        url: "/Foreup/createBooking",
        userAgent: "",
        message: "ERROR_CREATING_BOOKING",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          teesheetId,
          data,
          responseData
        })
      })
      throw new Error(`Error creating booking: ${JSON.stringify(responseData)}`);
    }

    const booking: BookingResponse = await response.json();

    return booking;
  }

  async updateTeeTime(
    token: string,
    courseId: string,
    teesheetId: string,
    bookingId: string,
    options?: TeeTimeUpdateRequest,
    slotId?: string
  ): Promise<BookingResponse> {
    const endpoint = this.getBasePoint();
    const { defaultPriceClassID } = JSON.parse(this.providerConfiguration ?? "{}");
    // https://api.foreupsoftware.com/api_rest/index.php/courses/courseId/teesheets/teesheetId/bookings/bookingId/bookedPlayers/bookedPlayerId
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings/${bookingId}/bookedPlayers/${slotId ? slotId : bookingId
      }`;
    const headers = this.getHeaders(token);

    if (options) {
      options.data.attributes.priceClassId = defaultPriceClassID;
    }

    console.log(`updateTeeTime - ${url}`);

    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(options),
    });
    // console.log(response);
    if (!response.ok) {
      this.logger.error(`Error updating tee time: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
        await this.getToken();
      }
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/updateTeeTime",
        userAgent: "",
        message: "ERROR_UPDATING_TEE_TIME",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          teesheetId,
          bookingId,
          options,
          responseData
        })
      })
      throw new Error(`Error updating tee time: ${JSON.stringify(responseData)}`);
    }

    return (await response.json()) as BookingResponse;
  }

  async createCustomer(
    token: string,
    courseId: string,
    customerData: CustomerCreationData
  ): Promise<ForeUpCustomerCreationResponse> {
    const { defaultPriceClassID } = JSON.parse(this.providerConfiguration ?? "{}");
    customerData = customerData as ForeUpCustomerCreationData;
    // Fetch required fields for the course
    const requiredFieldsUrl = `${this.getBasePoint()}/courses/${courseId}/settings/customerFieldSettings`;

    console.log(`createCustomer - ${requiredFieldsUrl}`);

    const requiredFieldsResponse = await fetch(requiredFieldsUrl, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    if (!requiredFieldsResponse.ok) {
      const responseData = await requiredFieldsResponse.json();
      this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/createCustomer",
        userAgent: "",
        message: "ERROR_FETCHING_REQUIRED_FIELDS",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          customerData,
          responseData
        })
      })
      throw new Error(`Error fetching required fields: ${JSON.stringify(responseData)}`);
    }

    const requiredFields = await requiredFieldsResponse.json();

    //Validate required fields in customerData
    for (const field in requiredFields) {
      if (requiredFields[field].required && !customerData.attributes.contact_info.hasOwnProperty(field)) {
        loggerService.errorLog({
          userId: "",
          url: "/Foreup/createCustomer",
          userAgent: "",
          message: "MISSING_REQUIRED_FIELD",
          stackTrace: ``,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            customerData,
            field
          })
        })
        throw new Error(`Missing required field: ${field}`);
      }
    }

    //Create Customer
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/customers`;

    console.log(`createCustomer - ${url}`);

    customerData.attributes.price_class = defaultPriceClassID;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({
        data: customerData,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Error creating customer: ${response.statusText}`);
      const responseData = await response.json();
      if (response.status === 403) {
        this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
      }
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/createCustomer",
        userAgent: "",
        message: "ERROR_CREATING_CUSTOMER",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          customerData
        })
      })
      throw new Error(`Error creating customer: ${JSON.stringify(responseData)}`);
    }

    return (await response.json()) as ForeUpCustomerCreationResponse;
  }

  async getCustomer(token: string, courseId: string, email: string): Promise<ForeUpGetCustomerResponse | undefined> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/customers?email=eq:${email}`;

    const headers = this.getHeaders(token);

    console.log(`getCustomer - ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      this.logger.error(`Error fetching customer: ${response.statusText}`);
      const responseData = await response.json();
      this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/getCustomer",
        userAgent: "",
        message: "ERROR_FETCHING_CUSTOMER",
        stackTrace: ``,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          email,
          responseData
        })
      })
      throw new Error(`Error fetching customer: ${JSON.stringify(responseData)}`);
    }

    const customers: ForeupGetCustomers = await response.json();

    if (customers.data.length === 0) {
      return undefined
    }

    const customer = customers.data.find(customer => customer.attributes.account_number !== null && customer.attributes.online_booking_disabled === false);

    return customer!;
  }

  async addSalesData(options: SalesDataOptions): Promise<void> {
    const opts = options as ForeupSaleDataOptions;
    try {
      const { totalAmountPaid, players, courseId, teesheetId, bookingId, token } = opts;
      if (!totalAmountPaid) {
        return;
      }
      const endpoint = this.getBasePoint();
      const headers = this.getHeaders(token);

      const bookingCheckinUrl = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings/${bookingId}/checkIn`;
      this.logger.info(`Booking Check in Url - ${bookingCheckinUrl}`);
      this.logger.info(`Making Check in request for provider booking: ${bookingId}`);

      // Generate positions array based on number of player count
      const generatedPositionsArray = Array.from({ length: players }, (_, i) => (i + 1).toString());

      const checkInResponse = await fetch(bookingCheckinUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          data: {
            type: "check_ins",
            attributes: {
              positions: generatedPositionsArray,
            },
          },
        }),
      });
      if (!checkInResponse.ok) {
        throw new Error(
          `Error doing booking checkin for booking: ${bookingId}, status code: ${checkInResponse.status
          }, status text: ${checkInResponse.statusText}, response: ${JSON.stringify(await checkInResponse.json())}`
        );
      }
      const cartData: CartData = await checkInResponse.json();

      const addPaymentsUrl = `${endpoint}/courses/${courseId}/carts/${cartData.data.id}/payments`;
      this.logger.info(`Add payments url - ${addPaymentsUrl}`);
      this.logger.info(`Adding payment for provider booking: ${bookingId}, cart id: ${cartData.data.id}`);

      console.log(
        "PAYMENT BODY:",
        JSON.stringify({
          data: {
            type: "payments",
            attributes: {
              amount: `${totalAmountPaid}`,
              type: "cash",
            },
          },
        })
      );
      const addPaymentsResponse = await fetch(addPaymentsUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          data: {
            type: "payments",
            attributes: {
              amount: `${totalAmountPaid}`,
              type: "cash",
            },
          },
        }),
      });
      if (!addPaymentsResponse.ok) {
        throw new Error(
          `Error adding payment to cart for booking: ${bookingId}, status code: ${addPaymentsResponse.status
          }, status text: ${addPaymentsResponse.statusText}, response: ${JSON.stringify(addPaymentsResponse)}`
        );
      }
      const paymentData: CartData = await addPaymentsResponse.json();

      const completeCartUrl = `${endpoint}/courses/${courseId}/carts/${cartData.data.id}`;
      this.logger.info(`Complete cart url - ${completeCartUrl}`);
      this.logger.info(
        `Completing cart for provider booking: ${bookingId}, cart id: ${cartData.data.id
        }, with paymentData: ${JSON.stringify(paymentData)}`
      );
      const completeCartResponse = await fetch(completeCartUrl, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({
          data: {
            type: "carts",
            id: `${cartData.data.id}`,
            attributes: {
              status: "complete",
            },
          },
        }),
      });
      if (!completeCartResponse.ok) {
        throw new Error(
          `Error completing cart for booking: ${bookingId}, status code: ${completeCartResponse.status
          }, status text: ${completeCartResponse.statusText}, response: ${JSON.stringify(
            await completeCartResponse.json()
          )}`
        );
      }
      const completeCartData: CartData = await completeCartResponse.json();
      this.logger.info(
        `Sales data added successfully for booking with id: ${bookingId}, cart data: ${JSON.stringify(
          completeCartData
        )}`
      );
    } catch (error: any) {
      this.logger.error(`Error adding sales data: ${error}`);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/addSalesData",
        userAgent: "",
        message: "ERROR_ADDING_SALES_DATA",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          options,
        })
      })
    }
  };

  getToken = async (): Promise<string> => {
    const endpoint = this.getBasePoint();

    console.log(`getToken - ${endpoint}`);

    const response = await fetch(`${endpoint}/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.credentials?.username, password: this.credentials?.password }),
    });

    if (!response.ok) {
      this.logger.error(`Error fetching token: ${response.statusText}`);
      const responseData = await response.json();
      this.logger.error(`Error response from foreup: ${JSON.stringify(responseData)}`);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/getToken",
        userAgent: "",
        message: "ERROR_FETCHING_TOKEN",
        stackTrace: ``,
        additionalDetailsJSON: "{}"
      })
      throw new Error(`Error fetching token: ${JSON.stringify(responseData)}`);
    }
    let responseData;
    try {
      responseData = await response.json();
      if (!responseData.data.id) {
        throw new Error(`Error Token not found in the response: ${JSON.stringify(responseData)}`);
      }
    } catch (error: any) {
      this.logger.error(`Error parsing token response: ${error}`);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/getToken",
        userAgent: "",
        message: "ERROR_PARSING_TOKEN_RESPONSE",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          response: JSON.stringify(response),
          responseData: JSON.stringify(responseData),
        })
      })
      throw new Error(`Error parsing token response: ${error}`);
    }
    return responseData.data.id as string;
  };

  private getHeaders(token: string) {
    return {
      "Content-Type": "application/json",
      "x-authorization": `Bearer ${token}`,
    };
  }

  private getBasePoint(): string {
    switch (process.env.NODE_ENV) {
      case "development":
        return "https://api.foreupsoftware.com/api_rest/index.php";
      case "production":
        return "https://api.foreupsoftware.com/api_rest/index.php";
      default:
        return "https://private-anon-67e30e32d1-foreup.apiary-mock.com/api_rest/index.php";
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getSlotIdsForBooking(
    bookingId: string,
    slots: number,
    customerId: string,
    providerBookingId: string | string[],
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
        slotnumber: providerBookingId + "-" + (i + 1),
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

  shouldAddSaleData() {
    return false;
  }

  getSalesDataOptions(reservationData: BookingResponse, bookingDetails: BookingDetails): ForeupSaleDataOptions {
    reservationData = reservationData as ForeupBookingResponse;
    const salesDataOptions: ForeupSaleDataOptions = {
      bookingId: reservationData.data.id,
      courseId: bookingDetails.providerCourseId,
      teesheetId: bookingDetails.providerTeeSheetId,
      players: bookingDetails.playerCount,
      totalAmountPaid: bookingDetails.totalAmountPaid,
      token: bookingDetails.token
    }

    return salesDataOptions;
  }

  supportsPlayerNameChange() {
    return true;
  };


  getCustomerCreationData(buyerData: BuyerData): ForeUpCustomerCreationData {
    const nameOfCustomer = buyerData.name ? buyerData.name.split(' ') : ['', ''];
    const customer: ForeUpCustomerCreationData = {
      type: "customer",
      attributes: {
        username: buyerData.handel ?? "",
        email_subscribed: buyerData.emailNotification ?? false,
        taxable: true,
        contact_info: {
          account_number: buyerData.accountNumber,
          phone_number: buyerData.phone ?? "",
          address_1: buyerData.address1 ?? "",
          first_name: nameOfCustomer?.[0] ? nameOfCustomer[0] ?? "guest" : "guest",
          last_name: nameOfCustomer?.[1] ? nameOfCustomer[1] : "N/A",
          email: buyerData.email,
        },
      },
    }
    return customer;
  }

  getCustomerId(customerData: ForeUpCustomerCreationResponse): string {
    return (customerData.data.id).toString();
  }

  getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData {
    const bookedPLayers = [
      {
        accountNumber: teeTimeData.providerAccountNumber as number,
      },
    ];

    const bookingData: BookingCreationData = {
      totalAmountPaid: teeTimeData.totalAmountPaid,
      data: {
        type: "bookings",
        attributes: {
          start: teeTimeData.startTime,
          holes: typeof teeTimeData.holes === "number" ? teeTimeData.holes.toString() : teeTimeData.holes,
          players: teeTimeData.playerCount,
          bookedPlayers: bookedPLayers,
          event_type: "tee_time",
          details: teeTimeData.notes ?? "",
        },
      },
    }
    return bookingData;
  }

  getBookingId(bookingData: BookingResponse): string {
    bookingData = bookingData as ForeupBookingResponse;
    return bookingData.data.id;
  }

  getAvailableSpotsOnTeeTime(teeTimeData: ForeupTeeTimeResponse): number {
    return teeTimeData.attributes.availableSpots;
  }

  indexTeeTime = async (
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string,
    _providerTeeTimeId: string
  ) => {
    try {
      const teeTimeResponse = await provider.getTeeTimes(
        token,
        providerCourseId,
        providerTeeSheetId,
        time.toString().padStart(4, "0"),
        (time + 1).toString().padStart(4, "0"),
        formattedDate
      ) as ForeupTeeTimeResponse[]
      let teeTime;
      if (teeTimeResponse && teeTimeResponse.length > 0) {
        teeTime = teeTimeResponse[0]!;
      }
      if (!teeTime) {
        await db
          .update(teeTimes)
          .set({ availableFirstHandSpots: 0 })
          .where(eq(teeTimes.id, teeTimeId))
          .execute();
        throw new Error("Tee time not available for booking");
      }
      const [indexedTeeTime] = await db
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          availableFirstHandSpots: teeTimes.availableFirstHandSpots,
          availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        })
        .from(teeTimes)
        .where(eq(teeTimes.providerTeeTimeId, teeTime.id))
        .execute()
        .catch((err: Error) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/Foreup/indexTeeTime",
            userAgent: "",
            message: "ERROR_INDEXING_TEE_TIME",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              formattedDate,
              providerCourseId,
              providerTeeSheetId,
              provider,
              token,
              time,
              teeTimeId,
              errorMessage: err.message
            })
          })
          throw new Error(`Error finding tee time id`);
        });

      if (indexedTeeTime) {
        const attributes = teeTime.attributes;

        if (!attributes) {
          this.logger.error(`No TeeTimeSlotAttributes available for: ${JSON.stringify(teeTimeResponse)}`);
          loggerService.errorLog({
            userId: "",
            url: "/Foreup/indexTeeTime",
            userAgent: "",
            message: "ERROR_CREATING_BOOKING",
            stackTrace: ``,
            additionalDetailsJSON: JSON.stringify({
              formattedDate,
              providerCourseId,
              providerTeeSheetId,
              provider,
              token,
              time,
              teeTimeId,
            })
          })
          throw new Error("No TeeTimeSlotAttributes available");
        }
        const maxPlayers = Math.max(...attributes.allowedGroupSizes);

        // format of attributes.time -> 2023-12-20T01:28:00-07:00
        const hours = Number(attributes.time?.split("T")?.[1]?.split(":")?.[0]);
        const minutes = Number(attributes.time?.split("T")?.[1]?.split(":")?.[1]?.split(":")?.[0]);
        const militaryTime = hours * 100 + minutes;

        const providerTeeTime = {
          id: indexedTeeTime.id,
          courseId: indexedTeeTime.courseId,
          providerTeeTimeId: teeTime.id,
          numberOfHoles: attributes.holes,
          date: attributes.time,
          time: militaryTime,
          maxPlayersPerBooking: maxPlayers,
          availableFirstHandSpots: attributes.availableSpots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          greenFeePerPlayer: attributes.greenFee * 100,
          cartFeePerPlayer: attributes.cartFee * 100,
          greenFeeTaxPerPlayer: attributes.greenFeeTax ? attributes.greenFeeTax : 0,
          cartFeeTaxPerPlayer: attributes.cartFeeTax,
          providerDate: attributes.time,
        };
        const providerTeeTimeMatchingKeys = {
          id: indexedTeeTime.id,
          providerTeeTimeId: teeTime.id,
          numberOfHoles: attributes.holes,
          date: dateToUtcTimestamp(new Date(attributes.time)),
          time: militaryTime,
          maxPlayersPerBooking: maxPlayers,
          greenFeePerPlayer: attributes.greenFee * 100,
          cartFeePerPlayer: attributes.cartFee * 100,
          greenFeeTaxPerPlayer: (attributes.greenFeeTax ? attributes.greenFeeTax : 0) * 100,
          cartFeeTaxPerPlayer: attributes.cartFeeTax * 100,
          courseId: indexedTeeTime.courseId,
          availableFirstHandSpots: attributes.availableSpots,
          availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
          providerDate: attributes.time,
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
                url: "/Foreup/indexTeeTime",
                userAgent: "",
                message: "ERROR_UPDATING_TEE_TIME",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  formattedDate,
                  providerCourseId,
                  providerTeeSheetId,
                  provider,
                  token,
                  time,
                  teeTimeId,
                })
              })
              throw new Error(`Error updating tee time: ${err}`);
            });
        }
      }
    } catch (error: any) {
      this.logger.error(error);
      loggerService.errorLog({
        userId: "",
        url: "/Foreup/indexTeeTime",
        userAgent: "",
        message: "ERROR_INDEXING_TEE_TIME",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          formattedDate,
          providerCourseId,
          providerTeeSheetId,
          provider,
          token,
          time,
          teeTimeId,
          errorMessage: error.message
        })
      })
      // throw new Error(`Error indexing tee time: ${error}`);
      // throw new Error(
      //   `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
      // );
      return {
        error: true,
        message: `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
      }
    }
  }

  getSlotIdsFromBooking = (bookingData: any): string[] => {
    return undefined as any;
  }

  getPlayerCount(bookingData: BookingResponse): number {
    bookingData = bookingData as ForeupBookingResponse;
    return bookingData.data.playerCount!
  }

  findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): ForeupTeeTimeResponse | undefined {
    const teeTimes = teetimes as ForeupTeeTimeResponse[];
    const teeTime = teeTimes.find((teeTime) => teeTime.id.toString() === teeTimeId);

    return teeTime;
  }

  getBookingNameChangeOptions(customerDetails: NameChangeCustomerDetails): ForeUpBookingNameChangeOptions {
    const { name, providerBookingId, providerCustomerId } = customerDetails;

    const bookingNameChangeOptions: ForeUpBookingNameChangeOptions = {
      data: {
        type: "Guest",
        id: providerBookingId,
        attributes: {
          type: "Guest",
          name: name,
          paid: false,
          cartPaid: false,
          noShow: false,
          personId: providerCustomerId ? providerCustomerId : "",
        },
      },
    };
    return bookingNameChangeOptions;
  }

  getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): { customerId: string, accountNumber?: number } {
    const customer = getCustomerResponse as ForeUpGetCustomerResponse;

    return { customerId: customer.id.toString(), accountNumber: customer.attributes.account_number };
  }

  requireToCreatePlayerSlots(): boolean {
    return true;
  }
}

// // "id": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJhdWQiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJpYXQiOjE3MDI0ODQ5NzksImV4cCI6MTcwNTA3Njk3OSwibGV2ZWwiOjMsImNpZCI6OTAzOSwiZW1wbG95ZWUiOmZhbHNlLCJ1aWQiOjcxNzk5MDUsImFwaVZlcnNpb24iOm51bGwsImFwcElkIjo2NDgyNzI4LCJwcmljZUNsYXNzSWQiOm51bGwsImFwaXYySWQiOjEyMCwibGltaXRhdGlvbnMiOnsiY3VzdG9tZXJzIjp0cnVlLCJlbXBsb3llZXMiOnRydWUsImludmVudG9yeSI6dHJ1ZSwiaWRlbnRpdHlfcHJvdmlkZXIiOnRydWUsImVtYWlscyI6dHJ1ZSwic2FsZXMiOnRydWUsInRlZXNoZWV0Ijp0cnVlLCJ0cmFkaW5nX2VuYWJsZWQiOmZhbHNlLCJ0cmFkZXNfYnlfcGxheWVyX2NvdW50IjpmYWxzZSwibWFnaWNfYXV0aF92aWFfZW1haWwiOmZhbHNlfX0.KBfzS0EHqPu09VL7W9A2U7GkAnh8OGP3QkRzePHmQ9mfcLLZD1z2Q0Zuv9aJVCEgtb1KXvX-XzZahK_edA08-Q",

//Curl -X POST
// curl -X GET "https://api.foreupsoftware.com/api_rest/index.php/courses/20606/teesheets/5105/bookings/TTID_12151128596lap?include=players" \
// -H "Content-Type: application/json" \
// -H "x-authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJhdWQiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJpYXQiOjE3MDI0ODQ5NzksImV4cCI6MTcwNTA3Njk3OSwibGV2ZWwiOjMsImNpZCI6OTAzOSwiZW1wbG95ZWUiOmZhbHNlLCJ1aWQiOjcxNzk5MDUsImFwaVZlcnNpb24iOm51bGwsImFwcElkIjo2NDgyNzI4LCJwcmljZUNsYXNzSWQiOm51bGwsImFwaXYySWQiOjEyMCwibGltaXRhdGlvbnMiOnsiY3VzdG9tZXJzIjp0cnVlLCJlbXBsb3llZXMiOnRydWUsImludmVudG9yeSI6dHJ1ZSwiaWRlbnRpdHlfcHJvdmlkZXIiOnRydWUsImVtYWlscyI6dHJ1ZSwic2FsZXMiOnRydWUsInRlZXNoZWV0Ijp0cnVlLCJ0cmFkaW5nX2VuYWJsZWQiOmZhbHNlLCJ0cmFkZXNfYnlfcGxheWVyX2NvdW50IjpmYWxzZSwibWFnaWNfYXV0aF92aWFfZW1haWwiOmZhbHNlfX0.KBfzS0EHqPu09VL7W9A2U7GkAnh8OGP3QkRzePHmQ9mfcLLZD1z2Q0Zuv9aJVCEgtb1KXvX-XzZahK_edA08-Q"

// curl --include \
//      --request POST \
//      --header "Content-Type: application/json" \
//      --header "x-authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJhdWQiOiJmb3JldXBzb2Z0d2FyZS5jb20iLCJpYXQiOjE3MDI1MjQzMzMsImV4cCI6MTcwNTExNjMzMywibGV2ZWwiOjMsImNpZCI6OTAzOSwiZW1wbG95ZWUiOmZhbHNlLCJ1aWQiOjcxNzk5MDUsImFwaVZlcnNpb24iOm51bGwsImFwcElkIjo2NDgyNzI4LCJwcmljZUNsYXNzSWQiOm51bGwsImFwaXYySWQiOjEyMCwibGltaXRhdGlvbnMiOnsiY3VzdG9tZXJzIjp0cnVlLCJlbXBsb3llZXMiOnRydWUsImludmVudG9yeSI6dHJ1ZSwiaWRlbnRpdHlfcHJvdmlkZXIiOnRydWUsImVtYWlscyI6dHJ1ZSwic2FsZXMiOnRydWUsInRlZXNoZWV0Ijp0cnVlLCJ0cmFkaW5nX2VuYWJsZWQiOmZhbHNlLCJ0cmFkZXNfYnlfcGxheWVyX2NvdW50IjpmYWxzZSwibWFnaWNfYXV0aF92aWFfZW1haWwiOmZhbHNlfX0.-pYzThWZx_mSdX-E8LKPLqct4DSF4uFeF5X-vQb1XWPiaJpSmHzCPjG-HwAdVPQQsVCfOSdJtnver6zr7SSpGw" \
//      --data-binary '{
//        "data": {
//          "type": "bookings",
//          "attributes": {
//            "start": "2023-12-15T14:04:00.000",
//            "holes": 18,
//            "players": 1,
//            "bookedPlayers": [
//              {
//                "accountNumber": 19575
//              }
//            ],
//            "event_type": "tee_time",
//            "details": "GD Booking"
//          }
//        }
//      }' \
// 'https://api.foreupsoftware.com/api_rest/index.php/courses/20606/teesheets/5105/bookings'
