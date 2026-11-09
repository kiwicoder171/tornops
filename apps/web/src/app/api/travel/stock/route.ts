import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface YataStockItem {
  id: number;
  name: string;
  cost: number;
  quantity: number;
}

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch("https://yata.yt/api/v1/travel/export/", {
      headers: {
        "User-Agent": "TornOps-Suite/1.0 (+https://web-ten-dusky-11.vercel.app)",
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        source: "yata",
        timestamp: Date.now(),
        data,
      });
    }

    // YATA returned an error (e.g. 502 Bad Gateway)
    return NextResponse.json({
      success: false,
      source: "fallback",
      yataStatus: res.status,
      message: `YATA responded with HTTP ${res.status}. Falling back to Torn canonical store costs.`,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json({
      success: false,
      source: "fallback",
      error: err?.name === "AbortError" ? "YATA connection timed out" : err?.message,
      message: "YATA is currently unreachable. Using official Torn canonical store costs.",
    });
  }
}
