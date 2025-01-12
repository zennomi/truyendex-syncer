import config from "@/config";
import { MANGA_SOURCE, MILVUS_COLLECTION_NAME } from "@/constants";
import { DataType, MilvusClient } from "@zilliz/milvus2-sdk-node";
import { getEmbeddings } from "./embedding";

// Initialize Milvus client
export const milvusClient = new MilvusClient({
  address: config.MILVUS_ADDRESS,
});

export async function createCollection(collectionName: string) {
  if (
    (
      await milvusClient.hasCollection({ collection_name: collectionName })
    ).value.valueOf()
  ) {
    return;
  }
  await milvusClient.createCollection({
    collection_name: collectionName,
    dimension: 512,
    metric_type: "L2",
  });
}

export async function createMangaTitleCollection() {
  if (
    (
      await milvusClient.hasCollection({
        collection_name: MILVUS_COLLECTION_NAME.MANGA_TITLE,
      })
    ).value.valueOf() === true
  ) {
    return;
  }
  console.info("Creating manga title collection");
  await milvusClient.createCollection({
    collection_name: MILVUS_COLLECTION_NAME.MANGA_TITLE,
    dimension: 512,
    metric_type: "L2",
  });
}

function replaceHyphen(str: string) {
  return str.replace(/-/g, "_");
}

export async function insertMangaTitleVectors(
  rawData: {
    source: MANGA_SOURCE;
    sourceId: string;
    title: string;
    index: number;
  }[]
) {
  const vectors = await getEmbeddings(rawData.map((v) => v.title));
  const data = rawData.map((v, i) => ({
    id: replaceHyphen(`${v.source}_${v.sourceId}_${v.index}`),
    vector: vectors[i],
    sourceId: v.sourceId,
    source: v.source,
    title: v.title,
  }));

  const insertRes = await milvusClient.insert({
    collection_name: MILVUS_COLLECTION_NAME.MANGA_TITLE,
    data,
  });

  if (!insertRes.IDs)
    throw new Error(`Insert vector failed: ${insertRes.status.reason}`);

  return insertRes;
}

export async function searchMangaVectors(query: string) {
  const [vector] = await getEmbeddings([query]);

  const { results } = await milvusClient.search({
    collection_name: MILVUS_COLLECTION_NAME.MANGA_TITLE,
    vectors: [vector],
    limit: 2,
    output_fields: ["sourceId", "source", "title"],
  });

  return results;
}
