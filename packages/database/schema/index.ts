import * as accounts from "./accounts";
import * as assets from "./assets";
import * as auctionAssets from "./auctionAssets";
import * as auctions from "./auctions";
import * as bids from "./bids";
import * as bookings from "./bookings";
import * as charities from "./charities";
import * as charityCourseLink from "./charityCourseLink";
import * as courseAssets from "./courseAssets";
import * as coursePromoCodeLink from "./coursePromoCodeLink";
import * as courses from "./courses";
import * as customerCart from "./customerCart";
import * as donations from "./donations";
import * as entities from "./entities";
import * as entityAdmins from "./entityAdmins";
import * as favorites from "./favorites";
import * as lists from "./lists";
import * as notifications from "./notifications";
import * as offerRead from "./offerRead";
import * as offers from "./offers";
import * as promoCodes from "./promoCodes";
import * as providers from "./providers";
import * as providerCourseLink from "./providersCourseLink";
import * as sessions from "./sessions";
import * as teeTimes from "./teeTimes";
import * as transfers from "./transfers";
import * as userBookingOffers from "./userBookingOffers";
import * as userPromoCodeLink from "./userPromoCodeLink";
import * as userProviderCourseLink from "./userProviderCourseLink";
import * as users from "./users";
import * as verificationTokens from "./verificationTokens";
import * as withdrawals from "./withdrawals";

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
  ...customerCart,
  ...withdrawals,
  ...promoCodes,
  ...coursePromoCodeLink,
  ...userPromoCodeLink,
  ...charities,
  ...charityCourseLink,
  ...donations,
};
