// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await fetch('https://jsonplaceholder.typicode.com/users121');
    const data = await users.json();
    throw new Error('Simulated error'); // Simulating an error for testing
    return NextResponse.json({ message: 'hello worlds', data });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  } 
}
