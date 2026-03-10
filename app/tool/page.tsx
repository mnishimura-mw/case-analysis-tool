import { redirect } from "next/navigation";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase-server";
import CaseAnalysisTool from "@/components/CaseAnalysisTool";

// リクエストごとにサーバーサイドで認証・管理者チェックを実行するため強制動的レンダリング
export const dynamic = "force-dynamic";

const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url_here";

export default async function ToolPage() {
  // Supabase が未設定の場合はそのまま表示（Step A 互換）
  if (!SUPABASE_ENABLED) {
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

  // 管理者かどうかチェック
  const admin = createAdminClient();
  const { data: allowedUser } = await admin
    .from("allowed_users")
    .select("is_admin")
    .eq("email", user!.email!)
    .single();

  const isAdmin = allowedUser?.is_admin ?? false;

  return <CaseAnalysisTool isAdmin={isAdmin} />;
}
