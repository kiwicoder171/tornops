import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join("/");
  const { searchParams } = new URL(req.url);

  const apiKey = searchParams.get("key");
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing required 'key' query parameter" },
      { status: 400 }
    );
  }

  // Construct Torn API URL (support both v1 selections syntax and v2 routes)
  const isV2Explicit = endpoint.startsWith("v2");
  const isV1Selection = searchParams.has("selections") && !isV2Explicit;
  const baseUrl = isV1Selection
    ? `https://api.torn.com/${endpoint}/`
    : isV2Explicit
    ? `https://api.torn.com/${endpoint}`
    : `https://api.torn.com/v2/${endpoint}`;

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

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: { code: 500, error: (err as Error).message } },
      { status: 500 }
    );
  }
}
