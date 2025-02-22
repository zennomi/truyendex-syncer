import { MONGODB_COLLECTION_NAME } from "@/constants";
import {
  getModelForClass,
  modelOptions,
  Prop,
  Ref,
} from "@typegoose/typegoose";
import { ExhentaiGallery } from "./exhentai-gallery.model";

@modelOptions({ schemaOptions: { _id: false } })
class GoogleResult {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  link!: string;

  @Prop({ required: true })
  snippet!: string;
}

export class VnHentaiManga {
  @Prop({ required: true })
  _id!: string; // folder + title

  @Prop({ required: true })
  id!: string; // folder + title

  @Prop({ required: true })
  folder!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ ref: () => ExhentaiGallery, type: () => String })
  refExhentai?: Ref<ExhentaiGallery, string>;

  // result from url
  @Prop({ required: false })
  fakkuUrl?: string;

  @Prop({ required: false })
  exhentaiUrl?: string;

  @Prop({ required: false })
  nhentaiUrl?: string;

  @Prop({ required: false })
  nhentaiComUrl?: string;

  @Prop({ required: false })
  irodoriUrl?: string;

  @Prop({ required: false })
  googleResults?: GoogleResult[];

  @Prop({ required: false })
  hentagResults?: any[];

  @Prop({ required: false })
  hentagData?: any;

  @Prop({ required: false })
  exhentaiRemoved?: boolean;

  @Prop({ required: false })
  ulgid?: string;
}

export const VnHentaiMangaModel = getModelForClass(VnHentaiManga, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.VNHENTAI_MANGA },
});
