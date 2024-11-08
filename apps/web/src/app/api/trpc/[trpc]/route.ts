import { appRouter, createTRPCContext } from "@golf-district/api";
import { auth } from "@golf-district/auth";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// overriding default function timeout
export const maxDuration = 5;

//edge api
//export const runtime = "edge";

/**
 * Configure basic CORS headers
 */
function setCorsHeaders(res: Response) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT");
  res.headers.set("Access-Control-Allow-Headers", "*");
}

export function OPTIONS() {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
}

const handler = auth(async (req) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    /* @ts-ignore */
    createContext: async () => await createTRPCContext({ auth: req.auth, req }),

    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path ?? "unknown path"}'`, error);
    },
  });

  setCorsHeaders(response);
  return response;
}) as unknown as () => Promise<Response> | undefined;

export const GET = handler;
export const POST = handler;
