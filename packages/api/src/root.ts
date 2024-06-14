import { auctionRouter } from "./routers/auction";
import { authRouter } from "./routers/auth";
import { bookingRouter } from "./routers/booking";
import { cashOutRouter } from "./routers/cashout";
import { checkoutRouter } from "./routers/checkout";
import { courseRouter } from "./routers/course";
import { domainRouter } from "./routers/domain";
import { entityRouter } from "./routers/entity";
import { geoCodeRouter } from "./routers/geo";
import { historyRouter } from "./routers/history";
import { imageRouter } from "./routers/image";
import { placesRouter } from "./routers/places";
import { profanityRouter } from "./routers/profanity";
import { registerRouter } from "./routers/register";
import { searchRouter } from "./routers/search";
import { sensibleRouter } from "./routers/sensible";
import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
import { waitlistNotificationRouter } from "./routers/waitlistNotification";
import { watchlistRouter } from "./routers/watchlist";
import { weatherRouter } from "./routers/weather";
import { webhookRouter } from "./routers/webhooks";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auction: auctionRouter,
  auth: authRouter,
  checkout: checkoutRouter,
  course: courseRouter,
  domain: domainRouter,
  entity: entityRouter,
  geocode: geoCodeRouter,
  image: imageRouter,
  places: placesRouter,
  register: registerRouter,
  sensible: sensibleRouter,
  upload: uploadRouter,
  user: userRouter,
  weather: weatherRouter,
  searchRouter: searchRouter,
  webhooks: webhookRouter,
  history: historyRouter,
  watchlist: watchlistRouter,
  teeBox: bookingRouter,
  cashOut: cashOutRouter,
  profanity: profanityRouter,
  waitlistNotification: waitlistNotificationRouter,
});

export type AppRouter = typeof appRouter;
