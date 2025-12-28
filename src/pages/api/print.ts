/**
 * API Route para impresión directa
 * 
 * Permite imprimir comandas y boletas desde el frontend
 * sin necesidad de cambiar el estado de la orden.
 * 
 * Endpoints:
 * - POST /api/print/kitchen - Imprimir comanda de cocina
 * - POST /api/print/receipt - Imprimir boleta de cliente
 */

import type { APIRoute } from 'astro';
import { requireAuth, jsonResponse, errorResponse } from '../../lib/api-helpers';
import { printKitchenCommand, printCustomerReceipt } from '../../lib/printer-service';

export const POST: APIRoute = async (context) => {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(context);
    if (authResult instanceof Response) return authResult;
    const { supabase: authSupabase } = authResult;
    
    const body = await context.request.json();
    const { type, ordenId } = body;
    
    if (!type || !ordenId) {
      return errorResponse('Tipo de impresión y ID de orden requeridos', 400);
    }
    
    if (type !== 'kitchen' && type !== 'receipt') {
      return errorResponse('Tipo de impresión inválido. Debe ser "kitchen" o "receipt"', 400);
    }
    
    // Obtener orden
    const { data: orden, error: ordenError } = await authSupabase
      .from('ordenes_restaurante')
      .select('*, mesas(numero)')
      .eq('id', ordenId)
      .single();
    
    if (ordenError || !orden) {
      return errorResponse('Orden no encontrada', 404);
    }
    
    // Obtener items de la orden
    const { data: itemsData, error: itemsError } = await authSupabase
      .from('orden_items')
      .select('*, menu_items(id, name, category_id)')
      .eq('orden_id', ordenId)
      .order('created_at', { ascending: true });
    
    if (itemsError) {
      return errorResponse('Error obteniendo items: ' + itemsError.message, 500);
    }
    
    const items = itemsData?.map((item: any) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      subtotal: item.subtotal,
      notas: item.notas,
      menu_item: item.menu_items,
    })) || [];
    
    if (items.length === 0) {
      return errorResponse('La orden no tiene items para imprimir', 400);
    }
    
    // Usar las mismas funciones que cuando cambia el estado
    // Esto garantiza que funcione exactamente igual
    let printResult = false;
    try {
      if (type === 'kitchen') {
        console.log('[API Print] Imprimiendo comanda de cocina para orden:', orden.numero_orden);
        printResult = await printKitchenCommand(orden, items);
      } else if (type === 'receipt') {
        console.log('[API Print] Imprimiendo boleta de cliente para orden:', orden.numero_orden);
        printResult = await printCustomerReceipt(orden, items);
      }
      
      if (printResult) {
        return jsonResponse({
          success: true,
          message: type === 'kitchen' ? 'Comanda enviada a impresora' : 'Boleta enviada a impresora',
          type,
          orden: orden.numero_orden
        });
      } else {
        return errorResponse(
          `Error al imprimir ${type === 'kitchen' ? 'comanda' : 'boleta'}. Verifica la configuración de la impresora.`,
          500
        );
      }
    } catch (error: any) {
      console.error(`[API Print] ❌ Error imprimiendo:`, error.message);
      return errorResponse(
        `Error al imprimir: ${error.message || 'Error desconocido'}`,
        500
      );
    }
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error en POST /api/print:', error);
    return errorResponse('Error interno: ' + (error.message || 'Desconocido'), 500);
  }
};

