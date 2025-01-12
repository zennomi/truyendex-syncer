import { MANGA_SOURCE, MILVUS_COLLECTION_NAME } from "@/constants";
import { MangaDexMangaModel } from "@/models";
import {
  createMangaTitleCollection,
  insertMangaTitleVectors,
  mongooseWrapper,
  normalizeString,
} from "@/utils";

mongooseWrapper(async () => {
  await createMangaTitleCollection();

  let skip = 0;
  const limit = 100;
  while (true) {
    const chunk = await MangaDexMangaModel.find(
      { "altTitles.en": { $regex: "Komi" } },
      {},
      { skip, limit }
    );

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    await Promise.all(
      chunk.map((mangaDoc) => {
        const manga = mangaDoc.toObject();
        const titles = mangaDoc
          .getTitles()
          .map((title) => normalizeString(title));

        return insertMangaTitleVectors(
          titles.map((title, index) => ({
            source: MANGA_SOURCE.MANGADEX,
            sourceId: manga.id,
            title,
            index,
          }))
        );
      })
    );

    skip += limit;
  }
});
