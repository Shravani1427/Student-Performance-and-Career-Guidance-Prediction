export async function GET() {
  return Response.json({ ok: true, message: "Express MySQL backend is configured", api: "http://localhost:5000/api" });
}
