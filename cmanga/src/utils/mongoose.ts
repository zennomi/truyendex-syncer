import config from "@/config";
import mongoose from "mongoose";

export const mongooseWrapper = (func: Function) => {
  return mongoose
    .connect(
      `mongodb://${config.MONGO_USERNAME}:${config.MONGO_PASSWORD}@${config.MONGO_HOST}:${config.MONGO_PORT}/${config.MONGO_DATABASE}`
    )
    .then(() => {
      console.info("Mongo connected");

      func().catch((error: any) => {
        console.error(error);
      });
    });
};

export const getMongooseCollection = (name: string) =>
  mongoose.connection.collection(name);
