// import { IpInfoService } from "@golf-district/service/src/ipinfo/ipinfo.service";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${process.env.GOLF_DISTRICT_AUTH_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ipInfo = await fetch(
      `https://ipinfo.io/json?token=${process.env.IP_INFO_API_KEY}`
    );

    const data = await ipInfo.json();

    return NextResponse.json({ country: data.country }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user country code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
