import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

type Feature = {
  bbox: number[];
  center: number[];
  context: unknown[];
  geometry: unknown;
  id: string;
  place_name: string;
  place_type: string[];
  properties: unknown;
  relevance: number;
  text: string;
  type: string;
};

type AutoCompleteCities = {
  attribution: string;
  features: Feature[];
  query: string[];
  type: string;
};

export const placesRouter = createTRPCRouter({
  getCity: publicProcedure.input(z.object({ city: z.string() })).query(async ({ input, ctx }) => {
    const { city } = input;
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${city}.json?access_token=${`pk.eyJ1IjoidHktc2lyIiwiYSI6ImNsbTUyemRpcjE1YXozY2xmNDJobHl4ZXUifQ.yLPCDwTvG7FkGiPoKAwQhw`}&cachebuster=1625641871908&autocomplete=true&types=place`
    );
    // console.log(ctx?.session);

    const autocompleteCities = (await res.json()) as AutoCompleteCities;
    return {
      autocompleteCities,
    };
  }),
});
