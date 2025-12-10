import type { APIContext } from 'astro';

export function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

export function requireAuth(context: APIContext) {
  const { supabase } = context.locals as any;
  
  if (!supabase) {
    throw new Response(
      JSON.stringify({ success: false, error: 'No autenticado' }),
      { status: 401 }
    );
  }
  
  return supabase;
}

