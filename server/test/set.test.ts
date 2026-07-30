import { describe, expect, it } from "vitest";
import { parseSetStockList } from "../src/providers/set.js";

describe("parseSetStockList", () => {
  it("parses a bare array of entries", () => {
    const result = parseSetStockList([
      { symbol: "PTT", nameEN: "PTT Public Company Limited" },
      { symbol: "AOT", nameEN: "Airports of Thailand" },
    ]);
    expect(result).toEqual([
      { symbol: "PTT.BK", name: "PTT Public Company Limited", market: "SET" },
      { symbol: "AOT.BK", name: "Airports of Thailand", market: "SET" },
    ]);
  });

  it("finds entries nested under a common wrapper field", () => {
    const result = parseSetStockList({
      securitySymbols: [{ symbol: "CPALL", name: "CP All Public Company Limited" }],
    });
    expect(result).toEqual([
      { symbol: "CPALL.BK", name: "CP All Public Company Limited", market: "SET" },
    ]);
  });

  it("falls back through name fields when nameEN is missing", () => {
    const result = parseSetStockList([{ symbol: "KBANK", nameTH: "ธนาคารกสิกรไทย" }]);
    expect(result).toEqual([{ symbol: "KBANK.BK", name: "ธนาคารกสิกรไทย", market: "SET" }]);
  });

  it("skips entries missing a symbol or name and de-duplicates", () => {
    const result = parseSetStockList([
      { symbol: "PTT", nameEN: "PTT Public Company Limited" },
      { symbol: "PTT", nameEN: "PTT Public Company Limited" },
      { name: "Missing Symbol" },
      { symbol: "MISSINGNAME" },
    ]);
    expect(result).toEqual([
      { symbol: "PTT.BK", name: "PTT Public Company Limited", market: "SET" },
    ]);
  });

  it("returns an empty list for an unrecognized shape", () => {
    expect(parseSetStockList({ unexpected: "shape" })).toEqual([]);
    expect(parseSetStockList(null)).toEqual([]);
    expect(parseSetStockList("not an object")).toEqual([]);
  });
});
