/**
 * SISTEMA INTEGRADO DE GESTIÓN - STYLE LUNA AZUL
 * Control estricto de acceso por Login
 */

const AppState = {
    currentUser: null,
    isStaticMode: false,
    users: [],
    services: [],
    barbers: [],
    appointments: [],
    inventory: [],
    sales: []
};

async function loadAppData() {
    try {
        const response = await fetch('/api/data');

        if (response.status === 404 || (response.ok && !response.headers.get('content-type')?.includes('application/json'))) {
            const fallbackResponse = await fetch('./base_de_datos_completa.json');
            if (!fallbackResponse.ok) {
                throw new Error('No se pudo cargar la información local del sistema.');
            }

            const data = await fallbackResponse.json();
            AppState.users = data.users || [];
            AppState.services = data.services || [];
            AppState.barbers = data.barbers || [];
            AppState.appointments = data.appointments || [];
            AppState.inventory = data.inventory || [];
            AppState.sales = data.sales || [];
            AppState.isStaticMode = true;
            return;
        }

        if (!response.ok) {
            throw new Error('No se pudo cargar la información del sistema');
        }

        const data = await response.json();
        AppState.users = data.users || [];
        AppState.services = data.services || [];
        AppState.barbers = data.barbers || [];
        AppState.appointments = data.appointments || [];
        AppState.inventory = data.inventory || [];
        AppState.sales = data.sales || [];
    } catch (error) {
        console.error(error);
        alert('No se pudo cargar la información del sistema.');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.view-module').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
}

function renderClientModule() {
    const serviceSelect = document.getElementById('bookService');
    const barberSelect = document.getElementById('bookBarber');
    const tableBody = document.getElementById('clientAppointmentsTable');

    if (!serviceSelect || !barberSelect || !tableBody) return;

    serviceSelect.innerHTML = AppState.services.map(s => `<option value="${s.name}">${s.name} ($${Number(s.price).toLocaleString()})</option>`).join('');
    barberSelect.innerHTML = AppState.barbers.map(b => `<option value="${b.name}">${b.name}</option>`).join('');

    const myApps = AppState.appointments.filter(a => a.client === AppState.currentUser?.name);

    if (myApps.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No tienes citas agendadas.</td></tr>';
        return;
    }

    tableBody.innerHTML = myApps.map(a => `
        <tr>
            <td class="p-3 font-medium text-slate-200">${a.service}</td>
            <td class="p-3">${a.barber}</td>
            <td class="p-3">${a.datetime.replace('T', ' ')}</td>
            <td class="p-3"><span class="badge-status badge-${a.status.toLowerCase()}">${a.status}</span></td>
            <td class="p-3">
                ${a.status === 'PENDIENTE' ? `<button onclick="cancelAppointment(${a.id})" class="text-rose-400 hover:text-rose-300 text-xs font-semibold">Cancelar</button>` : '-'}
            </td>
        </tr>
    `).join('');
}

function renderBarberModule() {
    const tableBody = document.getElementById('barberAgendaTable');
    if (!tableBody) return;

    const myAgenda = AppState.appointments.filter(a => a.barber === AppState.currentUser?.name);

    if (myAgenda.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No hay servicios asignados a tu nombre.</td></tr>';
        return;
    }

    tableBody.innerHTML = myAgenda.map(a => `
        <tr>
            <td class="p-3 font-mono text-sky-400">${a.datetime.split('T')[1]}</td>
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
    `).join('');
}

function renderAdminModule() {
    const totalRev = AppState.sales.reduce((acc, s) => acc + Number(s.amount || 0), 0);
    const lowStockCount = AppState.inventory.filter(i => i.stock <= i.min).length;

    const revenue = document.getElementById('metricRevenue');
    const appointments = document.getElementById('metricAppointments');
    const lowStock = document.getElementById('metricLowStock');
    const table = document.getElementById('adminInventoryTable');

    if (revenue) revenue.textContent = `$${totalRev.toLocaleString()} COP`;
    if (appointments) appointments.textContent = AppState.appointments.length;
    if (lowStock) lowStock.textContent = `${lowStockCount} Prod.`;
    if (table) {
        table.innerHTML = AppState.inventory.map(i => `
            <tr>
                <td class="p-2.5 font-medium text-slate-200">${i.name}</td>
                <td class="p-2.5 font-mono">${i.stock} un.</td>
                <td class="p-2.5">${i.stock <= i.min ? '<span class="text-amber-400 font-semibold text-xs">¡Bajo!</span>' : '<span class="text-emerald-400 text-xs">Normal</span>'}</td>
                <td class="p-2.5"><button onclick="addInventoryStock(${i.id})" class="text-sky-400 hover:text-sky-300 text-xs">+ Reabastecer</button></td>
            </tr>
        `).join('');
    }
}

async function cancelAppointment(id) {
    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CANCELADA' })
        });

        if (!response.ok) {
            throw new Error('No se pudo cancelar la cita');
        }

        await loadAppData();
        renderClientModule();
    } catch (error) {
        console.error(error);
        alert('No se pudo cancelar la cita.');
    }
}

