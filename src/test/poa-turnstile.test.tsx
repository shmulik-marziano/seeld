import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { Review } from "@/pages/report-order/screens/Review";
import { useTurnstileToken } from "@/pages/report-order/useTurnstileToken";

afterEach(() => { vi.useRealTimers(); });

const base = { headingRef: { current: null }, dir: "fwd" as const, prog: null, busy: false };
const identity = { first: "ישראל", last: "ישראלי", id: "000000000" };
const contact = { phone: "0501234567", email: "", terms: true, marketing: false };

describe("POA Turnstile on the first submitting screen", () => {
  it("renders nothing without a widget config, and the widget slot when one is given", () => {
    const { container, rerender } = render(<Review {...base} identity={identity} contact={contact} started={false} onConfirm={() => {}} onEdit={() => {}} />);
    expect(container.querySelector(".sd-turnstile")).toBeNull();
    rerender(
      <Review {...base} identity={identity} contact={contact} started={false}
        turnstile={{ siteKey: "k", handle: { current: null }, onToken: () => {}, onError: () => {} }}
        onConfirm={() => {}} onEdit={() => {}} />,
    );
    expect(container.querySelector(".sd-turnstile")).not.toBeNull();
    // after the start call the screen no longer asks for a token
    rerender(
      <Review {...base} identity={identity} contact={contact} started
        turnstile={{ siteKey: "k", handle: { current: null }, onToken: () => {}, onError: () => {} }}
        onConfirm={() => {}} onEdit={() => {}} />,
    );
    expect(container.querySelector(".sd-turnstile")).toBeNull();
  });

  it("with no site key there is no widget and the token is empty at once", async () => {
    const { result } = renderHook(() => useTurnstileToken(""));
    expect(result.current.widget).toBeUndefined();
    await expect(result.current.waitForToken()).resolves.toBeNull();
  });

  it("with a site key it waits for the token, then hands it over; reset forgets it", async () => {
    const { result } = renderHook(() => useTurnstileToken("k"));
    expect(result.current.widget?.siteKey).toBe("k");
    const pending = result.current.waitForToken();
    act(() => result.current.widget!.onToken("tok"));
    await expect(pending).resolves.toBe("tok");
    await expect(result.current.waitForToken()).resolves.toBe("tok");
    act(() => result.current.reset());
    vi.useFakeTimers();
    const again = result.current.waitForToken();
    await vi.advanceTimersByTimeAsync(9000);
    await expect(again).resolves.toBeNull();
  });

  it("a widget that cannot load drops the widget and stops waiting", async () => {
    const { result } = renderHook(() => useTurnstileToken("k"));
    act(() => result.current.widget!.onError());
    expect(result.current.widget).toBeUndefined();
    await expect(result.current.waitForToken()).resolves.toBeNull();
  });
});
