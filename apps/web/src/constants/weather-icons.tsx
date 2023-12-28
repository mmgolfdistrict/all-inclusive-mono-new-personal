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
  skc: <Sunny className="h-[30px] w-[30px]" />,
  few: <PartlyCloudy className="h-[30px] w-[30px]" />,
  sct: <PartlyCloudy className="h-[30px] w-[30px]" />,
  bkn: <CloudyClearAtTime className="h-[30px] w-[30px]" />,
  ovc: <Cloudy className="h-[30px] w-[30px]" />,
  wind_skc: <Wind className="h-[30px] w-[30px]" />,
  wind_few: <Wind className="h-[30px] w-[30px]" />,
  wind_sct: <Wind className="h-[30px] w-[30px]" />,
  wind_bkn: <Wind className="h-[30px] w-[30px]" />,
  wind_ovc: <Wind className="h-[30px] w-[30px]" />,
  snow: <Snow className="h-[30px] w-[30px]" />,
  rain_snow: <Snow className="h-[30px] w-[30px]" />,
  rain_sleet: <Snow className="h-[30px] w-[30px]" />,
  snow_sleet: <Snow className="h-[30px] w-[30px]" />,
  fzra: <LightRain className="h-[30px] w-[30px]" />,
  rain_fzra: <LightRain className="h-[30px] w-[30px]" />,
  snow_fzra: <LightRain className="h-[30px] w-[30px]" />,
  sleet: <Hail className="h-[30px] w-[30px]" />,
  rain: <LightRain className="h-[30px] w-[30px]" />,
  rain_showers: <ScatteredShowers className="h-[30px] w-[30px]" />,
  rain_showers_hi: <LightRain className="h-[30px] w-[30px]" />,
  tsra: <HeavyRain className="h-[30px] w-[30px]" />,
  tsra_sct: <HeavyRain className="h-[30px] w-[30px]" />,
  tsra_hi: <HeavyRain className="h-[30px] w-[30px]" />,
  tornado: <Wind className="h-[30px] w-[30px]" />,
  hurricane: <HeavyRain className="h-[30px] w-[30px]" />,
  tropical_storm: <HeavyRain className="h-[30px] w-[30px]" />,
  dust: <Fog className="h-[30px] w-[30px]" />,
  smoke: <Fog className="h-[30px] w-[30px]" />,
  haze: <Fog className="h-[30px] w-[30px]" />,
  hot: <Sunny className="h-[30px] w-[30px]" />,
  cold: <Sunny className="h-[30px] w-[30px]" />,
  blizzard: <Snow className="h-[30px] w-[30px]" />,
  fog: <Fog className="h-[30px] w-[30px]" />,
};
