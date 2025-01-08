import { MONGODB_COLLECTION_NAME } from "@/constants";
import {
  getCloudflareJsonData,
  getMongooseCollection,
  mongooseWrapper,
  realBrowser,
} from "@/utils";

const START_ID = 654;
const END_ID = 3000;
const SKIP_EXISTED = true;

const main = async () => {
  const cuuTruyenCollection = getMongooseCollection(
    MONGODB_COLLECTION_NAME.CUUTRUYEN_MANGA
  );

  const { browser, page } = await realBrowser();
  for (let i = START_ID; i <= END_ID; i++) {
    const strId = i.toString();
    if (SKIP_EXISTED) {
      if (await cuuTruyenCollection.findOne({ id: strId })) continue;
    }
    console.info(`Crawling `, strId);
    try {
      const { data: detailedManga } = await getCloudflareJsonData<{
        data: any;
      }>(`https://cuutruyen.net/api/v2/mangas/${strId}`, page);
      if (!detailedManga) {
        console.warn(`Not found `, strId);
        continue;
      }
      await cuuTruyenCollection.updateOne(
        { _id: strId as any },
        { $set: { ...detailedManga, _id: strId, strId } },
        { upsert: true }
      );
    } catch (error) {
      console.error(`Failed at `, strId);
      console.error(error);
    }
  }

  await browser.close();
};

mongooseWrapper(main);
