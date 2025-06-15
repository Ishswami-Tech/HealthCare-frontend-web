import { NextResponse } from 'next/server';
import { getDashboardByRole } from '@/config/routes';
import { Role } from '@/types/auth.types';
import { setSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    console.log('Starting Google callback processing');
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;
    const credential = searchParams.get('credential');
    const providedCallbackUrl = searchParams.get('callbackUrl');
    
    console.log('Callback parameters:', {
      credential: credential ? 'present' : 'missing',
      providedCallbackUrl
    });

    if (!credential) {
      console.log('No credential found, redirecting to login');
      const loginUrl = new URL('/auth/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'NoCredential');
      return NextResponse.redirect(loginUrl);
    }

    // Call your backend API with the credential
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/social/google`;
    console.log('Calling backend API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: credential }),
      credentials: 'include'
    });

    const data = await response.json();
    console.log('Backend response:', {
      ok: response.ok,
      status: response.status,
      data: { ...data, access_token: data.access_token ? 'present' : 'missing' }
    });

    if (!response.ok) {
      console.error('Google callback error:', data);
      const loginUrl = new URL('/auth/login', requestUrl.origin);
      loginUrl.searchParams.set('error', data.message || 'AuthenticationError');
      return NextResponse.redirect(loginUrl);
    }

    // Create the session data
    const sessionData = {
      access_token: data.access_token,
      session_id: data.session_id,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role || 'PATIENT',
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // Set the session first
    console.log('Setting session data');
    await setSession(sessionData);

    // Determine the redirect URL with proper fallback
    let redirectPath = '/patient/dashboard'; // Default fallback
    
    console.log('Determining redirect path', {
      providedCallbackUrl,
      dataRedirectUrl: data.redirectUrl,
      userRole: data.user?.role
    });

    if (providedCallbackUrl && !providedCallbackUrl.includes('/auth/')) {
      redirectPath = providedCallbackUrl;
    } else if (data.redirectUrl) {
      redirectPath = data.redirectUrl;
    } else if (data.user?.role) {
      redirectPath = getDashboardByRole(data.user.role as Role);
    }

    console.log('Final redirect path:', redirectPath);

    // Ensure we have a valid URL by using the request.url as base
    const redirectUrl = new URL(redirectPath.startsWith('http') ? redirectPath : redirectPath, requestUrl.origin);
    console.log('Constructed redirect URL:', redirectUrl.toString());
    
    const nextResponse = NextResponse.redirect(redirectUrl);

    // Set cookies in the response with proper security settings
    nextResponse.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    if (data.refresh_token) {
      nextResponse.cookies.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // Set session cookie
    nextResponse.cookies.set('session_id', sessionData.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set role cookie
    nextResponse.cookies.set('user_role', sessionData.user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set additional headers for security
    nextResponse.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    nextResponse.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

    console.log('Returning response with redirect to:', redirectUrl.toString());
    return nextResponse;
  } catch (error) {
    console.error('Google callback error:', error);
    const loginUrl = new URL('/auth/login', new URL(request.url).origin);
    loginUrl.searchParams.set('error', 'CallbackError');
    return NextResponse.redirect(loginUrl);
  }
}

export async function POST(request: Request) {
  return GET(request);
} 