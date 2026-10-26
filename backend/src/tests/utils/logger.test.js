import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../../utils/logger.js";

const originalLevel = process.env.LOG_LEVEL;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2030-01-01T10:00:00.000Z") });
  for (const method of ["debug", "info", "warn", "error"]) vi.spyOn(console, method).mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (originalLevel === undefined) delete process.env.LOG_LEVEL;
  else process.env.LOG_LEVEL = originalLevel;
});

describe("logger", () => {
  it("writes each level with the time and level, plus any details", () => {
    process.env.LOG_LEVEL = "debug";
    const details = { status: 503 };

    logger.debug("checking");
    logger.info("Server running on port 4000");
    logger.warn("ORS failed", details);
    logger.error("Unhandled error");

    expect(console.debug).toHaveBeenCalledWith("2030-01-01T10:00:00.000Z DEBUG checking");
    expect(console.info).toHaveBeenCalledWith("2030-01-01T10:00:00.000Z INFO Server running on port 4000");
    expect(console.warn).toHaveBeenCalledWith("2030-01-01T10:00:00.000Z WARN ORS failed", details);
    expect(console.error).toHaveBeenCalledWith("2030-01-01T10:00:00.000Z ERROR Unhandled error");
  });

  it("leaves out debug messages by default", () => {
    delete process.env.LOG_LEVEL;

    logger.debug("noise");
    logger.info("startup");

    expect(console.debug).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalled();
  });

  it("only writes messages at or above LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "warn";

    logger.info("startup");
    logger.warn("slow");
    logger.error("broken");

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("writes nothing with LOG_LEVEL=silent", () => {
    process.env.LOG_LEVEL = "silent";

    logger.error("broken");

    expect(console.error).not.toHaveBeenCalled();
  });
});
