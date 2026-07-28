import { describe, expect, it } from "vitest";
import { parseSymbolDirectory } from "../src/providers/nasdaq.js";

describe("parseSymbolDirectory", () => {
  it("parses nasdaqlisted.txt-style rows using the Symbol column", () => {
    const text = [
      "Symbol|Security Name|Market Category|Test Issue|Financial Status|Round Lot Size|ETF|NextShares",
      "AAPL|Apple Inc. - Common Stock|Q|N|N|100|N|N",
      "MSFT|Microsoft Corporation - Common Stock|Q|N|N|100|N|N",
      "ZTEST|Test Issue Corp|Q|Y|N|100|N|N",
      "File Creation Time: 0728202608:00",
    ].join("\n");

    const entries = parseSymbolDirectory(text);

    expect(entries).toEqual([
      { symbol: "AAPL", name: "Apple Inc. - Common Stock" },
      { symbol: "MSFT", name: "Microsoft Corporation - Common Stock" },
    ]);
  });

  it("parses otherlisted.txt-style rows using the ACT Symbol column", () => {
    const text = [
      "ACT Symbol|Security Name|Exchange|CQS Symbol|ETF|Round Lot Size|Test Issue|NASDAQ Symbol",
      "BRK.A|Berkshire Hathaway Inc. Class A|N|BRK.A|N|100|N|BRK.A",
      "IBM|International Business Machines Corp|N|IBM|N|100|N|IBM",
    ].join("\n");

    const entries = parseSymbolDirectory(text);

    expect(entries).toEqual([
      { symbol: "BRK.A", name: "Berkshire Hathaway Inc. Class A" },
      { symbol: "IBM", name: "International Business Machines Corp" },
    ]);
  });

  it("returns an empty array for unrecognized or empty input", () => {
    expect(parseSymbolDirectory("")).toEqual([]);
    expect(parseSymbolDirectory("not a real header\nrandom line")).toEqual([]);
  });
});
