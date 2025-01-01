import mongoose from "mongoose";
import {
  getJsonData,
  mongooseWrapper,
  parseJsonFromPage,
  realBrowser,
} from "@/utils";

// sudo apt-get install xvfb
// warp
const main = async () => {
  const db = mongoose.connection;

  const collection = db.collection("cmanga_mangas");

  const { browser, page } = await realBrowser();

  let paramsPage = 1;
  const limit = 1000;
  while (true) {
    // Extract the JSON content
    const jsonData = await getJsonData<{
      data: { id_album: string; info: string }[];
      total: number;
    }>(
      `https://cmangam.com/api/home_album_list?file=image&num_chapter=0&sort=update&type=new&tag=all&limit=${limit}&page=${paramsPage}`,
      page
    );

    const result = await collection.bulkWrite(
      jsonData.data
        .map((manga) => JSON.parse(manga.info))
        .map((mangaInfo: { id: number }) => ({
          updateOne: {
            filter: { _id: mangaInfo.id as any },
            update: { $set: { ...mangaInfo, _id: mangaInfo.id } },
            upsert: true,
          },
        }))
    );
    console.log("insertedCount:", result.insertedCount);
    console.log("upsertedCount:", result.upsertedCount);

    if (limit * paramsPage > jsonData.total) break;

    paramsPage++;
  }
  await browser.close();
};

mongooseWrapper(main);
