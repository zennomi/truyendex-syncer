import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getMongooseCollection, mongooseWrapper } from "@/utils";
import axios from "axios";

// ts-node -r tsconfig-paths/register src/scripts/crawl-tanamoe-titles.script.ts
const main = async () => {
  const tanamoeCollection = getMongooseCollection(
    MONGODB_COLLECTION_NAME.TANAMOE_TITLES
  );
  let page = 1;
  while (true) {
    const { data } = await axios({
      method: "POST",
      url: "https://pb.tana.moe/api/collections/titles/browse",
      params: {
        page: page,
        perPage: 100,
        expand: "defaultRelease.front,format",
      },
      data: {
        sort: "-updated",
        name: "",
        format: {
          kind: "or",
          values: [
            "tt6995wq46wqxkr",
            "8f25aho6twh3t45",
            "dyf4wfbemnsdhdy",
            "ijzvx72ftvfmax4",
            "73hx8goiqg8kqjh",
            "rm1vepkhubfjlen",
            "vwq4nhmnnjtxvwq",
            "tpjqaftrmnfi0qz",
            "ey71xs6rbjif9w6",
            "i9p8scjsqublfua",
            "93rvmcosn7ebo3e",
            "vz3pfyqxbcetgoo",
            "5os9n6rc1d384ya",
            "8bfw9aa2fja0apo",
            "9vvvbl40601g9av",
            "hzkycs0mofc1ls3",
          ],
        },
      },
    });

    if (!data.items || data.items.length === 0) {
      console.info("Done");
      break;
    }

    const result = await tanamoeCollection.bulkWrite(
      await Promise.all(
        data.items.map(async (title: { id: string }) => {
          return {
            updateOne: {
              filter: { _id: title.id as any },
              update: {
                $set: {
                  ...title,
                },
              },
              upsert: true,
            },
          };
        })
      )
    );
    console.info("upsertedCount:", result.upsertedCount);
    console.info("modifiedCount:", result.modifiedCount);
    console.info("insertedCount:", result.insertedCount);

    page++;
  }
};

mongooseWrapper(main);

fetch(
  "https://pb.tana.moe/api/collections/titles/browse?expand=defaultRelease.front%2Cformat&perPage=48&page=2",
  {
    headers: {
      accept: "*/*",
      "accept-language": "en-US",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      Referer: "https://tana.moe/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"name":"","format":{"kind":"or","values":["tt6995wq46wqxkr","8f25aho6twh3t45","dyf4wfbemnsdhdy","ijzvx72ftvfmax4","73hx8goiqg8kqjh","rm1vepkhubfjlen","vwq4nhmnnjtxvwq","tpjqaftrmnfi0qz","ey71xs6rbjif9w6","i9p8scjsqublfua","93rvmcosn7ebo3e","vz3pfyqxbcetgoo","5os9n6rc1d384ya","8bfw9aa2fja0apo","9vvvbl40601g9av","hzkycs0mofc1ls3"]},"demographic":{"kind":"or","values":["7fplll8fvuunau4","tj7c4b2s0daox6c","aklrjvjdgsyvcr8","wv9uyw50bsthbr3","dzmg8yt3mkphg49","0dk3bjci5jhwexz"]},"genres":{"kind":"or","values":["4uarrkkte6a9tso","9vu8nec34mi4y8c","plpsfmj1eukrrjs","u6f8szxa7jp4d6k","9ob1dehmpshpr5z","2gf48ybq6kui977","prfd6urcg66ycno","pl66e80kwvxujvs","df2ryz9jeppr7c0","g0qtx75lxrhptlw","lgfn95w4qi5uehx","srdcbureda0zpik","m2hi1on6g1u7g6l","l0jx8vkhgopozqs","txx3obf5uhlyu8d","521ud0fieaag2m4","5f7d5pynuo4vd5g","qnf1hbe510s5ojx","piq5xr0petmkva4","wt93b4bl2ptp1lc"]},"sort":""}',
    method: "POST",
  }
);
