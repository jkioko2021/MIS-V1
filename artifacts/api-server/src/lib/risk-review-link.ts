// MIS_PUBLIC_APP_URL is the verified published frontend URL, including its base path.
// Never fall back to a development host or include authentication credentials.
export function riskReviewLink(department: string, period: number, base = process.env.MIS_PUBLIC_APP_URL): string | null {
  try {
    if (!base || !department.trim() || department.length > 50
      || !Number.isSafeInteger(period) || period <= 0 || period > 2147483647) return null;
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || url.hostname === "localhost" || url.hostname.endsWith(".replit.dev")
      || url.hostname.endsWith(".localhost") || url.hostname === "127.0.0.1") return null;
    url.pathname = `${url.pathname.replace(/\/$/, "")}/risk/review`;
    url.search = new URLSearchParams({ depart_code: department, period_id: String(period) }).toString();
    return url.toString();
  } catch {
    return null;
  }
}
