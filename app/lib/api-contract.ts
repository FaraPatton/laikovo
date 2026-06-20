const API_ERROR_CODES = [
  "UNAUTHORIZED",
  "INVALID_JSON",
  "VALIDATION_ERROR",
  "UPSTREAM_ERROR",
  "INVALID_RESPONSE",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const apiErrorCodeSet = new Set<string>(API_ERROR_CODES);

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

function isApiFailure(value: unknown): value is ApiFailure {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ApiFailure>;

  return (
    candidate.ok === false &&
    typeof candidate.error?.code === "string" &&
    apiErrorCodeSet.has(candidate.error.code) &&
    typeof candidate.error.message === "string"
  );
}

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Partial<ApiSuccess<T>>).ok === true &&
      "data" in value,
  );
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Сервер вернул некорректный ответ.",
      response.status,
    );
  }

  if (isApiFailure(payload)) {
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
      response.status,
    );
  }

  if (!response.ok || !isApiSuccess<T>(payload)) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Формат ответа сервера не поддерживается.",
      response.status,
    );
  }

  return payload.data;
}
