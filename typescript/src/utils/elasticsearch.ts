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

export async function bulkInsert(index: string, documents: any[]) {
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
              type: "nested", // Treat each array element as a nested document
              properties: {
                title: { type: "text" },
              },
            },
            isMainStory: {
              type: "boolean",
            },
            source: {
              type: "keyword",
            },
            sourceId: {
              type: "keyword",
            },
            createdAt: {
              type: "date",
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
  titles: string[];
  createdAt: Date;
  isMainStory: boolean;
}) {
  return indexDocument(
    ES_INDEX_NAME.MANGA_TITLE,
    `${document.source}-${document.sourceId}`,
    {
      titles: document.titles.map((title) => ({ title })),
      source: document.source,
      sourceId: document.sourceId,
      createdAt: document.createdAt,
      isMainStory: document.isMainStory,
    }
  );
}

export async function indexMangaTitles(
  documents: {
    source: MANGA_SOURCE;
    sourceId: string;
    titles: string[];
    createdAt: Date;
    isMainStory: boolean;
  }[]
) {
  return bulkInsert(
    ES_INDEX_NAME.MANGA_TITLE,
    documents.map((doc) => ({
      _id: `${doc.source}-${doc.sourceId}`,
      titles: doc.titles.map((title) => ({ title })),
      source: doc.source,
      sourceId: doc.sourceId,
      createdAt: doc.createdAt,
      isMainStory: doc.isMainStory,
    }))
  );
}

export async function searchMangaTitles(
  query: string,
  source?: MANGA_SOURCE,
  threhold = 33
) {
  // phrase case
  let result = await elasticClient.search({
    index: ES_INDEX_NAME.MANGA_TITLE,
    query: source
      ? {
          bool: {
            must: [
              {
                nested: {
                  path: "titles",
                  query: {
                    match_phrase: {
                      "titles.title": query,
                    },
                  },
                  score_mode: "max",
                },
              },
            ],
            filter: [
              {
                term: {
                  source: source,
                },
              },
            ],
          },
        }
      : {
          nested: {
            path: "titles",
            query: {
              match_phrase: {
                "titles.title": query,
              },
            },
            score_mode: "max", // Use the best score from any array element
          },
        },
    sort: [{ _score: { order: "desc" } }, { createdAt: { order: "desc" } }],
    size: 1,
  });
  if (result.hits.hits.length > 0) {
    return { hit: result.hits.hits[0], mode: "match_phrase" };
  }

  // match
  result = await elasticClient.search({
    index: ES_INDEX_NAME.MANGA_TITLE,
    query: source
      ? {
          bool: {
            must: [
              {
                nested: {
                  path: "titles",
                  query: {
                    match: {
                      "titles.title": query,
                    },
                  },
                  score_mode: "max", // Use the best score from any array element
                },
              },
            ],
            filter: [
              {
                term: {
                  source: source,
                },
              },
            ],
          },
        }
      : {
          nested: {
            path: "titles",
            query: {
              match: {
                "titles.title": query,
              },
            },
            score_mode: "max", // Use the best score from any array element
          },
        },
    explain: true,
    sort: [{ _score: { order: "desc" } }, { createdAt: { order: "desc" } }],
    size: 1,
  });

  if (result.hits.hits.length > 0) {
    if (!result.hits.hits[0]._score || result.hits.hits[0]._score <= threhold)
      return null;

    const analyzeResult = await elasticClient.indices.analyze({
      index: ES_INDEX_NAME.MANGA_TITLE,
      text: query,
      tokenizer: "standard",
      filter: ["lowercase", "asciifolding", "unique"],
    });

    const tokenCount = analyzeResult.tokens?.length || 1;

    if (
      tokenCount -
        (result.hits.hits[0]._explanation?.details[0].details?.length || 0) <=
      3
    ) {
      return { hit: result.hits.hits[0], mode: "match" };
    }

    return null;
  }
}
