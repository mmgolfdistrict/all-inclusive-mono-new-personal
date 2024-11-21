import { NextResponse} from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const revisionFilePath = path.join(process.cwd(), 'revision.json');
    const revisionData = await fs.readFile(revisionFilePath, 'utf-8');
    const revision = JSON.parse(revisionData);

    return NextResponse.json(revision);
  } catch (error) {
    console.error('Error reading revision.json:', error);
    return NextResponse.json({ error: 'Could not read revision.json' }, { status: 500 });
  }
}

