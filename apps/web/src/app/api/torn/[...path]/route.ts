import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const rawEndpoint = path.join("/").replace(/^\/+|\/+$/g, "");
  const { searchParams } = new URL(req.url);

  const apiKey = searchParams.get("key");
  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json(
      { error: { code: 400, error: "Missing required 'key' query parameter" } },
      { status: 400 }
    );
  }

  // Construct Torn API URL (support both v1 selections syntax and v2 routes)
  const isV2Explicit = rawEndpoint.startsWith("v2");
  const isV1Selection = searchParams.has("selections") && !isV2Explicit;
  const baseUrl = isV1Selection
    ? `https://api.torn.com/${rawEndpoint}`
    : isV2Explicit
    ? `https://api.torn.com/${rawEndpoint}`
    : `https://api.torn.com/v2/${rawEndpoint}`;

  const tornUrl = new URL(baseUrl);
  searchParams.forEach((val, key) => {
    tornUrl.searchParams.set(key, val);
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(tornUrl.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "TornFactionOperationsSuite/1.0",
      },
      next: { revalidate: 2 }, // Cache short responses for 2 seconds
    });

    clearTimeout(timeoutId);

    if (res.status === 429) {
      return NextResponse.json(
        {
          error: {
            code: 429,
            error: "Torn API Rate Limit Exceeded (max 100 calls/minute per key). Please wait a moment.",
          },
        },
        { status: 429 }
      );
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: res.status >= 400 ? res.status : 502,
            error: `Torn API returned unexpected response (${res.status} ${res.statusText || "Bad Gateway"})`,
          },
        },
        { status: res.status >= 400 ? res.status : 502 }
      );
    }

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: { code: 504, error: "Torn API request timed out after 8 seconds" } },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: { code: 500, error: (err as Error).message || "Internal server error" } },
      { status: 500 }
    );
  }
}
