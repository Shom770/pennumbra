import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "pennumbra";

// `next dev` re-evaluates modules on every hot reload, so the client is parked on
// globalThis to avoid opening a new connection pool each time.
const globalForMongo = globalThis as typeof globalThis & {
  pennumbraMongoClient?: Promise<MongoClient>;
};

export function isMongoConfigured() {
  return Boolean(uri);
}

export function getMongoClient(): Promise<MongoClient> {
  if (!uri) throw new Error("MONGODB_URI is not set.");
  globalForMongo.pennumbraMongoClient ??= new MongoClient(uri).connect();
  return globalForMongo.pennumbraMongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
