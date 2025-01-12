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
  @Prop({ required: false })
  mangaId?: string;

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

  static async map(
    this: ReturnModelType<typeof MangaMapping>,
    from: { source: MANGA_SOURCE; sourceId: string },
    to: { source: MANGA_SOURCE; sourceId: string }
  ) {
    let mapping = await this.findByProvider(from.source, from.sourceId);
    if (!mapping) {
      mapping = await this.create({
        providers: [
          {
            providerType: from.source,
            sourceId: from.sourceId,
          },
        ],
      });
    }
    if (
      mapping.providers.some(
        (p) => p.sourceId === to.sourceId && p.providerType === to.source
      )
    )
      return mapping;
    mapping.providers.push({ providerType: to.source, sourceId: to.sourceId });
    return await mapping.save();
  }
}

export const MangaMappingModel = getModelForClass(MangaMapping, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.MANGA_MAPPING },
});
