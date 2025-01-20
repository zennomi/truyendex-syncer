import { MONGODB_COLLECTION_NAME } from "@/constants";
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  Prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import { flatten, union } from "lodash";

@modelOptions({ schemaOptions: { _id: false } })
class Title {
  @Prop({ required: false })
  vi?: string;

  @Prop({ required: false })
  ja?: string;

  @Prop({ required: false })
  "ja-ro"?: string;

  @Prop({ required: false })
  "ko-ro"?: string;

  @Prop({ required: false })
  "zh-ro"?: string;

  @Prop({ required: false })
  "zh-hk"?: string;

  @Prop({ required: false })
  en?: string;

  @Prop({ required: false })
  zh?: string;

  @Prop({ required: false })
  ko?: string;
}

@modelOptions({ schemaOptions: { _id: false } })
class RelatedManga {
  @Prop({ required: true })
  id!: string;
}

@modelOptions({ schemaOptions: { _id: false } })
class RelatedMangaObject {
  @Prop({ required: true })
  main_story!: RelatedManga[];

  @Prop({ required: true })
  based_on!: RelatedManga[];

  @Prop({ required: true })
  adapted_from!: RelatedManga[];
}

@modelOptions({ schemaOptions: { _id: false } })
class MainCoverObject {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  volume!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  createdAt!: Date;

  @Prop({ required: true })
  updatedAt!: Date;
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

  @Prop({ required: true })
  relatedManga!: RelatedMangaObject;

  @Prop({ required: true })
  contentRating!: string;

  @Prop({ required: true })
  tags!: string[];

  @Prop({ required: false })
  normalizedTitles?: string[];

  @Prop({ required: true })
  mainCover!: MainCoverObject | null;

  @Prop({ required: true })
  createdAt!: Date;

  @Prop({ required: true })
  updatedAt!: Date;

  public getTitles(this: DocumentType<MangaDexManga>): string[] {
    const object = this.toObject();
    return union([
      ...Object.values(object.title),
      ...flatten(object.altTitles.map((t) => Object.values(t))),
    ]);
  }

  public static async searchTitle(
    this: ReturnModelType<typeof MangaDexManga>,
    query: string,
    options: {
      limit: number;
    } = { limit: 1 }
  ) {
    const result = await this.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(options.limit);

    return result as ((typeof result)[number] & { score: number })[];
  }
}

export const MangaDexMangaModel = getModelForClass(MangaDexManga, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.MANGADEX_MANGA },
});
