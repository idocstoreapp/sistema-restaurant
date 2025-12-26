/**
 * Servicio de Impresión Térmica
 * 
 * Maneja la impresión automática de comandas de cocina y boletas de cliente
 * usando impresoras térmicas ESC/POS por red (IP) o USB.
 * 
 * IMPORTANTE: Este servicio maneja errores sin crashear el servidor.
 * Si la impresora no está disponible, solo registra el error y continúa.
 */

// Importación dinámica de escpos para evitar errores si no está instalado
// La librería escpos requiere instalación de dependencias nativas
let escpos: any = null;

async function loadEscpos() {
  if (escpos) return escpos;
  
  try {
    escpos = await import('escpos');
    return escpos;
  } catch (error: any) {
    console.warn('[Printer] Librería escpos no disponible:', error.message);
    return null;
  }
}

// Tipos
interface OrdenItem {
  id?: string;
  menu_item_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  notas?: string;
  menu_item?: {
    id: number;
    name: string;
    category_id?: number;
  };
}

interface Orden {
  id: string;
  numero_orden: string;
  mesa_id: string;
  estado: string;
  total: number;
  nota?: string;
  created_at: string;
  metodo_pago?: string;
  paid_at?: string;
  mesas?: {
    numero: number;
  };
}

interface PrinterConfig {
  type: 'network' | 'usb' | 'parallel';
  address?: string; // IP para network, path para USB/parallel (COM3, LPT1, etc.)
  port?: number; // Solo para network
}

// Configuración de impresoras desde variables de entorno
function getPrinterConfig(type: 'kitchen' | 'cashier'): PrinterConfig | null {
  const envPrefix = type === 'kitchen' ? 'KITCHEN' : 'CASHIER';
  const printerType = import.meta.env[`PRINTER_${envPrefix}_TYPE`] as 'network' | 'usb' | undefined;
  
  if (!printerType) {
    return null;
  }

  if (printerType === 'network') {
    const address = import.meta.env[`PRINTER_${envPrefix}_IP`];
    const port = parseInt(import.meta.env[`PRINTER_${envPrefix}_PORT`] || '9100');
    
    if (!address) {
      console.warn(`[Printer] Configuración incompleta para impresora ${type}: falta IP`);
      return null;
    }
    
    return { type: 'network', address, port };
  } else if (printerType === 'usb') {
    const path = import.meta.env[`PRINTER_${envPrefix}_PATH`];
    
    if (!path) {
      console.warn(`[Printer] Configuración incompleta para impresora ${type}: falta PATH`);
      return null;
    }
    
    // Detectar si es LPT (paralelo) o COM (USB serial)
    if (path.toUpperCase().startsWith('LPT')) {
      return { type: 'parallel', address: path };
    }
    
    return { type: 'usb', address: path };
  } else if (printerType === 'parallel') {
    const path = import.meta.env[`PRINTER_${envPrefix}_PATH`] || 'LPT1';
    return { type: 'parallel', address: path };
  }
  
  return null;
}

// Conectar a la impresora
async function connectPrinter(config: PrinterConfig): Promise<any | null> {
  try {
    const escposModule = await loadEscpos();
    if (!escposModule) {
      console.warn('[Printer] Librería escpos no disponible');
      return null;
    }
    
    const { Network, USB, Printer } = escposModule;
    let device;
    
    if (config.type === 'network') {
      device = new Network(config.address!, config.port);
    } else if (config.type === 'parallel') {
      // Para puertos paralelos (LPT1, LPT2, etc.), usar USB con el path
      // Nota: escpos puede no soportar LPT directamente, intentar como USB
      console.warn(`[Printer] Intentando conectar puerto paralelo ${config.address}. Esto puede requerir configuración adicional.`);
      device = new USB(config.address!);
    } else {
      // USB (COM ports)
      device = new USB(config.address!);
    }
    
    const printer = new Printer(device);
    return printer;
  } catch (error: any) {
    console.error(`[Printer] Error conectando a impresora:`, error.message);
    return null;
  }
}

