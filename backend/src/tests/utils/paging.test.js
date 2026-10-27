import { describe, it, expect } from "vitest";
import { HttpError } from "../../utils/httpError.js";
import { parsePage } from "../../utils/paging.js";

const options = { defaultLimit: 20, maxLimit: 50 };

describe("parsePage", () => {
  it("uses the default limit and no cursor without a query", () => {
    expect(parsePage({}, options)).toEqual({ before: undefined, limit: 20 });
  });

  it("reads before (a date) and limit (from the query string)", () => {
    expect(parsePage({ before: "2030-01-01T00:00:00.000Z", limit: "5" }, options)).toEqual({
      before: new Date("2030-01-01T00:00:00.000Z"),
      limit: 5,
    });
  });

  it.each([
    [{ before: "soon" }, "before must be a date"],
    [{ limit: "0" }, "limit must be a whole number from 1 to 50"],
    [{ limit: "51" }, "limit must be a whole number from 1 to 50"],
    [{ limit: "2.5" }, "limit must be a whole number from 1 to 50"],
  ])("rejects %o with 400", (query, message) => {
    let error;
    try {
      parsePage(query, options);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(400);
    expect(error.message).toBe(message);
  });
});
