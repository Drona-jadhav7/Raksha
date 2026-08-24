const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

export function wsUrl() {
  return API.replace(/^http/, "ws") + "/ws";
}
