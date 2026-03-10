/**
 * Module Gestion des Clients
 * Mini-CRM pour agents immobiliers, notaires et conseillers en investissement
 * Stockage local (localStorage) avec interface CRUD complète
 */

const STORAGE_KEY = 'immosim_clients';

let clients = [];
let editingClientId = null;

export function initClientManager() {
    loadClients();
    renderClients();
    setupClientEvents();
}

// ===== STORAGE =====

function loadClients() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        clients = stored ? JSON.parse(stored) : getSampleClients();
        if (!stored) saveClients();
    } catch {
        clients = getSampleClients();
    }
}

function saveClients() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function getSampleClients() {
    return [
        {
            id: generateId(),
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie.martin@email.com',
            phone: '06 12 34 56 78',
            status: 'active',
            type: 'buyer',
            notes: 'Budget 350K€, cherche T3 Lyon 3e ou 6e, proche transports',
            simulations: 2,
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
            id: generateId(),
            firstName: 'Pierre',
            lastName: 'Dubois',
            email: 'p.dubois@gmail.com',
            phone: '07 98 76 54 32',
            status: 'prospect',
            type: 'investor',
            notes: 'Cherche studio Paris pour investissement locatif LMNP, budget 200K€',
            simulations: 1,
            createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
        },
        {
            id: generateId(),
            firstName: 'Sophie',
            lastName: 'Leroux',
            email: 'sophieleroux@outlook.com',
            phone: '06 55 44 33 22',
            status: 'closed',
            type: 'seller',
            notes: 'Vente maison Bordeaux Caudéran 180m² — Conclue à 580K€',
            simulations: 3,
            createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
        }
    ];
}

// ===== CRUD =====

function addClient(data) {
    const client = {
        id: generateId(),
        ...data,
        simulations: 0,
        createdAt: new Date().toISOString()
    };
    clients.unshift(client);
    saveClients();
    return client;
}

function updateClient(id, data) {
    const idx = clients.findIndex(c => c.id === id);
    if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...data };
        saveClients();
        return clients[idx];
    }
    return null;
}

function deleteClient(id) {
    clients = clients.filter(c => c.id !== id);
    saveClients();
}

// ===== RENDERING =====

function renderClients(filter = '') {
    const grid = document.getElementById('clientsGrid');
    if (!grid) return;

    const statusFilter = document.getElementById('clientStatusFilter')?.value || '';
    let filtered = clients;

    if (filter) {
        const q = filter.toLowerCase();
        filtered = filtered.filter(c =>
            (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.notes?.toLowerCase().includes(q)
        );
    }

    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="16" r="10" stroke="#e2e8f0" stroke-width="2"/><path d="M4 44c0-11 9-20 20-20s20 9 20 20" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/></svg>
                <h3>Aucun client trouvé</h3>
                <p>Ajoutez votre premier client ou modifiez les filtres.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(client => renderClientCard(client)).join('');

    // Attach actions
    grid.querySelectorAll('.client-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm(`Supprimer le client ${btn.dataset.name} ?`)) {
                deleteClient(id);
                renderClients(document.getElementById('clientSearch')?.value || '');
            }
        });
    });

    grid.querySelectorAll('.client-edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(btn.dataset.id);
        });
    });

    grid.querySelectorAll('.client-simulate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Navigate to value simulator with client context
            const navItem = document.querySelector('.nav-item[data-panel="value-simulator"]');
            if (navItem) navItem.click();
        });
    });
}

function renderClientCard(client) {
    const statusLabels = { prospect: 'Prospect', active: 'En cours', closed: 'Conclu' };
    const typeLabels = { buyer: 'Acquéreur', seller: 'Vendeur', investor: 'Investisseur' };
    const typeIcons = { buyer: '🏠', seller: '💼', investor: '📈' };
    const initials = (client.firstName[0] + (client.lastName[0] || '')).toUpperCase();
    const createdDate = new Date(client.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    return `
        <div class="client-card">
            <div class="client-card-header">
                <div class="client-avatar">${initials}</div>
                <div>
                    <div class="client-name">${client.firstName} ${client.lastName}</div>
                    <div class="client-type">${typeIcons[client.type] || ''} ${typeLabels[client.type] || client.type}</div>
                </div>
                <span class="client-status status-${client.status}">${statusLabels[client.status] || client.status}</span>
            </div>
            ${client.email ? `<div class="client-info">📧 ${client.email}</div>` : ''}
            ${client.phone ? `<div class="client-info">📞 ${client.phone}</div>` : ''}
            <div class="client-info" style="margin-top:4px;color:#94a3b8;font-size:.72rem;">
                ${client.simulations} simulation${client.simulations !== 1 ? 's' : ''} · Depuis le ${createdDate}
            </div>
            ${client.notes ? `<div class="client-notes">${client.notes}</div>` : ''}
            <div class="client-actions">
                <button class="client-btn client-simulate-btn" data-id="${client.id}">Simuler</button>
                <button class="client-btn client-edit-btn" data-id="${client.id}">Modifier</button>
                <button class="client-btn client-delete-btn" data-id="${client.id}" data-name="${client.firstName} ${client.lastName}"
                    style="color:#dc2626;border-color:#fee2e2;">Supprimer</button>
            </div>
        </div>
    `;
}

// ===== MODAL =====

function openAddModal() {
    editingClientId = null;
    resetForm();
    document.getElementById('clientModalTitle').textContent = 'Nouveau client';
    openModal();
}

function openEditModal(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    editingClientId = id;
    document.getElementById('clientFirstName').value = client.firstName || '';
    document.getElementById('clientLastName').value = client.lastName || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientStatus').value = client.status || 'prospect';
    document.getElementById('clientType').value = client.type || 'buyer';
    document.getElementById('clientNotes').value = client.notes || '';
    document.getElementById('clientModalTitle').textContent = 'Modifier le client';
    openModal();
}

function openModal() {
    document.getElementById('clientModal').classList.add('open');
}

function closeModal() {
    document.getElementById('clientModal').classList.remove('open');
    editingClientId = null;
    resetForm();
}

function resetForm() {
    const form = document.getElementById('clientForm');
    if (form) form.reset();
}

// ===== EVENTS =====

function setupClientEvents() {
    // Add client button
    const addBtn = document.getElementById('addClientBtn');
    if (addBtn) addBtn.addEventListener('click', openAddModal);

    // Modal close
    document.getElementById('clientModalClose')?.addEventListener('click', closeModal);
    document.getElementById('clientModalCancel')?.addEventListener('click', closeModal);

    // Close on overlay click
    document.getElementById('clientModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('clientModal')) closeModal();
    });

    // Form submit
    document.getElementById('clientForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById('clientFirstName').value.trim(),
            lastName: document.getElementById('clientLastName').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            status: document.getElementById('clientStatus').value,
            type: document.getElementById('clientType').value,
            notes: document.getElementById('clientNotes').value.trim()
        };

        if (!data.firstName || !data.lastName) return;

        if (editingClientId) {
            updateClient(editingClientId, data);
        } else {
            addClient(data);
        }

        closeModal();
        renderClients(document.getElementById('clientSearch')?.value || '');
    });

    // Search
    document.getElementById('clientSearch')?.addEventListener('input', (e) => {
        renderClients(e.target.value);
    });

    // Status filter
    document.getElementById('clientStatusFilter')?.addEventListener('change', () => {
        renderClients(document.getElementById('clientSearch')?.value || '');
    });
}

// ===== UTILS =====

function generateId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
