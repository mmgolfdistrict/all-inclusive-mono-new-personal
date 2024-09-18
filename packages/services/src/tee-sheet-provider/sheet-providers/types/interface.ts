import type { InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
import type pino from "pino";
import type {
  BookingResponse as ForeUpBookingResponse,
  CustomerCreationData as ForeUpCustomerCreationData,
  CustomerData as ForeUpCustomerCreationResponse,
  TeeTimeResponse as ForeUpTeeTimeResponse,
} from "./foreup.type";
import type { LightSpeedBookingResponse, LightspeedBookingCreationData, LightspeedCustomerCreationData, LightspeedCustomerCreationResponse, LightspeedTeeTimeResponse } from "./lightspeed.type";
import { CacheService } from "../../../infura/cache.service";

export type ForeUpCredentials = {
  username: string;
  password: string;
};

export interface BuyerData {
  id: string;
  providerAccountNumber: number | string | null;
  providerCustomerId: number | string | null;
  name: string | null;
  email: string | null;
  address1: string | null;
  address2: string | null;
  state: string | null;
  zipcode: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  phoneNotification: boolean | null;
  emailNotification: boolean | null;
  handel: string | null;
}

export interface TeeTimeData {
  firstHandCharge: number;
  taxCharge: number;
  markupCharge: number;
  playerCount: number;
  teeTimeId: string;
  providerTeeTimeId: string;
  startTime: string;
  notes: string | null | undefined;
  holes: string | number;
  greenFees: number;
  cartFees: number;
  providerCustomerId: string | null;
}
export interface SecondHandBookingFields {
  data: {
    ownerId?: string;
    name?: string;
    purchasedFor?: number;
    bookingType?: string;
    weatherGuaranteeAmount?: number;
    weatherGuaranteeId?: string;
    playerCount?: number;
  }
}

type ProviderCredentials = ForeUpCredentials;

export type TeeTimeResponse = ForeUpTeeTimeResponse | LightspeedTeeTimeResponse;

export type BookingResponse = (ForeUpBookingResponse | LightSpeedBookingResponse) & SecondHandBookingFields;

export type BookingCreationData = LightspeedBookingCreationData;

export type CustomerCreationData = ForeUpCustomerCreationData | LightspeedCustomerCreationData;

export type CustomerData = ForeUpCustomerCreationResponse | LightspeedCustomerCreationResponse;


export interface ProviderAPI {
  providerId: string;
  logger: pino.Logger;
  providerConfiguration?: string | undefined;
  cacheService: CacheService | undefined;
  getTeeTimes: (
    token: string,
    courseId: string,
    teesheetId: string,
    startTime: string,
    endTime: string,
    date: string,
    rateCode?: string
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
  getToken: () => Promise<string | undefined>;
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
    courseId: string,
    providerSlotIds?: string[]
  ) => Promise<InsertBookingSlots[]>;
  getCustomerCreationData(buyerData: BuyerData): CustomerCreationData;
  getCustomerId(customerData: CustomerData): string;
  getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData;
  getBookingId(bookingData: BookingResponse): string;
  getSlotIdsFromBooking(bookingData: BookingResponse): string[];
  getAvailableSpotsOnTeeTime(teeTime: TeeTimeResponse): number;
  indexTeeTime(
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string
  ): Promise<unknown>
}

export abstract class BaseProvider implements ProviderAPI {
  abstract providerId: string;
  protected credentials: ProviderCredentials | undefined;
  abstract logger: pino.Logger;
  providerConfiguration: string | undefined;
  cacheService: CacheService | undefined;

  constructor(credentials?: ProviderCredentials, providerConfiguration?: string, cacheService?: CacheService) {
    this.credentials = credentials;
    this.providerConfiguration = providerConfiguration;
    this.cacheService = cacheService;
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
    options: any,
    slotId: string | undefined
  ): Promise<BookingResponse>;
  abstract deleteBooking(
    token: string,
    courseId: string,
    teesheetId: string,
    bookingId: string
  ): Promise<void>;
  abstract getToken(): Promise<string | undefined>;
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
    courseId: string,
    providerSlotIds?: string[]
  ): Promise<InsertBookingSlots[]>;
  abstract getCustomerCreationData(buyerData: BuyerData): CustomerCreationData;
  abstract getCustomerId(customerData: CustomerData): string;
  abstract getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData;
  abstract getBookingId(bookingData: BookingResponse): string;
  abstract getSlotIdsFromBooking(bookingData: BookingResponse): string[];
  abstract getAvailableSpotsOnTeeTime(teeTime: TeeTimeResponse): number;
  abstract indexTeeTime(
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string
  ): Promise<unknown>
}