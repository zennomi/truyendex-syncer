import mongoose from "mongoose";
import {
  delay,
  getCloudflareJsonData,
  mongooseWrapper,
  realBrowser,
} from "@/utils";
import { MONGODB_COLLECTION_NAME } from "@/constants";

// sudo apt-get install xvfb
// warp
const main = async () => {
  const db = mongoose.connection;

  const collection = db.collection(MONGODB_COLLECTION_NAME.CMANGA_MANGA);

  const { browser, page } = await realBrowser();

  await page.goto("https://cmangam.com", {
    waitUntil: "networkidle2",
  });

  await delay(5);

  let paramsPage = 1;
  const limit = 1000;
  while (true) {
    // Extract the JSON content
    const jsonData = await getCloudflareJsonData<{
      data: { id_album: string; info: string }[];
      total: number;
    }>(
      `https://cmangam.com/api/home_album_list?file=image&num_chapter=0&sort=update&type=new&tag=all&limit=${limit}&page=${paramsPage}`,
      page
    );

    const result = await collection.bulkWrite(
      jsonData.data
        .map((manga) => JSON.parse(manga.info))
        .map((mangaInfo: { id: number }) => {
          const id = mangaInfo.id.toString();
          return {
            updateOne: {
              filter: { _id: id as any },
              update: { $set: { ...mangaInfo, _id: id, id } },
              upsert: true,
            },
          };
        })
    );
    console.log("insertedCount:", result.insertedCount);
    console.log("upsertedCount:", result.upsertedCount);
    console.log("modifiedCount:", result.modifiedCount);

    if (limit * paramsPage > jsonData.total) break;

    paramsPage++;
  }
  await browser.close();
};

mongooseWrapper(main);
