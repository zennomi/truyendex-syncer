import { MANGA_SOURCE } from "@/constants";
import {
  ExhentaiGalleryModel,
  VnHentaiManga,
  VnHentaiMangaModel,
} from "@/models";
import { mongooseWrapper, normalizeString, removeBrackets } from "@/utils";
import { searchMangaTitles } from "@/utils/elasticsearch";
import { DocumentType } from "@typegoose/typegoose";
import { union } from "lodash";

// ts-node -r tsconfig-paths/register src/scripts/map-vnhentai-to-exhentai.script.ts

mongooseWrapper(async () => {
  let skip = 0;
  const limit = 50;

  while (true) {
    const chunk = await VnHentaiMangaModel.find({}, {}, { skip, limit });

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    await Promise.all(chunk.map((manga) => process(manga)));

    skip += limit;
  }
});

async function process(manga: DocumentType<VnHentaiManga>) {
  const normalizedTitles = [
    manga.title,
    removeBrackets(manga.title),
    normalizeString(manga.title),
  ];
  const result = await findExhentaiByTitles(normalizedTitles);
  if (!result) return;

  manga.refExhentai = result.result;
  await manga.save();

  // to log not sure result
  // if (result.mode !== "match" || result.score >= 40) return;

  // console.log("======");
  // console.log("Score:", result.score);
  // console.log("Mode:", result.mode);
  // console.log("VnHentai:");
  // console.log(normalizedTitles);

  // console.log("Exhentai:");
  // console.log(result.result.title);

  // console.log("======");
}

async function findExhentaiByTitles(titles: string[]) {
  titles = union(titles.map((t) => normalizeString(t)));

  let results = [];

  for (const title of titles) {
    const result = await searchMangaTitles(title, MANGA_SOURCE.EXHENTAI, 33);

    if (!result) continue;

    results.push(result);
  }

  if (results.length === 0) return null;

  results = results.sort((a, b) => (b.hit._score || 0) - (a.hit._score || 0));

  const exhentai = await ExhentaiGalleryModel.findOne({
    id: (results[0].hit._source as any).sourceId,
  });

  if (!exhentai) return null;

  return {
    result: exhentai,
    score: results[0].hit._score || 0,
    mode: results[0].mode,
  };
}
