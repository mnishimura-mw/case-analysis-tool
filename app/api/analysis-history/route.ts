import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hasValidAccess } from "@/lib/access-token";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  if (!(await hasValidAccess())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { session_id, step, product_company, product_name, case_company, case_title, analysis_data } = body;

    const admin = createAdminClient();
    const { error } = await admin.from("analysis_history").insert({
      session_id: session_id || randomUUID(),
      step: step || "unknown",
      product_company: product_company || null,
      product_name: product_name || null,
      case_company: case_company || null,
      case_title: case_title || null,
      analysis_data: analysis_data || null,
    });

    if (error) {
      console.error("analysis_history insert error:", error.message);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("analysis-history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
