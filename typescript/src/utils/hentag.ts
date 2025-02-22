import { HentagSearchResultResponse } from "@/@types";
import axios from "axios";

export async function searchHentag({
  query,
  limit,
  ila,
}: {
  query: string;
  limit: number;
  ila?: string;
}): Promise<HentagSearchResultResponse> {
  const { data } = await axios({
    url: "https://www.hentag.com/public/api/vault-search",
    method: "GET",
    params: {
      t: query,
      p: 1,
      s: limit,
      ila,
    },
  });

  return data;
}

export function getTagCount(work: HentagSearchResultResponse["works"][0]) {
  return (
    (work.maleTags?.length ?? 0) +
    (work.femaleTags?.length ?? 0) +
    (work.otherTags?.length ?? 0)
  );
}
