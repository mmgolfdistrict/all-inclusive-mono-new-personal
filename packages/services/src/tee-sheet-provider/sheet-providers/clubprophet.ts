import axios from "axios";
import {
  BookingCreationData,
  BookingResponse,
  ClubProphetTeeTimeResponse,
  TeeTimeResponseClubProphet,
} from "./types/clubprophet.types";
import { TeeTimeUpdateRequest } from "./types/foreup.type";

export class clubprophet {
  providerId?: string = "club-prophet";
  public providerConfiguration: any;

  async getTeeTimes(
    token: string,
    courseId: string,
    teesheetId: string | null,
    startTime: string,
    endTime: string,
    date: string,
    rateCode?: string
  ): Promise<ClubProphetTeeTimeResponse[]> {
    // async getTeeTimes(
    //   token: string,
    //   courseId: string,
    //   startTime: string,
    //   endTime: string,
    //   rateCode: string,
    //   date: string
    // ): Promise<ClubProphetTeeTimeResponse[]> {
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, API_KEY, TOKEN_ENDPOINT, TEESHEET_ENDPOINT } = JSON.parse(
      this.providerConfiguration
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

    let config = {
      method: "GET",
      maxBodyLength: Infinity,
      url,
      headers,
      data,
    };
    const resp = await axios.request(config as any);
    return resp.data;
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
    courseId: string,
    teesheetId: string,
    data: BookingCreationData
  ): Promise<BookingResponse> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/thirdpartyapi/api/v1/TeeSheet/BookReservation`;

    const headers = this.getHeaders(token);

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
      throw new Error(`Error creating booking: ${JSON.stringify(response)}`);
    }

    return (await response.json()) as BookingResponse;
  }

  async updateTeeTime(
    token: string,
    courseId: string,
    teesheetId: string,
    bookingId: string,
    options?: TeeTimeUpdateRequest
  ): Promise<BookingResponse> {
    const endpoint = this.getBasePoint();
    console.log("update teetime called");
    // https://api.foreupsoftware.com/api_rest/index.php/courses/courseId/teesheets/teesheetId/bookings/bookingId/bookedPlayers/bookedPlayerId
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings/${bookingId}/bookedPlayers/${bookingId}-1`;
    // console.log(url);

    // console.log(JSON.stringify(options));
    const headers = this.getHeaders(token);

    const response = await fetch(url, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(options),
    });
    // console.log(response);
    if (!response.ok) {
      if (response.status === 403) {
        // this.logger.error(`Error updating tee time: ${response.statusText}`);
        await this.getToken();
      }
      throw new Error(`Error updating tee time: ${response.statusText}`);
    }

    return (await response.json()) as BookingResponse;
  }

  getToken = async (): Promise<string> => {
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, API_KEY, TOKEN_ENDPOINT } = JSON.parse(
      this.providerConfiguration
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
    const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, X_Component_Id } = JSON.parse(this.providerConfiguration);
    return {
      "Content-Type": CONTENT_TYPE,
      Authorization: `bearer ${token}`,
      "client-secret": CLIENT_SECRET,
      "client-id": CLIENT_ID,
      "X-componentid": X_Component_Id,
    };
  }

  private getBasePoint(): string {
    const { TOKEN_ENDPOINT } = JSON.parse(this.providerConfiguration);

    switch (process.env.NODE_ENV) {
      case "development":
        return TOKEN_ENDPOINT;
      case "production":
        return TOKEN_ENDPOINT;
      default:
        return TOKEN_ENDPOINT;
    }
  }
}
