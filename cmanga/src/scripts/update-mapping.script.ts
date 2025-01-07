import config from "@/config";
import { MangaMapping, MangaMappingModel } from "@/models";
import { mongooseWrapper } from "@/utils";
import axios from "axios";

const main = async () => {
  let skip = 0;
  const limit = 100;

  while (true) {
    const chunk = await MangaMappingModel.find({}, {}, { skip, limit });

    console.info(chunk.length);

    if (chunk.length === 0) return;

    await axios({
      baseURL: config.PROXY_BACKEND_URL,
      url: "/admin/mapping",
      method: "POST",
      data: {
        mappings: chunk.map((mapping) => ({
          mapping: mapping.providers.map((p) => ({
            source: p.providerType.toLowerCase(),
            sourceId: p.sourceId,
          })),
        })),
      },
    });

    skip += limit;
  }
};

mongooseWrapper(main);
