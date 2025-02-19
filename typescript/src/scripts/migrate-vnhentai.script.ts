import { VnHentaiMangaModel } from "@/models";
import { mongooseWrapper } from "@/utils";
import * as fs from "fs";
import * as path from "path";

// ts-node -r tsconfig-paths/register src/scripts/migrate-vnhentai.script.ts

const directoryPath = "/Users/zennomi/Downloads/vnhentai";

function getDirectories(source: string): string[] {
  return fs.readdirSync(source).filter((name) => {
    return fs.statSync(path.join(source, name)).isDirectory();
  });
}

function getNestedDirectories(
  source: string
): { folder: string; title: string }[] {
  const parentFolders = getDirectories(source);
  const nestedFolders: { folder: string; title: string }[] = [];

  parentFolders.forEach((parent) => {
    const childFolders = getDirectories(path.join(source, parent));
    childFolders.forEach((child) => {
      nestedFolders.push({ folder: parent, title: child });
    });
  });

  return nestedFolders;
}

const nestedFolderNames = getNestedDirectories(directoryPath);

mongooseWrapper(async () => {
  const result = await VnHentaiMangaModel.bulkWrite(
    nestedFolderNames.map((gallery) => {
      const id = gallery.folder + "/" + gallery.title;
      return {
        updateOne: {
          filter: { _id: id as any },
          update: {
            $set: { ...gallery, id },
          },
          upsert: true,
        },
      };
    })
  );

  console.log("upsertedCount:", result.upsertedCount);
  console.log("modifiedCount:", result.modifiedCount);
  console.log("insertedCount:", result.insertedCount);
});
