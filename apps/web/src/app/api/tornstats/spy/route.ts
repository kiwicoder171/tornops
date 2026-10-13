import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const key = searchParams.get("key");
  const type = searchParams.get("type") || "user"; // "user" or "faction"
  const targetId = searchParams.get("id");

  if (!key || key.trim() === "") {
    return NextResponse.json(
      { error: "Missing required TornStats API key" },
      { status: 400 }
    );
  }

  if (!targetId || targetId.trim() === "") {
    return NextResponse.json(
      { error: "Missing required target ID" },
      { status: 400 }
    );
  }

  const endpoint =
    type === "faction"
      ? `https://www.tornstats.com/api/v2/${encodeURIComponent(key)}/spy/faction/${encodeURIComponent(targetId)}`
      : `https://www.tornstats.com/api/v2/${encodeURIComponent(key)}/spy/user/${encodeURIComponent(targetId)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "TornOpsFactionWarRoom/1.0",
      },
      next: { revalidate: 60 }, // Cache spy results for 60 seconds
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON response from TornStats" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "TornStats API request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err?.message || "Failed to reach TornStats API" },
      { status: 500 }
    );
  }
}
