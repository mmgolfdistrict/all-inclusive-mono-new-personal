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
  skc: <Sunny className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  few: <PartlyCloudy className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  sct: <PartlyCloudy className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  bkn: (
    <CloudyClearAtTime className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  ovc: <Cloudy className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  wind_skc: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  wind_few: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  wind_sct: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  wind_bkn: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  wind_ovc: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  snow: <Snow className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  rain_snow: <Snow className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  rain_sleet: <Snow className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  snow_sleet: <Snow className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  fzra: <LightRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  rain_fzra: (
    <LightRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  snow_fzra: (
    <LightRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  sleet: <Hail className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  rain: <LightRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  rain_showers: (
    <ScatteredShowers className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  rain_showers_hi: (
    <LightRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  tsra: <HeavyRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  tsra_sct: <HeavyRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  tsra_hi: <HeavyRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  tornado: <Wind className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  hurricane: (
    <HeavyRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  tropical_storm: (
    <HeavyRain className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />
  ),
  dust: <Fog className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  smoke: <Fog className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  haze: <Fog className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  hot: <Sunny className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  cold: <Sunny className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  blizzard: <Snow className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
  fog: <Fog className="md:h-[30px] md:w-[30px] h-[20px] w-[20px]" />,
};
