import * as accounts from "./accounts";
import * as assets from "./assets";
import * as auctionAssets from "./auctionAssets";
import * as auctions from "./auctions";
import * as bids from "./bids";
import * as bookings from "./bookings";
import * as courseAssets from "./courseAssets";
import * as courses from "./courses";
import * as entities from "./entities";
import * as entityAdmins from "./entityAdmins";
import * as favorites from "./favorites";
import * as lists from "./lists";
import * as notifications from "./notifications";
import * as offerRead from "./offerRead";
import * as offers from "./offers";
import * as providers from "./providers";
import * as providerCourseLink from "./providersCourseLink";
import * as sessions from "./sessions";
import * as teeTimes from "./teeTimes";
import * as transfers from "./transfers";
import * as userBookingOffers from "./userBookingOffers";
import * as userProviderCourseLink from "./userProviderCourseLink";
import * as users from "./users";
import * as verificationTokens from "./verificationTokens";

export const schema = {
  ...accounts,
  ...assets,
  ...auctions,
  ...auctionAssets,
  ...courseAssets,
  ...bids,
  ...bookings,
  ...courses,
  ...entities,
  ...entityAdmins,
  ...favorites,
  ...lists,
  ...notifications,
  ...providers,
  ...sessions,
  ...teeTimes,
  ...transfers,
  ...userBookingOffers,
  ...users,
  ...verificationTokens,
  ...providerCourseLink,
  ...offers,
  ...offerRead,
  ...userProviderCourseLink,
};
