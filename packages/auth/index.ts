import AppleProvider from "@auth/core/providers/apple";
import CredentialsProvider from "@auth/core/providers/credentials";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@golf-district/database";
import { AuthService, NotificationService } from "@golf-district/service";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
// @TODO - update to use env validation
//import { env } from "./env.mjs";
import { verifyCaptcha } from "../api/src/googleCaptcha";

const DEPLOYMENT = !!process.env.VERCEL_URL;
export type { Session } from "next-auth";

export const providers = ["google", "credentials"] as const;
export type OAuthProviders = (typeof providers)[number];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      phone: string;
    } & DefaultSession["user"];
  }
}
export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, tableCreator),
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        // console.log("Credentials");
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
        // console.log(isNotRobot);

        //if the captcha is not valid, return null
        if (!isNotRobot) {
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
        const data = await authService.authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        // console.log("data");
        // console.log(data);

        if (!data) {
          return null;
        }

        // console.log("Authentication successful");
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
    // signIn: `/login`,
    // verifyRequest: `/login`,
    error: `/auth-error`,
    // newUser: `/profile?new`, //this will call the create customer endpoint
  },
  session: {
    strategy: "jwt",
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
    jwt: ({ trigger, session, token, user }) => {
      if (user) {
        token.id = user?.id;
        token.email = user.email;
        token.user = user;
        token.picture = user.image;
        token.image = (token?.user as { image?: string })?.image ?? undefined;
      }

      if (trigger === "update" && session?.image !== undefined && token) {
        token.picture = session.image;
        token.image = session.image;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token.user as any).image = session.image;
      }
      const userInfo: any = token.user;
      token.phone = userInfo.phone;
      return token;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session?.user,
          id: token?.id,
        },
      };
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental,
} = NextAuth(authConfig);
