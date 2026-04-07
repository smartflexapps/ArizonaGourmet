<!DOCTYPE html>
<html lang='es'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Iniciar Sesión</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 450px;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #333;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }
    
    .form-group input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.3s;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    
    .btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .message {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 500;
    }
    
    .message.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    .message.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    .registro-link {
      text-align: center;
      margin-top: 20px;
      color: #666;
      font-size: 14px;
    }
    
    .registro-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    
    .registro-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'>
      <h1>Iniciar Sesión</h1>
      <p>Ingresa tus credenciales para continuar</p>
    </div>
    
    <div id='messageContainer'></div>
    
    <form id='loginForm'>
      <div class='form-group'>
        <label for='useremail'>Correo Electrónico</label>
        <input type='email' id='useremail' name='useremail' required placeholder='tu@email.com' autocomplete='email'>
      </div>
      
      <div class='form-group'>
        <label for='contrasena'>Contraseña</label>
        <input type='password' id='contrasena' name='contrasena' required placeholder='Tu contraseña' autocomplete='current-password'>
      </div>
      
      <button type='submit' class='btn' id='btnLogin'>Iniciar Sesión</button>
    </form>
    
    <div class='registro-link'>
      ¿No tienes cuenta? <a href='#' onclick='irARegistro(); return false;'>Regístrate aquí</a>
    </div>
  </div>

  <script>
    // Manejar login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const useremail = document.getElementById('useremail').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();
      
      // Validaciones
      if (!useremail || !contrasena) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
      }
      
      const btnLogin = document.getElementById('btnLogin');
      btnLogin.disabled = true;
      btnLogin.textContent = 'Iniciando...';
      
      google.script.run
        .withSuccessHandler(loginExitoso)
        .withFailureHandler(loginFallido)
        .validarLogin(useremail, contrasena);
    });
    
    function loginExitoso(response) {
      const btnLogin = document.getElementById('btnLogin');
      btnLogin.disabled = false;
      btnLogin.textContent = 'Iniciar Sesión';
      
      if (response.success) {
        // Guardar datos de sesión en localStorage
        const sessionData = {
          idUsuario: response.usuario.idUsuario,
          nombre: response.usuario.nombre,
          idEmpresa: response.usuario.idEmpresa,
          idAlmacen: response.usuario.idAlmacen,
          rol: response.usuario.rol,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        
        // Mensaje de éxito
        mostrarMensaje('Inicio de sesión exitoso. Redirigiendo...', 'success');
        
        // Cerrar diálogo y abrir catálogo (cuando exista)
        setTimeout(() => {
          google.script.host.close();
          // Aquí iría la función para abrir el catálogo
          // google.script.run.mostrarCatalogo();
          google.script.run.mostrarCatalogo();
        }, 1500);
      } else {
        mostrarMensaje(response.message, 'error');
      }
    }
    
    function loginFallido(error) {
      mostrarMensaje('Error al iniciar sesión: ' + error, 'error');
      document.getElementById('btnLogin').disabled = false;
      document.getElementById('btnLogin').textContent = 'Iniciar Sesión';
    }
    
    function mostrarMensaje(texto, tipo) {
      const container = document.getElementById('messageContainer');
      container.innerHTML = `<div class='message ${tipo}'>${texto}</div>`;
    }
    
    function irARegistro() {
  window.location.href = '?p=Register';
}
  </script>
</body>
</html>
