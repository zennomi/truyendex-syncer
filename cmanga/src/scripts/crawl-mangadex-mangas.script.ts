import { getMongooseCollection, mongooseWrapper } from "@/utils";
import { last } from "lodash";
import { Manga } from "mangadex-full-api";
const main = async () => {
  const collection = getMongooseCollection("mangadex_mangas");
  //   let latestCreatedAt = "2018-02-22T03:14:14";
  let latestCreatedAt = "2018-02-22T03:14:14";
  while (true) {
    console.log(latestCreatedAt);
    const titles = await Manga.search({
      order: { createdAt: "asc" },
      contentRating: ["pornographic"],
      createdAtSince: latestCreatedAt,
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

    latestCreatedAt = last(titles)!.createdAt.toISOString().slice(0, 19);
  }
};

mongooseWrapper(main);
