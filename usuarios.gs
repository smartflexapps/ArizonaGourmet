// ============================================
// USUARIOS - REGISTRO Y LOGIN (V2 con tablas separadas)
// ============================================

function obtenerEmpresas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const empresasSheet = ss.getSheetByName('EMPRESAS');
  const empresasData = empresasSheet.getDataRange().getValues();
  const empresas = [];
  for (let i = 1; i < empresasData.length; i++) {
    const tag = empresasData[i][3];
    if (tag && tag.toString().trim() !== '') {
      empresas.push({
        idEmpresa: empresasData[i][0],
        tag: tag.toString().trim()
      });
    }
  }
  return empresas;
}

function obtenerAlmacenesPorEmpresa(idEmpresa) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const almacenesSheet = ss.getSheetByName('ALMACENES');
  const almacenesData = almacenesSheet.getDataRange().getValues();
  const almacenes = [];
  for (let i = 1; i < almacenesData.length; i++) {
    const idEmpresaFila = (almacenesData[i][1] || '').toString().trim();
    const tipoAlmacen = (almacenesData[i][2] || '').toString().trim();
    const esPuntoDePedido = almacenesData[i][4];
    const activo = almacenesData[i][5];
    if (
      idEmpresaFila === idEmpresa &&
      (activo === true || activo === 'TRUE' || activo === 'true') &&
      (esPuntoDePedido === true || esPuntoDePedido === 'TRUE' || esPuntoDePedido === 'true') &&
      tipoAlmacen.toLowerCase() !== 'central' &&
      tipoAlmacen.toLowerCase() !== 'puente'
    ) {
      almacenes.push({
        idAlmacen: (almacenesData[i][0] || '').toString().trim(),
        nombre: (almacenesData[i][3] || '').toString().trim()
      });
    }
  }
  return almacenes;
}

// Validar email único en USUARIOSPEDIDOS
function validarEmailUnico(useremail) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USUARIOSPEDIDOS');
  const data = sheet.getDataRange().getValues();
  const emailBuscado = useremail.toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    const emailReg = (data[i][3] || '').toLowerCase().trim();
    if (emailReg === emailBuscado) return false;
  }
  return true;
}

function generarIdUsuario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USUARIOSPEDIDOS');
  const data = sheet.getDataRange().getValues();
  let maxNumero = 0;
  for (let i = 1; i < data.length; i++) {
    const idActual = (data[i][0] || '').toString().trim();
    if (idActual.toLowerCase().startsWith('usr_')) {
      const num = parseInt(idActual.substring(4));
      if (!isNaN(num) && num > maxNumero) maxNumero = num;
    }
  }
  const nuevoNumero = (maxNumero + 1).toString().padStart(2, '0');
  return 'Usr_' + nuevoNumero;
}

function registrarNuevoUsuario(datos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pedidosSheet = ss.getSheetByName('USUARIOSPEDIDOS');
  const notifSheet = ss.getSheetByName('USUARIOSNOTIFICACIONES');
  
  if (!validarEmailUnico(datos.useremail)) {
    return { success: false, message: 'El correo electrónico ya está registrado.' };
  }
  
  const nuevoId = generarIdUsuario();
  const ahora = new Date();
  const fechaHora = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  
  // USUARIOSPEDIDOS: [IdUserPed, Usuario, Contrasena, Email, IdEmpresa, IdAlmacen, Estado, UltimoCambio]
  const filaPedidos = [
    nuevoId,
    datos.usuario.trim(),
    datos.contrasena.trim(),
    datos.useremail.trim(),
    datos.idEmpresa,
    datos.idAlmacen,
    'Pendiente',
    fechaHora
  ];
  
  // USUARIOSNOTIFICACIONES: [IdUserNoti, Usuario, Email, Rol, Plataforma, IdTelegram, Estado, UltimoCambio]
  const filaNotif = [
    nuevoId,
    datos.usuario.trim(),
    datos.useremail.trim(),
    'Usuario',
    'Pedidos Web',
    '',
    'Activo',
    fechaHora
  ];
  
  try {
    pedidosSheet.appendRow(filaPedidos);
    notifSheet.appendRow(filaNotif);
  } catch (e) {
    return { success: false, message: 'Error crítico al escribir en las tablas.' };
  }
  
  // Emails (similar al original, usando config)
  const almacenesSheet = ss.getSheetByName('ALMACENES');
  const almacenesData = almacenesSheet.getDataRange().getValues();
  let nombreAlmacen = datos.idAlmacen;
  for (let i = 1; i < almacenesData.length; i++) {
    if ((almacenesData[i][0] || '').toString().trim() === datos.idAlmacen) {
      nombreAlmacen = (almacenesData[i][3] || '').toString().trim();
      break;
    }
  }
  
  const configSheet = ss.getSheetByName('CONFIGURACIONWEB');
  const configData = configSheet.getDataRange().getValues();
  let emailAdmin = '';
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][5]) {
      emailAdmin = (configData[i][5] || '').toString().trim();
      break;
    }
  }
  
  if (datos.useremail) {
    const asunto = '✅ Registro recibido – Sistema de Pedidos';
    const cuerpo = `Hola ${datos.usuario},\n\nTu registro fue recibido con éxito el ${fechaHora}.\n\nDatos:\n- Email: ${datos.useremail}\n- Nombre: ${datos.usuario}\n- Estado: Pendiente\n\n⚠️ Una vez activado podrás realizar pedidos.\n\nGracias.`;
    MailApp.sendEmail({ to: datos.useremail, subject: asunto, body: cuerpo });
  }
  
  if (emailAdmin) {
    const asunto = `🔔 Nuevo registro pendiente – ${datos.usuario}`;
    const cuerpo = `Se ha registrado un nuevo usuario:\n- Nombre: ${datos.usuario}\n- Email: ${datos.useremail}\n- Almacén: ${nombreAlmacen}\n- Fecha: ${fechaHora}\nEstado: Pendiente.\nRevisa USUARIOSPEDIDOS para activar.`;
    MailApp.sendEmail({ to: emailAdmin, subject: asunto, body: cuerpo });
  }
  
  return { success: true, message: 'Registro exitoso. Ahora puedes iniciar sesión.', idUsuario: nuevoId };
}

function validarLogin(useremail, contrasena) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('USUARIOSPEDIDOS');
  const data = sheet.getDataRange().getValues();
  const emailBuscado = useremail.toLowerCase().trim();
  const passBuscada = contrasena.toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    const emailReg = (data[i][3] || '').toString().toLowerCase().trim();
    const passReg = (data[i][2] || '').toString().trim();
    const estado = (data[i][6] || '').toString().trim();
    
    if (emailReg === emailBuscado && passReg === passBuscada) {
      if (estado === 'Activo' || estado === 'activo') {
        return {
          success: true,
          message: 'Inicio de sesión exitoso',
          usuario: {
            idUsuario: (data[i][0] || '').toString().trim(),
            nombre: (data[i][1] || '').toString().trim(),
            idEmpresa: (data[i][4] || '').toString().trim(),
            idAlmacen: (data[i][5] || '').toString().trim(),
            estado: estado
          }
        };
      } else {
        const estadoTexto = estado === 'Pendiente' ? 'pendiente de aprobación' : 'inactiva';
        return { success: false, message: `🚫 Tu cuenta está ${estadoTexto}. Contacta a soporte.` };
      }
    }
  }
  return { success: false, message: 'Credenciales incorrectas' };
}
