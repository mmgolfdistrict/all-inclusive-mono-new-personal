import { randomUUID } from "crypto";
import axios from "axios";
import type {
  BookingCreationData,
  ClubProphetBookingResponse,
  ClubProphetCustomerCreationResponse,
  ClubProphetCustomerCreationData,
} from "./types/clubprophet.types";
import type { TeeTimeUpdateRequest } from "./types/foreup.type";
import type { TeeTimeResponse, CustomerData, CustomerCreationData } from "./types/interface";
import { BaseProvider } from "./types/interface";
import Logger from "@golf-district/shared/src/logger";

export class clubprophet {
  providerId = "club-prophet";
  public providerConfiguration: string;
  logger = Logger(clubprophet.name);

  constructor(providerConfiguration: string) {
    this.providerConfiguration = providerConfiguration;
  }

  async getTeeTimes(
    token: string,
    courseId: string,
    teesheetId: string | null,
    startTime: string,
    endTime: string,
    date: string,
    rateCode?: string
  ): Promise<TeeTimeResponse[]> {
    // async getTeeTimes(
    //   token: string,
    //   courseId: string,
    //   startTime: string,
    //   endTime: string,
    //   rateCode: string,
    //   date: string
    // ): Promise<ClubProphetTeeTimeResponse[]> {
    const { TEESHEET_ENDPOINT } = JSON.parse(
      this.providerConfiguration ?? "{}"
    );

    const url = TEESHEET_ENDPOINT;

    const headers = this.getHeaders(token);
    const data = JSON.stringify({
      fromDate: `${date}T00:00:04.192Z`,
      toDate: `${date}T23:59:04.192Z`,
      courseId: courseId,
      rateCode: rateCode || "string",
    });

    // console.log("data--", data);

    const config = {
      method: "GET",
      maxBodyLength: Infinity,
      url,
      headers,
      data,
    };
    const resp = await axios.request(config as any);
    return resp.data as TeeTimeResponse[];
    // const response = await fetch(url, { headers, method: "GET", data:JSON.stringify(data) });

    // if (!response.ok) {
    //   if (response.status === 403) {
    //     this.logger.error(`Error updating tee time: ${response.statusText}`);
    //     await this.getToken();
    //   }

    //   console.log(JSON.stringify(response));
    //   throw new Error(`Error fetching tee times: ${response.statusText}`);
    // }

    // return (await response.json()).data as TeeTimeResponse[];
    // const res:TeeTimeResponse = resp
  }

  // ----* starting here we are creating new booking for tee time *-----

  async createBooking(
    token: string,
    _coureId: string,
    _teesheetId: string,
    data: BookingCreationData
  ): Promise<ClubProphetBookingResponse> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/BookReservation`;

    const headers = this.getHeaders(token);

    console.log("createBooking - ", url);
    console.log(data, JSON.stringify(data))

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) {
        // this.logger.error(`Error creating booking: ${response.statusText}`);
        await this.getToken();
      }
      console.dir(response, { depth: null });
      console.log("ERROR", await response.json());
      throw new Error(`Error creating booking: ${JSON.stringify(response)}`);
    }

    return (await response.json()) as ClubProphetBookingResponse;
  }

  async updateTeeTime(
    _token: string,
    _courseId: string,
    _teesheetId: string,
    _bookingId: string,
    _options?: TeeTimeUpdateRequest
  ): Promise<ClubProphetBookingResponse> {
    // const endpoint = this.getBasePoint();
    // console.log("update teetime called");

    // const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings/${bookingId}/bookedPlayers/${bookingId}-1`;
    // // console.log(url);

    // // console.log(JSON.stringify(options));
    // const headers = this.getHeaders(token);

    // const response = await fetch(url, {
    //   method: "PUT",
    //   headers: headers,
    //   body: JSON.stringify(options),
    // });
    // // console.log(response);
    // if (!response.ok) {
    //   if (response.status === 403) {
    //     // this.logger.error(`Error updating tee time: ${response.statusText}`);
    //     await this.getToken();
    //   }
    //   throw new Error(`Error updating tee time: ${response.statusText}`);
    // }

    return ({}) as ClubProphetBookingResponse;
  }

  getToken = async (): Promise<string> => {
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, API_KEY, TOKEN_ENDPOINT } = JSON.parse(
      this.providerConfiguration ?? "{}"
    );

    const response = await fetch(`${TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": CONTENT_TYPE },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        apikey: API_KEY,
      }),
    });

    if (!response.ok) {
      // this.logger.fatal(`Error fetching token: ${response.statusText}`);
      throw new Error(`Error fetching token: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.access_token as string;
  };

  private getHeaders(token: string) {
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, X_Component_Id } = JSON.parse(this.providerConfiguration ?? "{}");
    return {
      "Content-Type": CONTENT_TYPE,
      Authorization: `bearer ${token}`,
      "client-secret": CLIENT_SECRET,
      "client-id": CLIENT_ID,
      "X-componentid": X_Component_Id,
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

  deleteBooking =
    async (
      token: string,
      _teesheetId: string,
      bookingId: string
    ): Promise<void> => {
      const endpoint = this.getBasePoint();
      const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/CancelReservation`;
      const headers = this.getHeaders(token);

      console.log(`deleteBooking - ${url}`);

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          reservationId: bookingId,
        })
      });

      if (!response.ok) {
        this.logger.error(`Error deleting booking: ${response.statusText}`);
        this.logger.error(`Error response from club-prophet: ${JSON.stringify(await response.json())}`);
        if (response.status === 403) {
          await this.getToken();
        }
        throw new Error(`Error deleting booking: ${response.statusText}`);
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
      if (response.status === 403) {
        this.logger.error(`Error creating customer: ${response.statusText}`);
        this.logger.error(`Error response from foreup: ${JSON.stringify(await response.json())}`);
      }
      throw new Error(`Error creating customer: ${response.statusText}`);
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

  getCustomer = async (): Promise<CustomerData> => { return {} as CustomerData; }
}
