// Request id handling: honour a well-formed inbound x-request-id, else mint one.
const OK = /^[A-Za-z0-9_-]{8,64}$/;

export function requestIdFor(req: Request, mint: () => string = () => crypto.randomUUID()): string {
  const inbound = req.headers.get("x-request-id");
  return inbound && OK.test(inbound) ? inbound : mint();
}
