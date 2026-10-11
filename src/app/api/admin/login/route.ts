import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Live Supabase Auth attempt
    const supabase = getSupabaseServerClient();
    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (!error && data?.session) {
        const token = data.session.access_token;
        const res = NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || 'Clinic Administrator',
            role: 'admin',
          },
          token,
        });

        res.cookies.set('admin_session_token', token, {
          httpOnly: false, // Accessible to client if needed
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return res;
      }
    }

    // 2. Demo Admin Credentials Verification (for development & offline testing)
    const isValidDemoAdmin =
      (cleanEmail === 'admin' || cleanEmail === 'admin@vertexdental.co.uk' || cleanEmail === 'dr.vance') &&
      cleanPass === 'admin123';

    if (isValidDemoAdmin) {
      const token = 'vertex_admin_session_token_secure_2026';
      const res = NextResponse.json({
        success: true,
        user: {
          id: 'usr-admin-vance',
          email: 'admin@vertexdental.co.uk',
          name: 'Dr. Alistair Vance (Lead Surgeon)',
          role: 'admin',
        },
        token,
      });

      res.cookies.set('admin_session_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid administrator credentials. Please check your username and password.' },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
