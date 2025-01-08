import { ES_INDEX_NAME, MANGA_SOURCE } from "@/constants";
import { Client } from "@elastic/elasticsearch";
import config from "@/config";
import { omit } from "lodash";

export const elasticClient = new Client({
  node: config.ELASTICSEARCH_NODE,
  auth: {
    username: config.ELASTICSEARCH_USERNAME,
    password: config.ELASTICSEARCH_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function createIndex(index: string): Promise<void> {
  const exists = await elasticClient.indices.exists({ index });
  if (!exists) {
    await elasticClient.indices.create({ index });
    console.log(`Index "${index}" created.`);
  }
}

async function indexDocument<T>(index: string, id: string, document: T) {
  return await elasticClient.index({
    index,
    id,
    document,
  });
}

async function bulkInsert(index: string, documents: any[]) {
  // Prepare the bulk request body
  const operations = documents.flatMap((doc) => [
    { index: { _index: index, _id: doc._id } }, // Action to index the document
    omit(doc, ["_id"]), // The document itself
  ]);

  return await elasticClient.bulk({ operations });
}

async function search<T>(
  index: string,
  query: Record<string, unknown>
): Promise<T[]> {
  const result = await elasticClient.search({
    index,
    query,
  });
  return result.hits.hits.map((hit: any) => hit._source as T);
}

export async function createMangaTitleIndex(): Promise<void> {
  const exists = await elasticClient.indices.exists({
    index: ES_INDEX_NAME.MANGA_TITLE,
  });
  if (!exists) {
    await elasticClient.indices.create({
      index: ES_INDEX_NAME.MANGA_TITLE,
      body: {
        mappings: {
          properties: {
            titles: {
              type: "text",
            },
            titles_en: {
              type: "text",
              analyzer: "english",
            },
            titles_ko: {
              type: "text",
              analyzer: "nori",
            },
            titles_zh: {
              type: "text",
              analyzer: "smartcn",
            },
            titles_ja: {
              type: "text",
              analyzer: "kuromoji",
            },
          },
        },
      },
    });
    console.info(`Create index "${ES_INDEX_NAME.MANGA_TITLE}".`);
  }
}

export async function indexMangaTitle(document: {
  source: MANGA_SOURCE;
  sourceId: string;
  titles?: string[];
  titles_vi?: string[];
  titles_en?: string[];
  titles_ko?: string[];
  titles_zh?: string[];
  titles_ja?: string[];
}) {
  return indexDocument(
    ES_INDEX_NAME.MANGA_TITLE,
    `${document.source}-${document.sourceId}`,
    document
  );
}

export async function indexMangaTitles(
  documents: {
    source: MANGA_SOURCE;
    sourceId: string;
    titles?: string[];
    titles_vi?: string[];
    titles_en?: string[];
    titles_ko?: string[];
    titles_zh?: string[];
    titles_ja?: string[];
  }[]
) {
  return bulkInsert(
    ES_INDEX_NAME.MANGA_TITLE,
    documents.map((doc) => ({ _id: `${doc.source}-${doc.sourceId}`, ...doc }))
  );
}

export async function searchMangaTitles(query: string) {
  return await elasticClient.search({
    index: ES_INDEX_NAME.MANGA_TITLE,
    query: {
      multi_match: {
        query: query,
        fields: ["titles*"],
        type: "phrase",
      },
    },
  });
}
