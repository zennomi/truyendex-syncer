import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getModelForClass, Prop } from "@typegoose/typegoose";

export class ExhentaiGallery {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  galleryType!: string;

  @Prop({ required: true })
  thumnail!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  token!: string;

  @Prop({ required: true })
  totalPages!: number;

  @Prop({ required: true })
  uploader!: string;

  @Prop({ required: true })
  tags!: string[];
}

export const ExhentaiGalleryModel = getModelForClass(ExhentaiGallery, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.EXHENTAI_GALLERY },
});
