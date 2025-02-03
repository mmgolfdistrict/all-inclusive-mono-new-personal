//types subject to change
export interface TeeTimeQueryParams {
  courseId: string;
  teesheetId: string;
  startTime: string;
  endTime: string;
  date: string;
  bookingClassId: string;
  customerId: string;
  priceClassId: string;
  holes: string;
  scheduleSideId: string;
}

export interface TeeTimeSlotAttributes {
  time: string;
  holes: number;
  scheduleName: string;
  scheduleId: string;
  bookingClassId: number;
  availableSpots: number;
  greenFee: number;
  cartFee: number;
  rateType: string;
  greenFeeTax: number | undefined;
  cartFeeTax: number;
  hasSpecial: boolean;
  specialDiscountPercentage: number;
  tradeDiscountAvailable: number;
  tradeMinPlayersRequired: number;
  tradeAvailablePlayers: number;
  scheduleSideId: number;
  scheduleSideName: string;
  reroundScheduleSideId: number;
  reroundScheduleSideName: string;
  allowedGroupSizes: number[];
}

export interface TeeTimeResponse {
  type: string;
  id: string;
  attributes: TeeTimeSlotAttributes;
}
export interface TeeTimeRequestOptions {
  startTime?: string;
  endTime?: string;
  date?: string;
  bookingClassId?: string;
  customerId?: string;
  priceClassId?: string;
  holes?: string;
  scheduleSideId?: string;
}

// export interface TeeTimeAttributes {
//   time: string;
//   holes: number;
//   scheduleName: string;
//   scheduleId: string;
//   bookingClassId: number;
//   availableSpots: number;
//   greenFee: number;
//   cartFee: number;
//   rateType: string;
//   greenFeeTax: number;
//   cartFeeTax: number;
//   hasSpecial: boolean;
//   specialDiscountPercentage: number;
//   tradeDiscountAvailable: number;
//   tradeMinPlayersRequired: number;
//   tradeAvailablePlayers: number;
//   scheduleSideId: number;
//   scheduleSideName: string;
//   reroundScheduleSideId: number;
//   reroundScheduleSideName: string;
//   allowedGroupSizes: number[];
// }

// export interface TeeTimeSlot {
//   type: string;
//   id: string;
//   attributes: TeeTimeAttributes;
// }

export interface BookingCreationData {
  totalAmountPaid: number;
  data: {
    type: string;
    attributes: {
      start: string;
      side?: string;
      event_type: string;
      details: string;
      scheduleSideId?: number;
      holes: string;
      players: number;
      bookedPlayers: { accountNumber: number }[];
      carts?: number;
      title?: string;
      booking_class_id?: number;
    };
  };
}

export interface BookingResponse {
  data: {
    type: string;
    id: string;
    ownerId?: string;
    name?: string;
    purchasedFor?: number;
    bookingType?: string;
    weatherGuaranteeAmount?: number;
    weatherGuaranteeId?: string;
    attributes: {
      isReround: boolean;
      type: string;
      status: string;
      duration: number;
      playerCount: number;
      holes: number;
      carts: number;
      paidPlayerCount: number;
      noShowCount: number;
      title: string;
      details: string;
      side: string;
      bookingSource: string;
      start: string;
      end: string;
      lastUpdated: string;
      dateBooked: string;
      isTrade: boolean;
    };
    relationships: {
      players: any;
      sales: any;
    };
  };
}
export interface BookingAttributes {
  isReround: boolean;
  type: string;
  status: string;
  duration: number;
  playerCount: number;
  holes: number;
  carts: number;
  paidPlayerCount: number;
  noShowCount: number;
  title: string;
  details: string;
  side: string;
  bookingSource: string;
  start: string;
  end: string;
  lastUpdated: string;
  dateBooked: string;
  isTrade: boolean;
  priceClassId?: string;
}

export interface Relationships {
  players: any;
  sales: any;
}

export interface BookingData {
  type: string;
  id: string;
  attributes: BookingAttributes;
  relationships: Relationships;
}

export interface BookingRequestBody {
  data: BookingData;
}

