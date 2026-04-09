import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SettingsForm />;
}
