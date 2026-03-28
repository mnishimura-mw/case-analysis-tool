import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { validateToken } from "@/lib/access-token";
import { createAdminClient } from "@/lib/supabase-server";
import CaseAnalysisTool from "@/components/CaseAnalysisTool";

export const dynamic = "force-dynamic";

export default async function ToolPage() {
  const cookieStore = await cookies();

  // 1. トークン認証
  const token = cookieStore.get("sa_token")?.value;
  if (token && (await validateToken(token))) {
    return <CaseAnalysisTool />;
  }

  // 2. 管理者セッション（スーパーバイザーモード）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("allowed_users")
      .select("is_admin")
      .eq("email", user.email)
      .maybeSingle();
    if (data) {
      return <CaseAnalysisTool isAdmin={!!data.is_admin} />;
    }
  }

  redirect("/");
}
