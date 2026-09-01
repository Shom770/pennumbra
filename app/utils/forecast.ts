import "server-only";

export type ForecastMode = "sunset" | "sunrise";
export type ForecastModel = "ncep_hrrr_conus" | "ncep_nam_conus";

type NumberSeries = Array<number | null>;

interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: number[];
    cloud_cover_high: NumberSeries;
    cloud_cover_low: NumberSeries;
    relative_humidity_2m: NumberSeries;
  };
  daily: {
    time: number[];
    sunrise: NumberSeries;
    sunset: NumberSeries;
  };
}

interface AirQualityApiResponse {
  hourly: {
    time: number[];
    aerosol_optical_depth: NumberSeries;
  };
}

export interface ModelMetrics {
  model: ForecastModel;
  validAt: string;
  highCloudCover: number;
  lowCloudCover: number;
  relativeHumidity: number;
  aerosolOpticalDepth: number;
  score: number;
}

export interface ForecastMetrics {
  location: { latitude: number; longitude: number };
  mode: ForecastMode;
  eventAt: string;
  validAt: string;
  sunriseAt: string;
  sunsetAt: string;
  fetchedAt: string;
  models: ModelMetrics[];
  combinedScore: number;
  modelSpread: number;
  confidence: "high" | "medium" | "low";
  sources: {
    weather: string;
    aerosols: string;
  };
}

const WEATHER_API = "https://api.open-meteo.com/v1/gfs";
const AIR_QUALITY_API =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

function finite(value: number | null | undefined, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`The forecast feed did not return ${name}.`);
  }
  return value;
}

function nearestIndex(times: number[], target: number): number {
  if (!times.length) throw new Error("The forecast feed returned no timestamps.");
  return times.reduce(
    (best, time, index) =>
      Math.abs(time - target) < Math.abs(times[best] - target) ? index : best,
    0,
  );
}

function nearestCommonTime(left: number[], right: number[], target: number): number {
  const rightTimes = new Set(right);
  const common = left.filter((time) => rightTimes.has(time));
  if (!common.length) {
    throw new Error("HRRR and NAM did not return a common forecast timestamp.");
  }
  return common.reduce((best, time) =>
    Math.abs(time - target) < Math.abs(best - target) ? time : best,
  );
}

function nextEvent(response: WeatherApiResponse, mode: ForecastMode): number {
  const now = Date.now() / 1000;
  const events = response.daily[mode].filter(
    (value): value is number => typeof value === "number" && value > now,
  );
  if (!events.length) throw new Error(`No upcoming ${mode} was returned.`);
  return events[0];
}

function scoreMetrics(
  highCloudCover: number,
  lowCloudCover: number,
  aerosolOpticalDepth: number,
  relativeHumidity: number,
): number {
  const high = highCloudCover / 100;
  const low = lowCloudCover / 100;
  const humidity = relativeHumidity / 100;
  const highCloudTerm = Math.max(0, 1 - Math.abs(high - 0.45) / 0.55);
  const clarityTerm = Math.max(0, 1 - 2 * aerosolOpticalDepth);
  const score =
    100 *
    (0.35 * highCloudTerm +
      0.25 * (1 - low) +
      0.2 * clarityTerm +
      0.2 * (1 - humidity));
  return Math.round(Math.max(1, Math.min(100, score)));
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 900 },
  });
  if (!response.ok) {
    throw new Error(`Forecast provider returned HTTP ${response.status}.`);
  }
  return (await response.json()) as T;
}

function weatherUrl(
  latitude: number,
  longitude: number,
  model: ForecastModel,
): URL {
  const url = new URL(WEATHER_API);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    models: model,
    hourly: "cloud_cover_high,cloud_cover_low,relative_humidity_2m",
    daily: "sunrise,sunset",
    forecast_days: "3",
    timeformat: "unixtime",
    timezone: "UTC",
  }).toString();
  return url;
}

function airQualityUrl(latitude: number, longitude: number): URL {
  const url = new URL(AIR_QUALITY_API);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: "aerosol_optical_depth",
    forecast_days: "3",
    timeformat: "unixtime",
    timezone: "UTC",
  }).toString();
  return url;
}

export async function getLatestForecastMetrics({
  latitude,
  longitude,
  mode = "sunset",
}: {
  latitude: number;
  longitude: number;
  mode?: ForecastMode;
}): Promise<ForecastMetrics> {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new RangeError("Latitude or longitude is outside its valid range.");
  }

  const models: ForecastModel[] = ["ncep_hrrr_conus", "ncep_nam_conus"];
  const [hrrr, nam, air] = await Promise.all([
    fetchJson<WeatherApiResponse>(weatherUrl(latitude, longitude, models[0])),
    fetchJson<WeatherApiResponse>(weatherUrl(latitude, longitude, models[1])),
    fetchJson<AirQualityApiResponse>(airQualityUrl(latitude, longitude)),
  ]);
  const weatherResponses = [hrrr, nam];
  const sunriseAt = nextEvent(hrrr, "sunrise");
  const sunsetAt = nextEvent(hrrr, "sunset");
  const eventAt = mode === "sunrise" ? sunriseAt : sunsetAt;
  const validAt = nearestCommonTime(hrrr.hourly.time, nam.hourly.time, eventAt);
  const airIndex = nearestIndex(air.hourly.time, validAt);
  const aod = finite(
    air.hourly.aerosol_optical_depth[airIndex],
    "aerosol optical depth",
  );

  const metrics = weatherResponses.map((response, modelIndex): ModelMetrics => {
    const index = response.hourly.time.indexOf(validAt);
    if (index === -1) throw new Error("A model is missing the agreed forecast hour.");
    const highCloudCover = finite(
      response.hourly.cloud_cover_high[index],
      "high cloud cover",
    );
    const lowCloudCover = finite(
      response.hourly.cloud_cover_low[index],
      "low cloud cover",
    );
    const relativeHumidity = finite(
      response.hourly.relative_humidity_2m[index],
      "relative humidity",
    );
    return {
      model: models[modelIndex],
      validAt: new Date(validAt * 1000).toISOString(),
      highCloudCover,
      lowCloudCover,
      relativeHumidity,
      aerosolOpticalDepth: aod,
      score: scoreMetrics(highCloudCover, lowCloudCover, aod, relativeHumidity),
    };
  });

  const modelSpread = Math.abs(metrics[0].score - metrics[1].score);
  return {
    location: { latitude, longitude },
    mode,
    eventAt: new Date(eventAt * 1000).toISOString(),
    validAt: new Date(validAt * 1000).toISOString(),
    sunriseAt: new Date(sunriseAt * 1000).toISOString(),
    sunsetAt: new Date(sunsetAt * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    models: metrics,
    combinedScore: Math.round((metrics[0].score + metrics[1].score) / 2),
    modelSpread,
    confidence: modelSpread <= 5 ? "high" : modelSpread <= 12 ? "medium" : "low",
    sources: {
      weather: "NOAA HRRR CONUS and NAM CONUS 3 km via Open-Meteo",
      aerosols: "CAMS global aerosol optical depth via Open-Meteo",
    },
  };
}
