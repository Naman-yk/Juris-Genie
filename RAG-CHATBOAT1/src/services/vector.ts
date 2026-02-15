import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export type InputVector = PineconeRecord;

// ----------------------- UPSERT -----------------------
export async function upsertVectors(
  indexName: string,
  vectors: InputVector[]
) {
  const index = pc.index(indexName);

  await index.upsert(vectors); // correct for serverless
}

// ----------------------- QUERY -----------------------
export async function queryVectors(
  indexName: string,
  vector: number[],
  topK = 5
) {
  const index = pc.index(indexName);

  const result = await index.query({
    vector,
    topK,
    includeMetadata: true,
  });

  return result.matches ?? [];
}
