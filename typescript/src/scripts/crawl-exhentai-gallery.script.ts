import axios from "axios";
import { load } from "cheerio";

import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getMongooseCollection, mongooseWrapper } from "@/utils";
import { last } from "lodash";
import { HttpsProxyAgent } from "https-proxy-agent";
import config from "@/config";

const instance = axios.create({
  httpsAgent: new HttpsProxyAgent(config.ROTATING_PROXY_URL),
  headers: {
    cookie: `sl=dm_2`,
  },
});

mongooseWrapper(async () => {
  const collection = getMongooseCollection(
    MONGODB_COLLECTION_NAME.EXHENTAI_GALLERY
  );

  let cursor = "";

  while (true) {
    console.log("Cursor: ", cursor);
    const { data } = await instance({
      url:
        `https://e-hentai.org/?f_cats=1021&f_search=language%3Aenglish+&advsearch=1` +
        (cursor ? `&next=${cursor}` : ""),
    });

    const $ = load(data);

    const $rows = $("table.itg > tbody > tr");

    if (!$rows.length) {
      break;
    }

    console.log("Found rows: ", $rows.length);

    const galleries = [];
    for (const row of $rows.toArray()) {
      const $ = load(row);
      if ($("td.gl1e").length !== 1) continue;
      const url = $("td.gl1e a").attr("href");
      if (!url) continue;
      const [id, token] = url.split("/").slice(-3).slice(0, 2);
      const thumbnail = $("td.gl1e img").attr("src");
      const galleryType = $(".gl3e .cn.ct2").text().trim();
      const timestampText = $('.gl3e div[id^="posted_"]').text().trim();
      const timestamp = new Date(timestampText + " UTC");
      const irPosition = extractPosition($(".gl3e .ir").attr("style"));
      const star = irPosition
        ? 5 + irPosition.x / 16 + (irPosition.y === -1 ? 0 : -0.5)
        : 0;
      const uploader = $('.gl3e a[href^="https://e-hentai.org/uploader"]')
        .text()
        .trim();
      const totalPages = parseInt(
        $('.gl3e div:contains("pages")').text().replace(/\D/g, ""),
        10
      );
      const title = $(".gl4e .glink").text().trim();
      const tags = $(".gl4e .gtl, .gl4e .gt")
        .map((i, el) => $(el).attr("title"))
        .get();

      const data = {
        _id: id,
        id,
        token,
        thumbnail,
        galleryType,
        timestamp,
        star,
        uploader,
        totalPages,
        title,
        tags,
      };

      galleries.push(data);
    }

    const result = await collection.bulkWrite(
      galleries.map((gallery) => ({
        updateOne: {
          filter: { _id: gallery.id as any },
          update: {
            $set: { ...gallery },
          },
          upsert: true,
        },
      }))
    );

    console.log("upsertedCount:", result.upsertedCount);
    console.log("modifiedCount:", result.modifiedCount);
    console.log("insertedCount:", result.insertedCount);

    cursor = last(galleries)!.id;
  }
});

const extractPosition = (str: string | undefined) => {
  if (!str) return null;
  const match = str.match(/background-position:\s*(-?\d+)px\s*(-?\d+)px/);
  return match
    ? { x: parseInt(match[1], 10), y: parseInt(match[2], 10) }
    : null;
};
