import type { APIRoute } from 'astro';
import { requireAuth, jsonResponse, errorResponse } from '../../lib/api-helpers';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async (context) => {
  try {
    // Verificar que el usuario es admin
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    
    const body = await context.request.json();
    const { email, password, name, role = 'mesero' } = body;
    
    if (!email || !password || !name) {
      return errorResponse('Email, contraseña y nombre son requeridos', 400);
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Email inválido', 400);
    }
    
    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
    }
    
    // Validar rol
    if (!['admin', 'mesero', 'encargado'].includes(role)) {
      return errorResponse('Rol inválido', 400);
    }
    
    // Crear cliente de Supabase con service_role para crear usuarios
    // NOTA: La service_role key debe estar en las variables de entorno del servidor
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl) {
      console.error('PUBLIC_SUPABASE_URL no está configurada');
      return errorResponse('Configuración incompleta: falta PUBLIC_SUPABASE_URL', 500);
    }
    
    if (!supabaseServiceKey || supabaseServiceKey === 'tu-service-role-key-aqui') {
      console.error('SUPABASE_SERVICE_ROLE_KEY no está configurada o tiene valor por defecto');
      return errorResponse(
        'Configuración incompleta: Debes configurar SUPABASE_SERVICE_ROLE_KEY en el archivo .env. ' +
        'Obtén esta clave en: Supabase Dashboard > Settings > API > service_role',
        500
      );
    }
    
    // Crear cliente admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        name,
        role,
      },
    });
    
    if (authError) {
      console.error('Error creando usuario en Auth:', authError);
      return errorResponse('Error creando usuario: ' + authError.message, 400);
    }
    
    if (!authData.user) {
      return errorResponse('No se pudo crear el usuario', 500);
    }
    
    // Crear registro en la tabla users
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email || email,
        name: name,
        role: role,
      })
      .select()
      .single();
    
    if (userError) {
      console.error('Error creando registro en users:', userError);
      // Intentar eliminar el usuario de Auth si falla la creación en users
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return errorResponse('Error creando perfil de usuario: ' + userError.message, 500);
    }
    
    return jsonResponse({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en create-user:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

