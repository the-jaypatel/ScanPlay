import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    console.log("\n========================================================");
    console.log("🔔 [SCANPLAY REAL-DEVICE COMPRESSION DIAGNOSTIC RECEIVED]");
    console.log("========================================================");
    console.log(JSON.stringify(data, null, 2));
    console.log("========================================================\n");

    // Persist diagnostic locally for inspection
    try {
      const diagPath = path.join(process.cwd(), "latest_compression_diagnostic.json");
      fs.writeFileSync(diagPath, JSON.stringify(data, null, 2), "utf8");
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to parse diagnostic payload:", err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
