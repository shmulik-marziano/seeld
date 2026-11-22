// Entry contexts of the POA wizard (spec ס0 "נקודות כניסה"): `?from=<key>` picks the first line of ס0 only.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { POA_ENTRIES, poaEntryOf, type PoaEntry } from "@/lib/poa/config";
import { POA_COPY as C } from "@/lib/poa/copy";
import { PoaWizard } from "@/pages/report-order/PoaFlow";
import { createMockPoaApi } from "@/lib/poa/api";

describe("poa entry context", () => {
  it("reads ?from= and falls back to default", () => {
    expect(poaEntryOf("")).toBe("default");
    expect(poaEntryOf("?from=insurance")).toBe("insurance");
    expect(poaEntryOf("?x=1&from=join")).toBe("join");
    expect(poaEntryOf("?from=anything")).toBe("default");
    expect(poaEntryOf("?from=")).toBe("default");
  });

  it("every entry has its own first line, and they differ", () => {
    const lines = POA_ENTRIES.map((e) => C.s0.lead[e]);
    expect(new Set(lines).size).toBe(POA_ENTRIES.length);
  });

  it.each(POA_ENTRIES.map((e) => [e]))("renders the %s line on ס0", (entry) => {
    const { unmount } = render(
      <MemoryRouter><PoaWizard api={createMockPoaApi({ delayMs: 0 })} entry={entry as PoaEntry} /></MemoryRouter>,
    );
    expect(screen.getByText(C.s0.lead[entry as PoaEntry])).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: C.s0.title })).toBeInTheDocument();
    unmount();
  });
});
