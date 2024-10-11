import AppleProvider from "@auth/core/providers/apple";
import CredentialsProvider from "@auth/core/providers/credentials";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@golf-district/database";
import { AuthService, NotificationService, UserService } from "@golf-district/service";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { cookies } from "next/headers";
import Logger from "@golf-district/shared/src/logger";
// @TODO - update to use env validation
//import { env } from "./env.mjs";
import { verifyCaptcha } from "../api/src/googleCaptcha";
import { loggerService } from "@golf-district/service/src/webhooks/logging.service";

const DEPLOYMENT = !!process.env.VERCEL_URL;
export type { Session } from "next-auth";

export const providers = ["google", "credentials"] as const;
export type OAuthProviders = (typeof providers)[number];

interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  phone: string;
}
declare module "next-auth" {
  interface Session {
    user: User & DefaultSession["user"];
    ip?: string;
  }
}
const logger = Logger("Auth-File");

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, tableCreator),
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    AppleProvider({
      clientId: process.env.NEXT_PUBLIC_APPLE_ID,
      clientSecret: process.env.APPLE_SECRET ?? "",
    }),
    FacebookProvider({
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        ReCAPTCHA: { label: "ReCAPTCHA", type: "text" },
      },
      async authorize(credentials) {
        // console.log(credentials);

        if (process.env.RECAPTCHA_SECRET_KEY) {
          if (!credentials.email || !credentials.password || !credentials.ReCAPTCHA) {
            return null;
          }
        } else {
          if (!credentials.email || !credentials.password) {
            return null;
          }
        }
        const captchaToken = process.env.RECAPTCHA_SECRET_KEY ? (credentials.ReCAPTCHA as string) : "";

        const isNotRobot = process.env.RECAPTCHA_SECRET_KEY ? await verifyCaptcha(captchaToken) : true;

        // console.log("RECAPTCHA_SECRET_KEY");
        // console.log(process.env.RECAPTCHA_SECRET_KEY);

        //if the captcha is not valid, return null

        if (!isNotRobot) {
          logger.error(`Captcha not verified`);
          await loggerService.errorLog({
            message: "CAPTCHA NOT VERIFIED",
            userId: "",
            url: "/auth",
            userAgent: "",
            stackTrace: `Captcha verification failed for user with email: ${credentials.email}`,
            additionalDetailsJSON: JSON.stringify({
              email: credentials.email,
            }),
          })
          return null;
        }
        const notificationService = new NotificationService(
          db,
          process.env.TWILLIO_PHONE_NUMBER!,
          process.env.SENDGRID_EMAIL!,
          process.env.TWILLIO_ACCOUNT_SID!,
          process.env.TWILLIO_AUTH_TOKEN!,
          process.env.SENDGRID_API_KEY!
        );
        const authService = new AuthService(
          db,
          notificationService,
          process.env.REDIS_URL!,
          process.env.REDIS_TOKEN!
        );
        console.log("------here------>CredentialsCredentials");

        const data = await authService.authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        if (!data) {
          logger.warn(`User not authenticated`);
          return null;
        }

        logger.warn(`User authentication successful`);
        return {
          id: data?.id,
          email: data?.email,
          image: data?.profilePicture,
          name: data?.name,
          phone: data?.phoneNumber,
        };
      },
    }),
  ],
  pages: {
    signIn: `/`,
    // verifyRequest: `/login`,
    // error: `/auth-error`,
    // newUser: `/profile?new`, //this will call the create customer endpoint
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  // cookies: {
  //   sessionToken: {
  //     name: `${DEPLOYMENT ? "__Secure-" : ""}auth-js.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "lax",
  //       path: "/",
  //       domain: DEPLOYMENT ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : undefined,
  //       secure: DEPLOYMENT,
  //     },
  //   },
  // },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (user) {
        const notificationService = new NotificationService(
          db,
          process.env.TWILLIO_PHONE_NUMBER!,
          process.env.SENDGRID_EMAIL!,
          process.env.TWILLIO_ACCOUNT_SID!,
          process.env.TWILLIO_AUTH_TOKEN!,
          process.env.SENDGRID_API_KEY!
        );

        const authService = new AuthService(
          db,
          notificationService,
          process.env.REDIS_URL!,
          process.env.REDIS_TOKEN!
        );
        const isUserBlocked = await authService.isUserBlocked(user.email ?? "");
        if (isUserBlocked) {
          return false;
        }
        const userService = new UserService(db, notificationService);
        const username = await userService.generateUsername(6);
        const getUserByIdServide = await userService.getUserById(user.id);
        console.log("getUserByIdServide", getUserByIdServide);

        if (!getUserByIdServide?.handle) {
          if (account && account.provider) {
            const updateData = {
              ...user,
              handle: username,
            };
            await userService.updateUser(user.id, updateData);
          }
        }
      }
      return true;
    },
    jwt: async ({ trigger, session, token, user }) => {
      console.log("JWT Callback");
      console.log(trigger);
      console.log(session);
      console.log(token);
      console.log(user);

      const notificationService = new NotificationService(
        db,
        process.env.TWILLIO_PHONE_NUMBER!,
        process.env.SENDGRID_EMAIL!,
        process.env.TWILLIO_ACCOUNT_SID!,
        process.env.TWILLIO_AUTH_TOKEN!,
        process.env.SENDGRID_API_KEY!
      );

      const authService = new AuthService(
        db,
        notificationService,
        process.env.REDIS_URL!,
        process.env.REDIS_TOKEN!
      );

      if (user) {
        token.id = user?.id;
        token.email = user.email;
        token.user = user;
        token.picture = user.image;
        token.image = (token?.user as { image?: string })?.image ?? undefined;
      }

      await authService.updateLastSuccessfulLogin(user?.id, user?.email ?? "");

      if (trigger === "update" && session?.image !== undefined && token) {
        token.picture = session.image;
        token.image = session.image;
        (token.user as User).image = session.image;
      }
      const userInfo = token.user as User;
      token.phone = userInfo.phone;
      return token;
    },
    session: ({ session, token }) => {
      console.log("Session Callback");
      console.log(session);
      console.log(token);

      return {
        ...session,
        user: {
          ...session?.user,
          id: token?.id,
        },
      };
    },
  },
  events: {
    signOut(e) {
      cookies().delete("cookie");
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental,
} = NextAuth(authConfig);
