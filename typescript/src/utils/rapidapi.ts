import { SearchGoogleResponse } from "@/@types";
import config from "@/config";
import axios from "axios";

export async function searchGoogle({
  query,
  limit,
}: {
  query: string;
  limit?: number;
}) {
  const response = await axios.request<SearchGoogleResponse | string>({
    method: "GET",
    url: "https://google-search95.p.rapidapi.com/googlesearch.php",
    params: {
      query: query,
      lang: "en",
      offset: "0",
      domain: "com",
      device: "Desktop",
      results: limit ?? "10",
      country: "US",
    },
    headers: {
      "x-rapidapi-key": config.RAPIDAPI_KEY,
      "x-rapidapi-host": "google-search95.p.rapidapi.com",
    },
  });

  if (typeof response.data === "string") {
    throw new Error(response.data);
  }

  return response.data.objects;
}
