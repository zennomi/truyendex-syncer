import * as fs from "fs";
import archiver from "archiver";

export const zipFolder = (sourceFolder: string, outputZip: string) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputZip);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () =>
      resolve({ bytes: archive.pointer(), path: outputZip })
    );
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    archive.finalize();
  });
};
