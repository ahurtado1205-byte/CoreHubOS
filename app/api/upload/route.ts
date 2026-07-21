import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

// Allowed MIME types for upload
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

// Maximum file size: 5MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

import { verifyServerAuth } from '@/lib/serverAuth';

export async function POST(request: Request) {
  // Authentication check — must come before any processing
  const authUser = await verifyServerAuth(request);
  const isAuthenticated = !!authUser;
  if (!isAuthenticated) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Authentication required to upload files' },
      { status: 401 }
    );
  }

  // Content-length size pre-check (browsers may not always send this header)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` },
      { status: 413 }
    );
  }

  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found in request' }, { status: 400 });
    }

    // Post-parse size check (more reliable than content-length header)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.` },
        { status: 413 }
      );
    }

    // MIME type validation — check declared type, not just extension
    const mimeType = file.type || '';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: '${mimeType}'. Allowed types: images (jpeg, png, gif, webp, svg) and PDF.`
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename — remove path separators and only allow safe characters
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '_') // prevent path traversal via ..
      .substring(0, 200); // cap filename length
    const uniqueName = `${Date.now()}-${sanitizedName}`;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(uniqueName, buffer, {
            contentType: mimeType,
            upsert: false, // prevent overwriting existing files
          });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(uniqueName);

          return NextResponse.json({ success: true, url: publicUrl });
        } else {
          console.error('[upload] Supabase upload error:', uploadError);
        }
      } catch (e) {
        console.error('[upload] Failed to upload to Supabase Storage:', e);
      }
    }

    // Fallback to local filesystem (development only)
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filepath = join(uploadDir, uniqueName);
        await writeFile(filepath, buffer);

        const publicUrl = `/uploads/${uniqueName}`;
        return NextResponse.json({ success: true, url: publicUrl });
      } catch (fsError) {
        console.warn('[upload] Local filesystem write failed:', fsError);
      }
    }

    // Last resort: base64 data URI (dev only — never use in production)
    if (process.env.NODE_ENV === 'development') {
      const base64Data = buffer.toString('base64');
      const publicUrl = `data:${mimeType};base64,${base64Data}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }

    return NextResponse.json(
      { success: false, error: 'Upload service unavailable. Storage is not configured.' },
      { status: 503 }
    );

  } catch (error) {
    console.error('[upload] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed due to server error' }, { status: 500 });
  }
}
