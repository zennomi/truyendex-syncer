import mongoose from "mongoose";
import { connect } from "puppeteer-real-browser";
import config from "@/config";

mongoose
  .connect(
    `mongodb://${config.MONGO_USERNAME}:${config.MONGO_PASSWORD}@${config.MONGO_HOST}:${config.MONGO_PORT}/${config.MONGO_DATABASE}`
  )
  .then(() => {
    console.info("Mongo connected");

    main();
  });

// sudo apt-get install xvfb
// warp
const main = async () => {
  const db = mongoose.connection;

  const collection = db.collection("cmanga_mangas");

  const { browser, page } = await connect({
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

  // Set an arbitrary large viewport to fit all data
  await page.setViewport({
    width: 1920,
    height: 5000, // Large height to contain all rows
  });
  let paramsPage = 1;
  const limit = 1000;
  while (true) {
    await page.goto(
      `https://cmangam.com/api/home_album_list?file=image&num_chapter=0&sort=update&type=new&tag=all&limit=${limit}&page=${paramsPage}`,
      {
        waitUntil: "networkidle2",
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Extract the JSON content
    const jsonData = (await page.evaluate(() => {
      return JSON.parse(document.body.innerText);
    })) as {
      data: { id_album: string; info: string }[];
      total: number;
    };

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
