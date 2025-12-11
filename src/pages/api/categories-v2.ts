import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { requireAuth, jsonResponse, errorResponse } from '../../lib/api-helpers';

// GET - Obtener todas las categorías
export const GET: APIRoute = async ({ url }) => {
  try {
    const onlyActive = url.searchParams.get('onlyActive') === 'true';
    
    let query = supabase
      .from('categories')
      .select('*')
      .order('order_num', { ascending: true });
    
    if (onlyActive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error obteniendo categorías:', error);
      return errorResponse('Error al obtener categorías: ' + error.message, 500);
    }
    
    return jsonResponse({ success: true, data });
  } catch (error: any) {
    console.error('Error en GET categories:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

// POST - Crear nueva categoría
export const POST: APIRoute = async (context) => {
  try {
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    const { supabase: authSupabase } = authResult;
    
    const body = await context.request.json();
    const { name, slug, description, order_num, is_active } = body;
    
    if (!name) {
      return errorResponse('El nombre es requerido', 400);
    }
    
    // Generar slug si no se proporciona
    const finalSlug = slug || name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const { data, error } = await authSupabase
      .from('categories')
      .insert([{
        name,
        slug: finalSlug,
        description: description || null,
        order_num: order_num || 0,
        is_active: is_active ?? true,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creando categoría:', error);
      if (error.code === '23505') {
        return errorResponse('Ya existe una categoría con ese slug', 400);
      }
      return errorResponse('Error al crear categoría: ' + error.message, 500);
    }
    
    return jsonResponse({ success: true, data }, 201);
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en POST categories:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

// PUT - Actualizar categoría
export const PUT: APIRoute = async (context) => {
  try {
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    const { supabase: authSupabase } = authResult;
    
    const body = await context.request.json();
    const { id, name, slug, description, order_num, is_active } = body;
    
    if (!id) {
      return errorResponse('ID de categoría requerido', 400);
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (order_num !== undefined) updateData.order_num = order_num;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data, error } = await authSupabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando categoría:', error);
      return errorResponse('Error al actualizar categoría: ' + error.message, 500);
    }
    
    return jsonResponse({ success: true, data });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en PUT categories:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

// PATCH - Actualizar parcialmente (ej: toggle is_active)
export const PATCH: APIRoute = async (context) => {
  try {
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    const { supabase: authSupabase } = authResult;
    
    const body = await context.request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return errorResponse('ID de categoría requerido', 400);
    }
    
    const { data, error } = await authSupabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando categoría:', error);
      return errorResponse('Error al actualizar: ' + error.message, 500);
    }
    
    return jsonResponse({ success: true, data });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en PATCH categories:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

// DELETE - Eliminar categoría
export const DELETE: APIRoute = async (context) => {
  try {
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    const { supabase: authSupabase } = authResult;
    
    const body = await context.request.json();
    const { id } = body;
    
    if (!id) {
      return errorResponse('ID de categoría requerido', 400);
    }
    
    // Primero, actualizar items que tengan esta categoría (ponerlos sin categoría)
    await authSupabase
      .from('menu_items')
      .update({ category_id: null })
      .eq('category_id', id);
    
    // Luego eliminar la categoría
    const { error } = await authSupabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error eliminando categoría:', error);
      return errorResponse('Error al eliminar: ' + error.message, 500);
    }
    
    return jsonResponse({ success: true, message: 'Categoría eliminada' });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en DELETE categories:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

