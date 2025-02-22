import { VnHentaiManga, VnHentaiMangaModel } from "@/models";
import { addTextToImage, mongooseWrapper, zipFolder } from "@/utils";
import { DocumentType } from "@typegoose/typegoose";
import { promises as fs } from "fs";
import path from "path";
import { createNewGallery, reorderGellery } from "./utils";
import { randomInt } from "crypto";

// ts-node -r tsconfig-paths/register src/scripts/exhentai/upload-vnhentai.script.ts
mongooseWrapper(async () => {
  if (!process.env.VIHENTAI_PATH) throw new Error("VIHENTAI_PATH not found");
  let skip = 0;

  while (true) {
    const chunk = await VnHentaiMangaModel.find(
      {
        fakkuUrl: null,
        irodoriUrl: null,
        exhentaiRemoved: { $ne: true },
        ulgid: null,
        refExhentai: null,
      },
      {},
      { skip, limit: 1 }
    );

    if (chunk.length === 0) {
      console.info("Done");
      return;
    }
    console.info("Skip ", skip);

    try {
      await processManga(chunk[0]);
    } catch (error) {
      console.error("Error", chunk[0].title);
      console.error(error);
    }

    // return;

    skip += 1;
  }
});

async function processManga(manga: DocumentType<VnHentaiManga>) {
  const sourcePath = path.join(
    process.env.VIHENTAI_PATH!,
    manga.folder,
    manga.title
  );

  // filter image
  const files = await fs.readdir(sourcePath);
  const images = files.filter((file) => /\.(jpe?g|png|gif)$/i.test(file));

  const copiedSourcePath = path.join(sourcePath, "copied_images");

  await fs.mkdir(copiedSourcePath, { recursive: true });

  for (const image of images) {
    const sourceImagePath = path.join(sourcePath, image);
    const destImagePath = path.join(copiedSourcePath, image);
    await fs.copyFile(sourceImagePath, destImagePath);
  }

  // add credit

  const selectedImages = [];
  for (let i = 1; i < images.length; i += 10) {
    const end = Math.min(i + 10, images.length);
    const randomIndex = Math.floor(Math.random() * (end - i)) + i;
    selectedImages.push(images[randomIndex]);
  }

  for (const image of selectedImages) {
    await addTextToImage({
      imagePath: path.join(copiedSourcePath, image),
      text: "@zennomi",
      outputPath: path.join(copiedSourcePath, image),
      x: randomInt(0, 50),
      y: randomInt(0, 50),
    });
  }

  // zip folder
  const zipPath = path.join(
    process.env.VIHENTAI_PATH!,
    manga.folder,
    manga.title + ".zip"
  );

  await zipFolder(copiedSourcePath, zipPath);

  const { ulgid } = await createNewGallery({
    title: fixTitle(manga.title),
    folder: manga.folder,
    zipPath: zipPath,
    ulcomment: `htvn::${path.join(manga.folder, manga.title)}`,
  });

  // clean
  console.debug(`Delete ${zipPath} and ${copiedSourcePath}`);
  await fs.rm(copiedSourcePath, { recursive: true });
  await fs.unlink(zipPath);

  await reorderGellery({ ulgid, autosort: "natural" });

  manga.ulgid = ulgid;
  await manga.save();
}

function fixTitle(title: string) {
  title = title.replace(/English/g, "Vietnamese");
  title = title.replace(/fakku!/gi, "");
  title = title.replace(/fakku/gi, "");
  title = title.replace(/irodori comics/gi, "");
  title = title.replace(/irodori/gi, "");
  title = title.replace(/\(\)/g, "");
  title = title.replace(/\[\]/g, "");
  return title;
}
