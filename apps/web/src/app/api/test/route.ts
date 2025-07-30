// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const users = await fetch('https://jsonplaceholder.typicode.com/users121');
    const data = await users.json();
    
  return NextResponse.json({ message: 'hello worlds', data });
}
