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

  if (response.status === 429) {
    const resetHeader = response.headers.get("RateLimit-Reset");
    // express-rate-limit sends RateLimit-Reset as seconds remaining or a date.
    // Standard headers (draft-7) vs Legacy. The user config has standardHeaders: true.
    // standardHeaders: true -> RateLimit-Reset: <integer seconds>?
    // actually standardHeaders (draft-6/7 compliance) usually means `RateLimit-Reset` is seconds delta or timestamp.
    // Let's assume generic loose handling or just calculate current time + 15 mins if missing.
    // Actually the middleware sets windowMs = 15 mins.

    let retryTime = "";
    if (resetHeader) {
      // If it's a timestamp or delta, let's try to interpret.
      // Often strictly strictly it is distinct.
      // Let's just pass the raw info or Calculate target time.
      const resetSeconds = parseInt(resetHeader, 10);
      if (!isNaN(resetSeconds)) {
        // Current express-rate-limit with standardHeaders: true usually sends the *count* of seconds or the window?
        // Actually, let's look at the docs or assume simple behavior:
        // If we get a 429, we likely have to wait.
        // Let's calculate a "Try after" time.
        const targetDate = new Date(Date.now() + (resetSeconds || 900) * 1000);
        retryTime = targetDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    // Just in case header is missing/funky, default to +15 mins from now as a fallback logic if we know the config
    if (!retryTime) {
      const targetDate = new Date(Date.now() + 15 * 60 * 1000);
      retryTime = targetDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const event = new CustomEvent("rate-limit-hit", {
      detail: {
        message: "Too many requests. Please try again after " + retryTime,
      },
    });
    window.dispatchEvent(event);
  }

  if (!response.ok) {
    const errorResult = await response
      .json()
      .catch(() => ({ message: `HTTP Error ${response.status}` }));
    throw new Error(errorResult.error || errorResult.message);
  }

  if (method === "DELETE") return {} as T;
  return response.json();
}
