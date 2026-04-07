// ============================================
// EMAILS - NOTIFICACIONES
// ============================================

function enviarEmailConfirmacion(usuario, pedido, productos, almacenSuministrador, config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Buscar email del usuario en USUARIOS
  const usuariosSheet = ss.getSheetByName('USUARIOS');
  const usuariosData = usuariosSheet.getDataRange().getValues();
  let emailUsuario = '';

  for (let i = 1; i < usuariosData.length; i++) {
    if ((usuariosData[i][0] || '').toString().trim() === usuario.idUsuario) {
      emailUsuario = (usuariosData[i][1] || '').toString().trim();
      break;
    }
  }

  if (!emailUsuario) {
    return {
      success: false,
      message: 'No se encontró el email del usuario'
    };
  }

  // Construir detalle de productos
  let detalleProductos = '';
  let totalProductos = 0;

  for (let i = 0; i < productos.length; i++) {
    const nombreProd = productos[i].nombre || 'Producto sin nombre';
    const unidadProd = productos[i].unidad || 'Unidad';
    detalleProductos += `${i + 1}. ${nombreProd} - ${productos[i].cantidad} ${unidadProd}\n`;
    totalProductos += productos[i].cantidad;
  }

  // === Obtener datos de ALMACENES (una sola vez) ===
  const almacenesSheet = ss.getSheetByName('ALMACENES');
  const almacenesData = almacenesSheet.getDataRange().getValues();

  // Nombre del almacén solicitante (del usuario)
  let nombreAlmacenSolicitante = 'No especificado';
  for (let i = 1; i < almacenesData.length; i++) {
    if ((almacenesData[i][0] || '').toString().trim() === usuario.idAlmacen) {
      nombreAlmacenSolicitante = (almacenesData[i][3] || '').toString().trim();
      break;
    }
  }

  // Nombre del almacén suministrador (donde va el pedido)
  let nombreAlmacenSuministrador = 'No especificado';
  for (let i = 1; i < almacenesData.length; i++) {
    if ((almacenesData[i][0] || '').toString().trim() === almacenSuministrador.idAlmacen) {
      nombreAlmacenSuministrador = (almacenesData[i][3] || '').toString().trim();
      break;
    }
  }

  // === Obtener nombre de la empresa ===
  let nombreEmpresa = usuario.idEmpresa;
  const empresasSheet = ss.getSheetByName('EMPRESAS');
  if (empresasSheet) {
    const empresasData = empresasSheet.getDataRange().getValues();
    for (let i = 1; i < empresasData.length; i++) {
      if ((empresasData[i][0] || '').toString().trim() === usuario.idEmpresa) {
        nombreEmpresa = (empresasData[i][1] || '').toString().trim();
        break;
      }
    }
  }

  // === Buscar email del ALMACENISTA por prefijo (ALF / BET) ===
  let emailAlmacenista = '';
  const idxEmail = 1; // Columna B: Useremail
  const idxRol = 2; // Columna C: Rol
  const idxIdAlmacen = 3; // Columna D: IdAlmacen

  const almacenId = almacenSuministrador.idAlmacen || '';
  let prefijoBusqueda = '';

  if (almacenId.startsWith('ALF')) {
    prefijoBusqueda = 'ALF';
  } else if (almacenId.startsWith('BET')) {
    prefijoBusqueda = 'BET';
  }

  if (prefijoBusqueda) {
    for (let i = 1; i < usuariosData.length; i++) {
      const rol = (usuariosData[i][idxRol] || '').toString().trim();
      const idAlm = (usuariosData[i][idxIdAlmacen] || '').toString().trim();

      if (rol === 'Almacen' && idAlm.startsWith(prefijoBusqueda)) {
        emailAlmacenista = (usuariosData[i][idxEmail] || '').toString().trim();
        break;
      }
    }
  }

  // === Emails ===
  const asuntoUsuario = `✅ Confirmación de Pedido ${pedido.idPedido}`;
  const cuerpoUsuario = `
¡Hola ${usuario.nombre}!

Tu pedido ha sido recibido exitosamente.

📦 DETALLE DEL PEDIDO:
Empresa: ${nombreEmpresa}
ID Pedido: ${pedido.idPedido}
Fecha: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')}
Unidad Solicitante: ${nombreAlmacenSolicitante}
Para el Almacén: ${nombreAlmacenSuministrador}

📋 PRODUCTOS SOLICITADOS:
${detalleProductos}

Estado: Pendiente

Gracias por tu pedido.
${config.webNombre}

ρoᥕᥱrᥱd bყ smᥲrtfᥣᥱx
  `;

  const asuntoAdmin = `📦 Nuevo Pedido Recibido: ${pedido.idPedido}`;
  const cuerpoAdmin = `
Nuevo pedido recibido en el sistema.

👤 USUARIO:
Nombre: ${usuario.nombre}
Email: ${emailUsuario}
Empresa: ${nombreEmpresa}
Unidad Solicitante: ${nombreAlmacenSolicitante}

📦 PEDIDO:
ID Pedido: ${pedido.idPedido}
Fecha: ${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')}
Para el Almacén: ${nombreAlmacenSuministrador}
Tipo: Requisición
Estado: Pendiente

📋 PRODUCTOS:
${detalleProductos}

Total de productos solicitados: ${totalProductos}

---
${config.webNombre}

ρoᥕᥱrᥱd bყ smᥲrtfᥣᥱx
  `;

  try {
    MailApp.sendEmail({
      to: emailUsuario,
      subject: asuntoUsuario,
      body: cuerpoUsuario
    });

    const destinatariosAdmin = [];
    if (config.emailNotifications) {
      destinatariosAdmin.push(config.emailNotifications);
    }
    if (emailAlmacenista) {
      destinatariosAdmin.push(emailAlmacenista);
    }

    if (destinatariosAdmin.length > 0) {
      MailApp.sendEmail({
        to: destinatariosAdmin.join(','),
        subject: asuntoAdmin,
        body: cuerpoAdmin
      });
    }

    return {
      success: true,
      message: 'Emails enviados correctamente'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al enviar emails: ' + error.toString()
    };
  }
}
