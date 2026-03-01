import { GET as authGET } from '@/lib/auth';

export async function GET(request: Request) {
  return authGET(request);
}
