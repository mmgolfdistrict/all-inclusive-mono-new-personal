import Logger from "@golf-district/shared/src/logger";
import type pino from "pino";
import type { BookingResponse, CustomerCreationData, CustomerData, TeeTimeResponse } from "./foreup.type";

export type ForeUpCredentials = {
  username: string;
  password: string;
};

type ProviderCredentials = ForeUpCredentials;
export interface ProviderAPI {
  providerId: string;
  logger: pino.Logger;
  getTeeTimes: (
    token: string,
    courseId: string,
    teesheetId: string,
    startTime: string,
    endTime: string,
    date: string
  ) => Promise<TeeTimeResponse[]>;
  createBooking: (
    token: string,
    courseId: string,
    teeTimeId: string,
    options: any
  ) => Promise<BookingResponse>;
  updateTeeTime: (
    token: string,
    courseId: string,
    teeTimeId: string,
    bookingId: string,
    options: any
  ) => Promise<BookingResponse>;
  getToken: () => Promise<string>;
  createCustomer(token: string, courseId: string, customerData: CustomerCreationData): Promise<CustomerData>;
  getCustomer(token: string, courseId: string, customerId: string): Promise<CustomerData>;
}

export abstract class BaseProvider implements ProviderAPI {
  abstract providerId: string;
  protected credentials: ProviderCredentials;
  abstract logger: pino.Logger;

  constructor(credentials: ProviderCredentials) {
    this.credentials = credentials;
  }

  abstract getTeeTimes(
    token: string,
    courseId: string,
    teesheetId: string,
    startTime: string,
    endTime: string,
    date: string
  ): Promise<TeeTimeResponse[]>;
  abstract createBooking(
    token: string,
    courseId: string,
    teeTimeId: string,
    options: any
  ): Promise<BookingResponse>;
  abstract updateTeeTime(
    token: string,
    courseId: string,
    teeTimeId: string,
    bookingId: string,
    options: any
  ): Promise<BookingResponse>;
  abstract getToken: () => Promise<string>;
  abstract createCustomer(
    token: string,
    courseId: string,
    customerData: CustomerCreationData
  ): Promise<CustomerData>;
  abstract getCustomer(token: string, courseId: string, customerId: string): Promise<CustomerData>;
}
