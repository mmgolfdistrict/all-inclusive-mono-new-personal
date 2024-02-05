export type IconCodeType =
  | "" //no icon
  | "skc"
  | "few"
  | "sct"
  | "bkn"
  | "ovc"
  | "wind_skc"
  | "wind_few"
  | "wind_sct"
  | "wind_bkn"
  | "wind_ovc"
  | "snow"
  | "rain_snow"
  | "rain_sleet"
  | "snow_sleet"
  | "fzra"
  | "rain_fzra"
  | "snow_fzra"
  | "sleet"
  | "rain"
  | "rain_showers"
  | "rain_showers_hi"
  | "tsra"
  | "tsra_sct"
  | "tsra_hi"
  | "tornado"
  | "hurricane"
  | "tropical_storm"
  | "dust"
  | "smoke"
  | "haze"
  | "hot"
  | "cold"
  | "blizzard"
  | "fog";

export type EntityType = {
  id?: string;
  name?: string | null;
  description?: string | null;
  font?: string;
  color1?: string;
  color2?: string;
  color3?: string;
  subdomain?: string | null;
  customDomain?: string | null;
  message404?: string | null;
  createdAt?: string;
  updatedAt?: Date;
  updatedById?: string | null;
  logo: string;
};

export type CourseType = {
  logo: string | undefined;
  images: string[];
  id: string;
  name: string;
  description: string | null;
  address: string | null;
};

export type CourseImagesType = { logo?: string; images: string[] };

export type FullCourseType = {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  longitude: number | null;
  latitude: number | null;
  forecastApi: string | null;
  charityName: string | null;
  charityDescription: string | null;
  convenienceFees: number | null;
  markup: number | null;
  openTime: string | null;
  closeTime: string | null;
  supportCharity: boolean;
  supportSensibleWeather: boolean;
  timezoneCorrection: number;
  highestListedTeeTime: number;
  lowestListedTeeTime: number;
  highestPrimarySaleTeeTime: number;
  lowestPrimarySaleTeeTime: number;
};

export type Course = FullCourseType & CourseImagesType;

export type WatchlistItem = {
  watchListId: string;
  watchListCreatedAt: string;
  ownedBy: string;
  teeTimeId: string;
  courseId: string;
  teeTimeExpiration: string;
  price: number;
  availableSpots: number;
  image: string;
  type: "FIRST_PARTY" | "SECOND_HAND";
  status: "LISTED" | "UNLISTED";
  bookingIds: string[];
  ownedById: string;
  listId?: string;
  minimumOfferPrice: number;
};

export interface BookingGroup {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  teeTimeId: string;
  date: string | null;
  time: number;
  listingId: string | null;
  userWatchListed: boolean;
  includesCart: boolean;
  teeTimeOwnedByCaller: boolean;
  listsPrice: string | null;
  teeTimeStatus: "LISTED" | "UNLISTED";
  minimumOfferPrice: number;
  firstHandPrice: number;
  golfers: string[];
  purchasedFor: number;
  bookings: string[];
}

export type GroupedBookings = Record<string, BookingGroup>;

export enum TeeTimeType {
  FIRST_HAND = "FIRST_HAND",
  SECOND_HAND = "SECOND_HAND",
  UNLISTED = "UNLISTED",
}

export type SearchObject = {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  teeTimeId: string;
  date: string; //day of tee time
  time: number; //military time
  includesCart: boolean;
  firstOrSecondHandTeeTime: TeeTimeType;
  isListed: boolean; //false if the booking is unlisted
  userWatchListed: boolean;
  weather: {
    temperature: number;
    shortForecast: string;
    name: string;
    iconCode: IconCodeType;
  };
  listingId?: string;
  bookingIds?: string[];
  minimumOfferPrice?: number;
  firstHandPurchasePrice?: number;
};

export type CombinedObject = {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  teeTimeId: string;
  date: string; //day of tee time
  time: number; //military time
  isOwned: boolean;
  includesCart: boolean;
  firstOrSecondHandTeeTime: TeeTimeType;
  isListed: boolean; //false if the booking is unlisted
  userWatchListed: boolean;
  listingId?: string;
  bookingIds: string[];
  minimumOfferPrice?: number;
  firstHandPurchasePrice?: number;
};
