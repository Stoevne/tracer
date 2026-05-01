/**
 * Supabase clients — drei Varianten:
 *  - supabaseBrowser  : Client-Component (anon, cookies)
 *  - supabaseServer   : Server-Component / Route-Handler (anon, cookies)
 *  - supabaseAdmin    : Server-only, service_role, kein Cookie-Tracking
 *
 * service_role NIEMALS aus dem Browser oder einer "use client"-Datei
 * importieren.
 */
import { createClient } from "@supabase/supabase-js";
import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, anonKey };
}

export function supabaseBrowser() {
  const { url, anonKey } = publicEnv();
  return createBrowserClient(url, anonKey);
}

export function supabaseServer() {
  const { url, anonKey } = publicEnv();
  const cookieStore = cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server-Component-Read-Only-Kontext — ignorieren
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // dito
        }
      },
    },
  });
}

export function supabaseAdmin() {
  const { url } = publicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server-only)");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
