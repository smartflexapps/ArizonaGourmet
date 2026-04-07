// ============================================
// PRODUCTOS - CATÁLOGO OPTIMIZADO (V2)
// ============================================

function obtenerCatalogoProductos(entidadWeb) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PRODUCTOS');
  const data = sheet.getDataRange().getValues();
  const catalogo = [];

  // Índices según estructura V2 (0:ALFACODIGO, 1:BETACODIGO, 2:IdProducto, 3:ProductoNombre,
  // 4:PresentacionCompra, 5:UnidadCostos, 9:Factor, 18:Categoria, 21:StockAlfa, 22:StockBeta, 23:Stock)
  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    let codigoMostrar = "";
    let stockCosto = 0;

    if (entidadWeb === 'CATERING') {
      codigoMostrar = fila[0];               // ALFACODIGO
      stockCosto = parseFloat(fila[21]) || 0; // StockAlfa
    } else if (entidadWeb === 'GOURMET') {
      codigoMostrar = fila[1];               // BETACODIGO
      stockCosto = parseFloat(fila[22]) || 0; // StockBeta
    } else if (entidadWeb === 'SPRITZ') {
      codigoMostrar = fila[0] || fila[1];    // cualquier código
      stockCosto = parseFloat(fila[23]) || 0; // Stock total
    } else {
      continue;
    }

    if (!codigoMostrar || stockCosto <= 0) continue;

    const factor = parseFloat(fila[9]) || 1;
    const categoria = (fila[18] || '').toString().trim();

    let existencia;
    if (categoria === "01-PROTE" || categoria === "02-VEGFR") {
      existencia = stockCosto / factor;       // decimal
    } else {
      existencia = Math.floor(stockCosto / factor); // entero
    }

    if (existencia <= 0) continue;

    catalogo.push({
      id: fila[2],
      codigo: codigoMostrar,
      nombre: fila[3],
      unidad: fila[4],               // PresentacionCompra
      existencia: existencia,
      categoria: categoria,
      factor: factor,
      unidad_costo: fila[5]
    });
  }
  return catalogo;
}
