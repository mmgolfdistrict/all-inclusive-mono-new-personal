import { db } from "@golf-district/database";
import {
  AppSettingsService,
  BookingService,
  CourseSEOService,
  CourseService,
  EntityService,
  ForeUpWebhookService,
  HyperSwitchService,
  HyperSwitchWebhookService,
  NotificationService,
  ProviderService,
  SensibleService,
  StripeConnectWebhookService,
  StripeService,
  TokenizeService,
  UpdateWithdrawableBalance,
} from "@golf-district/service";
import { UserWaitlistService } from "@golf-district/service/src/user-waitlist/userWaitlist.service";
import { LoggerService } from "@golf-district/service/src/webhooks/logging.service";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./src/root";

export { appRouter, type AppRouter } from "./src/root";
export { createTRPCContext } from "./src/trpc";
export { verifySignatureAppRouter } from "@golf-district/service";
export type RouterInputs = inferRouterInputs<AppRouter>;

export type RouterOutputs = inferRouterOutputs<AppRouter>;

export const ssrGetEntityByDomain = async (domain: string, rootDomain: string) => {
  try {
    const entityService = new EntityService(db);
    return await entityService.getEntityFromDomain(domain, rootDomain);
  } catch (error) {
    throw new Error(`ssrGetEntityByDomain Error: ${String(error)}`);
  }
};
export const ssrGetStaticPaths = async () => {
  const entityService = new EntityService(db);
  return await entityService.getStaticParams();
};

export const getCourseById = async (courseId: string) => {
  const credentials = {
    username: process.env.FOREUP_USERNAME!,
    password: process.env.FOREUP_PASSWORD!,
  };
  const providerService = new ProviderService(
    db,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!,
    credentials
  );
  const courseService = new CourseService(
    db,
    process.env.VERCEL_PROJECT_ID!,
    process.env.VERCEL_TEAM_ID!,
    process.env.VERCEL_AUTH_BEARER_TOKEN!,
    providerService
  );
  try {
    return await courseService.getCourseById(courseId);
  } catch (error) {
    console.log(error);
  }
};

export const getSupportedCharitiesForCourseId = async (courseId: string) => {
  const credentials = {
    username: process.env.FOREUP_USERNAME!,
    password: process.env.FOREUP_PASSWORD!,
  };
  const providerService = new ProviderService(
    db,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!,
    credentials
  );
  const courseService = new CourseService(
    db,
    process.env.VERCEL_PROJECT_ID!,
    process.env.VERCEL_TEAM_ID!,
    process.env.VERCEL_AUTH_BEARER_TOKEN!,
    providerService
  );

  try {
    return await courseService.getSupportedCharitiesForCourseId(courseId);
  } catch (error) {
    console.error("Error fetching supported charities:", error);
    return []; // Return an empty array on error to avoid breaking the UI
  }
};

export const getCourseImages = async (courseId: string) => {
  const credentials = {
    username: process.env.FOREUP_USERNAME!,
    password: process.env.FOREUP_PASSWORD!,
  };
  const providerService = new ProviderService(
    db,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!,
    credentials
  );
  const courseService = new CourseService(
    db,
    process.env.VERCEL_PROJECT_ID!,
    process.env.VERCEL_TEAM_ID!,
    process.env.VERCEL_AUTH_BEARER_TOKEN!,
    providerService
  );
  try {
    return await courseService.getImagesForCourse(courseId);
  } catch (error) {
    console.log(error);
  }
};

export const getCourseSEOInfo = async (courseId: string) => {
  const courseSEOService = new CourseSEOService(db);
  try {
    return await courseSEOService.getCourseSEO(courseId);
  } catch (error) {
    console.log(error);
  }
};

export const processForeUpWebhook = async () => {
  const credentials = {
    username: process.env.FOREUP_USERNAME!,
    password: process.env.FOREUP_PASSWORD!,
  };
  const providerService = new ProviderService(
    db,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!,
    credentials
  );
  const foreUpWebhookService = new ForeUpWebhookService(db, providerService);
  // await foreUpWebhookService.handleWebhook().catch((error) => {
  //   console.log(error);
  // });
};

