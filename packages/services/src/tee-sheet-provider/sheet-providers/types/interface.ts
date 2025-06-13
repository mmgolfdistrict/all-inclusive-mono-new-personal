import type { InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
import type pino from "pino";
import type { CacheService } from "../../../infura/cache.service";
import type {
  BookingCreationData as ClubProphetBookingCreationData,
  ClubProphetBookingResponse,
  ClubProphetCustomerCreationData,
  ClubProphetCustomerCreationResponse,
  ClubProphetGetCustomerResponse,
  ClubProphetTeeTimeResponse,
} from "./clubprophet.types";
import type {
  BookingCreationData as ForeupBookingCreationData,
  ForeUpBookingNameChangeOptions,
  BookingResponse as ForeUpBookingResponse,
  CustomerCreationData as ForeUpCustomerCreationData,
  CustomerData as ForeUpCustomerCreationResponse,
  ForeUpGetCustomerResponse,
  ForeupSaleDataOptions,
  TeeTimeResponse as ForeUpTeeTimeResponse,
} from "./foreup.type";
import type {
  LightspeedBookingCreationData,
  LightspeedBookingNameChangeOptions,
  LightSpeedBookingResponse,
  LightspeedCustomerCreationData,
  LightspeedCustomerCreationResponse,
  LightspeedGetCustomerResponse,
  LightspeedSaleDataOptions,
  LightspeedTeeTimeResponse,
} from "./lightspeed.type";
import type {
  QuickEighteenBookingCreationData,
  QuickEighteenBookingResponse,
  QuickEighteenCustomerCreationData,
  QuickEighteenGetCustomerResponse,
  QuickEighteenTeeTimeResponse
} from "./quickEighteen.types";

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
  accountNumber: number;
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
  providerAccountNumber: number | string | null;
  providerCourseId: string | null;
  totalAmountPaid: number;
  name: string | null;
  email: string | null;
  phone: string | null;
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
  };
}
export type BookingDetails = {
  providerCourseId: string;
  providerTeeSheetId: string;
  playerCount: number;
  totalAmountPaid: number;
  token: string;
  greenFeeCharge: number;
  cartFeeCharge: number;
};

export type NameChangeCustomerDetails = {
  name: string;
  providerBookingId: string;
  providerCustomerId: string;
};

export type FetchCustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ProviderCredentials = ForeUpCredentials;

export type TeeTimeResponse = ForeUpTeeTimeResponse | ClubProphetTeeTimeResponse | LightspeedTeeTimeResponse | QuickEighteenTeeTimeResponse;

export type BookingResponse = (
  | ForeUpBookingResponse
  | ClubProphetBookingResponse
  | LightSpeedBookingResponse
  | QuickEighteenBookingResponse
) &
  SecondHandBookingFields;

export type BookingCreationData =
  | ForeupBookingCreationData
  | ClubProphetBookingCreationData
  | LightspeedBookingCreationData
  | QuickEighteenBookingCreationData;

export type CustomerCreationData =
  | ForeUpCustomerCreationData
  | ClubProphetCustomerCreationData
  | LightspeedCustomerCreationData
  | QuickEighteenCustomerCreationData;

export type CustomerData =
  | ForeUpCustomerCreationResponse
  | ClubProphetCustomerCreationResponse
  | LightspeedCustomerCreationResponse
  | QuickEighteenGetCustomerResponse;

export type SalesDataOptions = ForeupSaleDataOptions | LightspeedSaleDataOptions;

export type BookingNameChangeOptions = ForeUpBookingNameChangeOptions | LightspeedBookingNameChangeOptions;

