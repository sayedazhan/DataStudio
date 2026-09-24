export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new Error("Azhan Data Studio couldn't connect to the analysis service. Please check your connection and try again shortly.");
  }
}
