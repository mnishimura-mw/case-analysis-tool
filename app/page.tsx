// Step A: Login page placeholder
// Google OAuth authentication will be added in Step B
import { redirect } from "next/navigation";

export default function LoginPage() {
  // Step A: redirect directly to tool (no auth yet)
  redirect("/tool");
}
