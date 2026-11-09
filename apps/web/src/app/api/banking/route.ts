import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export interface BankingWithdrawalRecord {
  id: string;
  factionId: number;
  playerId: number;
  playerName: string;
  amount: number;
  reason: string;
  status: "PENDING" | "FULFILLED";
  createdAt: number;
  fulfilledAt?: number;
  fulfilledBy?: string;
}

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
      requests: [],
    });
  }

  try {
    const snapshot = await firestore
      .collection("faction_banking")
      .where("factionId", "==", factionId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const requests: BankingWithdrawalRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        factionId: data.factionId,
        playerId: data.playerId,
        playerName: data.playerName || `Player [${data.playerId}]`,
        amount: Number(data.amount || 0),
        reason: data.reason || "General vault request",
        status: data.status || "PENDING",
        createdAt: data.createdAt || Math.floor(Date.now() / 1000),
        fulfilledAt: data.fulfilledAt,
        fulfilledBy: data.fulfilledBy,
      };
    });

    return NextResponse.json({
      configured: true,
      engine: "firestore",
      factionId,
      count: requests.length,
      requests,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_banking GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch banking records" }, { status: 500 });
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
    const { action, factionId } = body;

    if (!factionId || isNaN(Number(factionId))) {
      return NextResponse.json({ error: "Valid factionId is required" }, { status: 400 });
    }

    const fid = Number(factionId);

    // 1. Action: Fulfill a request
    if (action === "FULFILL") {
      const { requestId, bankerName } = body;
      if (!requestId) {
        return NextResponse.json({ error: "requestId is required to fulfill" }, { status: 400 });
      }

      const docRef = firestore.collection("faction_banking").doc(requestId);
      await docRef.set(
        {
          status: "FULFILLED",
          fulfilledAt: Math.floor(Date.now() / 1000),
          fulfilledBy: bankerName || "Banker",
        },
        { merge: true }
      );

      return NextResponse.json({ success: true, action: "FULFILLED", requestId });
    }

    // 2. Action: Create a new member withdrawal request
    const { playerId, playerName, amount, reason } = body;

    if (!playerId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Invalid payload. playerId and positive amount are required." },
        { status: 400 }
      );
    }

    const recordId = `req_${fid}_${playerId}_${Date.now()}`;
    const newRecord: BankingWithdrawalRecord = {
      id: recordId,
      factionId: fid,
      playerId: Number(playerId),
      playerName: playerName || `Player [${playerId}]`,
      amount: Number(amount),
      reason: reason?.trim() || "War gear / Medical funds",
      status: "PENDING",
      createdAt: Math.floor(Date.now() / 1000),
    };

    await firestore.collection("faction_banking").doc(recordId).set(newRecord);

    return NextResponse.json({
      success: true,
      action: "CREATED",
      record: newRecord,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_banking POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to process banking transaction" }, { status: 500 });
  }
}
