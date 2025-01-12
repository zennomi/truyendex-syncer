import { CuuTruyenMangaModel, MangaDexMangaModel } from "@/models";
import { mongooseWrapper, normalizeString } from "@/utils";
import { searchMangaTitles } from "@/utils/elasticsearch";
import { union } from "lodash";

mongooseWrapper(async () => {
  let skip = 0;
  const limit = 500;

  while (true) {
    const chunk = await CuuTruyenMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    for (const manga of chunk) {
      let hits = [];

      const titles = union([manga.name, ...manga.titles.map((t) => t.name)]);

      for (const title of titles) {
        const result = await searchMangaTitles(normalizeString(title));

        if (
          !result ||
          !result.hits.total ||
          !result.hits.hits[0] ||
          !result.hits.hits[0]._score
        )
          continue;

        hits.push(result.hits.hits[0]);
      }

      hits = hits.sort((a, b) => (b._score || 0) - (a._score || 0));

      // not sure about this threshold
      if (!hits[0] || !hits[0]._score || hits[0]._score <= 14) continue;

      const mangadex = await MangaDexMangaModel.findOne({
        id: (hits[0]._source as any).sourceId,
      });

      if (!mangadex) continue;

      console.log("Score:", hits[0]._score);
      console.log("CuuTruyen:");
      console.log(titles);

      console.log("MangaDex:");
      console.log(mangadex.getTitles());

      console.log("======");
    }

    skip += limit;
  }
});
