import { NextResponse } from "next/server";
import {
  ApiErrorCode,
  ApiFailure,
  ApiSuccess,
} from "@/app/lib/api-contract";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status });
}

export function apiFailure(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json<ApiFailure>(
    { ok: false, error: { code, message } },
    { status },
  );
}
