import { Auth } from '@auth/core';
import GitHubProvider from '@auth/core/providers/github';
import GoogleProvider from '@auth/core/providers/google';
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
      })
    ]
  })
);

export { ____auth_ as default };
//# sourceMappingURL=_...auth_.mjs.map
