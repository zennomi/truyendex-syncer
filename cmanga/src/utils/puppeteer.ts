import { connect, PageWithCursor } from "puppeteer-real-browser";
import { delay } from ".";

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

export async function getCloudflareData(
  url: string,
  page: PageWithCursor,
  config?: { delay: number }
) {
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  // delay in seconds
  if (config?.delay) await delay(config.delay);

  return await page.evaluate(() => {
    return document.body.innerText;
  });
}

export async function getCloudflareJsonData<T>(
  url: string,
  page: PageWithCursor,
  config?: { delay: number }
) {
  // Extract the JSON content
  const data = await getCloudflareData(url, page, config);
  const jsonData = JSON.parse(data) as T;

  return jsonData;
}
