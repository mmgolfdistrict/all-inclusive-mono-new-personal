import * as accounts from "./accounts";
import * as adminPermissions from "./adminPermissions";
import * as adminPersonaRole from "./adminPersonaRole";
import * as adminPersonas from "./adminPersonas";
import * as adminRolePermission from "./adminRolePermission";
import * as adminRoles from "./adminRoles";
import * as adminUserCourse from "./adminUserCourse";
import * as adminUserRole from "./adminUserRole";
import * as adminUsers from "./adminUsers";
import * as appSettings from "./appSetting";
import * as assets from "./assets";
import * as auctionAssets from "./auctionAssets";
import * as auctions from "./auctions";
import * as auditlog from "./auditlog";
import * as authenticationMethod from "./authenticationMethod";
import * as bids from "./bids";
import * as bookings from "./bookings";
import * as cashouts from "./cashout";
import * as charities from "./charities";
import * as charityCourseLink from "./charityCourseLink";
import * as courseAllowedTimeToSell from "./courseAllowedTimeToSell";
import * as courseAssets from "./courseAssets";
import * as courseContacts from "./courseContacts";
import * as courseException from "./courseException";
import * as courseGlobalNotification from "./courseGlobalNotification";
import * as courseMarkup from "./courseMarkup";
import * as courseMembership from "./courseMembership";
import * as coursePromoCodeLink from "./coursePromoCodeLink";
import * as courses from "./courses";
import * as courseScheduleDetails from "./courseScheduleDetails";
import * as courseSEOs from "./courseSEO";
import * as courseUser from "./courseUser";
import * as customerCart from "./customerCart";
import * as customerPaymentDetail from "./customerPaymentDetails";
import * as customerRecievable from "./customerRecievable";
import * as donations from "./donations";
import * as entities from "./entities";
import * as entityAdmins from "./entityAdmins";
import * as favorites from "./favorites";
import * as jobs from "./jobs";
import * as lists from "./lists";
import * as majorEvents from "./majorEvents";
import * as notifications from "./notifications";
import * as nums from "./nums";
import * as offerRead from "./offerRead";
import * as offers from "./offers";
import * as profanities from "./profanities";
import * as promoCodes from "./promoCodes";
import * as providerAuthTokens from "./providerAuthTokens";
import * as providers from "./providers";
import * as providerScheduleDetails from "./providerScheduleDetails";
import * as providerCourseLink from "./providersCourseLink";
import * as sessions from "./sessions";
import * as systemNotification from "./systemNotification";
import * as teeTimeIndexLogs from "./teeTimeIndexLogs";
import * as teeTimes from "./teeTimes";
import * as transfers from "./transfers";
import * as userBookingOffers from "./userBookingOffers";
import * as userPromoCodeLink from "./userPromoCodeLink";
import * as userProviderCourseLink from "./userProviderCourseLink";
import * as users from "./users";
import * as userSession from "./userSession";
import * as userWaitlists from "./userWaitlists";
import * as verificationTokens from "./verificationTokens";
import * as withdrawals from "./withdrawals";
import * as groupBookings from "./groupBooking"

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
  ...appSettings,
  ...providerScheduleDetails,
  ...courseScheduleDetails,
  ...jobs,
  ...teeTimeIndexLogs,
  ...customerPaymentDetail,
  ...cashouts,
  ...customerRecievable,
  ...auditlog,
  ...profanities,
  ...courseSEOs,
  ...userWaitlists,
  ...systemNotification,
  ...courseException,
  ...courseMarkup,
  ...nums,
  ...majorEvents,
  ...adminUsers,
  ...adminUserCourse,
  ...courseGlobalNotification,
  ...providerAuthTokens,
  ...courseAllowedTimeToSell,
  ...userSession,
  ...courseUser,
  ...authenticationMethod,
  ...courseContacts,
  ...courseMembership,
  ...adminPermissions,
  ...adminPersonaRole,
  ...adminPersonas,
  ...adminRolePermission,
  ...adminRoles,
  ...adminUserRole,
  ...groupBookings
};
