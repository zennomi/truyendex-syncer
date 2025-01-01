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

export async function getJsonData<T>(url: string, page: PageWithCursor) {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  // delay 5s
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Extract the JSON content
  const jsonData = await parseJsonFromPage<T>(page);

  return jsonData;
}
