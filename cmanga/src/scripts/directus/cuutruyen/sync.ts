import { mongooseWrapper } from "@/utils";
import { getAuthenticatedClient } from "../utils";
import { createItems, readItems } from "@directus/sdk";
import { CuuTruyenMangaModel } from "@/models";

mongooseWrapper(async () => {
  const client = await getAuthenticatedClient();

  let skip = 0;
  const limit = 100;

  while (true) {
    console.info("Skip: ", skip);
    const mangas = (
      await CuuTruyenMangaModel.find({}, {}, { limit, skip })
    ).map((manga) => manga.toObject());

    if (mangas.length === 0) {
      console.info("Done");
      break;
    }

    const existed = await client.request(
      readItems("title_variant", {
        filter: {
          source: { _eq: "cuutruyen" },
          source_id: { _in: mangas.map((manga) => manga._id) },
        },
        limit,
      })
    );

    const existedIds = existed.map((item) => item.source_id);

    const insertMangas = mangas.filter(
      (manga) => !existedIds.includes(manga._id)
    );

    const titleVariantItems = insertMangas.map((manga) => ({
      status: "published",
      name: manga.name,
      other_names: manga.titles.map((t) => t.name),
      image: manga.cover_url,
      raw_data: manga,
      source: "cuutruyen",
      source_id: manga._id,
    }));

    const titleVariants = await client.request(
      createItems("title_variant", titleVariantItems)
    );

    console.log("Inserted: ", titleVariants.length);

    skip += mangas.length;
  }
});
