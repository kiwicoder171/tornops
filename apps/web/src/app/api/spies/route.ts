import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const factionIdStr = searchParams.get("factionId");

  if (!factionIdStr || isNaN(Number(factionIdStr))) {
    return NextResponse.json(
      { error: "Valid factionId query param is required" },
      { status: 400 }
    );
  }

  const factionId = Number(factionIdStr);
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      message: "Supabase not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY.",
      spies: [],
    });
  }

  try {
    const { data, error } = await supabase
      .from("faction_spies")
      .select("*")
      .eq("faction_id", factionId);

    if (error) {
      console.error("Supabase faction_spies GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map rows into PlayerSpyData format
    const spies = (data || []).map((row) => ({
      playerId: row.player_id,
      name: row.name || undefined,
      strength: row.strength || undefined,
      defense: row.defense || undefined,
      speed: row.speed || undefined,
      dexterity: row.dexterity || undefined,
      total: row.total,
      fairFight: row.fair_fight || undefined,
      source: row.source || "FACTION_SPY",
      spiedBy: row.spied_by || "Teammate Cloud",
      timestamp: row.timestamp || Math.floor(new Date(row.updated_at || row.created_at).getTime() / 1000),
    }));

    return NextResponse.json({
      configured: true,
      factionId,
      count: spies.length,
      spies,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      {
        configured: false,
        error: "Supabase not configured. Connect your Supabase project in environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { factionId, spies } = body;

    if (!factionId || !Array.isArray(spies) || spies.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. Expected { factionId: number, spies: PlayerSpyData[] }" },
        { status: 400 }
      );
    }

    const rows = spies
      .filter((s) => s && s.playerId && (s.total || s.strength || s.speed))
      .map((s) => ({
        faction_id: Number(factionId),
        player_id: Number(s.playerId),
        name: s.name || null,
        strength: s.strength ? Number(s.strength) : null,
        defense: s.defense ? Number(s.defense) : null,
        speed: s.speed ? Number(s.speed) : null,
        dexterity: s.dexterity ? Number(s.dexterity) : null,
        total: Number(s.total || 0),
        fair_fight: s.fairFight ? Number(s.fairFight) : null,
        source: s.source || "FACTION_SPY",
        spied_by: s.spiedBy || "Teammate Cloud",
        timestamp: s.timestamp || Math.floor(Date.now() / 1000),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid spy entries to upsert" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("faction_spies")
      .upsert(rows, { onConflict: "faction_id,player_id" });

    if (error) {
      console.error("Supabase faction_spies upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      upsertedCount: rows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to upsert spies" }, { status: 500 });
  }
}
