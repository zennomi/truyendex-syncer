import { mongooseWrapper } from "@/utils";
import { getAuthenticatedClient } from "../utils";
import { createItems, readItems } from "@directus/sdk";
import { TanamoeTitleModel } from "@/models";

// ts-node -r tsconfig-paths/register src/scripts/directus/sync/tanamoe.ts
mongooseWrapper(async () => {
  const client = await getAuthenticatedClient();

  let skip = 0;
  const limit = 100;

  while (true) {
    console.info("Skip: ", skip);
    const mangas = (await TanamoeTitleModel.find({}, {}, { limit, skip })).map(
      (manga) => manga.toObject()
    );

    if (mangas.length === 0) {
      console.info("Done");
      break;
    }

    const existed = await client.request(
      readItems("title_variant", {
        filter: {
          source: { _eq: "tanamoe" },
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
      other_names:
        manga.expand?.["additionalTitleNames(title)"]?.map(
          (title) => title.name
        ) || null,
      image: manga?.defaultRelease?.front?.resizedImage?.["640w"]
        ? "https://image.tana.moe/" +
          manga.defaultRelease.front.resizedImage["640w"]
        : "",
      raw_data: manga,
      source: "tanamoe",
      source_id: manga._id,
    }));

    const titleVariants = await client.request(
      createItems("title_variant", titleVariantItems)
    );

    console.log("Inserted: ", titleVariants.length);

    skip += mangas.length;
  }
});
