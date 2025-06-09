import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { readFile } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default body parsing
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function parseForm(req: Request): Promise<{ file: File }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true });

    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ file: files.file[0] });
    });
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({ uploadResult });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed', details: error }, { status: 500 });
  }
}
