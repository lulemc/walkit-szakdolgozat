import http from "node:http";
import { Socket } from "node:net";

/**
 * Sends an in-memory HTTP request through an Express app and resolves with
 * the response, without opening a network port (works in sandboxes and CI).
 *
 * @param {import("express").Express} app
 * @param {{ method?: string, url: string, body?: unknown, headers?: Record<string, string> }} options
 * @returns {Promise<{ status: number, headers: object, text: string, body: unknown }>}
 */
export const inject = (app, { method = "GET", url, body, headers = {} }) =>
  new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);

    const req = new http.IncomingMessage(new Socket());
    req.method = method;
    req.url = url;
    req.headers = {
      host: "localhost",
      ...(payload && {
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(payload)),
      }),
      ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
    };

    const res = new http.ServerResponse(req);
    const chunks = [];
    const collect = (chunk) => {
      if (chunk && typeof chunk !== "function") chunks.push(Buffer.from(chunk));
    };
    res.write = (chunk) => {
      collect(chunk);
      return true;
    };
    res.end = (chunk) => {
      collect(chunk);
      const text = Buffer.concat(chunks).toString();
      let parsed = text;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        // not JSON, keep the text
      }
      resolve({ status: res.statusCode, headers: res.getHeaders(), text, body: parsed });
      return res;
    };

    try {
      app(req, res);
    } catch (error) {
      reject(error);
    }

    if (payload) req.push(payload);
    req.push(null);
  });
