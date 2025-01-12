import { mongooseWrapper, searchMangaVectors } from "@/utils";

mongooseWrapper(async () => {
  const result = await searchMangaVectors("Miss Komi");
  console.log(result);
  return;
});
