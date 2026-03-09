import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  

  if (!token) {
    return NextResponse.json(null);
  }

  try {
    // const user = JSON.parse(token);
    const { payload } = await jwtVerify(JSON.parse(token), secret);
    const user = payload;
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(null);
  }
}