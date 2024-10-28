import { auth } from "@golf-district/auth";
import type { Session } from "@golf-district/auth";
import { db } from "@golf-district/database";
import { AppSettingsService, RateLimitService } from "@golf-district/service";
import type { ServiceConfig } from "@golf-district/service/src/serviceFactory";
import { ServiceFactory } from "@golf-district/service/src/serviceFactory";
import { loggerService } from "@golf-district/service/src/webhooks/logging.service";
import Logger from "@golf-district/shared/src/logger";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

interface CreateContextOptions {
  session: Session | null;
  courseId: string;
  //logger: pino.Logger;
}

let appSettings: any = {};
await (async () => {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    return;
  }

  const appSettingService = new AppSettingsService(db, process.env.REDIS_URL, process.env.REDIS_TOKEN);
  const res = await appSettingService.getMultiple(
    "SENSIBLE_CLIENT_ID",
    "SENSIBLE_CLIENT_SECRET",
    "SENSIBLE_AUDIENCE"
  );
  appSettings = res ?? {};
})();
const logger = Logger("trpc");
const serviceFactoryConfig: ServiceConfig = {
  database: db,
  aws_accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  aws_secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  aws_region: process.env.AWS_REGION ?? "",
  aws_bucket: process.env.AWS_BUCKET ?? "",
  aws_cloudFrontUrl: process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "",
  redisToken: process.env.REDIS_TOKEN ?? "",
  twillio_accountSid: process.env.TWILLIO_ACCOUNT_SID ?? "",
  twillio_authToken: process.env.TWILLIO_AUTH_TOKEN ?? "",
  twillio_phoneNumber: process.env.TWILLIO_PHONE_NUMBER ?? "",
  sendGrid_email: process.env.SENDGRID_EMAIL ?? "",
  sendGridApiKey: process.env.SENDGRID_API_KEY ?? "",
  vercel_projectId: process.env.VERCEL_PROJECT_ID ?? "",
  vercel_teamId: process.env.VERCEL_TEAM_ID ?? "",
  vercel_authBearerToken: process.env.VERCEL_AUTH_BEARER_TOKEN ?? "",
  sensible_partner_id: process.env.NEXT_PUBLIC_SENSIBLE_PARTNER_ID ?? "",
  sensible_product_id: process.env.NEXT_PUBLIC_SENSIBLE_PRODUCT_ID ?? "",
  sensible_audience: appSettings.SENSIBLE_AUDIENCE ?? "",
  sensible_client_Id: appSettings.SENSIBLE_CLIENT_ID ?? "",
  sensible_client_secret: appSettings.SENSIBLE_CLIENT_SECRET ?? "",
  hyperSwitchApiKey: process.env.HYPERSWITCH_API_KEY ?? "",
  hyperSwitchProfileId: process.env.HYPERSWITCH_PROFILE_ID ?? "",
  foreUpApiKey: process.env.FOREUP_API_KEY ?? "",
  stripeApiKey: process.env.STRIPE_SECRET_KEY ?? "",
  foreupUsername: process.env.FOREUP_USERNAME ?? "",
  foreupPassword: process.env.FOREUP_PASSWORD ?? "",
  upStashClientToken: process.env.UPSTASH_CLIENT_TOKEN ?? "",
};
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    serviceFactory: new ServiceFactory(serviceFactoryConfig),
    courseId: opts.courseId,
    // logger: logger,
  };
};

export const createTRPCContext = async (opts: { req?: Request; auth?: Session }) => {
  const session = opts.auth ?? (await auth());
  const source = opts.req?.headers.get("x-trpc-source") ?? "unknown";
  const ip = opts.req?.headers.get("x-forwarded-for");
  session.ip = ip ?? "";
  logger.info(">>> tRPC Request from", source, "by", session?.user?.id ?? "anonymous");
  const courseId = opts.req?.headers.get("referer")?.split("/")[3] ?? '';

  return createInnerTRPCContext({
    session,
    courseId
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const addLoggerInfo = t.middleware(async ({ next, ctx }) => {
  loggerService.courseId = ctx.courseId;
  return next();
})

export const publicProcedure = t.procedure.use(addLoggerInfo);

// @TODO - add captcha guard here
export const publicProcedureWithCaptcha = t.procedure;

//@TODO - add rate limit guard here
export const rateLimit = t.middleware(async ({ path, next, ctx }) => {
  const rateLimitService = new RateLimitService(
    serviceFactoryConfig.redisUrl,
    serviceFactoryConfig.redisToken
  );
  const response = await rateLimitService.canAccess(rateLimitService.createIdentifier("api", path));
  if (response.success) {
    return next();
  } else {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
  }
});

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed).use(addLoggerInfo);