export const processStripeWebhook = async (req: any, sig: string) => {
  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);
  const notificationService = new NotificationService(
    db,
    process.env.TWILLIO_PHONE_NUMBER!,
    process.env.SENDGRID_EMAIL!,
    process.env.TWILLIO_ACCOUNT_SID!,
    process.env.TWILLIO_AUTH_TOKEN!,
    process.env.SENDGRID_API_KEY!
  );
  const stripeConnectWebhookService = new StripeConnectWebhookService(
    db,
    notificationService,
    stripeService,
    process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET!
  );
  await stripeConnectWebhookService.processWebhook(req, sig).catch((error) => {
    console.log(error);
  });
};

export const processUpdateWithdrawableBalance = async (req: { userId: string; amount: number }) => {
  const notificationService = new NotificationService(
    db,
    process.env.TWILLIO_PHONE_NUMBER!,
    process.env.SENDGRID_EMAIL!,
    process.env.TWILLIO_ACCOUNT_SID!,
    process.env.TWILLIO_AUTH_TOKEN!,
    process.env.SENDGRID_API_KEY!
  );
  const updateWithdrawableBalanceService = new UpdateWithdrawableBalance(
    db,
    notificationService,
    process.env.QSTASH_CURRENT_SIGNING_KEY!,
    process.env.QSTASH_NEXT_SIGNING_KEY!
  );
  await updateWithdrawableBalanceService.processWebhook(req).catch((error) => {
    console.log(error);
  });
};

export const processHyperSwitchWebhook = async (req: any) => {
  console.log("processHyperSwitchWebhook");
  console.log(req);

  const appSettingService = new AppSettingsService(db, process.env.REDIS_URL!, process.env.REDIS_TOKEN!);

  const appSettings = await appSettingService.getMultiple(
    "SENSIBLE_CLIENT_ID",
    "SENSIBLE_CLIENT_SECRET",
    "SENSIBLE_AUDIENCE"
  );
  const sensibleService = new SensibleService(
    (appSettings?.SENSIBLE_CLIENT_ID as string) || "",
    (appSettings?.SENSIBLE_CLIENT_SECRET as string) || "",
    (appSettings?.SENSIBLE_AUDIENCE as string) || "",
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!
  );

  const notificationService = new NotificationService(
    db,
    process.env.TWILLIO_PHONE_NUMBER!,
    process.env.SENDGRID_EMAIL!,
    process.env.TWILLIO_ACCOUNT_SID!,
    process.env.TWILLIO_AUTH_TOKEN!,
    process.env.SENDGRID_API_KEY!
  );
  const tokenizeService = new TokenizeService(db, notificationService, sensibleService);
  const hyperswitchService = new HyperSwitchService(process.env.HYPERSWITCH_API_KEY ?? "");
  const credentials = {
    username: process.env.FOREUP_USERNAME!,
    password: process.env.FOREUP_PASSWORD!,
  };
  const providerService = new ProviderService(
    db,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!,
    credentials
  );
  const userWaitlistService = new UserWaitlistService(db, notificationService, appSettingService);
  const bookingService = new BookingService(
    db,
    tokenizeService,
    providerService,
    notificationService,
    hyperswitchService,
    sensibleService,
    userWaitlistService
  );

  // const appSettings = await appSettingService.getMultiple(
  //   "SENSIBLE_CLIENT_ID",
  //   "SENSIBLE_CLIENT_SECRET",
  //   "SENSIBLE_AUDIENCE"
  // );

  // const sensibleService = new SensibleService(
  //   (appSettings?.SENSIBLE_CLIENT_ID as string) || "",
  //   (appSettings?.SENSIBLE_CLIENT_SECRET as string) || "",
  //   (appSettings?.SENSIBLE_AUDIENCE as string) || "",
  //   process.env.REDIS_URL!,
  //   process.env.REDIS_TOKEN!
  // );

  const hyperSwitchWebhookService = new HyperSwitchWebhookService(
    db,
    tokenizeService,
    providerService,
    notificationService,
    bookingService,
    sensibleService,
    process.env.QSTASH_TOKEN!,
    hyperswitchService
  );
  await hyperSwitchWebhookService.processWebhook(req).catch((error) => {
    console.log(error);
  });
};
