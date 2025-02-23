import { mongooseWrapper } from "@/utils";
import { getAuthenticatedClient } from "../utils";
import { createItems, readItems } from "@directus/sdk";
import { MangaDexMangaModel } from "@/models";

mongooseWrapper(async () => {
  const client = await getAuthenticatedClient();

  let skip = 0;
  const limit = 50;

  while (true) {
    console.info("Skip: ", skip);
    const mangas = (await MangaDexMangaModel.find({}, {}, { limit, skip })).map(
      (manga) => manga.toObject()
    );

    if (mangas.length === 0) {
      console.info("Done");
      break;
    }

    const existed = await client.request(
      readItems("title_variant", {
        filter: {
          source: { _eq: "mangadex" },
          source_id: { _in: mangas.map((manga) => manga._id) },
        },
        limit,
      })
    );

    const existedIds = existed.map((item) => item.source_id);

    const insertMangas = mangas.filter(
      (manga) => !existedIds.includes(manga._id)
    );

    if (insertMangas.length > 0) {
      const titleItems = insertMangas.map((manga) => ({
        name: Object.values(manga.title)[0],
        image: manga.mainCover
          ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.mainCover.fileName}`
          : null,
        status: "published",
        other_names: manga.altTitles.map((t) => Object.values(t)[0]),
      }));

      const titleVariantItems = insertMangas.map((manga, index) => ({
        status: "published",
        name: Object.values(manga.title)[0],
        other_names: manga.altTitles.map((t) => Object.values(t)[0]),
        image: manga.mainCover
          ? `https://uploads.mangadex.org/covers/${manga.id}/${manga.mainCover.fileName}`
          : null,
        raw_data: manga,
        source: "mangadex",
        source_id: manga._id,
        title: titleItems[index],
      }));

      const titleVariants = await client.request(
        createItems("title_variant", titleVariantItems)
      );

      console.log("Inserted: ", titleVariants.length);
    }
    skip += mangas.length;
  }
});
