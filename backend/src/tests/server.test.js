import { describe, it, expect, vi, beforeEach } from "vitest";

/* -------------------- MOCKS -------------------- */

// mock dotenv
vi.mock("dotenv", () => ({
  default: {
    config: vi.fn(),
  },
}));

// mock db connection
vi.mock("../config/db.js", () => ({
  connectDB: vi.fn(),
}));

// mock express app
vi.mock("../app.js", () => ({
  default: {
    listen: vi.fn(),
  },
}));

/* -------------------- TEST -------------------- */

describe("Server startup", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.PORT = "5000";
  });

  it("initializes environment, connects DB and starts server", async () => {
    const { startServer } = await import("../server.js");

    startServer();

    const dotenv = await import("dotenv");
    const { connectDB } = await import("../config/db.js");
    const app = (await import("../app.js")).default;

    expect(dotenv.default.config).toHaveBeenCalled();
    expect(connectDB).toHaveBeenCalled();

    // Update this expectation to match the actual call
    expect(app.listen).toHaveBeenCalledWith(
      "5000",
      "0.0.0.0",
      expect.any(Function),
    );
  });
});
