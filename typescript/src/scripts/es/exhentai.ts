import { MANGA_SOURCE } from "@/constants";
import { ExhentaiGalleryModel } from "@/models";
import { mongooseWrapper, normalizeString, removeBrackets } from "@/utils";
import { createMangaTitleIndex, indexMangaTitles } from "@/utils/elasticsearch";

// ts-node -r tsconfig-paths/register src/scripts/es/exhentai.ts

mongooseWrapper(async () => {
  await createMangaTitleIndex();

  let skip = 0;
  const limit = 10000;
  while (true) {
    const chunk = await ExhentaiGalleryModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    await indexMangaTitles(
      chunk.map((mangaDoc) => {
        const manga = mangaDoc.toObject();
        const document = {
          source: MANGA_SOURCE.EXHENTAI,
          sourceId: manga.id,
          titles: [
            manga.title,
            removeBrackets(manga.title),
            normalizeString(manga.title),
          ],
          createdAt: new Date(manga.timestamp),
          isMainStory: manga.tags.includes("language:english"),
        };
        return document;
      })
    );

    skip += limit;
  }
});
