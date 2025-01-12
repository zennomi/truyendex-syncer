import { MANGA_SOURCE } from "@/constants";
import { MangaDexMangaModel } from "@/models";
import { mongooseWrapper, normalizeString } from "@/utils";
import { createMangaTitleIndex, indexMangaTitles } from "@/utils/elasticsearch";

mongooseWrapper(async () => {
  await createMangaTitleIndex();

  let skip = 0;
  const limit = 10000;
  while (true) {
    const chunk = await MangaDexMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    await indexMangaTitles(
      chunk.map((mangaDoc) => {
        const manga = mangaDoc.toObject();
        const document = {
          source: MANGA_SOURCE.MANGADEX,
          sourceId: manga.id,
          titles: mangaDoc.getTitles().map((title) => normalizeString(title)),
          isMainStory:
            mangaDoc.relatedManga.main_story.length === 0 &&
            mangaDoc.relatedManga.based_on.length === 0 &&
            !mangaDoc.tags.includes("b13b2a48-c720-44a9-9c77-39c9979373fb"), // doujinshi tag
          createdAt: manga.createdAt,
        };
        return document;
      })
    );

    skip += limit;
  }
});
