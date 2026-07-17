import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isSupabaseConfigured = !!(supabaseUrl && supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file found' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
        // Upload to a bucket named 'uploads'
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(uniqueName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(uniqueName);

          return NextResponse.json({ success: true, url: publicUrl });
        } else {
          console.error('Supabase upload error:', uploadError);
        }
      } catch (e) {
        console.error('Failed to upload to Supabase Storage:', e);
      }
    }

    // Fallback to local file (e.g. for local development)
    try {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const filepath = join(uploadDir, uniqueName);
      await writeFile(filepath, buffer);

      const publicUrl = `/uploads/${uniqueName}`;
      return NextResponse.json({ success: true, url: publicUrl });
    } catch (fsError) {
      console.warn('Local filesystem write failed, falling back to base64 encoding:', fsError);
      const base64Data = buffer.toString('base64');
      const publicUrl = `data:${file.type || 'application/octet-stream'};base64,${base64Data}`;
      return NextResponse.json({ success: true, url: publicUrl });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
