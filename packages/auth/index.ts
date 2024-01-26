import CredentialsProvider from "@auth/core/providers/credentials";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@golf-district/database";
import { AuthService } from "@golf-district/service";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import ts from "typescript";

// @TODO - update to use env validation
//import { env } from "./env.mjs";

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
    } & DefaultSession["user"];
  }
}
export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, tableCreator),
  redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          return null;
        }
        const authService = new AuthService(db);
        const data = await authService.authenticateUser(
          credentials.email as string,
          credentials.password as string
        );
        if (!data) {
          return null;
        }
        return {
          id: data.id,
          email: data.email,
          image: data.profilePicture,
          name: data.name,
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
        token.id = user.id;
        token.email = user.email;
        token.user = user;
        token.picture = user.image;
        token.image = (token?.user as { image?: string })?.image ?? undefined;
      }

      if (trigger === "update" && session?.image && token) {
        token.picture = session.image;
        token.image = session.image;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token.user as any).image = session.image;
      }

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
