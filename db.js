// ============================================
// JanQ Database System - Multi-usuario
// Base de datos aislada por usuario
// ============================================

class JanQDatabase {
    constructor(userEmail) {
        this.userEmail = userEmail;
        this.dbKey = `janq_db_${userEmail}`;
        this.initDatabase();
    }
    
    // Inicializar base de datos del usuario
    initDatabase() {
        if (!localStorage.getItem(this.dbKey)) {
            const emptyDB = {
                version: '1.0',
                user: this.userEmail,
                createdAt: new Date().toISOString(),
                collections: {
                    productos: [],
                    ventas: [],
                    clientes: [],
                    proveedores: [],
                    compras: [],
                    configuracion: {},
                    analytics: []
                }
            };
            localStorage.setItem(this.dbKey, JSON.stringify(emptyDB));
        }
    }
    
    // Obtener toda la base de datos
    getDB() {
        return JSON.parse(localStorage.getItem(this.dbKey));
    }
    
    // Guardar base de datos
    saveDB(db) {
        localStorage.setItem(this.dbKey, JSON.stringify(db));
    }
    
    // ========== CRUD Productos ==========
    getProductos() {
        const db = this.getDB();
        return db.collections.productos;
    }
    
    addProducto(producto) {
        const db = this.getDB();
        producto.id = Date.now();
        producto.createdAt = new Date().toISOString();
        db.collections.productos.push(producto);
        this.saveDB(db);
        return producto;
    }
    
    updateProducto(id, data) {
        const db = this.getDB();
        const index = db.collections.productos.findIndex(p => p.id === id);
        if (index !== -1) {
            db.collections.productos[index] = { ...db.collections.productos[index], ...data };
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    deleteProducto(id) {
        const db = this.getDB();
        db.collections.productos = db.collections.productos.filter(p => p.id !== id);
        this.saveDB(db);
        return true;
    }
    
    // ========== CRUD Ventas ==========
    getVentas() {
        const db = this.getDB();
        return db.collections.ventas;
    }
    
    addVenta(venta) {
        const db = this.getDB();
        venta.id = Date.now();
        venta.createdAt = new Date().toISOString();
        db.collections.ventas.push(venta);
        this.saveDB(db);
        return venta;
    }
    
    // ========== CRUD Clientes ==========
    getClientes() {
        const db = this.getDB();
        return db.collections.clientes;
    }
    
    addCliente(cliente) {
        const db = this.getDB();
        cliente.id = Date.now();
        cliente.createdAt = new Date().toISOString();
        db.collections.clientes.push(cliente);
        this.saveDB(db);
        return cliente;
    }
    
    deleteCliente(id) {
        const db = this.getDB();
        db.collections.clientes = db.collections.clientes.filter(c => c.id !== id);
        this.saveDB(db);
        return true;
    }
    
    // ========== CRUD Proveedores ==========
    getProveedores() {
        const db = this.getDB();
        return db.collections.proveedores;
    }
    
    addProveedor(proveedor) {
        const db = this.getDB();
        proveedor.id = Date.now();
        db.collections.proveedores.push(proveedor);
        this.saveDB(db);
        return proveedor;
    }
    
    deleteProveedor(id) {
        const db = this.getDB();
        db.collections.proveedores = db.collections.proveedores.filter(p => p.id !== id);
        this.saveDB(db);
        return true;
    }
    
    // ========== CRUD Compras ==========
    getCompras() {
        const db = this.getDB();
        return db.collections.compras;
    }
    
    addCompra(compra) {
        const db = this.getDB();
        compra.id = Date.now();
        db.collections.compras.push(compra);
        this.saveDB(db);
        return compra;
    }
    
    // ========== Estadísticas ==========
    getStats() {
        const db = this.getDB();
        return {
            totalProductos: db.collections.productos.length,
            totalVentas: db.collections.ventas.length,
            totalClientes: db.collections.clientes.length,
            totalProveedores: db.collections.proveedores.length,
            ingresosTotales: db.collections.ventas.reduce((sum, v) => sum + v.total, 0),
            productosBajoStock: db.collections.productos.filter(p => p.stock < 5).length
        };
    }
    
    // Exportar/Importar datos
    exportData() {
        const db = this.getDB();
        return JSON.stringify(db.collections, null, 2);
    }
    
    importData(data) {
        const db = this.getDB();
        const imported = JSON.parse(data);
        db.collections = { ...db.collections, ...imported };
        this.saveDB(db);
        return true;
    }
}

// Exportar para uso global
window.JanQDatabase = JanQDatabase;
