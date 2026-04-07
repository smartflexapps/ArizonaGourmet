// ============================================
// PEDIDOS - COMPLETO Y OPTIMIZADO (V2)
// ============================================

function obtenerAlmacenCentral(idEmpresa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const almacenesData = ss.getSheetByName('ALMACENES').getDataRange().getValues();
  for (let i = 1; i < almacenesData.length; i++) {
    if (almacenesData[i][1] === idEmpresa && almacenesData[i][2].toLowerCase() === 'central' && almacenesData[i][5]) {
      return { idAlmacen: almacenesData[i][0].toString() };
    }
  }
  return null;
}

function generarIdPedido(idUsuario) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PEDIDOS');
  return 'PED_' + idUsuario + '_A' + (sheet.getLastRow() + 1).toString().padStart(3, '0');
}

function generarIdDetalle() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PEDIDOSDETALLE');
  return 'DET_' + (sheet.getLastRow() + 1).toString().padStart(3, '0');
}

function procesarPedidoConLogin(carrito, email, password, entidadWeb) {
  try {
    const resultadoLogin = validarLogin(email, password);
    if (!resultadoLogin.success) return { success: false, msg: resultadoLogin.message };
    
    const usuario = resultadoLogin.usuario;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const hProd = ss.getSheetByName('PRODUCTOS');
    const prodData = hProd.getDataRange().getValues();
    const prodCab = prodData[0].map(h => h.toString().trim().toUpperCase());
    
    const hStock = ss.getSheetByName('STOCK');
    const stockData = hStock.getDataRange().getValues();
    const stockCab = stockData[0].map(h => h.toString().trim().toUpperCase());
    
    const mapaMaestroStock = {};
    const iIdProdStock = stockCab.indexOf('IDPRODUCTO');
    for (let i = 1; i < stockData.length; i++) {
      mapaMaestroStock[stockData[i][iIdProdStock]] = true;
    }
    
    const iId = prodCab.indexOf("IDPRODUCTO");
    const iStAlfa = prodCab.indexOf("STOCKALFA");
    const iStBeta = prodCab.indexOf("STOCKBETA");
    const iStTotal = prodCab.indexOf("STOCK");
    const iFactor = prodCab.indexOf("FACTOR");
    const iPresentacion = prodCab.indexOf("PRESENTACIONCOMPRA");
    const iUnidadCosto = prodCab.indexOf("UNIDADCOSTOS");
    
    // Validación de stock con factor
    for (const item of carrito) {
      if (!mapaMaestroStock[item.id]) {
        return { success: false, msg: '❌ El producto ' + item.nombre + ' no existe en el Maestro de Stock.' };
      }
      const filaP = prodData.find(r => r[iId] === item.id);
      if (!filaP) {
        return { success: false, msg: '❌ Producto ' + item.nombre + ' no encontrado en PRODUCTOS.' };
      }
      const factor = parseFloat(filaP[iFactor]) || 1;
      const cantidadCosto = item.cantidad * factor;
      let stockDisponible = 0;
      const idEmp = usuario.idEmpresa.toUpperCase();
      if (idEmp.startsWith('SPRI')) stockDisponible = parseFloat(filaP[iStTotal]) || 0;
      else if (idEmp.startsWith('ALF')) stockDisponible = parseFloat(filaP[iStAlfa]) || 0;
      else if (idEmp.startsWith('BET')) stockDisponible = parseFloat(filaP[iStBeta]) || 0;
      else stockDisponible = parseFloat(filaP[iStTotal]) || 0;
      
      if (cantidadCosto > stockDisponible) {
        const presentacion = filaP[iPresentacion] || 'unidad';
        const unidadCosto = filaP[iUnidadCosto] || 'unidad';
        return { success: false, msg: `❌ Stock insuficiente para ${item.nombre}. Pedido: ${item.cantidad} ${presentacion} (${cantidadCosto} ${unidadCosto}). Disponible: ${stockDisponible} ${unidadCosto}.` };
      }
    }
    
    // Reparto de pedidos
    let pedidosACrear = [];
    if (usuario.idEmpresa.toUpperCase().startsWith('SPRI')) {
      const xAlm = { 'ALF001': [], 'BET001': [] };
      for (const item of carrito) {
        const filaP = prodData.find(r => r[iId] === item.id);
        const sA = parseFloat(filaP[iStAlfa]) || 0;
        const sB = parseFloat(filaP[iStBeta]) || 0;
        let cant = item.cantidad;
        if (entidadWeb === 'CATERING' && sA >= cant) { xAlm['ALF001'].push(item); }
        else if (entidadWeb === 'GOURMET' && sB >= cant) { xAlm['BET001'].push(item); }
        else if (sA >= cant) { xAlm['ALF001'].push(item); }
        else if (sB >= cant) { xAlm['BET001'].push(item); }
        else {
          if (sA >= sB) {
            let qA = Math.min(cant, sA);
            if (qA > 0) { xAlm['ALF001'].push({ ...item, cantidad: qA }); cant -= qA; }
            if (cant > 0) xAlm['BET001'].push({ ...item, cantidad: cant });
          } else {
            let qB = Math.min(cant, sB);
            if (qB > 0) { xAlm['BET001'].push({ ...item, cantidad: qB }); cant -= qB; }
            if (cant > 0) xAlm['ALF001'].push({ ...item, cantidad: cant });
          }
        }
      }
      for (const id in xAlm) {
        if (xAlm[id].length > 0) {
          pedidosACrear.push({
            idUsuario: usuario.idUsuario, idEmpresa: usuario.idEmpresa,
            almacenSuministradorId: id, idPuente: (id === 'ALF001' ? 'ALF099' : 'BET099'),
            carrito: xAlm[id]
          });
        }
      }
    } else {
      const central = obtenerAlmacenCentral(usuario.idEmpresa);
      if (!central) return { success: false, msg: 'Sin almacén central configurado.' };
      pedidosACrear.push({
        idUsuario: usuario.idUsuario, idEmpresa: usuario.idEmpresa,
        almacenSuministradorId: central.idAlmacen, idPuente: '',
        carrito: carrito
      });
    }
    
    // Escritura final
    const pedidosSheet = ss.getSheetByName('PEDIDOS');
    const config = obtenerConfiguracionWeb();
    for (const p of pedidosACrear) {
      const idPed = generarIdPedido(p.idUsuario);
      const fechaFormateada = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
      pedidosSheet.appendRow([
        idPed, fechaFormateada, usuario.idAlmacen, p.idUsuario,
        p.almacenSuministradorId, 'Requisicion', 'Pendiente', 'Pedido Web', p.idPuente
      ]);
      crearDetallesPedido(idPed, p.carrito, p.almacenSuministradorId);
      enviarEmailConfirmacion(usuario, { idPedido: idPed }, p.carrito, { idAlmacen: p.almacenSuministradorId }, config);
    }
    return { success: true, message: 'Pedido Recibido' };
  } catch (e) {
    return { success: false, msg: 'Error de Servidor: ' + e.toString() };
  }
}

