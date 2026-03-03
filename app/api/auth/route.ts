// import { NextRequest, NextResponse } from 'next/server';
// import { authenticate, createToken } from '@/lib/auth'; // Đảm bảo đường dẫn import đúng
// import { cookies } from 'next/headers';

// // Xử lý Đăng Nhập (POST)
// export async function POST(request: NextRequest) {
//   try {
//     // 1. Lấy dữ liệu từ client gửi lên
//     const body = await request.jsy
// on();
//     const { username, password } = body;

//     // Validate dữ liệu đầu vào
//     if (!username || !password) {
//       return NextResponse.json(
//         { error: 'Vui lòng nhập tài khoản và mật khẩu' },
//         { status: 400 }
//       );
//     }

//     console.log('Đang đăng nhập với user:', username); // Log để debug

//     // 2. Xác thực user từ Database (thông qua hàm authenticate trong lib/auth)
//     const user = await authenticate(username, password);

//     if (!user) {
//       return NextResponse.json(
//         { error: 'Sai tài khoản hoặc mật khẩu' },
//         { status: 401 }
//       );
//     }

//     // 3. Tạo Token
//     const token = await createToken(user);

//     // 4. Lưu token vào Cookie (Quan trọng: Phải set cookie ở đây mới giữ đăng nhập được)
//     const cookieStore = cookies();
//     cookieStore.set('auth-token', token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 86400, // 24 giờ
//       path: '/', // Cookie có hiệu lực toàn trang
//     });

//     // 5. Trả về kết quả thành công
//     return NextResponse.json({
//       success: true,
//       user: {
//         id: user.id,
//         username: username, // user.username,
//         role: user.role,
//       },
//     });

//   } catch (error) {
//     console.error('Login API Error:', error);
//     return NextResponse.json(
//       { error: 'Lỗi server nội bộ' },
//       { status: 500 }
//     );
//   }
// }

// // Xử lý Đăng Xuất (DELETE)
// export async function DELETE() {
//   // Xóa cookie auth-token
//   cookies().delete('auth-token');
  
//   return NextResponse.json({ 
//     success: true,
//     message: 'Đăng xuất thành công' 
//   });
// }

import { NextRequest, NextResponse } from 'next/server';
import { authenticate, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { signOut, signIn, useSession } from 'next-auth/react';

const VITE_LMS_APP_API_URL = process.env.VITE_LMS_APP_API_URL || '';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': VITE_LMS_APP_API_URL,
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tài khoản và mật khẩu' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const user = await authenticate(username, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Sai tài khoản hoặc mật khẩu' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const token = await createToken(user);
    user.password = password;

    const cookieStore = cookies();
    cookieStore.set('auth-token', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400, // 24 giờ
      path: '/', // Cookie có hiệu lực toàn trang
    });

    // await signOut();

    // const result = await signIn('credentials', {
    //     email: username,
    //     password,
    //     redirect: false,
    //   });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username,
          role: user.role,
        },
      },
      { headers: corsHeaders() }
    );

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function DELETE() {
  cookies().delete('auth-token');

  return NextResponse.json(
    { success: true, message: 'Đăng xuất thành công' },
    { headers: corsHeaders() }
  );
}