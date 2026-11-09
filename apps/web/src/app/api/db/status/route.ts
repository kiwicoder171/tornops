import { NextResponse } from "next/server";
import { getFirestoreDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const firestore = getFirestoreDb();

  if (!firestore) {
    return NextResponse.json({
      connected: false,
      engine: null,
      message: "No cloud database credentials configured.",
    }, { status: 503 });
  }

  try {
    const healthDoc = await firestore.collection("_health_check").doc("ping").get();
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      connected: true,
      engine: "firestore",
      projectId: "tornops-suite-e547bd",
      latencyMs,
      data: healthDoc.data() || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      engine: "firestore",
      error: err?.message || "Failed to reach Firestore",
    }, { status: 500 });
  }
}
