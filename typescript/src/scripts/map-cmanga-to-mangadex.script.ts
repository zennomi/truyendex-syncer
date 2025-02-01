import { CmangaManga, CmangaMangaModel, MangaDexMangaModel } from "@/models";
import { mongooseWrapper, normalizeString } from "@/utils";
import { searchMangaTitles } from "@/utils/elasticsearch";
import { DocumentType } from "@typegoose/typegoose";
import { union } from "lodash";
import { mapMultiple } from "./directus/utils";

mongooseWrapper(async () => {
  let skip = 0;
  const limit = 1;

  while (true) {
    const chunk = await CmangaMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    const maps = await Promise.all(chunk.map((manga) => process(manga)));

    await mapMultiple(maps.filter((m) => !!m));
    return;
    skip += limit;
  }
});

async function process(manga: DocumentType<CmangaManga>) {
  // handle source
  if (manga.source.startsWith("MangaDex ")) {
    const mangadexId = manga.source.split(" ")[1];
    const mangadexManga = await MangaDexMangaModel.findById(mangadexId);
    if (mangadexManga) {
      return {
        from: { source: "mangadex", sourceId: mangadexId },
        to: { source: "cmanga", sourceId: manga.id },
        exact: true,
      };
    }
  }
  const normalizedTitles = [manga.name, ...manga.name_other];
  const result = await findMangaDexMangaByTitles(normalizedTitles);
  if (!result) return;

  return {
    from: { source: "mangadex", sourceId: result.result.id },
    to: { source: "cmanga", sourceId: manga.id },
    exact: result.mode === "exact" || result.mode === "match_phrase",
  };

  // to log not sure result
  //   if (result.mode !== "match" || result.score >= 40) return;

  //   console.log("======");
  //   console.log("Score:", result.score);
  //   console.log("Mode:", result.mode);
  //   console.log("CManga:");
  //   console.log(normalizedTitles);

  //   console.log("MangaDex:");
  //   console.log(result.result.getTitles());

  //   console.log("======");
}

async function findMangaDexMangaByTitles(titles: string[]) {
  titles = union(titles.map((t) => normalizeString(t)));

  // exacly case
  const mangadexManga = await MangaDexMangaModel.findOne(
    {
      normalizedTitles: { $in: titles },
    },
    {},
    { sort: { createdAt: -1 } }
  );

  if (mangadexManga)
    return { result: mangadexManga, score: 100, mode: "exact" };

  let results = [];

  for (const title of titles) {
    const result = await searchMangaTitles(title);

    if (!result) continue;

    results.push(result);
  }

  if (results.length === 0) return null;

  results = results.sort((a, b) => (b.hit._score || 0) - (a.hit._score || 0));

  const mangadex = await MangaDexMangaModel.findOne({
    id: (results[0].hit._source as any).sourceId,
  });

  if (!mangadex) return null;

  return {
    result: mangadex,
    score: results[0].hit._score || 0,
    mode: results[0].mode,
  };
}
