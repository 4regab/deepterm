import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getStorageKey(): string {
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
  return `sb-${projectRef}-auth-token`
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { name: getStorageKey() },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
              })
            );
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  );
}
