export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
  });
}
