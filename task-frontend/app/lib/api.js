// Thin fetch wrapper shared by every component that talks to the backend.
// Centralizing this means error-message parsing, JSON headers, and the API
// base URL only need to be correct in one place.

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function parseErrorMessage(res, fallback) {
  try {
    const data = await res.json();
    return { message: data.error || fallback, code: data.code, ...data };
  } catch {
    // Response wasn't JSON at all (e.g. the API crashed before sending JSON,
    // or a proxy/server returned an HTML error page) — this is the
    // "unexpected error" that we need to handle gracefully.
    return { message: fallback };
  }
}

class ApiError extends Error {
  constructor(message, extra = {}) {
    super(message);
    this.name = "ApiError";
    Object.assign(this, extra);
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (networkErr) {
    // fetch() itself threw — server unreachable, DNS failure, offline, etc.
    throw new ApiError(
      "Can't reach the server right now. Check your connection and try again.",
    );
  }

  if (!res.ok) {
    const fallback = `Request failed (${res.status}). Please try again.`;
    const errInfo = await parseErrorMessage(res, fallback);
    throw new ApiError(errInfo.message, errInfo);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { ApiError };
