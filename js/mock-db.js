// SIMULACIÓN DE TUS HOJAS DE GOOGLE SHEETS

const DB = {
    EMPRESAS: [
        { idEmpresa: "SPRI001", tag: "SPRITZ CATERING" },
        { idEmpresa: "ALF001", tag: "ALFA GOURMET" }
    ],
    ALMACENES: [
        { idAlmacen: "A_SPRI_01", idEmpresa: "SPRI001", tipo: "Secundario", nombre: "Punto Venta Spritz", esPuntoDePedido: true, activo: true },
        { idAlmacen: "A_ALF_01", idEmpresa: "ALF001", tipo: "Secundario", nombre: "Cocina Alfa", esPuntoDePedido: true, activo: true }
    ],
    USUARIOS: [
        { id: "Usr_01", nombre: "Admin Prueba", contrasena: "1234", email: "admin@prueba.com", idEmpresa: "SPRI001", idAlmacen: "A_SPRI_01", estado: "Activo" }
    ],
    PRODUCTOS: [
        // id, codAlfa, codBeta, nombre, unidad, cat, factor, costo, stockAlfa, stockBeta, stockTotal
        { id: "P001", alfa: "A01", beta: "B01", nombre: "Carne de Res", unidad: "Kg", cat: "01-PROTE", factor: 1, costo: "Kg", stAlfa: 10, stBeta: 5, stTotal: 15 },
        { id: "P002", alfa: "A02", beta: "B02", nombre: "Papas Fritas", unidad: "Bolsa", cat: "02-VEGFR", factor: 1, costo: "Bolsa", stAlfa: 20, stBeta: 20, stTotal: 40 },
        { id: "P003", alfa: "A03", beta: "B03", nombre: "Aceite de Oliva", unidad: "Litro", cat: "03-ABARR", factor: 1, costo: "Litro", stAlfa: 0, stBeta: 10, stTotal: 10 }
    ]
};
