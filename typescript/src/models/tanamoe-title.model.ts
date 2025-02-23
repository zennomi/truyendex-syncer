import { MONGODB_COLLECTION_NAME } from "@/constants";
import { getModelForClass, modelOptions, Prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false } })
class AdditionalTitleName {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  language!: string;
}

@modelOptions({ schemaOptions: { _id: false } })
class Metadata {
  @Prop({ required: false })
  images?: any;
}

@modelOptions({ schemaOptions: { _id: false } })
class Expand {
  @Prop({ required: false })
  "additionalTitleNames(title)"?: AdditionalTitleName[];
}

class Relase {
  front?: {
    resizedImage?: {
      "160w": string;
      "320w": string;
      "640w": string;
    };
  };
}

export class TanamoeTitle {
  @Prop({ required: true })
  _id!: string;

  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  cover!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: false })
  expand?: Expand;

  @Prop({ required: true })
  metadata!: Metadata;

  @Prop({ required: false })
  defaultRelease?: Relase;
}

export const TanamoeTitleModel = getModelForClass(TanamoeTitle, {
  schemaOptions: { collection: MONGODB_COLLECTION_NAME.TANAMOE_TITLES },
});
