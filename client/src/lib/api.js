const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function requestRoute(payload, options = {}) {
  const response = await fetch(`${apiBaseUrl}/api/route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    signal: options.signal
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Route request failed.");
  }

  return data;
}