// Formatear personalización de items
function formatPersonalization(notas?: string): string {
  if (!notas) return '';
  
  try {
    const personalization = JSON.parse(notas);
    const parts: string[] = [];
    
    if (personalization.agregado) {
      parts.push(`Agregado: ${personalization.agregado}`);
    }
    if (personalization.salsas && personalization.salsas.length > 0) {
      parts.push(`Salsa${personalization.salsas.length > 1 ? 's' : ''}: ${personalization.salsas.join(', ')}`);
    }
    if (personalization.sinIngredientes && personalization.sinIngredientes.length > 0) {
      parts.push(`Sin: ${personalization.sinIngredientes.join(', ')}`);
    }
    if (personalization.bebidas && personalization.bebidas.length > 0) {
      const bebidasText = personalization.bebidas.map((b: any) => {
        if (b.sabor) return `${b.nombre} (${b.sabor})`;
        return b.nombre;
      }).join(', ');
      parts.push(`Bebida${personalization.bebidas.length > 1 ? 's' : ''}: ${bebidasText}`);
    }
    if (personalization.detalles) {
      parts.push(`Nota: ${personalization.detalles}`);
    }
    
    return parts.join(' | ');
  } catch {
    // Si no es JSON, retornar como texto simple
    return notas;
  }
}

// Detectar si estamos en servidor local (no en nube)
function isLocalServer(): boolean {
  // Si hay variables de impresora configuradas, asumimos que es servidor local
  return !!(
    import.meta.env.PRINTER_KITCHEN_IP || 
    import.meta.env.PRINTER_KITCHEN_PATH ||
    import.meta.env.PRINTER_CASHIER_IP ||
    import.meta.env.PRINTER_CASHIER_PATH
  );
}

// Enviar comando de impresión a servicio local
async function sendToLocalPrintService(type: 'kitchen' | 'receipt', orden: Orden, items: OrdenItem[]): Promise<boolean> {
  const printServiceUrl = import.meta.env.PRINT_SERVICE_URL || 'http://localhost:3001';
  const printServiceToken = import.meta.env.PRINT_SERVICE_TOKEN || '';
  
  if (!printServiceUrl || !printServiceToken) {
    console.warn('[Printer] Servicio de impresión local no configurado (PRINT_SERVICE_URL y PRINT_SERVICE_TOKEN)');
    return false;
  }
  
  try {
    // El servicio local escucha en la raíz, no en /print
    const url = printServiceUrl.endsWith('/') ? printServiceUrl.slice(0, -1) : printServiceUrl;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${printServiceToken}`,
      },
      body: JSON.stringify({
        type,
        orden,
        items,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[Printer] ${type === 'kitchen' ? 'Comanda' : 'Boleta'} enviada a servicio local:`, result.message);
    return result.success === true;
  } catch (error: any) {
    console.error(`[Printer] Error enviando a servicio local:`, error.message);
    return false;
  }
}

// Imprimir comanda de cocina
export async function printKitchenCommand(orden: Orden, items: OrdenItem[]): Promise<boolean> {
  // Si estamos en servidor local, imprimir directamente
  if (isLocalServer()) {
    const config = getPrinterConfig('kitchen');
    
    if (!config) {
      console.warn('[Printer] Impresora de cocina no configurada. Saltando impresión.');
      return false;
    }
  
  const printer = await connectPrinter(config);
  if (!printer) {
    console.error('[Printer] No se pudo conectar a la impresora de cocina');
    return false;
  }
  
  try {
    // Encabezado
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('COMANDA COCINA')
      .text('================')
      .size(0, 0)
      .align('lt')
      .text(`Orden: ${orden.numero_orden}`)
      .text(`Mesa: ${orden.mesas?.numero || 'N/A'}`)
      .text(`Hora: ${new Date(orden.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`)
      .text('----------------')
      .feed(1);
    
    // Items agrupados
    const itemsPorCategoria = items.reduce((acc, item) => {
      const categoria = item.menu_item?.category_id || 0;
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(item);
      return acc;
    }, {} as Record<number, OrdenItem[]>);
    
    Object.entries(itemsPorCategoria).forEach(([categoriaId, categoriaItems]) => {
      categoriaItems.forEach((item) => {
        const personalization = formatPersonalization(item.notas);
        
        printer
          .text(`${item.cantidad}x ${item.menu_item?.name || 'Item'}`.toUpperCase());
        
        if (personalization) {
          printer
            .text(`  ${personalization}`)
            .font('b');
        }
        
        printer.feed(1);
      });
    });
    
    // Nota general
    if (orden.nota) {
      printer
        .text('----------------')
        .text('NOTA GENERAL:')
        .text(orden.nota)
        .feed(1);
    }
    
    // Pie
    printer
      .text('----------------')
      .align('ct')
      .text(`Total Items: ${items.reduce((sum, item) => sum + item.cantidad, 0)}`)
      .text(new Date().toLocaleString('es-CL'))
      .feed(2)
      .cut();
    
    await printer.close();
    console.log(`[Printer] Comanda impresa exitosamente: Orden ${orden.numero_orden}`);
    return true;
  } catch (error: any) {
    console.error(`[Printer] Error imprimiendo comanda:`, error.message);
    try {
      await printer.close();
    } catch {
      // Ignorar errores al cerrar
    }
    return false;
  }
  } else {
    // Si estamos en nube, enviar a servicio local
    console.log('[Printer] Servidor en la nube - enviando a servicio local de impresión');
    return await sendToLocalPrintService('kitchen', orden, items);
  }
}

