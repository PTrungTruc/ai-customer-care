import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json(null);
  }

  try {
    const user = JSON.parse(token);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json(null);
  }
}