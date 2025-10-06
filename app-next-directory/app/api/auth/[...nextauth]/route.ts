import { GET as authGET, POST as authPOST } from "@/lib/auth";

console.log('[auth route] module loaded');

export async function GET(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    console.log('[auth route] incoming GET', pathname);
  } catch (_error) {
    console.log('[auth route] incoming GET');
  }
  return authGET(request as Parameters<typeof authGET>[0]);
}

export async function POST(request: Request) {
  try {
    const { pathname } = new URL(request.url);
    console.log('[auth route] incoming POST', pathname);
  } catch (_error) {
    console.log('[auth route] incoming POST');
  }
  return authPOST(request as Parameters<typeof authPOST>[0]);
}
