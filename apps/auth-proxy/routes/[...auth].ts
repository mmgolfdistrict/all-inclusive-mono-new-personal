import { Auth } from "@auth/core";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import LinkedInProvider from "@auth/core/providers/linkedin";
import { eventHandler, toWebRequest } from "h3";

export default eventHandler(async (event) =>
  Auth(toWebRequest(event), {
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
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
      LinkedInProvider({
        clientId: "78rbprguxmjodr",
        clientSecret: "WPL_AP1.iw8Pb2NohiAmIJrA.GDIaqw==",
        authorization: {
          params: { scope: "openid profile email" },
        },
        issuer: "https://www.linkedin.com/oauth",
        jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
        profile(profile, tokens) {
          const defaultImage = "https://cdn-icons-png.flaticon.com/512/174/174857.png";
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: profile.picture ?? defaultImage,
          };
        },
      }),
    ],
  })
);