export interface BookingResponseBody {
  data: BookingData;
}
export interface TeeTimeUpdateRequest {
  data: {
    type: string;
    id: string;
    attributes: BookingAttributes;
    relationships: {
      players: Record<string, any>;
      sales: Record<string, any>;
    };
  };
}

export interface TeeTime {
  time: string;
  start_front: number;
  course_id: number;
  course_name: string;
  schedule_id: number;
  teesheet_id: number;
  schedule_name: string;
  require_credit_card: boolean;
  teesheet_holes: number;
  teesheet_side_id: number;
  teesheet_side_name: string;
  teesheet_side_order: number;
  reround_teesheet_side_id: number;
  reround_teesheet_side_name: string;
  available_spots: number;
  available_spots_9: number;
  available_spots_18: number;
  maximum_players_per_booking: string;
  minimum_players: string;
  allowed_group_sizes: string[];
  holes: number;
  has_special: boolean;
  special_id: boolean | false;
  special_discount_percentage: number;
  group_id: boolean | false;
  booking_class_id: number;
  booking_fee_required: boolean;
  booking_fee_price: boolean | false;
  booking_fee_per_person: boolean | false;
  foreup_trade_discount_rate: number;
  trade_min_players: number;
  trade_available_players: number;
  green_fee_tax_rate: boolean | false;
  green_fee_tax: number;
  green_fee_tax_9: number;
  green_fee_tax_18: number;
  guest_green_fee_tax_rate: boolean | false;
  guest_green_fee_tax: number;
  guest_green_fee_tax_9: number;
  guest_green_fee_tax_18: number;
  cart_fee_tax_rate: boolean | false;
  cart_fee_tax: number;
  cart_fee_tax_9: number;
  cart_fee_tax_18: number;
  guest_cart_fee_tax_rate: boolean | false;
  guest_cart_fee_tax: number;
  guest_cart_fee_tax_9: number;
  guest_cart_fee_tax_18: number;
  foreup_discount: boolean | false;
  pay_online: string;
  green_fee: number;
  green_fee_9: number;
  green_fee_18: number;
  guest_green_fee: number;
  guest_green_fee_9: number;
  guest_green_fee_18: number;
  cart_fee: number;
  cart_fee_9: number;
  cart_fee_18: number;
  guest_cart_fee: number;
  guest_cart_fee_9: number;
  guest_cart_fee_18: number;
  rate_type: string;
  special_was_price: number | null;
}

export interface CustomerData {
  data: {
    type: string; // "customer"
    id: number; // 134132
    attributes: CustomerAttributes; // nested interface
  };
}

export interface CustomerCreationData {
  type: string;
  attributes: CustomerAttributes;
}
export interface CustomerAttributes {
  id?: number;
  account_number?: number;
  username?: string;
  company_name?: string;
  taxable?: boolean;
  discount?: number;
  opt_out_email?: boolean;
  opt_out_text?: boolean;
  date_created?: string;
  email_subscribed?: boolean;
  online_booking_disabled?: boolean;
  price_class?: string;
  groups?: string[];
  contact_info: ContactInfo;
  email?: string | null;
}
export interface ContactInfo {
  first_name: string;
  last_name: string;
  account_number?: number;
  phone_number?: string;
  cell_phone_number?: string;
  email: string | null;
  birthday?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  handicap_account_number?: string;
  handicap_score?: string;
  comments?: string;
  gender?: string;
}

export interface CartData {
  data: {
    type: string;
    id: string;
    attributes: {
      total: number;
      totalDue: number;
      tax: number;
      subTotal: number;
      status: string;
      lastActivity: string;
    };
  };
}

export interface ForeupSaleDataOptions {
  totalAmountPaid: number;
  players: number;
  courseId: string | number;
  teesheetId: string | number;
  bookingId: string;
  token: string;
}

export interface ForeUpBookingNameChangeOptions {
  data: {
    type: "Guest";
    id: string;
    attributes: {
      type: "Guest";
      name: string;
      paid: boolean;
      cartPaid: boolean;
      noShow: boolean;
      personId: string | number;
    };
  };
}

export interface ForeUpGetCustomerResponse {
  type: string;
  id: number;
  attributes: CustomerAttributes;
}

export interface ForeupGetCustomers {
  data: ForeUpGetCustomerResponse[];
}
