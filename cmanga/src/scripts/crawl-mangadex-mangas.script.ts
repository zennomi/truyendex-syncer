import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getMongooseCollection, mongooseWrapper } from "@/utils";
import { last } from "lodash";
import { Manga } from "mangadex-full-api";
const main = async () => {
  const collection = getMongooseCollection(
    MONGODB_COLLECTION_NAME.MANGADEX_MANGA
  );
  //   let latestUpdatedAt = "2018-02-22T03:14:14";
  let latestUpdatedAt = "2018-02-22T03:14:14";
  while (true) {
    console.log(latestUpdatedAt);
    const titles = await Manga.search({
      order: { updatedAt: "asc" },
      contentRating: ["pornographic"],
      updatedAtSince: latestUpdatedAt,
      limit: 100,
    });

    const result = await collection.bulkWrite(
      titles.map((title) => {
        return {
          updateOne: {
            filter: { _id: title.id as any },
            update: { $set: { ...title, tags: title.tags.map((t) => t.id) } },
            upsert: true,
          },
        };
      })
    );
    console.log("insertedCount:", result.insertedCount);
    console.log("upsertedCount:", result.upsertedCount);

    if (titles.length <= 1) break;

    latestUpdatedAt = last(titles)!.updatedAt.toISOString().slice(0, 19);
  }
};

mongooseWrapper(main);
