
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { auth } from '@/lib/auth';

type AuthFn = () => Promise<unknown>;
type UploadFn = (assetType: string, file: File) => Promise<unknown>;
type FormDataFn = (request: Request) => Promise<FormData>;

export const testControl = {
  authOverride: undefined as AuthFn | undefined,
  uploadOverride: undefined as UploadFn | undefined,
  formDataOverride: undefined as FormDataFn | undefined,
};

export async function POST(request: Request) {
  const authFn = testControl.authOverride ?? auth;
  const session = await authFn();
  // session.user can be a loose object in tests; cast to any to avoid typing issues
  const sessionUser = (session as any)?.user as {
    id?: string;
    role?: string;
  } | undefined;

  if (sessionUser?.role !== 'venueOwner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formDataGetter =
      testControl.formDataOverride ?? ((req: Request) => req.formData());
    const formData = await formDataGetter(request);
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const uploadFn =
      testControl.uploadOverride ?? ((assetType: string, uploadFile: File) => client.assets.upload(assetType as any, uploadFile as any));
    const imageAsset = await uploadFn('image', file);

    return NextResponse.json({ asset: imageAsset });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
