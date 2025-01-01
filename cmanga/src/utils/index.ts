export * from "./mongoose";
export * from "./puppeteer";

export function delay(secs: number) {
  return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}
