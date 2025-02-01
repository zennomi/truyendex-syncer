import { getAuthenticatedClient } from "./utils";
import { deleteItems } from "@directus/sdk";

(async () => {
  const client = await getAuthenticatedClient();
  while (true) {
    const result = await client.request(deleteItems("title", { limit: 1000 }));
    console.log(result);
  }
})();
