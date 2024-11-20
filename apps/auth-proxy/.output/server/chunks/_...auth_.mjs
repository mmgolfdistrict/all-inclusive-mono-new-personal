import { Auth } from '@auth/core';
import GitHubProvider from '@auth/core/providers/github';
import GoogleProvider from '@auth/core/providers/google';
import LinkedInProvider from '@auth/core/providers/linkedin';
import { e as eventHandler, t as toWebRequest } from './nitro/node-server.mjs';
import 'node:http';
import 'node:https';
import 'fs';
import 'path';
import 'node:fs';
import 'node:url';

const ____auth_ = eventHandler(
  async (event) => Auth(toWebRequest(event), {
    secret: process.env.AUTH_SECRET,
    trustHost: !!process.env.VERCEL,
    redirectProxyUrl: process.env.AUTH_REDIRECT_PROXY_URL,
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      }),
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET
      }),
      LinkedInProvider({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_SECRET,
        authorization: {
          params: { scope: "openid profile email" }
        },
        issuer: "https://www.linkedin.com/oauth",
        jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
        profile(profile, tokens) {
          var _a;
          const defaultImage = "https://cdn-icons-png.flaticon.com/512/174/174857.png";
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: (_a = profile.picture) != null ? _a : defaultImage
          };
        }
      })
    ]
  })
);

export { ____auth_ as default };
//# sourceMappingURL=_...auth_.mjs.map
