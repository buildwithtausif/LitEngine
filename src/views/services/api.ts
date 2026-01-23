const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: any,
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const errorResult = await response
      .json()
      .catch(() => ({ message: `HTTP Error ${response.status}` }));
    throw new Error(errorResult.error || errorResult.message);
  }

  if (method === "DELETE") return {} as T;
  return response.json();
}
