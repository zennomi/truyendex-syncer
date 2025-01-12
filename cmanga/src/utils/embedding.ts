import axios from "axios";

export async function getEmbeddings(sentences: string[]) {
  try {
    // example url: http://localhost:5000/embed
    const response = await axios.post("", {
      sentences: sentences,
    });

    const embeddings = response.data.embeddings;

    return embeddings;
  } catch (error) {
    console.error("Error getting embeddings:", error);
  }
}
