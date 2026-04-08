// VARIABLES GLOBALES
let usuarioActual = null;
let carrito = [];

// --- NAVEGACIÓN ---
function mostrarPantalla(id) {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.add('oculto'));
    document.getElementById(`pantalla-${id}`).classList.remove('oculto');
    
    if(id === 'catalogo') renderizarCatalogo();
    if(id === 'carrito') renderizarCarrito();
    if(id === 'registro') cargarEmpresas();
}

// --- LOGICA DE LOGIN ---
function hacerLogin() {
    const email = document.getElementById('login-email').value.toLowerCase();
    const pass = document.getElementById('login-pass').value;
    const user = DB.USUARIOS.find(u => u.email.toLowerCase() === email && u.contrasena === pass);

    if (user && user.estado === 'Activo') {
        usuarioActual = user;
        document.getElementById('navbar').classList.remove('hidden');
        document.getElementById('user-info').innerText = `Hola, ${user.nombre}`;
        mostrarPantalla('catalogo');
    } else {
        document.getElementById('login-error').innerText = "Credenciales incorrectas o usuario inactivo.";
    }
}

function cerrarSesion() {
    usuarioActual = null;
    carrito = [];
    document.getElementById('navbar').classList.add('hidden');
    mostrarPantalla('login');
}

// --- LOGICA DE REGISTRO ---
function cargarEmpresas() {
    const select = document.getElementById('reg-empresa');
    select.innerHTML = '<option value="">Seleccione Empresa...</option>';
    DB.EMPRESAS.forEach(e => select.innerHTML += `<option value="${e.idEmpresa}">${e.tag}</option>`);
}

function cargarAlmacenes() {
    const idEmpresa = document.getElementById('reg-empresa').value;
    const select = document.getElementById('reg-almacen');
    select.innerHTML = '<option value="">Seleccione Almacén...</option>';
    const filtrados = DB.ALMACENES.filter(a => a.idEmpresa === idEmpresa && a.activo && a.esPuntoDePedido);
    filtrados.forEach(a => select.innerHTML += `<option value="${a.idAlmacen}">${a.nombre}</option>`);
}

function hacerRegistro() {
    const nombre = document.getElementById('reg-nombre').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const idEmpresa = document.getElementById('reg-empresa').value;
    const idAlmacen = document.getElementById('reg-almacen').value;

    if(DB.USUARIOS.find(u => u.email === email)) {
        document.getElementById('reg-msg').innerText = "❌ El email ya existe.";
        return;
    }

    DB.USUARIOS.push({ id: "Usr_" + Math.floor(Math.random()*100), nombre, contrasena: pass, email, idEmpresa, idAlmacen, estado: "Activo" });
    document.getElementById('reg-msg').innerHTML = "✅ Registro exitoso. <a href='#' onclick=\"mostrarPantalla('login')\">Inicia sesión</a>";
}

// --- LOGICA DEL CATÁLOGO CON TARJETAS CLICKEABLES ---
function renderizarCatalogo() {
    const contenedor = document.getElementById('grid-productos');
    contenedor.innerHTML = '';

    let entidadWeb = usuarioActual.idEmpresa.startsWith('SPRI') ? 'SPRITZ' : (usuarioActual.idEmpresa.startsWith('ALF') ? 'CATERING' : 'GOURMET');

    DB.PRODUCTOS.forEach(prod => {
        let stock = 0;
        if (entidadWeb === 'CATERING') stock = prod.stAlfa;
        else if (entidadWeb === 'GOURMET') stock = prod.stBeta;
        else if (entidadWeb === 'SPRITZ') stock = prod.stTotal;

        if (stock > 0) {
            // Diseño de tarjeta Tailwind (Botón gigante)
            contenedor.innerHTML += `
                <div class="bg-white rounded-2xl shadow hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col border border-gray-100"
                     onclick="agregarAlCarrito('${prod.id}', '${prod.nombre}', ${stock}, '${prod.unidad}')">
                    
                    <div class="p-5 flex-grow">
                        <span class="text-xs font-bold text-blue-500 uppercase tracking-wider">${prod.cat}</span>
                        <h3 class="text-xl font-bold text-gray-800 mt-1">${prod.nombre}</h3>
                        <p class="text-sm text-gray-500 mt-2">Disponible: <span class="font-bold text-green-600">${stock} ${prod.unidad}</span></p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <label class="text-sm font-semibold text-gray-600">Cant:</label>
                            <!-- event.stopPropagation() evita que al dar clic en el input, se ejecute el clic de toda la tarjeta -->
                            <input type="number" id="cant-${prod.id}" value="1" min="1" max="${stock}" 
                                   onclick="event.stopPropagation()" 
                                   class="w-16 p-1 text-center border rounded-md shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400">
                        </div>
                        <div class="bg-blue-100 text-blue-600 p-2 rounded-full">
                            🛒
                        </div>
                    </div>
                </div>
            `;
        }
    });
}

// --- LOGICA DEL CARRITO ---
function agregarAlCarrito(id, nombre, stockMax, unidad) {
    const cantidad = parseInt(document.getElementById(`cant-${id}`).value);
    if(cantidad > stockMax || cantidad <= 0) return alert("Cantidad inválida o excede el stock");

    const itemExistente = carrito.find(i => i.id === id);
    if(itemExistente) itemExistente.cantidad = cantidad;
    else carrito.push({ id, nombre, cantidad, unidad });

    document.getElementById('cart-count').innerText = carrito.length;
    alert("Agregado al carrito!");
}

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    lista.innerHTML = '';
    if(carrito.length === 0) return lista.innerHTML = "<p>El carrito está vacío.</p>";

    carrito.forEach((item, index) => {
        lista.innerHTML += `
            <div class="carrito-item">
                <span><b>${item.nombre}</b> - ${item.cantidad} ${item.unidad}</span>
                <button style="background: red; color:white; border:none; padding:5px; border-radius:3px;" onclick="eliminarItem(${index})">X</button>
            </div>
        `;
    });
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    document.getElementById('cart-count').innerText = carrito.length;
    renderizarCarrito();
}

// --- PROCESAR PEDIDO (Simulación de tu procesarPedidoConLogin) ---
function procesarPedido() {
    if(carrito.length === 0) return alert("Agrega productos antes de confirmar.");
    
    // Aquí es donde normalmente enviarías el objeto "carrito" a tu Apps Script usando google.script.run
    
    // Simulación de éxito
    document.getElementById('checkout-msg').innerText = "✅ ¡Procesando pedido...!";
    
    setTimeout(() => {
        alert("¡Pedido generado exitosamente! ID: PED_" + usuarioActual.id + "_" + Math.floor(Math.random()*1000));
        carrito = [];
        document.getElementById('cart-count').innerText = "0";
        mostrarPantalla('catalogo');
        document.getElementById('checkout-msg').innerText = "";
    }, 1500);
}
