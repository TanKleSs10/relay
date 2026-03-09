type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
};

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

function buildUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, headers } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init: RequestInit = {
    method,
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
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.detail || data?.error || "";
    } catch (error) {
      detail = "";
    }
    throw new Error(detail || `Request failed (${response.status})`);
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
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.detail || data?.error || "";
    } catch (error) {
      detail = "";
    }
    throw new Error(detail || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers };
}
