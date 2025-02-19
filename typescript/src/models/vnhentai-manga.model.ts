import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getModelForClass, Prop } from "@typegoose/typegoose";

export class VnHentaiManga {
  @Prop({ required: true })
  _id!: string; // folder + title

  @Prop({ required: true })
  id!: string; // folder + title

  @Prop({ required: true })
  folder!: string;

  @Prop({ required: true })
  title!: string;
}

export const VnHentaiMangaModel = getModelForClass(VnHentaiManga, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.VNHENTAI_MANGA },
});
