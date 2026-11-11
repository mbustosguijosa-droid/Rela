export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getViewer, needsHandle } from "@/lib/auth";

export default async function MiPerfil() {
  const { user, profile } = await getViewer();
  if (!user || !profile) redirect("/entrar?next=/perfil");
  if (needsHandle(profile)) redirect("/perfil/editar?nuevo=1");
  redirect(`/u/${profile.handle}`);
}
