/**
 * SISTEMA INTEGRADO DE GESTIÓN - STYLE LUNA AZUL
 * Control estricto de acceso por Login
 */

// 1. BASE DE DATOS Y ESTADO DEL SISTEMA
const AppState = {
    currentUser: null,

    // Usuarios del sistema con nombres reales del proyecto
    users: [
        { email: "admin@lunaazul.com", pass: "1234", role: "ADMIN", name: "Steven Avilés" },
        { email: "mildrey@lunaazul.com", pass: "1234", role: "ADMIN", name: "Mildrey Celis" },
        { email: "cesar@lunaazul.com", pass: "1234", role: "ADMIN", name: "Julio Porras" },
        { email: "barbero@lunaazul.com", pass: "1234", role: "BARBER", name: "Alexander Oviedo" },
        { email: "cliente@lunaazul.com", pass: "1234", role: "CLIENT", name: "Juan Pérez" }
    ],

    services: [
        { name: "Corte Tradicional", price: 20000 },
        { name: "Arreglo de Barba", price: 12000 },
        { name: "Combo Luna Azul", price: 28000 }
    ],

    barbers: ["Alexander Oviedo", "Carlos Barber"],

    appointments: [
        { id: 101, client: "Juan Pérez", service: "Corte Tradicional", barber: "Alexander Oviedo", datetime: "2026-09-02T10:00", status: "PENDIENTE" },
        { id: 102, client: "Mildrey Celis", service: "Combo Luna Azul", barber: "Alexander Oviedo", datetime: "2026-09-02T11:30", status: "COMPLETADA" },
        { id: 103, client: "Julio Porras", service: "Arreglo de Barba", barber: "Carlos Barber", datetime: "2026-09-02T14:00", status: "PENDIENTE" }
    ],

    inventory: [
        { id: 1, name: "Cera Peinado Mate", stock: 12, min: 5 },
        { id: 2, name: "Aceite para Barba", stock: 2, min: 4 },
        { id: 3, name: "Shampoo Anticaída", stock: 8, min: 3 }
    ],

    sales: [
        { id: 1, concept: "Corte Caballero", amount: 20000, payment: "Efectivo" },
        { id: 2, concept: "Combo Luna Azul", amount: 28000, payment: "Transferencia" }
    ]
};

// 2. CONTROLADOR DE CAMBIO DE PANTALLAS
function showSection(sectionId) {
    document.querySelectorAll(".view-module").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add("active");
    }
}

// 3. RENDERIZADO DE MÓDULOS SEGÚN EL ROL AUTENTICADO

// Módulo Cliente
function renderClientModule() {
    const serviceSelect = document.getElementById("bookService");
    const barberSelect = document.getElementById("bookBarber");
    const tableBody = document.getElementById("clientAppointmentsTable");

    serviceSelect.innerHTML = AppState.services.map(s => `<option value="${s.name}">${s.name} ($${s.price.toLocaleString()})</option>`).join("");
    barberSelect.innerHTML = AppState.barbers.map(b => `<option value="${b}">${b}</option>`).join("");

    const myApps = AppState.appointments.filter(a => a.client === AppState.currentUser.name);

    if (myApps.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No tienes citas agendadas.</td></tr>`;
        return;
    }

    tableBody.innerHTML = myApps.map(a => `
        <tr>
            <td class="p-3 font-medium text-slate-200">${a.service}</td>
            <td class="p-3">${a.barber}</td>
            <td class="p-3">${a.datetime.replace("T", " ")}</td>
            <td class="p-3"><span class="badge-status badge-${a.status.toLowerCase()}">${a.status}</span></td>
            <td class="p-3">
                ${a.status === 'PENDIENTE' ? `<button onclick="cancelAppointment(${a.id})" class="text-rose-400 hover:text-rose-300 text-xs font-semibold">Cancelar</button>` : '-'}
            </td>
        </tr>
    `).join("");
}

// Módulo Barbero
function renderBarberModule() {
    const tableBody = document.getElementById("barberAgendaTable");
    const myAgenda = AppState.appointments.filter(a => a.barber === AppState.currentUser.name);

    if (myAgenda.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No hay servicios asignados a tu nombre.</td></tr>`;
        return;
    }

    tableBody.innerHTML = myAgenda.map(a => `
        <tr>
            <td class="p-3 font-mono text-sky-400">${a.datetime.split("T")[1]}</td>
            <td class="p-3 font-medium text-slate-200">${a.client}</td>
            <td class="p-3">${a.service}</td>
            <td class="p-3"><span class="badge-status badge-${a.status.toLowerCase()}">${a.status}</span></td>
            <td class="p-3 space-x-2">
                ${a.status === 'PENDIENTE' ? `
                    <button onclick="updateAppointmentStatus(${a.id}, 'COMPLETADA')" class="bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 px-2.5 py-1 rounded text-xs">Completar</button>
                    <button onclick="updateAppointmentStatus(${a.id}, 'CANCELADA')" class="bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 px-2.5 py-1 rounded text-xs">Cancelar</button>
                ` : '<span class="text-xs text-slate-500">Finalizada</span>'}
            </td>
        </tr>
    `).join("");
}

