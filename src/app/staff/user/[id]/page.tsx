import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserDetail } from "../../actions";
import UserAdminPage from "./UserAdminPage";

export default async function StaffUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(session.priv & ((1 << 12) | (1 << 13) | (1 << 14)))) redirect("/");

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) redirect("/staff");

  const data = await getUserDetail(userId);

  return (
    <UserAdminPage
      initialData={data}
      userId={userId}
      sessionPriv={session.priv}
    />
  );
}
