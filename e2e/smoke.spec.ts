import { test, expect, type Page } from "@playwright/test";

/**
 * Stamps a value on `window` that a client-side route change preserves and a
 * full document load destroys. That difference is the whole point of an SPA,
 * and it is exactly what regressed when navigation links were plain anchors.
 */
async function markDocument(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __doc: number }).__doc = 1;
  });
}

async function documentSurvived(page: Page) {
  return page.evaluate(() => (window as unknown as { __doc?: number }).__doc === 1);
}

test("homepage renders rather than white-screening", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");

  await expect(page).toHaveTitle(/SEELD/);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByRole("banner")).toBeVisible();
  expect(errors).toEqual([]);
});

test("the document survives header navigation", async ({ page }) => {
  await page.goto("/");
  await markDocument(page);

  await page.getByRole("link", { name: "ביטוח", exact: true }).first().click();
  await expect(page).toHaveURL(/\/insurances$/);

  expect(await documentSurvived(page)).toBe(true);
});

test("the document survives an article card click", async ({ page }) => {
  await page.goto("/wellness");
  await markDocument(page);

  const card = page.locator('a[href^="/article/"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();

  await expect(page).toHaveURL(/\/article\//);
  expect(await documentSurvived(page)).toBe(true);
});

test("the fund finder reaches live data", async ({ page }) => {
  await page.goto("/fund-finder");

  // The heading is static; the count only appears once Supabase answers.
  await expect(page.getByText(/קופות במאגר/)).toBeVisible({ timeout: 30_000 });
});

test("an unknown article id renders not-found at its own URL", async ({ page }) => {
  await page.goto("/article/definitely-not-an-article");

  // Rendered in place: the URL the visitor asked for is still in the bar.
  await expect(page).toHaveURL(/definitely-not-an-article/);
  await expect(page.locator("#root")).not.toBeEmpty();
});

test("the chat bot mounts after the page is interactive", async ({ page }) => {
  await page.goto("/");

  // Deferred to idle on purpose — it must still turn up without interaction.
  await expect(page.getByRole("button", { name: /שיחה עם היועץ/ })).toBeVisible({
    timeout: 15_000,
  });
});
