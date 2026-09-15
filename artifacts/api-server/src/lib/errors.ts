export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendError(res: import("express").Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.code, message: error.message });
    return;
  }
  console.error(JSON.stringify({ event: "unhandled_route_error", message: error instanceof Error ? error.message : String(error) }));
  res.status(500).json({ error: "internal_error", message: "Something went wrong. Please try again." });
}
