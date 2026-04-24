type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
};

const baseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "/api";

function buildUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

function getErrorMessage(response: Response, fallbackStatus: number) {
  return response
    .json()
    .then((data) => data?.detail || data?.error || `Request failed (${fallbackStatus})`)
    .catch(() => `Request failed (${fallbackStatus})`);
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  return match?.[1] ?? null;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, headers } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestWithMeta<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, headers } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, response.status));
  }

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers };
}

export async function downloadFile(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, headers } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), init);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, response.status));
  }

  return {
    blob: await response.blob(),
    filename: getFilenameFromDisposition(response.headers.get("Content-Disposition")),
  };
}
