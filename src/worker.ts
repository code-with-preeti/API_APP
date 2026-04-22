import prisma from "./prismaClient";
import { insertApiCheck } from "./services/apiCheckService";

const CHECK_INTERVAL_MS = 10 * 1000;
const REQUEST_TIMEOUT_MS = 5 * 1000;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

function normalizeMethod(m: unknown): Method {
  const up = String(m ?? "GET").trim().toUpperCase();
  if (
    up === "GET" ||
    up === "POST" ||
    up === "PUT" ||
    up === "PATCH" ||
    up === "DELETE" ||
    up === "HEAD" ||
    up === "OPTIONS"
  ) {
    return up;
  }
  return "GET";
}

const checkAPIs = async () => {
  console.log(`[${new Date().toLocaleTimeString()}] Checking APIs...`);

  let apis: {
    id: number;
    name: string;
    url: string;
    method: Method;
    headers: unknown;
    body: unknown;
  }[] = [];
  try {
    apis = await prisma.monitoredAPI.findMany({
      select: { id: true, name: true, url: true, method: true, headers: true, body: true },
    });
  } catch (err) {
    console.error("Failed to load monitored APIs from DB.", err);
    return;
  }

  for (const api of apis) {
    let status: "up" | "down" = "down";
    let responseTime: number | undefined = undefined;

    try {
      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      const method = normalizeMethod((api as any).method);
      const headers: Record<string, string> = {
        "User-Agent": "api-sentinel",
      };
      if (api.headers && typeof api.headers === "object" && !Array.isArray(api.headers)) {
        for (const [k, v] of Object.entries(api.headers as Record<string, unknown>)) {
          if (typeof v === "string") headers[k] = v;
        }
      }

      let body: string | undefined = undefined;
      if (method !== "GET" && method !== "HEAD" && api.body !== null && api.body !== undefined) {
        headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
        body = JSON.stringify(api.body);
      }

      const start = Date.now();
      const response = await fetch(api.url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      responseTime = Date.now() - start;

      // Consider 2xx/3xx as UP. 4xx/5xx are treated as DOWN for monitoring.
      if (response.status < 400) {
        status = "up";
      }
    } catch (error) {
      // Network errors / timeouts => DOWN
    }

    try {
      await prisma.monitoredAPI.update({
        where: { id: api.id },
        data: { status },
      });
      await insertApiCheck(api.id, status, responseTime);
    } catch (err) {
      console.error(`Failed to persist check for API ${api.id}.`, err);
    }

    console.log(`${api.name} status: ${status.toUpperCase()}`);
  }
};

void checkAPIs();
setInterval(checkAPIs, CHECK_INTERVAL_MS);
