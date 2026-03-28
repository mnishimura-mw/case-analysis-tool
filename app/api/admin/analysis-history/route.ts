import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const { createServerClient } = await import("@supabase/ssr");
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const admin = createAdminClient();
  const { data } = await admin.from("allowed_users").select("is_admin").eq("email", user.email).single();
  return !!data?.is_admin;
}

function escCsv(val: unknown): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

interface AnalysisData {
  background?: string[];
  challenges?: string[];
  reasons?: string[];
  effects?: string[];
  url?: string;
  note?: string;
  issues?: { common?: string[] };
  strengths?: { common?: string[] };
  values?: { common?: string[] };
  [key: string]: unknown;
}

function flattenAnalysis(step: string, data: AnalysisData | null) {
  if (!data) return { background: "", challenges: "", reasons: "", effects: "", input_summary: "", raw: "" };

  if (step === "step1_case") {
    return {
      background: (data.background || []).join(" / "),
      challenges: (data.challenges || []).join(" / "),
      reasons: (data.reasons || []).join(" / "),
      effects: (data.effects || []).join(" / "),
      input_summary: "",
      raw: "",
    };
  }
  if (step === "step0_product") {
    return {
      background: "", challenges: "", reasons: "", effects: "",
      input_summary: [data.url, data.note].filter(Boolean).join(" | "),
      raw: "",
    };
  }
  if (step === "step2_common") {
    return {
      background: "", challenges: "", reasons: "", effects: "",
      input_summary: "",
      raw: [
        data.issues?.common ? "課題: " + data.issues.common.join(" / ") : "",
        data.strengths?.common ? "強み: " + data.strengths.common.join(" / ") : "",
        data.values?.common ? "効果: " + data.values.common.join(" / ") : "",
      ].filter(Boolean).join(" | "),
    };
  }
  return {
    background: "", challenges: "", reasons: "", effects: "",
    input_summary: "", raw: JSON.stringify(data).substring(0, 500),
  };
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const format = req.nextUrl.searchParams.get("format");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("analysis_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];

  if (format === "csv") {
    const headers = [
      "日時", "ステップ", "製品企業", "製品名",
      "事例企業", "事例タイトル",
      "ご検討の背景", "当時の課題", "製品選定理由", "導入の効果",
      "入力情報", "その他データ", "セッションID",
    ];

    const csvRows = [headers.map(escCsv).join(",")];
    for (const row of rows) {
      const flat = flattenAnalysis(row.step, row.analysis_data as AnalysisData | null);
      const stepLabel: Record<string, string> = {
        step0_product: "製品設定",
        step1_case: "事例分析",
        step2_common: "訴求軸抽出",
        step3_scenario: "シナリオ",
      };
      csvRows.push([
        escCsv(new Date(row.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })),
        escCsv(stepLabel[row.step] || row.step),
        escCsv(row.product_company),
        escCsv(row.product_name),
        escCsv(row.case_company),
        escCsv(row.case_title),
        escCsv(flat.background),
        escCsv(flat.challenges),
        escCsv(flat.reasons),
        escCsv(flat.effects),
        escCsv(flat.input_summary),
        escCsv(flat.raw),
        escCsv(row.session_id),
      ].join(","));
    }

    const bom = "\uFEFF"; // Excel UTF-8 BOM
    const csv = bom + csvRows.join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analysis_history_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(rows);
}