function crearDetallesPedido(idPedido, productos, idAlmacenSuministrador) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const detSheet = ss.getSheetByName('PEDIDOSDETALLE');
  const stockSheet = ss.getSheetByName('STOCK');
  const stockData = stockSheet.getDataRange().getValues();
  const headersStock = stockData[0].map(h => h.toString().trim());
  
  const prodSheet = ss.getSheetByName('PRODUCTOS');
  const prodData = prodSheet.getDataRange().getValues();
  const prodHeaders = prodData[0].map(h => h.toString().trim().toUpperCase());
  const idxIdProducto = prodHeaders.indexOf('IDPRODUCTO');
  const idxFactor = prodHeaders.indexOf('FACTOR');
  const idxPresentacion = prodHeaders.indexOf('PRESENTACIONCOMPRA');
  const idxUnidadCosto = prodHeaders.indexOf('UNIDADCOSTOS');
  
  for (const prod of productos) {
    const idProd = prod.id;
    const idStockUsar = idAlmacenSuministrador + '_' + idProd;
    
    // Crear entrada en STOCK si no existe
    if (!stockData.some(r => r[headersStock.indexOf('IdStock')] === idStockUsar)) {
      let registroBase = stockData.find(r => r[headersStock.indexOf('IdProducto')] === idProd);
      if (registroBase) {
        let nuevaFila = [...registroBase];
        nuevaFila[headersStock.indexOf('IdStock')] = idStockUsar;
        nuevaFila[headersStock.indexOf('IdAlmacen')] = idAlmacenSuministrador;
        stockSheet.appendRow(nuevaFila);
      }
    }
    
    // Obtener factor, presentación, unidad de costo
    let factor = 1, presentacion = '', unidadCosto = '';
    const filaProd = prodData.find(r => r[idxIdProducto] === idProd);
    if (filaProd) {
      factor = parseFloat(filaProd[idxFactor]) || 1;
      presentacion = (filaProd[idxPresentacion] || '').toString().trim();
      unidadCosto = (filaProd[idxUnidadCosto] || '').toString().trim();
    }
    
    const cantidadPresentacion = prod.cantidad;
    const cantidadCosto = cantidadPresentacion * factor;
    const textoSolicitud = `${cantidadPresentacion} ${presentacion} (${cantidadCosto} ${unidadCosto})`;
    
    detSheet.appendRow([
      generarIdDetalle(),
      idPedido,
      idStockUsar,
      cantidadCosto,          // CantidadSolicitada en unidad de costo
      '',                     // CantidadDespachada
      'Pendiente',            // Estado
      unidadCosto,            // UnidadCostos
      textoSolicitud,         // Solicitud
      '',                     // MotivoRechazo
      ''                      // IdStockDestino
    ]);
  }
}
