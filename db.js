// ============================================
// JanQ Database - Multiempresa con Firebase
// ============================================

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBr9RNzKpzIZ19BJ7zhSxFm-VqH6iDLluk",
  authDomain: "janq-erp.firebaseapp.com",
  projectId: "janq-erp",
  storageBucket: "janq-erp.firebasestorage.app",
  messagingSenderId: "5417350393",
  appId: "1:5417350393:web:a16e2f8dcb427f7a755e28",
  measurementId: "G-WSDR4K0VCT"
};

// Inicializar Firebase (usando CDN, no módulos)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ==================== AUTENTICACIÓN ====================
async function registerUser(email, password, name, companyId, role = 'user') {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        await db.collection('users').doc(uid).set({
            email, name, role, companyId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, uid };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        return { success: true, user: { uid, ...userData } };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function logoutUser() {
    await auth.signOut();
}

// ==================== EMPRESAS ====================
async function createCompany(name, plan = 'basic', modules = ['ventas', 'inventario', 'clientes']) {
    const companyRef = await db.collection('companies').add({
        name, plan, modules,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true
    });
    return companyRef.id;
}

async function getCompanies() {
    const snapshot = await db.collection('companies').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getCompany(companyId) {
    const doc = await db.collection('companies').doc(companyId).get();
    return { id: doc.id, ...doc.data() };
}

// ==================== DATOS POR EMPRESA ====================
function getCollectionRef(companyId, collectionName) {
    return db.collection('companies').doc(companyId).collection(collectionName);
}

// ----- PRODUCTOS -----
async function getProductos(companyId) {
    const snapshot = await getCollectionRef(companyId, 'productos').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addProducto(companyId, producto) {
    const docRef = await getCollectionRef(companyId, 'productos').add({
        ...producto,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...producto };
}
async function updateProducto(companyId, productId, data) {
    await getCollectionRef(companyId, 'productos').doc(productId).update(data);
}
async function deleteProducto(companyId, productId) {
    await getCollectionRef(companyId, 'productos').doc(productId).delete();
}

// ----- VENTAS -----
async function getVentas(companyId, limit = 100) {
    const snapshot = await getCollectionRef(companyId, 'ventas')
        .orderBy('fecha', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addVenta(companyId, venta) {
    const docRef = await getCollectionRef(companyId, 'ventas').add({
        ...venta,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...venta };
}

// ----- CLIENTES -----
async function getClientes(companyId) {
    const snapshot = await getCollectionRef(companyId, 'clientes').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addCliente(companyId, cliente) {
    const docRef = await getCollectionRef(companyId, 'clientes').add(cliente);
    return { id: docRef.id, ...cliente };
}
async function deleteCliente(companyId, clienteId) {
    await getCollectionRef(companyId, 'clientes').doc(clienteId).delete();
}

// ----- PROVEEDORES -----
async function getProveedores(companyId) {
    const snapshot = await getCollectionRef(companyId, 'proveedores').orderBy('nombre').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addProveedor(companyId, proveedor) {
    const docRef = await getCollectionRef(companyId, 'proveedores').add(proveedor);
    return { id: docRef.id, ...proveedor };
}
async function deleteProveedor(companyId, proveedorId) {
    await getCollectionRef(companyId, 'proveedores').doc(proveedorId).delete();
}

// ----- COMPRAS -----
async function getCompras(companyId, limit = 50) {
    const snapshot = await getCollectionRef(companyId, 'compras')
        .orderBy('fecha', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addCompra(companyId, compra) {
    const docRef = await getCollectionRef(companyId, 'compras').add({
        ...compra,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...compra };
}

// ----- MOVIMIENTOS (KARDEX) -----
async function getMovimientos(companyId, productoId = null, limit = 200) {
    let query = getCollectionRef(companyId, 'movimientos').orderBy('fecha', 'desc').limit(limit);
    if (productoId) query = query.where('productoId', '==', productoId);
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
async function addMovimiento(companyId, movimiento) {
    const docRef = await getCollectionRef(companyId, 'movimientos').add({
        ...movimiento,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...movimiento };
}

// ==================== ESTADO DE SESIÓN ====================
let currentUser = null;
let currentCompany = null;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            currentUser = { uid: user.uid, ...userDoc.data() };
            if (currentUser.companyId) {
                currentCompany = await getCompany(currentUser.companyId);
            }
        }
        const path = window.location.pathname;
        if (path === '/' || path.includes('index.html')) {
            if (currentUser.role === 'super_admin') {
                window.location.href = 'admin.html';
            } else if (currentUser.companyId) {
                window.location.href = 'dashboard.html';
            }
        }
    } else {
        currentUser = null;
        currentCompany = null;
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    }
});

window.JanQ = {
    auth, db,
    registerUser, loginUser, logoutUser,
    createCompany, getCompanies, getCompany,
    getProductos, addProducto, updateProducto, deleteProducto,
    getVentas, addVenta,
    getClientes, addCliente, deleteCliente,
    getProveedores, addProveedor, deleteProveedor,
    getCompras, addCompra,
    getMovimientos, addMovimiento,
    getCurrentUser: () => currentUser,
    getCurrentCompany: () => currentCompany
};
