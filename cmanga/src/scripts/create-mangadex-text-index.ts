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
        const languages = ["en", "ko", "zh", "ja"];
        const document: {
          source: MANGA_SOURCE;
          sourceId: string;
          [key: string]: any;
        } = {
          source: MANGA_SOURCE.MANGADEX,
          sourceId: manga.id,
          titles: [],
        };
        const titles = [manga.title, ...manga.altTitles];

        languages.forEach((lang) => {
          document[`titles_${lang}`] = [];
        });

        titles.forEach((title) => {
          const lang = Object.keys(title)[0];
          let value = Object.values(title)[0];

          if (!languages.includes(lang)) {
            document.titles.push(normalizeString(value));
          } else {
            if (lang === "en") value = normalizeString(value);
            document[`titles_${lang}`].push(value);
          }
        });
        return document;
      })
    );

    skip += limit;
  }
});
