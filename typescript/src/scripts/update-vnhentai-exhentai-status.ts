import { VnHentaiManga, VnHentaiMangaModel } from "@/models";
import { mongooseWrapper, proxyAxios } from "@/utils";
import { DocumentType } from "@typegoose/typegoose";
import { isAxiosError } from "axios";

// ts-node -r tsconfig-paths/register src/scripts/update-vnhentai-exhentai-status.ts

mongooseWrapper(async () => {
  let skip = 0;

  while (true) {
    const chunk = await VnHentaiMangaModel.find(
      { exhentaiUrl: { $exists: true } },
      {},
      { skip, limit: 1 }
    );

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    try {
      await process(chunk[0]);
    } catch (error) {
      console.error("Error", chunk[0].title);
      console.error(error);
    }

    // return;

    skip += 1;
  }
});

async function process(manga: DocumentType<VnHentaiManga>) {
  if (!manga.exhentaiUrl) {
    return;
  }

  try {
    await proxyAxios.get(manga.exhentaiUrl);
    manga.exhentaiRemoved = false;
    console.info("Exists", manga.title);
  } catch (error) {
    if (
      isAxiosError(error) &&
      error.response &&
      error.response.status === 404
    ) {
      manga.exhentaiRemoved = true;
      console.info("Removed", manga.title);
    }
  }
  await manga.save();
}
