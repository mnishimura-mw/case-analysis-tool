import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { validateToken } from "@/lib/access-token";
import CaseAnalysisTool from "@/components/CaseAnalysisTool";

export const dynamic = "force-dynamic";

export default async function ToolPage() {
  // トークン検証
  const cookieStore = await cookies();
  const token = cookieStore.get("sa_token")?.value;

  if (!token || !(await validateToken(token))) {
    redirect("/");
  }

  return <CaseAnalysisTool />;
}
