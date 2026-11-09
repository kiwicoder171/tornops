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
      plan: null,
    });
  }

  try {
    const doc = await firestore.collection("faction_oc").doc(`plan_${factionId}`).get();

    if (!doc.exists) {
      return NextResponse.json({
        configured: true,
        factionId,
        plan: null,
      });
    }

    return NextResponse.json({
      configured: true,
      factionId,
      plan: doc.data(),
    });
  } catch (err: any) {
    console.error("[Firestore] faction_oc GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch OC plan" }, { status: 500 });
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
    const { factionId, selectedTemplateIndex, lockedSlots, updatedBy } = body;

    if (!factionId || isNaN(Number(factionId))) {
      return NextResponse.json({ error: "Valid factionId is required" }, { status: 400 });
    }

    const fid = Number(factionId);
    const planDoc = {
      factionId: fid,
      selectedTemplateIndex: Number(selectedTemplateIndex ?? 0),
      lockedSlots: lockedSlots || {},
      updatedBy: updatedBy || "Leader",
      updatedAt: Math.floor(Date.now() / 1000),
    };

    await firestore.collection("faction_oc").doc(`plan_${fid}`).set(planDoc, { merge: true });

    return NextResponse.json({
      success: true,
      plan: planDoc,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_oc POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save OC plan" }, { status: 500 });
  }
}
