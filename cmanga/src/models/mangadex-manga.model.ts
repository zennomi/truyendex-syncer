import { COLLECTION_NAME } from "@/constants";
import { getModelForClass, modelOptions, Prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false } })
class Title {
  @Prop({ required: false })
  vi?: string;

  @Prop({ required: false })
  ja?: string;

  @Prop({ required: false })
  en?: string;
}

export class MangaDexManga {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: Title;

  @Prop({ required: true })
  altTitles!: Title[];
}

export const MangaDexMangaModel = getModelForClass(MangaDexManga, {
  schemaOptions: { collection: COLLECTION_NAME.MANGADEX_MANGA },
});
