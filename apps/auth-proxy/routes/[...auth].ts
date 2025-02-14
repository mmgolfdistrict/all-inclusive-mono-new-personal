import { Auth } from "@auth/core";
import GitHubProvider from "@auth/core/providers/github";
import GoogleProvider from "@auth/core/providers/google";
import LinkedInProvider from "@auth/core/providers/linkedin";
import AppleProvider from "@auth/core/providers/apple";
import { eventHandler, toWebRequest } from "h3";
import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";

async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID as string;
  const clientId = process.env.APPLE_CLIENT_ID as string;
  const keyId = process.env.APPLE_KEY_ID as string;
  const privateKey = process.env.APPLE_PRIVATE_KEY as string;

  const expirationTime = Math.floor(Date.now() / 1000) + 86400 * 180;

  return new SignJWT({})
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(createPrivateKey(privateKey.replace(/\\n/g, "\n")));
}
export default eventHandler(async (event) =>
  Auth(toWebRequest(event), {
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      }),
      LinkedInProvider({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_SECRET,
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
      AppleProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      }),
    ],
  })
);
