import { NextRequest, NextResponse } from "next/server";
import {
  getLatestForecastMetrics,
  type ForecastMode,
} from "../../utils/forecast";

export const runtime = "nodejs";

function coordinate(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new TypeError("Coordinates must be numbers.");
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const latitude = coordinate(request.nextUrl.searchParams.get("lat"), 39.95388);
    const longitude = coordinate(request.nextUrl.searchParams.get("lon"), -75.19304);
    const requestedMode = request.nextUrl.searchParams.get("mode") ?? "sunset";
    if (requestedMode !== "sunset" && requestedMode !== "sunrise") {
      return NextResponse.json(
        { error: 'The "mode" parameter must be "sunset" or "sunrise".' },
        { status: 400 },
      );
    }

    const forecast = await getLatestForecastMetrics({
      latitude,
      longitude,
      mode: requestedMode as ForecastMode,
    });
    return NextResponse.json(forecast, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (error) {
    const badRequest = error instanceof RangeError || error instanceof TypeError;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Forecast lookup failed." },
      { status: badRequest ? 400 : 502 },
    );
  }
}
