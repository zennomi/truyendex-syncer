import { MANGA_SOURCE } from "@/constants";
import { CuuTruyenMangaModel, MangaDexMangaModel } from "@/models";
import { mongooseWrapper } from "@/utils";
import { searchMangaTitles } from "@/utils/elasticsearch";
import { union } from "lodash";

mongooseWrapper(async () => {
  let skip = 0;
  const limit = 100;

  while (true) {
    const chunk = await CuuTruyenMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) return;
    console.info("Skip ", skip);

    for (const manga of chunk) {
      let result;

      const titles = union([manga.name, ...manga.titles.map((t) => t.name)]);

      for (const title of titles) {
        result = await searchMangaTitles(title);

        if (!result.hits.total || !result.hits.hits[0]) continue;
      }

      if (!result || !result.hits.total || !result.hits.hits[0]) continue;

      const mangadex = await MangaDexMangaModel.findOne({
        id: (result.hits.hits[0]._source as any).sourceId,
      });

      if (!mangadex) continue;

      console.log("Score :", result.hits.max_score);
      console.log("CuuTruyen:");
      console.log(titles);

      console.log("MangaDex:");
      console.log(mangadex.getTitles());

      console.log("======");
    }

    return;

    skip += limit;
  }
});
