import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));
vi.mock("../config/db.js", () => ({ connectDB: vi.fn() }));
vi.mock("../app.js", () => ({ default: { listen: vi.fn() } }));

const { connectDB } = await import("../config/db.js");
const app = (await import("../app.js")).default;
const { SHUTDOWN_TIMEOUT_MS, shutdown, startServer } = await import("../server.js");

const fakeServer = () => ({ close: vi.fn((done) => done()) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation(() => {});
  vi.spyOn(process, "once").mockImplementation(() => process);
  vi.spyOn(mongoose, "disconnect").mockResolvedValue(undefined);
  process.env.PORT = "5000";
});

describe("startServer", () => {
  it("connects to the database before accepting requests", async () => {
    const order = [];
    connectDB.mockImplementation(async () => order.push("db"));
    app.listen.mockImplementation((_port, _host, ready) => {
      order.push("listen");
      ready();
      return fakeServer();
    });

    await startServer();

    expect(order).toEqual(["db", "listen"]);
    expect(app.listen).toHaveBeenCalledWith("5000", "0.0.0.0", expect.any(Function));
  });

  it("stops with an error when the database can't be reached", async () => {
    connectDB.mockRejectedValue(new Error("ECONNREFUSED"));

    await startServer();

    expect(app.listen).not.toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it("shuts down cleanly on SIGTERM and SIGINT", async () => {
    connectDB.mockResolvedValue(undefined);
    app.listen.mockReturnValue(fakeServer());

    await startServer();

    const signals = process.once.mock.calls.map(([signal]) => signal);
    expect(signals).toEqual(expect.arrayContaining(["SIGTERM", "SIGINT"]));
  });
});

describe("shutdown", () => {
  it("stops taking requests, finishes the open ones, closes the database, then exits", async () => {
    const server = fakeServer();

    await shutdown(server, "SIGTERM");

    expect(server.close).toHaveBeenCalled();
    expect(mongoose.disconnect).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it(`gives up after ${SHUTDOWN_TIMEOUT_MS / 1000} s if requests don't finish`, async () => {
    vi.useFakeTimers();
    const server = { close: vi.fn() };

    shutdown(server, "SIGTERM");
    vi.advanceTimersByTime(SHUTDOWN_TIMEOUT_MS);

    expect(process.exit).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });
});
