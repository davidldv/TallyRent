import { google } from "@/lib/oauth";
import { cookies } from "next/headers";
import { prisma as db } from "@/lib/db";
import { createSession } from '@/lib/session'

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
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    const googleUser: GoogleUser = await response.json();

    const existingUser = await db.user.findUnique({
      where: {
        googleId: googleUser.sub
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
                data: { googleId: googleUser.sub }
            });
            userId = userByEmail.id;
        } else {
            // Create user
            const newUser = await db.user.create({
                data: {
                    googleId: googleUser.sub,
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
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
    
    return Response.redirect(new URL(`/${locale}/dashboard`, request.url));

  } catch (e) {
    console.error(e);
    // Cast error to any to access message safely
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return Response.redirect(new URL(`/login?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
