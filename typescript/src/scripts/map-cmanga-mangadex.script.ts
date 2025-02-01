import {
  CmangaMangaModel,
  MangaDexMangaModel,
  MangaMappingModel,
} from "@/models";
import { mongooseWrapper } from "@/utils";

const main = async () => {
  const mappings = await MangaMappingModel.find();

  for (const mapping of mappings) {
    const mangadexMangas = await MangaDexMangaModel.find({
      id: {
        $in: mapping.providers
          .filter((m) => m.providerType === "MANGADEX")
          .map((m) => m.sourceId),
      },
    });

    const cmangaMangas = await CmangaMangaModel.find({
      id: {
        $in: mapping.providers
          .filter((m) => m.providerType === "CMANGA")
          .map((m) => m.sourceId),
      },
    });
    console.log("MangaDex:");
    console.log(
      mangadexMangas
        .map((m) => m.toObject())
        .map((m) => [
          ...Object.values(m.title),
          ...m.altTitles.map((t) => Object.values(t)),
        ])
    );
    console.log("Cmanga:");
    console.log(
      cmangaMangas
        .map((m) => m.toObject())
        .map((m) => [m.name, ...m.name_other])
    );
    console.log("======");
  }
};

mongooseWrapper(main);
