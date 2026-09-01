/**
 * Seeds the six original vantage points — photos included — into MongoDB.
 *
 *   npm run seed            # skips spots that are already there
 *   npm run seed -- --force # replaces them (document + GridFS photo)
 *
 * Reads MONGODB_* from .env via node --env-file.
 */
import { GridFSBucket, MongoClient } from "mongodb";

const SPOTS = [
  {
    name: "Cira Green",
    location: "129 S 30th St",
    bestFor: "both",
    view: "Skyline + river",
    crowd: "high",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/CiraSun.jpg?width=900",
  },
  {
    name: "South Street Bridge",
    location: "South St + Schuylkill",
    bestFor: "both",
    view: "River + skyline",
    crowd: "medium",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Philadelphia%20skyline%20from%20South%20Street%20Bridge.jpg?width=900",
  },
  {
    name: "Belmont Plateau",
    location: "Fairmount Park",
    bestFor: "sunset",
    view: "Panorama",
    crowd: "medium",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Belmont%20Plateau.jpg?width=900",
  },
  {
    name: "Penn Park",
    location: "Walnut St + 31st",
    bestFor: "sunrise",
    view: "Open field",
    crowd: "low",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Philadelphia%20skyline%20from%20South%20Street%20Bridge.jpg?width=900",
  },
  {
    name: "Schuylkill Boardwalk",
    location: "Locust St + river",
    bestFor: "both",
    view: "Water + skyline",
    crowd: "high",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Philadelphia%20skyline%20(cropped).jpg?width=900",
  },
  {
    name: "Lemon Hill",
    location: "East Fairmount Park",
    bestFor: "sunrise",
    view: "Elevated skyline",
    crowd: "low",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Philadelphia%20Panorama%20as%20taken%20from%20Lemon%20Hill%20in%20Fairmount%20Park.jpg?width=900",
  },
];

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run this with `npm run seed` so .env is loaded.");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB || "pennumbra";
const collectionName = process.env.MONGODB_SPOTS_COLLECTION || "spot_submissions";
const bucketName = process.env.MONGODB_PICTURE_BUCKET || "spot_pictures";
const force = process.argv.includes("--force");

async function download(url) {
  // Wikimedia rejects requests without a descriptive User-Agent.
  const response = await fetch(url, {
    headers: { "user-agent": "pennumbra-seed/1.0 (https://github.com/; local development seed script)" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const contentType = (response.headers.get("content-type") || "image/jpeg").split(";")[0];
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType };
}

function upload(bucket, filename, bytes, metadata) {
  return new Promise((resolve, reject) => {
    const stream = bucket.openUploadStream(filename, { metadata });
    stream.on("error", reject);
    stream.on("finish", () => resolve(stream.id));
    stream.end(bytes);
  });
}

const client = await new MongoClient(uri).connect();
try {
  const db = client.db(dbName);
  const spots = db.collection(collectionName);
  const bucket = new GridFSBucket(db, { bucketName });

  for (const [index, spot] of SPOTS.entries()) {
    const existing = await spots.findOne({ name: spot.name, seeded: true });
    if (existing && !force) {
      console.log(`· ${spot.name} — already seeded, skipping`);
      continue;
    }
    if (existing) {
      if (existing.picture?.id) await bucket.delete(existing.picture.id).catch(() => {});
      await spots.deleteOne({ _id: existing._id });
    }

    const { bytes, contentType } = await download(spot.image);
    const filename = `${spot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
    const pictureId = await upload(bucket, filename, bytes, { contentType, size: bytes.length, sourceUrl: spot.image });

    await spots.insertOne({
      name: spot.name,
      location: spot.location,
      bestFor: spot.bestFor,
      view: spot.view,
      crowd: spot.crowd,
      notes: "",
      contact: "",
      credit: "Wikimedia Commons",
      picture: { id: pictureId, bucket: bucketName, filename, contentType, size: bytes.length },
      status: "published",
      seeded: true,
      order: index + 1,
      createdAt: new Date(),
    });

    console.log(`✓ ${spot.name} — ${(bytes.length / 1024).toFixed(0)} KB ${contentType}`);
  }

  const published = await spots.countDocuments({ status: "published" });
  console.log(`\nDone. ${published} published spot${published === 1 ? "" : "s"} in ${dbName}.${collectionName}.`);
} finally {
  await client.close();
}
