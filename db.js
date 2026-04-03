// ============================================
// JanQ Database System - Multi-tenant
// Cada empresa tiene su propia base de datos
// ============================================

class JanQDatabase {
    constructor(companyId) {
        this.companyId = companyId;
        this.dbKey = `janq_db_${companyId}`;
        this.initDatabase();
    }
    
    initDatabase() {
        if (!localStorage.getItem(this.dbKey)) {
            const emptyDB = {
                version: '1.0',
                companyId: this.companyId,
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
    
    getDB() {
        return JSON.parse(localStorage.getItem(this.dbKey));
    }
    
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
    
    // Exportar/Importar
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

// Sistema de gestión de empresas y usuarios
class JanQAdmin {
    constructor() {
        this.initSystem();
    }
    
    initSystem() {
        if (!localStorage.getItem('janq_companies')) {
            const companies = {};
            localStorage.setItem('janq_companies', JSON.stringify(companies));
        }
        if (!localStorage.getItem('janq_users')) {
            const users = {};
            localStorage.setItem('janq_users', JSON.stringify(users));
        }
    }
    
    // ========== Gestión de Empresas ==========
    getCompanies() {
        return JSON.parse(localStorage.getItem('janq_companies'));
    }
    
    createCompany(name, plan = 'basic', modules = ['ventas', 'inventario', 'clientes']) {
        const companies = this.getCompanies();
        const companyId = 'comp_' + Date.now();
        companies[companyId] = {
            id: companyId,
            name: name,
            plan: plan,
            modules: modules,
            createdAt: new Date().toISOString(),
            active: true
        };
        localStorage.setItem('janq_companies', JSON.stringify(companies));
        
        // Crear base de datos para la empresa
        new JanQDatabase(companyId);
        return companyId;
    }
    
    updateCompany(companyId, data) {
        const companies = this.getCompanies();
        if (companies[companyId]) {
            companies[companyId] = { ...companies[companyId], ...data };
            localStorage.setItem('janq_companies', JSON.stringify(companies));
            return true;
        }
        return false;
    }
    
    deleteCompany(companyId) {
        const companies = this.getCompanies();
        if (companies[companyId]) {
            delete companies[companyId];
            localStorage.setItem('janq_companies', JSON.stringify(companies));
            localStorage.removeItem(`janq_db_${companyId}`);
            return true;
        }
        return false;
    }
    
    // ========== Gestión de Usuarios ==========
    getUsers() {
        return JSON.parse(localStorage.getItem('janq_users'));
    }
    
    createUser(email, password, name, companyId, role = 'user', modules = null) {
        const users = this.getUsers();
        const companies = this.getCompanies();
        
        if (users[email]) return false;
        if (!companies[companyId]) return false;
        
        users[email] = {
            email: email,
            password: password,
            name: name,
            companyId: companyId,
            role: role,
            modules: modules || companies[companyId].modules,
            createdAt: new Date().toISOString(),
            active: true
        };
        localStorage.setItem('janq_users', JSON.stringify(users));
        return true;
    }
    
    updateUser(email, data) {
        const users = this.getUsers();
        if (users[email]) {
            users[email] = { ...users[email], ...data };
            localStorage.setItem('janq_users', JSON.stringify(users));
            return true;
        }
        return false;
    }
    
    deleteUser(email) {
        const users = this.getUsers();
        if (users[email]) {
            delete users[email];
            localStorage.setItem('janq_users', JSON.stringify(users));
            return true;
        }
        return false;
    }
    
    // ========== Autenticación ==========
    authenticate(email, password) {
        const users = this.getUsers();
        const user = users[email];
        if (user && user.password === password && user.active) {
            return user;
        }
        return null;
    }
    
    // ========== Obtener empresa del usuario ==========
    getUserCompany(email) {
        const users = this.getUsers();
        const user = users[email];
        if (user) {
            const companies = this.getCompanies();
            return companies[user.companyId];
        }
        return null;
    }
    
    // ========== Verificar acceso a módulo ==========
    canAccessModule(email, moduleName) {
        const users = this.getUsers();
        const user = users[email];
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.modules.includes(moduleName);
    }
}

window.JanQDatabase = JanQDatabase;
window.JanQAdmin = JanQAdmin;
window.janqAdmin = new JanQAdmin();
