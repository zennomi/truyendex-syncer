import { MONGODB_COLLECTION_NAME } from "@/constants";
import { MangaDexMangaModel } from "@/models";
import {
  getMongooseCollection,
  mongooseWrapper,
  normalizeString,
} from "@/utils";
import { Manga } from "@zennomi/mangadex-full-api";
import { flatten, last, union } from "lodash";
import { backOff } from "exponential-backoff";

const MODE: "full" | "update" = "full";

const main = async () => {
  const collection = getMongooseCollection(
    MONGODB_COLLECTION_NAME.MANGADEX_MANGA
  );
  let cursor =
    MODE === "full"
      ? "2018-01-01T00:00:00" // to start from the beginning
      : (
          await MangaDexMangaModel.findOne({}, {}, { sort: { updatedAt: -1 } })
        )?.updatedAt
          .toISOString()
          .slice(0, 19) || "2018-01-01T00:00:00";
  cursor: while (true) {
    console.log("Cursor: ", cursor);

    const titles = await backOff(
      () =>
        Manga.search({
          order: MODE === "full" ? { createdAt: "asc" } : { updatedAt: "asc" },
          contentRating: ["safe", "suggestive", "erotica", "pornographic"],
          ...(MODE === "full"
            ? { createdAtSince: cursor }
            : { updatedAtSince: cursor }),
          limit: 100,
          includes: ["cover_art"],
        }),
      {
        startingDelay: 1000,
        jitter: "full",
        numOfAttempts: 10,
        retry: (e, attemptNumber) => {
          console.warn(`Attempt ${attemptNumber} failed: ${e.message}`);
          return true;
        },
      }
    );

    const result = await collection.bulkWrite(
      await Promise.all(
        titles.map(async (title) => {
          return {
            updateOne: {
              filter: { _id: title.id as any },
              update: {
                $set: {
                  ...title,
                  normalizedTitles: union(
                    [
                      ...Object.values(title.title),
                      ...flatten(title.altTitles.map((t) => Object.values(t))),
                    ].map((t) => normalizeString(t))
                  ),
                  tags: title.tags.map((t) => t.id),
                  mainCover:
                    title.mainCover && title.mainCover.cached
                      ? await title.mainCover.resolve()
                      : null,
                },
              },
              upsert: true,
            },
          };
        })
      )
    );
    console.log("upsertedCount:", result.upsertedCount);
    console.log("modifiedCount:", result.modifiedCount);

    cursor = last(titles)!
      [MODE === "full" ? "createdAt" : "updatedAt"].toISOString()
      .slice(0, 19);

    if (titles.length <= 1) break cursor;
  }
};

mongooseWrapper(main);
