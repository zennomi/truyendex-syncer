import { COLLECTION_NAME } from "@/constants";
import {
  delay,
  getCloudflareData,
  getCloudflareJsonData,
  mongooseWrapper,
  realBrowser,
} from "@/utils";
import { load } from "cheerio";
import { last } from "lodash";
import mongoose from "mongoose";

// sudo apt-get install xvfb
// warp
const main = async () => {
  const db = mongoose.connection;

  const collection = db.collection(COLLECTION_NAME.CMANGA_MANGA);

  const { browser, page } = await realBrowser();

  await page.goto("https://cmangam.com", {
    waitUntil: "networkidle2",
  });

  await delay(5);

  for (let siteMapNumber = 1; siteMapNumber <= 48; siteMapNumber++) {
    console.info({ siteMapNumber });
    const data = await getCloudflareData(
      `https://cmangam.com/sitemap_album_${siteMapNumber}.xml`,
      page
    );
    const $ = load(data, { xml: true });
    const urls = $("loc")
      .map((_, el) => $(el).text()) // Extract the text content of each <loc> element
      .get();

    for (const url of urls) {
      const id = last(url.split("-"));
      try {
        if (await collection.findOne({ id })) {
          console.debug(`Skip `, id);
          continue;
        }
        const mangaJsonData = await getCloudflareJsonData<{ info: string }>(
          `https://cmangam.com/api/get_data_by_id?id=${id}&table=album&data=info`,
          page,
          { delay: 3 }
        );
        const mangaInfo = JSON.parse(mangaJsonData.info);
        await collection.updateOne(
          { _id: id as any },
          { $set: { ...mangaInfo, _id: id, id } },
          { upsert: true }
        );
        console.info(`Save manga `, id);
      } catch (error) {
        console.error(error);
        console.error(`Error when save `, id);
      }
    }

    return;
  }
  await browser.close();
};

mongooseWrapper(main);
