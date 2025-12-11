import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { requireAuth, jsonResponse, errorResponse } from '../../lib/api-helpers';
import { deleteImage } from '../../lib/supabase';

export const POST: APIRoute = async (context) => {
  try {
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    
    const body = await context.request.json();
    const { imageUrl } = body;
    
    if (!imageUrl) {
      return errorResponse('URL de imagen requerida', 400);
    }
    
    const success = await deleteImage(imageUrl);
    
    if (success) {
      return jsonResponse({ success: true, message: 'Imagen eliminada' });
    } else {
      return errorResponse('Error al eliminar imagen', 500);
    }
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en delete-image:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

