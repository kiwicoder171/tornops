import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export interface RwArmoryRecord {
  id: string;
  factionId: number;
  name: string;
  category: "PRIMARY" | "SECONDARY" | "MELEE" | "ARMOR";
  bonusName: string;
  bonusValue: string;
  bonusType: "DEBUFF" | "DAMAGE" | "UTILITY" | "ARMOR_SET";
  bonusDescription: string;
  tier: "ORANGE" | "YELLOW" | "RED";
  baseDamage?: number;
  baseAccuracy?: number;
  loanedTo?: {
    name: string;
    id: number;
    daysHeld: number;
    isOverdue: boolean;
  } | null;
  valueEst: string;
  createdAt: number;
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
      items: [],
    });
  }

  try {
    const snapshot = await firestore
      .collection("faction_armory")
      .where("factionId", "==", factionId)
      .get();

    const items: RwArmoryRecord[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        factionId: data.factionId,
        name: data.name,
        category: data.category || "PRIMARY",
        bonusName: data.bonusName || "Combat Bonus",
        bonusValue: data.bonusValue || "+0%",
        bonusType: data.bonusType || "DAMAGE",
        bonusDescription: data.bonusDescription || "",
        tier: data.tier || "YELLOW",
        baseDamage: data.baseDamage,
        baseAccuracy: data.baseAccuracy,
        loanedTo: data.loanedTo || null,
        valueEst: data.valueEst || "$100,000,000",
        createdAt: data.createdAt || Math.floor(Date.now() / 1000),
      };
    });

    return NextResponse.json({
      configured: true,
      engine: "firestore",
      factionId,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_armory GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch armory records" }, { status: 500 });
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

    // 1. Action: Delete an armory record
    if (action === "DELETE") {
      const { itemId } = body;
      if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });
      await firestore.collection("faction_armory").doc(itemId).delete();
      return NextResponse.json({ success: true, action: "DELETED", itemId });
    }

    // 2. Action: Update Loan status (Loan / Return)
    if (action === "UPDATE_LOAN") {
      const { itemId, loanedTo } = body;
      if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

      await firestore.collection("faction_armory").doc(itemId).set(
        {
          loanedTo: loanedTo || null,
          updatedAt: Math.floor(Date.now() / 1000),
        },
        { merge: true }
      );

      return NextResponse.json({ success: true, action: "UPDATED_LOAN", itemId, loanedTo });
    }

    // 3. Action: Register a new RW weapon
    const { name, category, bonusName, bonusValue, bonusType, bonusDescription, tier, baseDamage, baseAccuracy, loanedTo, valueEst } = body;

    if (!name || !bonusName) {
      return NextResponse.json({ error: "Weapon name and bonus name are required" }, { status: 400 });
    }

    const itemId = `rw_${fid}_${Date.now()}`;
    const newRecord: RwArmoryRecord = {
      id: itemId,
      factionId: fid,
      name: name.trim(),
      category: category || "PRIMARY",
      bonusName: bonusName.trim(),
      bonusValue: bonusValue?.trim() || "20%",
      bonusType: bonusType || "DAMAGE",
      bonusDescription: bonusDescription?.trim() || "",
      tier: tier || "YELLOW",
      baseDamage: baseDamage ? Number(baseDamage) : undefined,
      baseAccuracy: baseAccuracy ? Number(baseAccuracy) : undefined,
      loanedTo: loanedTo || null,
      valueEst: valueEst?.trim() || "$250,000,000",
      createdAt: Math.floor(Date.now() / 1000),
    };

    await firestore.collection("faction_armory").doc(itemId).set(newRecord);

    return NextResponse.json({
      success: true,
      action: "CREATED",
      record: newRecord,
    });
  } catch (err: any) {
    console.error("[Firestore] faction_armory POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to save armory record" }, { status: 500 });
  }
}
