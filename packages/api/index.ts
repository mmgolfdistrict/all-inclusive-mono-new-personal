import { db } from "@golf-district/database";
import {
  BookingService,
  CourseService,
  EntityService,
  ForeUpWebhookService,
  HyperSwitchWebhookService,
  NotificationService,
  ProviderService,
  StripeConnectWebhookService,
  StripeService,
  TokenizeService,
  UpdateWithdrawableBalance,
  SensibleService,
} from "@golf-district/service";
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
  const courseService = new CourseService(
    db,
    process.env.VERCEL_PROJECT_ID!,
    process.env.VERCEL_TEAM_ID!,
    process.env.VERCEL_AUTH_BEARER_TOKEN!
  );
  try {
    return await courseService.getCourseById(courseId);
  } catch (error) {
    console.log(error);
  }
};
export const getCourseImages = async (courseId: string) => {
  const courseService = new CourseService(
    db,
    process.env.VERCEL_PROJECT_ID!,
    process.env.VERCEL_TEAM_ID!,
    process.env.VERCEL_AUTH_BEARER_TOKEN!
  );
  try {
    return await courseService.getImagesForCourse(courseId);
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
  await foreUpWebhookService.handleWebhook().catch((error) => {
    console.log(error);
  });
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
  const notificationService = new NotificationService(
    db,
    process.env.TWILLIO_PHONE_NUMBER!,
    process.env.SENDGRID_EMAIL!,
    process.env.TWILLIO_ACCOUNT_SID!,
    process.env.TWILLIO_AUTH_TOKEN!,
    process.env.SENDGRID_API_KEY!
  );
  const tokenizeService = new TokenizeService(db, notificationService);
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
  const bookingService = new BookingService(db, tokenizeService, providerService, notificationService);
  const sensibleService = new SensibleService(
    process.env.SENSIBLE_CLIENT_ID!,
    process.env.SENSIBLE_CLIENT_SECRET!,
    process.env.SENSIBLE_AUDIENCE!,
    process.env.REDIS_URL!,
    process.env.REDIS_TOKEN!
  );
  const hyperSwitchWebhookService = new HyperSwitchWebhookService(
    db,
    tokenizeService,
    providerService,
    notificationService,
    bookingService,
    sensibleService,
    process.env.QSTASH_TOKEN!
  );
  await hyperSwitchWebhookService.processWebhook(req).catch((error) => {
    console.log(error);
  });
};
