import Logger from "@golf-district/shared/src/logger";
import type {
  BookingCreationData,
  BookingResponse,
  CustomerCreationData,
  CustomerData,
  TeeTimeResponse,
  TeeTimeUpdateRequest,
} from "./types/foreup.type";
import { BaseProvider } from "./types/interface";

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
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/teetimes?startTime=${startTime}&endTime=${endTime}&date=${date}`;
    const headers = this.getHeaders(token);

    const response = await fetch(url, { headers, method: "GET" });

    if (!response.ok) {
      if (response.status === 403) {
        this.logger.error(`Error fetching tee time: ${response.statusText}`);
        await this.getToken();
      }

      throw new Error(`Error fetching tee times: ${response.statusText}`);
    }

    return (await response.json()).data as TeeTimeResponse[];
  }

  async createBooking(
    token: string,
    courseId: string,
    teesheetId: string,
    data: BookingCreationData
  ): Promise<BookingResponse> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/teesheets/${teesheetId}/bookings`;

    const headers = this.getHeaders(token);

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 403) {
        this.logger.error(`Error creating booking: ${response.statusText}`);
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
        this.logger.error(`Error updating tee time: ${response.statusText}`);
        await this.getToken();
      }
      throw new Error(`Error updating tee time: ${response.statusText}`);
    }

    return (await response.json()) as BookingResponse;
  }

  async createCustomer(
    token: string,
    courseId: string,
    customerData: CustomerCreationData
  ): Promise<CustomerData> {
    // Fetch required fields for the course
    const requiredFieldsUrl = `${this.getBasePoint()}/courses/${courseId}/settings/customerFieldSettings`;
    const requiredFieldsResponse = await fetch(requiredFieldsUrl, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    if (!requiredFieldsResponse.ok) {
      throw new Error(`Error fetching required fields: ${requiredFieldsResponse.statusText}`);
    }

    const requiredFields = await requiredFieldsResponse.json();

    //Validate required fields in customerData
    for (const field in requiredFields) {
      if (requiredFields[field].required && !customerData.attributes.contact_info.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    //Create Customer
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/customers`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(token),
      body: JSON.stringify({
        data: customerData,
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        this.logger.error(`Error creating customer: ${response.statusText}`);
      }
      throw new Error(`Error creating customer: ${response.statusText}`);
    }

    return (await response.json()) as CustomerData;
  }

  async getCustomer(token: string, courseId: string, customerId: string): Promise<CustomerData> {
    const endpoint = this.getBasePoint();
    const url = `${endpoint}/courses/${courseId}/customers/${customerId}`;

    const headers = this.getHeaders(token);

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      this.logger.error(`Error fetching customer: ${response.statusText}`);
      throw new Error(`Error fetching customer: ${response.statusText}`);
    }

    return (await response.json()) as CustomerData;
  }

  getToken = async (): Promise<string> => {
    const endpoint = this.getBasePoint();
    const response = await fetch(`${endpoint}/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.credentials.username, password: this.credentials.password }),
    });

    if (!response.ok) {
      this.logger.fatal(`Error fetching token: ${response.statusText}`);
      throw new Error(`Error fetching token: ${response.statusText}`);
    }

    const responseData = await response.json();
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
