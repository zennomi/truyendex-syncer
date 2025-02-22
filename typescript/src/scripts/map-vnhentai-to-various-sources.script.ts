import { VnHentaiManga, VnHentaiMangaModel } from "@/models";
import { mongooseWrapper, searchHentag } from "@/utils";
import { searchGoogle } from "@/utils/rapidapi";
import { DocumentType } from "@typegoose/typegoose";

// ts-node -r tsconfig-paths/register src/scripts/map-vnhentai-to-various-sources.script.ts

mongooseWrapper(async () => {
  let skip = 0;

  while (true) {
    const chunk = await VnHentaiMangaModel.find({}, {}, { skip, limit: 1 });

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    try {
      await process(chunk[0]);
    } catch (error) {
      console.error("Error", chunk[0].title);
      console.error(error);
    }

    // return;

    skip += 1;
  }
});

async function process(manga: DocumentType<VnHentaiManga>) {
  const nhentaiUrls = [];
  const nhentaiComUrls = [];
  const exhentaiUrls = [];
  const fakkuUrls = [];
  const irodoriUrls = [];

  // search on hentag
  const { works } = await searchHentag({
    query: manga.title,
    limit: 5,
    ila: "2,1", // english and japanese
  });
  if (works.length > 0) {
    manga.hentagResults = works;
    for (const url of works.map((w) => w.locations).flat()) {
      if (url.startsWith("https://nhentai.net/")) {
        nhentaiUrls.push(url);
      } else if (url.startsWith("https://e-hentai.org/g/")) {
        exhentaiUrls.push(url);
      } else if (
        url.startsWith("https://fakku.net/") ||
        url.startsWith("https://www.fakku.net/")
      ) {
        fakkuUrls.push(url);
      } else if (url.startsWith("https://irodoricomics.com/")) {
        irodoriUrls.push(url);
      }
    }

    manga.hentagData = works[0];
  } else {
    // query by google search

    // skip if seacrching already
    if (manga.googleResults && manga.googleResults.length > 0) return;
    let googleResults;
    let query = "hentai doujinshi " + manga.title;

    // retry if query too long
    while (true) {
      try {
        googleResults = await searchGoogle({
          query: query,
          limit: 20,
        });
        break;
      } catch (error) {
        if (query.length > 60) {
          query = query.slice(0, 60);
          console.info("Retry with shorter query", query);
          continue;
        } else {
          throw error;
        }
      }
    }

    manga.googleResults = googleResults;

    for (const result of googleResults.reverse()) {
      const { link } = result;
      if (link.startsWith("https://nhentai.net/g/")) {
        if (link.match(/nhentai.net\/g\/\d+\/$/)) {
          // ưu tiên các link truyện chính xác
          nhentaiUrls.unshift(link);
        } else {
          nhentaiUrls.push(link);
        }
      } else if (link.startsWith("https://nhentai.com/")) {
        if (link.match(/nhentai.com\/\w+\/comic\/[\w-]+$/)) {
          nhentaiComUrls.unshift(link);
        } else {
          nhentaiComUrls.push(link);
        }
      } else if (link.startsWith("https://e-hentai.org/g/")) {
        if (link.match(/exhentai.org\/g\/\d+\/[\w-]+$/)) {
          exhentaiUrls.unshift(link);
        } else {
          exhentaiUrls.push(link);
        }
      } else if (
        link.startsWith("https://fakku.net/") ||
        link.startsWith("https://www.fakku.net/")
      ) {
        if (link.match(/fakku.net\/hentai\/[\w-]+$/)) {
          fakkuUrls.unshift(link);
        } else {
          fakkuUrls.push(link);
        }
      } else if (link.startsWith("https://irodoricomics.com/")) {
        if (link.match(/irodoricomics.com\/[\w-]+$/)) {
          irodoriUrls.unshift(link);
        } else {
          irodoriUrls.push(link);
        }
      }
    }
  }

  if (nhentaiUrls.length > 0) {
    manga.nhentaiUrl = nhentaiUrls[0];
  }
  if (nhentaiComUrls.length > 0) {
    manga.nhentaiComUrl = nhentaiComUrls[0];
  }
  if (exhentaiUrls.length > 0) {
    manga.exhentaiUrl = exhentaiUrls[0];
  }
  if (fakkuUrls.length > 0) {
    manga.fakkuUrl = fakkuUrls[0];
  }
  if (irodoriUrls.length > 0) {
    manga.irodoriUrl = irodoriUrls[0];
  }

  await manga.save();
  console.info("Update", manga.title);
}
