import { GridFSBucket, ObjectId } from "mongodb";
import { getDb, isMongoConfigured } from "./mongodb";

export interface SpotSubmission {
  name: string;
  location: string;
  bestFor: "sunrise" | "sunset" | "both";
  view: string;
  crowd: "low" | "medium" | "high" | "unknown";
  notes: string;
  contact: string;
  picture: File;
}

const limits = { name: 80, location: 160, view: 100, notes: 500, contact: 160 } as const;

const collectionName = process.env.MONGODB_SPOTS_COLLECTION ?? "spot_submissions";
const bucketName = process.env.MONGODB_PICTURE_BUCKET ?? "spot_pictures";

export function parseSpotSubmission(input: unknown): SpotSubmission | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const text = (key: keyof typeof limits) => typeof value[key] === "string" ? value[key].trim() : "";
  const submission = {
    name: text("name"),
    location: text("location"),
    bestFor: value.bestFor,
    view: text("view"),
    crowd: value.crowd,
    notes: text("notes"),
    contact: text("contact"),
    picture: value.picture,
  };

  if (!submission.name || submission.name.length > limits.name) return null;
  if (!submission.location || submission.location.length > limits.location) return null;
  if (!submission.view || submission.view.length > limits.view) return null;
  if (submission.notes.length > limits.notes || submission.contact.length > limits.contact) return null;
  if (!["sunrise", "sunset", "both"].includes(String(submission.bestFor))) return null;
  if (!["low", "medium", "high", "unknown"].includes(String(submission.crowd))) return null;
  if (!(submission.picture instanceof File) || submission.picture.size === 0 || submission.picture.size > 8 * 1024 * 1024) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(submission.picture.type)) return null;

  return submission as SpotSubmission;
}

export { isMongoConfigured };

/** Streams the photo into GridFS, then writes the submission document that points at it. */
export async function saveSpotSubmission(submission: SpotSubmission) {
  const db = await getDb();
  const bucket = new GridFSBucket(db, { bucketName });

  // The request body is already buffered by formData(), and the photo is capped at 8 MB.
  const bytes = Buffer.from(await submission.picture.arrayBuffer());
  const pictureId = await new Promise<ObjectId>((resolve, reject) => {
    // Driver v6 dropped the top-level `contentType` option; it lives in metadata now.
    const upload = bucket.openUploadStream(submission.picture.name || "spot-photo", {
      metadata: { contentType: submission.picture.type, size: submission.picture.size },
    });
    upload.on("error", reject);
    upload.on("finish", () => resolve(upload.id));
    upload.end(bytes);
  });

  const document = {
    name: submission.name,
    location: submission.location,
    bestFor: submission.bestFor,
    view: submission.view,
    crowd: submission.crowd,
    notes: submission.notes,
    contact: submission.contact,
    picture: {
      id: pictureId,
      bucket: bucketName,
      filename: submission.picture.name,
      contentType: submission.picture.type,
      size: submission.picture.size,
    },
    // Submissions go live immediately for now; flip this to "pending" to gate on review.
    status: "published" as const,
    createdAt: new Date(),
  };

  try {
    const result = await db.collection(collectionName).insertOne(document);
    return { id: result.insertedId.toHexString() };
  } catch (error) {
    // Don't leave an orphaned photo behind if the document write fails.
    await bucket.delete(pictureId).catch(() => {});
    throw error;
  }
}

export interface StoredSpot {
  id: string;
  name: string;
  location: string;
  bestFor: SpotSubmission["bestFor"];
  view: string;
  crowd: SpotSubmission["crowd"];
  credit: string;
  pictureUrl: string;
}

interface SpotDocument {
  _id: ObjectId;
  name: string;
  location: string;
  bestFor: SpotSubmission["bestFor"];
  view: string;
  crowd: SpotSubmission["crowd"];
  credit?: string;
}

/**
 * Published spots for the vantage list, oldest first. Everything is published on
 * arrival today, but the filter stays so review can be switched back on later.
 */
export async function listPublishedSpots(): Promise<StoredSpot[]> {
  const db = await getDb();
  const documents = await db
    .collection<SpotDocument>(collectionName)
    .find({ status: "published" }, { projection: { name: 1, location: 1, bestFor: 1, view: 1, crowd: 1, credit: 1 } })
    .sort({ order: 1, createdAt: 1 })
    .toArray();

  return documents.map((document) => ({
    id: document._id.toHexString(),
    name: document.name,
    location: document.location,
    bestFor: document.bestFor,
    view: document.view,
    crowd: document.crowd,
    credit: document.credit ?? "",
    pictureUrl: `/api/spots/${document._id.toHexString()}/picture`,
  }));
}

/** Opens the GridFS photo for a spot, or returns null if either the spot or its file is gone. */
export async function openSpotPicture(id: string) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const spot = await db.collection(collectionName).findOne(
    { _id: new ObjectId(id) },
    { projection: { picture: 1 } },
  );
  const pictureId = spot?.picture?.id;
  if (!(pictureId instanceof ObjectId)) return null;

  const bucket = new GridFSBucket(db, { bucketName: spot?.picture?.bucket ?? bucketName });
  const [file] = await bucket.find({ _id: pictureId }).limit(1).toArray();
  if (!file) return null;

  return {
    stream: bucket.openDownloadStream(pictureId),
    contentType: (file.metadata?.contentType as string | undefined) ?? "application/octet-stream",
    length: file.length,
  };
}
