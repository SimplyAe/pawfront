import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import StaffPanel from "./StaffPanel";

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(session.priv & ((1 << 12) | (1 << 13) | (1 << 14)))) redirect("/");
  return <StaffPanel sessionPriv={session.priv} />;
}
