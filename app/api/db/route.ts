import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const dbPath = join(process.cwd(), 'local_db.json');

export async function GET() {
  try {
    const data = await readFile(dbPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    // If file doesn't exist, return empty object
    if (error.code === 'ENOENT') {
      return NextResponse.json({});
    }
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const incomingData = await request.json();
    
    // Write incoming data directly to database file
    await writeFile(dbPath, JSON.stringify(incomingData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write database' }, { status: 500 });
  }
}
