export async function requestRoute(payload) {
  const response = await fetch("/api/route", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Route request failed.");
  }

  return data;
}
