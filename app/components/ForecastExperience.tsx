"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Breakdown from "./Breakdown";
import LandingPage from "./LandingPage";

type Mode = "sunset" | "sunrise";

interface ApiModelMetrics {
  model: "ncep_hrrr_conus" | "ncep_nam_conus";
  highCloudCover: number;
  lowCloudCover: number;
  relativeHumidity: number;
  aerosolOpticalDepth: number;
  score: number;
}

interface ApiForecast {
  mode: Mode;
  fetchedAt: string;
  sunriseAt: string;
  sunsetAt: string;
  combinedScore: number;
  models: ApiModelMetrics[];
}

const UPENN = { latitude: 39.95388, longitude: -75.19304 };

export default function ForecastExperience() {
  const [mode, setMode] = useState<Mode>("sunset");
  const [forecasts, setForecasts] = useState<Partial<Record<Mode, ApiForecast>>>({});
  const hasUserSelectedMode = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = (requestedMode: Mode) => {
      const params = new URLSearchParams({
        lat: String(UPENN.latitude),
        lon: String(UPENN.longitude),
        mode: requestedMode,
      });
      return fetch(`/api/forecast?${params}`, { signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("Forecast request failed.");
        return response.json() as Promise<ApiForecast>;
      });
    };
    Promise.all([load("sunrise"), load("sunset")])
      .then(([sunrise, sunset]) => {
        setForecasts({ sunrise, sunset });
        if (!hasUserSelectedMode.current) {
          setMode(new Date(sunrise.sunriseAt).getTime() < new Date(sunset.sunsetAt).getTime()
            ? "sunrise"
            : "sunset");
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      });
    return () => controller.abort();
  }, []);

  const activeForecast = forecasts[mode] ?? null;
  const solarForecast = activeForecast ?? forecasts.sunrise ?? forecasts.sunset;
  const live = useMemo(() => {
    if (!activeForecast || activeForecast.models.length < 2) return null;
    const hrrr = activeForecast.models.find((item) => item.model === "ncep_hrrr_conus");
    const nam = activeForecast.models.find((item) => item.model === "ncep_nam_conus");
    if (!hrrr || !nam) return null;
    const mean = (key: "highCloudCover" | "lowCloudCover" | "relativeHumidity" | "aerosolOpticalDepth") =>
      (hrrr[key] + nam[key]) / 2;
    return {
      observations: {
        highCloudCover: mean("highCloudCover"),
        lowCloudCover: mean("lowCloudCover"),
        relativeHumidity: mean("relativeHumidity"),
        aerosolOpticalDepth: mean("aerosolOpticalDepth"),
        hrrr: {
          highCloudCover: hrrr.highCloudCover,
          lowCloudCover: hrrr.lowCloudCover,
          relativeHumidity: hrrr.relativeHumidity,
        },
        nam: {
          highCloudCover: nam.highCloudCover,
          lowCloudCover: nam.lowCloudCover,
          relativeHumidity: nam.relativeHumidity,
        },
      },
      modelScores: { hrrr: hrrr.score, nam: nam.score },
    };
  }, [activeForecast]);

  const score = activeForecast?.combinedScore ?? (mode === "sunset" ? 78 : 58);
  const selectMode = (nextMode: Mode) => {
    hasUserSelectedMode.current = true;
    setMode(nextMode);
  };
  const updatedAt = activeForecast
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(activeForecast.fetchedAt)).toLowerCase()
    : "loading live data";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#140d2e]">
      <LandingPage
        score={score}
        mode={mode}
        onModeChange={selectMode}
        sunriseAt={solarForecast?.sunriseAt}
        sunsetAt={solarForecast?.sunsetAt}
      />
      <section aria-label="Sunset and sunrise forecast details">
        <Breakdown
          mode={mode}
          score={score}
          updatedAt={updatedAt}
          observations={live?.observations}
          modelScores={live?.modelScores}
        />
      </section>
    </main>
  );
}
