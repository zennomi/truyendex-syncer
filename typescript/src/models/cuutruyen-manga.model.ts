import { MONGODB_COLLECTION_NAME } from "@/constants";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  Prop,
} from "@typegoose/typegoose";
import { union } from "lodash";

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

  @Prop({ default: false })
  mapped?: boolean;

  @Prop({ required: true })
  cover_url!: string;

  @Prop({ required: true })
  created_at!: string;

  public getTitles(this: DocumentType<CuuTruyenManga>): string[] {
    const object = this.toObject();
    return union([object.name, ...object.titles.map((t) => t.name)]);
  }
}

export const CuuTruyenMangaModel = getModelForClass(CuuTruyenManga, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.CUUTRUYEN_MANGA },
});
