import { connect, PageWithCursor } from "puppeteer-real-browser";

export const realBrowser = () =>
  connect({
    headless: false,

    args: [],

    customConfig: {
      chromePath: "/usr/bin/google-chrome",
    },

    turnstile: true,

    connectOption: {},

    disableXvfb: false,
    ignoreAllFlags: false,
  });

export async function parseJsonFromPage<T>(page: PageWithCursor) {
  return (await page.evaluate(() => {
    return JSON.parse(document.body.innerText);
  })) as T;
}
