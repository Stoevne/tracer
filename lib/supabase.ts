/**
 * Supabase clients — Server- und Browser-Variante.
 * Browser-Client nutzt anon-Key, Server-Client kann anon ODER service_role.
 * Service-Role NIEMALS im Browser exposen.
 */
import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function supabaseBrowser() {
  return createBrowserClient(url, anonKey);
}

export function supabaseServer() {
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createServerClient(url, serviceKey, {
    cookies: { get: () => undefined, set: () => {}, remove: () => {} },
  });
}
