import { google } from "@/lib/oauth";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/db";
import { createSession } from '@/lib/session'
import { NextResponse } from 'next/server';
import { decodeIdToken } from "arctic";

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture: string;
  email_verified: boolean;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
  const storedCodeVerifier = cookieStore.get("google_oauth_code_verifier")?.value ?? null;

  if (!code || !state || !storedState || !storedCodeVerifier || state !== storedState) {
    console.error('OAuth Callback Error:', {
      hasCode: !!code,
      hasState: !!state,
      hasStoredState: !!storedState,
      hasStoredVerifier: !!storedCodeVerifier,
      statesMatch: state === storedState
    });
    
    return new Response(`OAuth Error: Invalid State. 
      Code: ${!!code}, 
      State: ${!!state}, 
      StoredState: ${!!storedState}, 
      StoredVerifier: ${!!storedCodeVerifier},
      Match: ${state === storedState}`, {
      status: 400
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, storedCodeVerifier);

    const claims = decodeIdToken(tokens.idToken()) as any;
    const googleUser: GoogleUser = {
      sub: claims.sub,
      name: claims.name,
      email: claims.email,
      picture: claims.picture,
      email_verified: claims.email_verified
    };

    
    // Support both 'sub' and 'id' as Google sometimes returns 'id' depending on endpoint/scope
    const googleId = googleUser.sub;
    
    if (!googleId) {
        throw new Error(`Google UserInfo missing 'sub' or 'id': ${JSON.stringify(googleUser)}`);
    }

    const existingUser = await db.user.findUnique({
      where: {
        googleId: googleId
      }
    });

    let userId = existingUser?.id;

    if (!existingUser) {
        // Check by email
        const userByEmail = await db.user.findUnique({
            where: { email: googleUser.email }
        });
        
        if (userByEmail) {
            // Link account
            await db.user.update({
                where: { id: userByEmail.id },
                data: { googleId: googleId }
            });
            userId = userByEmail.id;
        } else {
            // Create user
            const newUser = await db.user.create({
                data: {
                    googleId: googleId,
                    email: googleUser.email,
                    name: googleUser.name
                }
            });
            userId = newUser.id;
        }
    }

    if (!userId) {
      throw new Error("Failed to process user")
    }

    // Create session
    await createSession(userId);
    
    const cookieStore = await cookies();
    // Use NextResponse to ensure cookies are preserved
    const redirectUrl = new URL(`/dashboard`, request.url);
    return NextResponse.redirect(redirectUrl);

  } catch (e) {
    console.error(e);
    // Cast error to any to access message safely
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/login?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
