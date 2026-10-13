import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const key = searchParams.get("key");
  const targets = searchParams.get("targets");

  if (!key || key.trim() === "") {
    return NextResponse.json(
      { error: "Missing required Torn API key" },
      { status: 400 }
    );
  }

  if (!targets || targets.trim() === "") {
    return NextResponse.json(
      { error: "Missing required targets list (comma-separated IDs)" },
      { status: 400 }
    );
  }

  const endpoint = `https://ffscouter.com/api/v1/get-stats?key=${encodeURIComponent(
    key.trim()
  )}&targets=${encodeURIComponent(targets.trim())}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "TornOpsFactionWarRoom/1.0",
      },
      next: { revalidate: 300 }, // Cache estimates for 5 minutes
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON response from FFScouter" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "FFScouter API request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Failed to reach FFScouter API" },
      { status: 500 }
    );
  }
}
