import { auth } from "@/auth";

export async function requireAuthedSession() {
  const session = await auth();

  if (!session?.user?.email || !session.accessToken) {
    return null;
  }

  return session;
}
