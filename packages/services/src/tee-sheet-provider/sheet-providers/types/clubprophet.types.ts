export interface ClubProphetTeeTimeResponse {
  teeSheetId: number;
  participant: number;
  teeTypeId: number;
  startTime: string;
  startTimeString: string;
  startingTee: number;
  teeSuffix: string;
  freeSlots: number;
  locked: number;
  defaultRateCode: number;
  auctionId: number;
  is9HoleOnly: boolean;
  is18HoleOnly: boolean;
  siteId: number;
  greenFee9: number;
  greenFee9Code: number;
  greenFee18: number;
  greenFee18Code: number;
  cartFee9: number;
  cartFee9Code: number;
  cartFee18: number;
  cartFee18Code: number;
  caddieFee9: number;
  caddieFee9Code: number;
  caddieFee18: number;
  caddieFee18Code: number;
  rentalClubFee9: number;
  rentalClubFee9Code: number;
  rentalClubFee18: number;
  rentalClubFee18Code: number;
  otherFee9: number;
  otherFee9Code: number;
  otherFee18: number;
  otherFee18Code: number;
  package9: number;
  package9Code: number;
  package18: number;
  package18Code: number;
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

export interface TeeTimeResponseClubProphet {
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

export interface BookingCreationData {
  teeSheetId: number;
  holes: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  players: number;
  notes: string;
  pskUserId: number;
  terminalId: number;
  bookingTypeId: number;
  rateCode: string;
  price: number[];
}

export interface BookingResponse {
  success: boolean;
  responseText: string;
  participantIds: number[];
  reservationConfirmKey: null | string; // This can be either null or a string
  reservationId: number;
}
