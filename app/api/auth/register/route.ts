import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from "@prisma/client";
import bcrypt from 'bcryptjs';

const VITE_LMS_APP_API_URL = process.env.VITE_LMS_APP_API_URL || '';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': VITE_LMS_APP_API_URL,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true', // 🔥 quan trọng nếu có cookie
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const email = username;

    const exist = await prisma.user.findUnique({ where: { email } });

    if (exist) {
      return NextResponse.json(
        { error: 'User already exists' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': VITE_LMS_APP_API_URL,
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name: 'Regular User',
        password: hashedPassword,
        role: Role.USER,
      },
    });

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Access-Control-Allow-Origin': VITE_LMS_APP_API_URL,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating user' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': VITE_LMS_APP_API_URL,
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }
}