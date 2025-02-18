// import { IpInfoService } from "@golf-district/service/src/ipinfo/ipinfo.service";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${process.env.GOLF_DISTRICT_AUTH_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { phoneNumber } = await request.json();
    const response = await fetch(
        `https://phonevalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&phone=${phoneNumber}`
    );
    const { valid } = await response.json();

    return NextResponse.json({valid}, { status: 200 });
  } catch (error) {
    console.error('Error fetching user country code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
