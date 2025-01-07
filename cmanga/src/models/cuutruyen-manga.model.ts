import { COLLECTION_NAME } from "@/constants";
import { getModelForClass, modelOptions, Prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false } })
class Title {
  @Prop({ required: true })
  name!: string;
}

export class CuuTruyenManga {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  titles!: Title[];
}

export const CuuTruyenMangaModel = getModelForClass(CuuTruyenManga, {
  schemaOptions: { collection: COLLECTION_NAME.CUUTRUYEN_MANGA },
});
