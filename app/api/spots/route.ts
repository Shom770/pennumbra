import { isMongoConfigured, parseSpotSubmission, saveSpotSubmission } from "../../utils/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return Response.json({ error: "Submissions are not configured yet." }, { status: 503 });
  }

  let body: Record<string, FormDataEntryValue>;
  try {
    body = Object.fromEntries(await request.formData());
  } catch {
    return Response.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const submission = parseSpotSubmission(body);
  if (!submission) {
    return Response.json({ error: "Please check the required fields." }, { status: 422 });
  }

  try {
    const { id } = await saveSpotSubmission(submission);
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("Spot submission failed", error);
    return Response.json({ error: "The submission could not be saved." }, { status: 502 });
  }
}
