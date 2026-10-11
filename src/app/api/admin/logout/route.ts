import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  res.cookies.set('admin_session_token', '', {
    path: '/',
    maxAge: 0,
  });
  res.cookies.set('sb-access-token', '', {
    path: '/',
    maxAge: 0,
  });
  return res;
}
