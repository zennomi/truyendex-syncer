export type SearchGoogleResponse = {
  result: string;
  objects: Array<{
    title: string;
    link: string;
    visible_link: string;
    snippet: string;
  }>;
};

export type HentagSearchResultResponse = {
  page: number;
  pageSize: number;
  total: number;
  works: Array<{
    locations: string[];
    title: string;
    maleTags?: string[];
    femaleTags?: string[];
    parodies?: string[];
    characters?: string[];
    otherTags?: string[];
  }>;
};
