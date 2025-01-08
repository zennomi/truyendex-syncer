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
@index(
  { noStemmingTitles: "text", stemmingTitles: "text" },
  { default_language: "none" }
)
export class MangaDexManga {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  title!: Title;

  @Prop({ required: true })
  altTitles!: Title[];

  @Prop({ type: () => [String] })
  stemmingTitles?: string[];

  @Prop({ type: () => [String] })
  noStemmingTitles?: string[];

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
