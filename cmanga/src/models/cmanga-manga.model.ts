import { COLLECTION_NAME } from "@/constants";
import { getModelForClass, Prop } from "@typegoose/typegoose";

export class CmangaManga {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  name_other!: string[];
}

export const CmangaMangaModel = getModelForClass(CmangaManga, {
  schemaOptions: { collection: COLLECTION_NAME.CMANGA_MANGA },
});
