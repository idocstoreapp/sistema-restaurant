import type { APIContext } from 'astro';
import { supabase } from './supabase';

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

export async function requireAuth(context: APIContext) {
  // Obtener el token de las cookies o headers
  const authHeader = context.request.headers.get('Authorization');
  let token = authHeader?.replace('Bearer ', '');
  
  // Si no hay token en el header, intentar obtenerlo de las cookies de Supabase
  if (!token) {
    // Supabase guarda el token en cookies con este formato
    const cookies = context.request.headers.get('Cookie') || '';
    const match = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);
    if (match) {
      try {
        const cookieData = JSON.parse(decodeURIComponent(match[1]));
        token = cookieData.access_token;
      } catch {
        // Si no se puede parsear, continuar sin token
      }
    }
  }

  if (!token) {
    return errorResponse('No autenticado', 401);
  }

  // Crear un cliente de Supabase con el token para verificar
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
  
  const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // Verificar el token con Supabase
  const { data: { user }, error } = await supabaseWithAuth.auth.getUser();
  
  if (error || !user) {
    return errorResponse('Token inválido o expirado', 401);
  }

  // Verificar que el usuario tenga rol de admin o encargado
  const { data: userProfile } = await supabaseWithAuth
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['admin', 'encargado'].includes(userProfile.role)) {
    return errorResponse('No tienes permisos para esta acción', 403);
  }

  return { user, supabase: supabaseWithAuth };
}

// Helper para obtener usuario autenticado en páginas Astro
export async function getAuthUser(context: APIContext) {
  try {
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  context.cookies.get('sb-access-token')?.value ||
                  context.cookies.get('sb-auth-token')?.value;

    if (!token) return null;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return userProfile;
  } catch {
    return null;
  }
}

