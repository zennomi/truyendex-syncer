import { MANGA_SOURCE } from "@/constants";
import { CuuTruyenMangaModel } from "@/models";
import { mongooseWrapper, normalizeString } from "@/utils";
import { createMangaTitleIndex, indexMangaTitles } from "@/utils/elasticsearch";

mongooseWrapper(async () => {
  await createMangaTitleIndex();

  let skip = 0;
  const limit = 10000;
  while (true) {
    const chunk = await CuuTruyenMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    await indexMangaTitles(
      chunk.map((mangaDoc) => {
        const manga = mangaDoc.toObject();
        const document = {
          source: MANGA_SOURCE.CUUTRUYEN,
          sourceId: manga.id,
          titles: mangaDoc.getTitles().map((title) => normalizeString(title)),
          createdAt: new Date(manga.created_at),
          isMainStory: true,
        };
        return document;
      })
    );

    skip += limit;
  }
});