export type GetCustomerResponse =
  | ForeUpGetCustomerResponse
  | ClubProphetGetCustomerResponse
  | LightspeedGetCustomerResponse
  | QuickEighteenGetCustomerResponse;

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
    date: string
  ) => Promise<TeeTimeResponse[]>;
  createBooking: (
    token: string,
    courseId: string,
    teeTimeId: string,
    options: any,
    userId: string
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
  getCustomer: (token: string, courseId: string, customerDetails: FetchCustomerDetails) => Promise<GetCustomerResponse | undefined>;
  getSlotIdsForBooking: (
    bookingId: string,
    slots: number,
    clientId: string,
    providerBookingId: string | string[],
    providerId: string,
    courseId: string,
    providerSlotIds?: string[] | undefined,
    providerCourseMembershipId?: string
  ) => Promise<InsertBookingSlots[]>;
  shouldAddSaleData: () => boolean;
  getSalesDataOptions: (reservationData: BookingResponse, bookingDetails: BookingDetails) => SalesDataOptions;
  addSalesData: (options: SalesDataOptions) => Promise<void>;
  supportsPlayerNameChange(): boolean;
  getCustomerCreationData(buyerData: BuyerData): CustomerCreationData;
  getCustomerId(customerData: CustomerData): string;
  getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData;
  getBookingId(bookingData: BookingResponse): string;
  getPlayerCount(bookingData: BookingResponse): number;
  getSlotIdsFromBooking(bookingData: BookingResponse): string[];
  getAvailableSpotsOnTeeTime(teeTime: TeeTimeResponse): number;
  indexTeeTime(
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string,
    providerTeeTimeId: string
  ): Promise<unknown>;
  findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): TeeTimeResponse | undefined;
  getBookingNameChangeOptions(customerDetails: NameChangeCustomerDetails): BookingNameChangeOptions;
  getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): {
    customerId: string;
    accountNumber?: number;
  };
  requireToCreatePlayerSlots(): boolean;
  checkBookingIsCancelledOrNot(
    providerBookingId: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    token: string,
    providerInternalId: string,
    courseId: string,
    providerCourseConfiguration: string
  ): Promise<boolean>;
  SearchCustomer(token: string, providerCourseId: string, email: string): Promise<CustomerData>;
}

export abstract class BaseProvider implements ProviderAPI {
  abstract providerId: string;
  protected credentials: ProviderCredentials | undefined;
  abstract logger: pino.Logger;
  providerConfiguration: string | undefined;
  cacheService: CacheService | undefined;

  constructor(
    credentials?: ProviderCredentials,
    providerConfiguration?: string,
    cacheService?: CacheService
  ) {
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
    options: any,
    userId: string
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
  abstract getCustomer(
    token: string,
    courseId: string,
    customerDetails: FetchCustomerDetails
  ): Promise<GetCustomerResponse | undefined>;
  abstract getSlotIdsForBooking(
    bookingId: string,
    slots: number,
    clientId: string,
    providerBookingId: string | string[],
    providerId: string,
    courseId: string,
    providerSlotIds?: string[],
    providerCourseMembershipId?: string
  ): Promise<InsertBookingSlots[]>;
  abstract shouldAddSaleData(): boolean;
  abstract getSalesDataOptions(
    reservationData: BookingResponse,
    bookingDetails: BookingDetails
  ): SalesDataOptions;
  abstract addSalesData(options: SalesDataOptions): Promise<void>;
  abstract supportsPlayerNameChange(): boolean;
  abstract getCustomerCreationData(buyerData: BuyerData): CustomerCreationData;
  abstract getCustomerId(customerData: CustomerData): string;
  abstract getBookingCreationData(teeTimeData: TeeTimeData): BookingCreationData;
  abstract getBookingId(bookingData: BookingResponse): string;
  abstract getPlayerCount(bookingData: BookingResponse): number;
  abstract getSlotIdsFromBooking(bookingData: BookingResponse): string[];
  abstract getAvailableSpotsOnTeeTime(teeTime: TeeTimeResponse): number;
  abstract indexTeeTime(
    formattedDate: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    provider: ProviderAPI,
    token: string,
    time: number,
    teeTimeId: string,
    providerTeeTimeId: string
  ): Promise<unknown>;
  abstract findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): TeeTimeResponse | undefined;
  abstract getBookingNameChangeOptions(customerDetails: NameChangeCustomerDetails): BookingNameChangeOptions;
  abstract getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): {
    customerId: string;
    accountNumber?: number;
  };
  abstract checkBookingIsCancelledOrNot(
    providerBookingId: string,
    providerCourseId: string,
    providerTeeSheetId: string,
    token: string,
    providerInternalId: string,
    courseId: string,
    providerCourseConfiguration: string
  ): Promise<boolean>;
  abstract SearchCustomer(token: string, providerCourseId: string, email: string): Promise<CustomerData>;
  /**
   * Whether to require to create player slots to allow players for name changes
   */
  abstract requireToCreatePlayerSlots(): boolean;
}
