import React from "react";
import { type IconCodeType } from "@golf-district/shared";
import { Cloudy } from "~/components/icons/weather/cloudy";
import { CloudyClearAtTime } from "~/components/icons/weather/cloudy-clear-at-time";
import { Fog } from "~/components/icons/weather/fog";
import { Hail } from "~/components/icons/weather/hail";
import { HeavyRain } from "~/components/icons/weather/heavy-rain";
import { LightRain } from "~/components/icons/weather/light-rain";
import { PartlyCloudy } from "~/components/icons/weather/partly-cloudy";
import { ScatteredShowers } from "~/components/icons/weather/scattered-showers";
import { Sunny } from "~/components/icons/weather/sunny";
import { Wind } from "~/components/icons/weather/wind";
import { type ReactNode } from "react";
import { Snow } from "../components/icons/weather/snow";

export const WeatherIcons: Record<IconCodeType, ReactNode> = {
  "": <></>,
  skc: <Sunny className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  few: <PartlyCloudy className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  sct: <PartlyCloudy className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  bkn: (
    <CloudyClearAtTime className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  ovc: <Cloudy className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  wind_skc: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  wind_few: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  wind_sct: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  wind_bkn: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  wind_ovc: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  snow: <Snow className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  rain_snow: <Snow className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  rain_sleet: <Snow className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  snow_sleet: <Snow className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  fzra: <LightRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  rain_fzra: (
    <LightRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  snow_fzra: (
    <LightRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  sleet: <Hail className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  rain: <LightRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  rain_showers: (
    <ScatteredShowers className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  rain_showers_hi: (
    <LightRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  tsra: <HeavyRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  tsra_sct: <HeavyRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  tsra_hi: <HeavyRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  tornado: <Wind className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  hurricane: (
    <HeavyRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  tropical_storm: (
    <HeavyRain className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />
  ),
  dust: <Fog className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  smoke: <Fog className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  haze: <Fog className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  hot: <Sunny className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  cold: <Sunny className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  blizzard: <Snow className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
  fog: <Fog className="md:h-[1.875rem] md:w-[1.875rem] h-[1.25rem] w-[1.25rem]" />,
};
