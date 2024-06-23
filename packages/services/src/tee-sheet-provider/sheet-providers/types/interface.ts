import type { InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
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
  providerConfiguration?: string | undefined;
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
    options: any,
    slotId: string | undefined
  ) => Promise<BookingResponse>;
  deleteBooking: (token: string, courseId: string, teesheetId: string, bookingId: string) => Promise<void>; // Added deleteBooking to the interface
  getToken: () => Promise<string>;
  createCustomer: (
    token: string,
    courseId: string,
    customerData: CustomerCreationData
  ) => Promise<CustomerData>;
  getCustomer: (token: string, courseId: string, customerId: string) => Promise<CustomerData>;
  getSlotIdsForBooking: (
    bookingId: string,
    slots: number,
    clientId: string,
    providerBookingId: string,
    providerId: string,
    courseId: string
  ) => Promise<InsertBookingSlots[]>;
}

export abstract class BaseProvider implements ProviderAPI {
  abstract providerId: string;
  protected credentials: ProviderCredentials;
  abstract logger: pino.Logger;
  providerConfiguration: string | undefined;

  constructor(credentials: ProviderCredentials, providerConfiguration?: string) {
    this.credentials = credentials;
    this.providerConfiguration = providerConfiguration;
  }

  // Abstract methods declaration
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
  abstract deleteBooking(
    token: string,
    courseId: string,
    teesheetId: string,
    bookingId: string
  ): Promise<void>;
  abstract getToken: () => Promise<string>;
  abstract createCustomer(
    token: string,
    courseId: string,
    customerData: CustomerCreationData
  ): Promise<CustomerData>;
  abstract getCustomer(token: string, courseId: string, customerId: string): Promise<CustomerData>;
  abstract getSlotIdsForBooking(
    bookingId: string,
    slots: number,
    clientId: string,
    providerBookingId: string,
    providerId: string,
    courseId: string
  ): Promise<InsertBookingSlots[]>;
}
