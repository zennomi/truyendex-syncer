import { CuuTruyenMangaModel, MangaDexMangaModel } from "@/models";
import { mongooseWrapper, normalizeString, searchMangaVectors } from "@/utils";
import { searchMangaTitles } from "@/utils/elasticsearch";
import { union } from "lodash";

mongooseWrapper(async () => {
  let skip = 0;
  const limit = 500;

  const result = await searchMangaVectors("Komi");
  console.log(result);
  return;
  while (true) {
    const chunk = await CuuTruyenMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    for (const manga of chunk) {
      let hits = [];

      const titles = union([manga.name, ...manga.titles.map((t) => t.name)]);

      for (const title of titles) {
        const result = await searchMangaVectors(normalizeString(title));

        hits.push(result[0]);
      }

      hits = hits.sort((a, b) => (b.score || 0) - (a.score || 0));

      // not sure about this threshold
      if (!hits[0] || !hits[0].score) continue;

      const mangadex = await MangaDexMangaModel.findOne({
        id: hits[0].sourceId as any,
      });

      if (!mangadex) continue;

      console.log("Score:", hits[0].score);
      console.log("CuuTruyen:");
      console.log(titles);

      console.log("MangaDex:");
      console.log(mangadex.getTitles());

      console.log("======");
    }

    skip += limit;
  }
});
