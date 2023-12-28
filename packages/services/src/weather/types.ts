export interface Forecast {
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  shortForecast: string;
  iconCode: string;
}

interface WeatherContextItem {
  "@version": string;
  wx: string;
  s: string;
  geo: string;
  unit: string;
  "@vocab": string;
  geometry: {
    "@id": string;
    "@type": string;
  };
  [key: string]:
    | {
        "@type": string;
        "@id"?: string;
      }
    | string;
}

interface WeatherGeometry {
  type: string;
  coordinates: [number, number];
}

interface WeatherRelativeLocationProperties {
  city: string;
  state: string;
  distance: {
    unitCode: string;
    value: number;
  };
  bearing: {
    unitCode: string;
    value: number;
  };
}

interface WeatherRelativeLocation {
  type: string;
  geometry: WeatherGeometry;
  properties: WeatherRelativeLocationProperties;
}

interface WeatherProperties {
  "@id": string;
  "@type": string;
  cwa: string;
  forecastOffice: string;
  gridId: string;
  gridX: number;
  gridY: number;
  forecast: string;
  forecastHourly: string;
  forecastGridData: string;
  observationStations: string;
  relativeLocation: WeatherRelativeLocation;
  forecastZone: string;
  county: string;
  fireWeatherZone: string;
  timeZone: string;
  radarStation: string;
}

export interface _WeatherData {
  "@context": (string | WeatherContextItem)[];
  id: string;
  type: string;
  geometry: WeatherGeometry;
  properties: WeatherProperties;
}

interface RelativeHumidity {
  unitCode: string;
  value: number;
}

interface Dewpoint {
  unitCode: string;
  value: number;
}

interface ProbabilityOfPrecipitation {
  unitCode: string;
  value: number | null;
}

interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation: ProbabilityOfPrecipitation;
  dewpoint: Dewpoint;
  relativeHumidity: RelativeHumidity;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

interface ForecastDataProperties {
  updated: string;
  units: string;
  forecastGenerator: string;
  generatedAt: string;
  updateTime: string;
  validTimes: string;
  elevation: {
    unitCode: string;
    value: number;
  };
  periods: ForecastPeriod[];
}

export interface _ForecastData {
  "@context": (string | object)[];
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: ForecastDataProperties;
}
