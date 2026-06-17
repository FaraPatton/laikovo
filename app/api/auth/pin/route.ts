import { NextResponse } from "next/server";
import { authorizePin, isPinAuthorized } from "@/app/lib/pin-auth";

export async function GET() {
  try {
    return NextResponse.json({ authorized: await isPinAuthorized() });
  } catch {
    return NextResponse.json({ authorized: false });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { pin?: string };

  try {
    const authorized = await authorizePin(body.pin ?? "");

    if (!authorized) {
      return NextResponse.json({ error: "Неверный PIN." }, { status: 401 });
    }

    return NextResponse.json({ authorized: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось проверить PIN.",
      },
      { status: 500 },
    );
  }
}
