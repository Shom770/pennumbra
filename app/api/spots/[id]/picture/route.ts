import { Readable } from "node:stream";
import { isMongoConfigured, openSpotPicture } from "../../../../utils/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isMongoConfigured()) return new Response("Not configured", { status: 503 });

  const { id } = await params;

  try {
    const picture = await openSpotPicture(id);
    if (!picture) return new Response("Not found", { status: 404 });

    return new Response(Readable.toWeb(picture.stream) as ReadableStream<Uint8Array>, {
      headers: {
        "content-type": picture.contentType,
        "content-length": String(picture.length),
        // The URL is keyed to an immutable document id, so this can be cached hard.
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Could not read spot picture", error);
    return new Response("Unavailable", { status: 502 });
  }
}
