import { formatCompactNumber, formatLastUpdated } from "../healthFormatters";

describe("formatCompactNumber", () => {
  it("keeps small numbers as whole numbers", () => {
    expect(formatCompactNumber(950)).toBe("950");
  });

  it("shows thousands with a k suffix", () => {
    expect(formatCompactNumber(10000)).toBe("10k");
    expect(formatCompactNumber(12400)).toBe("12.4k");
  });
});

describe("formatLastUpdated", () => {
  it("says just now for recent updates", () => {
    expect(formatLastUpdated(new Date())).toBe("just now");
  });
});
