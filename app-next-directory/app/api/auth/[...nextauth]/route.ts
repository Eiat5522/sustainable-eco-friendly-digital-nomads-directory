import { GET as authGET, POST as authPOST } from "@/lib/auth";

console.log('[auth route] module loaded');

export async function GET(request: Request) {
  try {
    console.log('[auth route] incoming GET', request.url);
  } catch (e) {}
  return authGET(request as any);
}

export async function POST(request: Request) {
  try {
    console.log('[auth route] incoming POST', request.url);
  } catch (e) {}
  return authPOST(request as any);
}