// Módulo Administrador
function renderAdminModule() {
    const totalRev = AppState.sales.reduce((acc, s) => acc + s.amount, 0);
    const lowStockCount = AppState.inventory.filter(i => i.stock <= i.min).length;

    document.getElementById("metricRevenue").textContent = `$${totalRev.toLocaleString()} COP`;
    document.getElementById("metricAppointments").textContent = AppState.appointments.length;
    document.getElementById("metricLowStock").textContent = `${lowStockCount} Prod.`;

    document.getElementById("adminInventoryTable").innerHTML = AppState.inventory.map(i => `
        <tr>
            <td class="p-2.5 font-medium text-slate-200">${i.name}</td>
            <td class="p-2.5 font-mono">${i.stock} un.</td>
            <td class="p-2.5">${i.stock <= i.min ? '<span class="text-amber-400 font-semibold text-xs">¡Bajo!</span>' : '<span class="text-emerald-400 text-xs">Normal</span>'}</td>
            <td class="p-2.5"><button onclick="addInventoryStock(${i.id})" class="text-sky-400 hover:text-sky-300 text-xs">+ Reabastecer</button></td>
        </tr>
    `).join("");
}

// 4. ACCIONES INTERACTIVAS INTERNAS
function cancelAppointment(id) {
    const app = AppState.appointments.find(a => a.id === id);
    if (app) {
        app.status = "CANCELADA";
        renderClientModule();
    }
}

function updateAppointmentStatus(id, newStatus) {
    const app = AppState.appointments.find(a => a.id === id);
    if (app) {
        app.status = newStatus;
        renderBarberModule();
    }
}

function addInventoryStock(id) {
    const item = AppState.inventory.find(i => i.id === id);
    if (item) {
        item.stock += 5;
        renderAdminModule();
    }
}

// 5. INICIALIZACIÓN Y EVENTOS DE FORMULARIO
document.addEventListener("DOMContentLoaded", () => {

    // Evento Formulario de Login
    document.getElementById("loginForm").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById("email").value.trim();
        const passInput = document.getElementById("password").value.trim();
        const authMsg = document.getElementById("authMessage");

        // Búsqueda estricta del usuario
        const userFound = AppState.users.find(u => u.email === emailInput && u.pass === passInput);

        authMsg.classList.remove("hidden", "bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400", "bg-rose-500/10", "border-rose-500/30", "text-rose-400");

        if (userFound) {
            AppState.currentUser = userFound;

            // Actualizar interfaz superior
            document.getElementById("navUserSection").classList.remove("hidden");
            document.getElementById("userInfoName").textContent = userFound.name;
            document.getElementById("userInfoRole").textContent = `Rol: ${userFound.role}`;

            authMsg.classList.add("bg-emerald-500/10", "border-emerald-500/30", "text-emerald-400");
            authMsg.textContent = `Acceso concedido. Cargando módulo de ${userFound.role}...`;

            setTimeout(() => {
                authMsg.classList.add("hidden");
                
                // Redirección estricta según el rol autenticado
                if (userFound.role === "CLIENT") {
                    showSection("mod-client");
                    renderClientModule();
                } else if (userFound.role === "BARBER") {
                    showSection("mod-barber");
                    renderBarberModule();
                } else if (userFound.role === "ADMIN") {
                    showSection("mod-admin");
                    renderAdminModule();
                }
            }, 500);

        } else {
            authMsg.classList.add("bg-rose-500/10", "border-rose-500/30", "text-rose-400");
            authMsg.textContent = "Credenciales inválidas. Revisa el correo o la contraseña.";
        }
    });

    // Evento Cerrar Sesión
    document.getElementById("btnLogout").addEventListener("click", () => {
        AppState.currentUser = null;
        document.getElementById("navUserSection").classList.add("hidden");
        document.getElementById("loginForm").reset();
        showSection("mod-auth");
    });

    // Evento Agendar Cita (Cliente)
    document.getElementById("bookingForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const service = document.getElementById("bookService").value;
        const barber = document.getElementById("bookBarber").value;
        const datetime = document.getElementById("bookDateTime").value;

        AppState.appointments.push({
            id: Date.now(),
            client: AppState.currentUser.name,
            service,
            barber,
            datetime,
            status: "PENDIENTE"
        });

        alert("¡Reserva confirmada con éxito!");
        document.getElementById("bookingForm").reset();
        renderClientModule();
    });

    // Evento Registrar Venta (Admin POS)
    document.getElementById("posForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const concept = document.getElementById("posConcept").value;
        const amount = parseFloat(document.getElementById("posAmount").value);
        const payment = document.getElementById("posPayment").value;

        AppState.sales.push({ id: Date.now(), concept, amount, payment });
        document.getElementById("posForm").reset();
        renderAdminModule();
    });
});