async function updateAppointmentStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('No se pudo actualizar la cita');
        }

        await loadAppData();
        renderBarberModule();
    } catch (error) {
        console.error(error);
        alert('No se pudo actualizar la cita.');
    }
}

async function addInventoryStock(id) {
    try {
        const response = await fetch(`/api/inventory/${id}/reabastecer`, { method: 'PATCH' });
        if (!response.ok) {
            throw new Error('No se pudo reabastecer el stock');
        }

        await loadAppData();
        renderAdminModule();
    } catch (error) {
        console.error(error);
        alert('No se pudo reabastecer el inventario.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAppData();

    const loginForm = document.getElementById('loginForm');
    const btnLogout = document.getElementById('btnLogout');
    const bookingForm = document.getElementById('bookingForm');
    const posForm = document.getElementById('posForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('email').value.trim();
            const passInput = document.getElementById('password').value.trim();
            const authMsg = document.getElementById('authMessage');

            authMsg.classList.remove('hidden', 'bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400', 'bg-rose-500/10', 'border-rose-500/30', 'text-rose-400');

            try {
                if (AppState.isStaticMode) {
                    const user = AppState.users.find(
                        candidate => candidate.email === emailInput && candidate.password === passInput
                    );

                    if (!user) {
                        throw new Error('Credenciales inválidas. Revisa el correo o la contraseña.');
                    }

                    AppState.currentUser = {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        name: user.name
                    };
                } else {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailInput, password: passInput })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Credenciales inválidas');
                    }

                    AppState.currentUser = data.user;
                }

                document.getElementById('navUserSection').classList.remove('hidden');
                document.getElementById('userInfoName').textContent = AppState.currentUser.name;
                document.getElementById('userInfoRole').textContent = `Rol: ${AppState.currentUser.role}`;

                authMsg.classList.add('bg-emerald-500/10', 'border-emerald-500/30', 'text-emerald-400');
                authMsg.textContent = `Acceso concedido. Cargando módulo de ${AppState.currentUser.role}...`;

                setTimeout(() => {
                    authMsg.classList.add('hidden');

                    if (AppState.currentUser.role === 'CLIENT') {
                        showSection('mod-client');
                        renderClientModule();
                    } else if (AppState.currentUser.role === 'BARBER') {
                        showSection('mod-barber');
                        renderBarberModule();
                    } else if (AppState.currentUser.role === 'ADMIN') {
                        showSection('mod-admin');
                        renderAdminModule();
                    }
                }, 500);
            } catch (error) {
                authMsg.classList.add('bg-rose-500/10', 'border-rose-500/30', 'text-rose-400');
                authMsg.textContent = error.message || 'Credenciales inválidas. Revisa el correo o la contraseña.';
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            AppState.currentUser = null;
            document.getElementById('navUserSection').classList.add('hidden');
            if (loginForm) loginForm.reset();
            showSection('mod-auth');
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const service = document.getElementById('bookService').value;
            const barber = document.getElementById('bookBarber').value;
            const datetime = document.getElementById('bookDateTime').value;

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client: AppState.currentUser.name,
                        service,
                        barber,
                        datetime,
                        status: 'PENDIENTE'
                    })
                });

                if (!response.ok) {
                    throw new Error('No se pudo agendar la cita');
                }

                await loadAppData();
                alert('¡Reserva confirmada con éxito!');
                bookingForm.reset();
                renderClientModule();
            } catch (error) {
                console.error(error);
                alert('No se pudo crear la cita.');
            }
        });
    }

    if (posForm) {
        posForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const concept = document.getElementById('posConcept').value;
            const amount = Number(document.getElementById('posAmount').value);
            const payment = document.getElementById('posPayment').value;

            try {
                const response = await fetch('/api/sales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ concept, amount, payment })
                });

                if (!response.ok) {
                    throw new Error('No se pudo registrar la venta');
                }

                await loadAppData();
                posForm.reset();
                renderAdminModule();
            } catch (error) {
                console.error(error);
                alert('No se pudo registrar el ingreso en caja.');
            }
        });
    }
});