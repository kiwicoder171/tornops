import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const factionIdStr = searchParams.get("factionId");

  if (!factionIdStr || isNaN(Number(factionIdStr))) {
    return NextResponse.json({ error: "Valid factionId query param is required" }, { status: 400 });
  }

  const factionId = Number(factionIdStr);
  const firestore = getFirestoreDb();

  if (!firestore) {
    return NextResponse.json({
      configured: false,
      message: "Firestore not configured yet.",
      members: [],
    });
  }

  try {
    const doc = await firestore.collection("faction_coverage").doc(`roster_${factionId}`).get();

    if (!doc.exists) {
      return NextResponse.json({
        configured: true,
        factionId,
        members: [],
        updatedAt: null,
      });
    }

    const data = doc.data();
    return NextResponse.json({
      configured: true,
      factionId,
      members: data?.members || [],
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || null,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_coverage GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch coverage roster" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const firestore = getFirestoreDb();

  if (!firestore) {
    return NextResponse.json(
      { configured: false, error: "Cloud database not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { factionId, members, updatedBy } = body;

    if (!factionId || isNaN(Number(factionId))) {
      return NextResponse.json({ error: "Valid factionId is required" }, { status: 400 });
    }

    if (!Array.isArray(members)) {
      return NextResponse.json({ error: "members must be an array" }, { status: 400 });
    }

    const fid = Number(factionId);
    const rosterData = {
      factionId: fid,
      members,
      updatedBy: updatedBy || "Teammate",
      updatedAt: Math.floor(Date.now() / 1000),
    };

    await firestore.collection("faction_coverage").doc(`roster_${fid}`).set(rosterData);

    return NextResponse.json({
      success: true,
      count: members.length,
      updatedAt: rosterData.updatedAt,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_coverage POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save coverage roster" }, { status: 500 });
  }
}
