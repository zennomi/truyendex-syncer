import { COLLECTION_NAME } from "@/constants";
import { getMongooseCollection, mongooseWrapper } from "@/utils";

const main = async () => {
  const mappingCollection = getMongooseCollection(
    COLLECTION_NAME.MANGA_MAPPING
  );
  const documents = await mappingCollection.find().toArray();
  const bulkOps = documents.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
        },
      },
    },
  }));

  const result = await mappingCollection.bulkWrite(bulkOps);
  console.log(result);
};

mongooseWrapper(main);
