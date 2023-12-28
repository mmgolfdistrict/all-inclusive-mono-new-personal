import CredentialsProvider from "@auth/core/providers/credentials";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, tableCreator } from "@golf-district/database";
import { AuthService } from "@golf-district/service";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";

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
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials.username || !credentials.password) {
          return null;
        }
        const authService = new AuthService(db);
        const data = await authService.authenticateUser(
          credentials.username as string,
          credentials.password as string
        );
        if (!data) {
          return null;
        }
        return {
          id: data.id,
          email: data.email,
          picture: data.profilePicture,
          name: data.name,
        };
      },
    }),
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: `/login`,
    newUser: `/profile?new`, //this will call the create customer endpoint
  },
  // session: {
  //   strategy: "jwt",
  // },
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
    // jwt: ({ trigger, session, token, user }) => {
    //   if (trigger === "update" && session) {
    //     (token?.user as any).image = session.image;
    //   }
    //   if (user) {
    //     token.id = user.id;
    //     token.email = user.email;
    //     token.user = user;
    //     // @ts-expect-error

    //     token.picture = user.picture;
    //   }
    //   return token;
    // },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
};

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental,
} = NextAuth(authConfig);
