import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import CaseAnalysisTool from "@/components/CaseAnalysisTool";

export default async function ToolPage() {
  // Supabase が設定されていない場合はそのまま表示（Step A 互換）
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "your_supabase_url_here"
  ) {
    return <CaseAnalysisTool />;
  }

  // サーバーサイドで認証チェック
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <CaseAnalysisTool />;
}
