import { MONGODB_COLLECTION_NAME, MANGA_SOURCE } from "@/constants";
import {
  getModelForClass,
  Prop,
  modelOptions,
  ReturnModelType,
} from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

@modelOptions({ schemaOptions: { _id: false } })
class ProviderMapping {
  @Prop({ required: true, enum: MANGA_SOURCE })
  providerType!: MANGA_SOURCE;

  @Prop({ required: true })
  sourceId!: string;
}

export class MangaMapping extends TimeStamps {
  @Prop({ required: true })
  mangaId!: string;

  @Prop({ required: true })
  providers!: ProviderMapping[];

  static async findByMangaId(
    this: ReturnModelType<typeof MangaMapping>,
    mangaId: string
  ) {
    return this.findOne({ mangaId });
  }

  static async findByProvider(
    this: ReturnModelType<typeof MangaMapping>,
    providerType: MANGA_SOURCE,
    sourceId: string
  ) {
    return this.findOne({
      providers: { $elemMatch: { providerType, sourceId } },
    });
  }
}

export const MangaMappingModel = getModelForClass(MangaMapping, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.MANGA_MAPPING },
});