// Imprimir boleta de cliente
export async function printCustomerReceipt(orden: Orden, items: OrdenItem[]): Promise<boolean> {
  // Si estamos en servidor local, imprimir directamente
  if (isLocalServer()) {
    const config = getPrinterConfig('cashier');
    
    if (!config) {
      console.warn('[Printer] Impresora de caja no configurada. Saltando impresión.');
      return false;
    }
  
  const printer = await connectPrinter(config);
  if (!printer) {
    console.error('[Printer] No se pudo conectar a la impresora de caja');
    return false;
  }
  
  try {
    // Calcular desglose IVA
    const calcularDesgloseIVA = (precioConIVA: number) => {
      const precioSinIVA = precioConIVA / 1.19;
      const iva = precioConIVA - precioSinIVA;
      return { sinIVA: precioSinIVA, iva, conIVA: precioConIVA };
    };
    
    const subtotalSinIVA = items.reduce((sum, item) => {
      const desglose = calcularDesgloseIVA(item.subtotal);
      return sum + desglose.sinIVA;
    }, 0);
    
    const ivaTotal = items.reduce((sum, item) => {
      const desglose = calcularDesgloseIVA(item.subtotal);
      return sum + desglose.iva;
    }, 0);
    
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(Math.round(price));
    };
    
    // Encabezado
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('GOURMET ARABE SPA')
      .size(0, 0)
      .text('RUT: 77669643-9')
      .text('Providencia 1388 Local 49')
      .text('Celular: 939459286')
      .text('----------------')
      .align('lt')
      .text(`Orden: ${orden.numero_orden}`)
      .text(`Mesa: ${orden.mesas?.numero || 'Para Llevar'}`)
      .text(`Fecha: ${new Date(orden.created_at).toLocaleDateString('es-CL')}`)
      .text(`Hora: ${new Date(orden.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`)
      .text('----------------')
      .feed(1);
    
    // Items
    printer
      .text('Cant. Descripcion        Total')
      .text('----------------');
    
    items.forEach((item) => {
      const desglose = calcularDesgloseIVA(item.subtotal);
      const nombre = (item.menu_item?.name || 'Item').substring(0, 20);
      const cantidad = item.cantidad.toString().padStart(2);
      const precio = formatPrice(desglose.sinIVA).padStart(10);
      
      printer.text(`${cantidad}  ${nombre.padEnd(20)} ${precio}`);
    });
    
    // Totales
    printer
      .text('----------------')
      .text(`Monto Neto:     ${formatPrice(subtotalSinIVA).padStart(15)}`)
      .text(`IVA (19%):      ${formatPrice(ivaTotal).padStart(15)}`)
      .text('----------------')
      .font('b')
      .text(`TOTAL:          ${formatPrice(total).padStart(15)}`)
      .font('a');
    
    // Método de pago
    if (orden.metodo_pago) {
      printer
        .text('----------------')
        .text(`Metodo de Pago: ${orden.metodo_pago}`)
        .text(`Pagado: ${orden.paid_at ? new Date(orden.paid_at).toLocaleString('es-CL') : 'N/A'}`);
    }
    
    // Pie
    printer
      .text('----------------')
      .align('ct')
      .text('¡Gracias por su visita!')
      .text('Carne Halal Certificada 🕌')
      .text(new Date().toLocaleString('es-CL'))
      .feed(2)
      .cut();
    
    await printer.close();
    console.log(`[Printer] Boleta impresa exitosamente: Orden ${orden.numero_orden}`);
    return true;
  } catch (error: any) {
    console.error(`[Printer] Error imprimiendo boleta:`, error.message);
    try {
      await printer.close();
    } catch {
      // Ignorar errores al cerrar
    }
    return false;
  }
  } else {
    // Si estamos en nube, enviar a servicio local
    console.log('[Printer] Servidor en la nube - enviando a servicio local de impresión');
    return await sendToLocalPrintService('receipt', orden, items);
  }
}

