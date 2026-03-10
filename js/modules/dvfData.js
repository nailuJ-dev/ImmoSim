/**
 * Module DVF — Demandes de Valeurs Foncières
 * Intégration des données officielles de transactions immobilières via data.gouv.fr / API DVF Étalab
 *
 * API utilisée: https://api.dvf.etalab.gouv.fr/geoapi/
 * Documentation: https://api.dvf.etalab.gouv.fr/docs
 */

import { formatCurrency, formatArea } from '../utils/formatter.js';

// API DVF officielle d'Étalab (data.gouv.fr)
const DVF_API_BASE = 'https://api.dvf.etalab.gouv.fr/geoapi';
// Fallback: API de géocodage pour transformer une adresse en coordonnées
const GEOCODE_API = 'https://api-adresse.data.gouv.fr/search';

let currentDVFResults = null;

/**
 * Initialise le module DVF dans le dashboard
 */
export function initDVFData(cityData) {
    const layout = document.getElementById('dvfLayout');
    if (!layout) return;

    layout.innerHTML = buildDVFLayout();
    setupDVFEvents(cityData);
}

function buildDVFLayout() {
    return `
    <div class="dvf-search-bar">
        <h3 style="font-size:.9rem;font-weight:700;color:#334155;margin-bottom:16px;">
            Recherche de transactions DVF
            <span style="font-size:.72rem;font-weight:500;color:#94a3b8;margin-left:8px;">
                Source: DGFiP / data.gouv.fr — Transactions depuis 2018
            </span>
        </h3>
        <div class="dvf-search-form">
            <div class="form-group" style="flex:2;min-width:200px;">
                <label>Adresse ou ville</label>
                <input type="text" id="dvfAddress" placeholder="Ex: 75001 Paris, Lyon, Bordeaux Caudéran..." autocomplete="off">
            </div>
            <div class="form-group">
                <label>Type de bien</label>
                <div class="select-wrapper">
                    <select id="dvfPropertyType">
                        <option value="">Tous types</option>
                        <option value="Appartement">Appartement</option>
                        <option value="Maison">Maison</option>
                        <option value="Local industriel. commercial ou assimilé">Local commercial</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Rayon (km)</label>
                <div class="select-wrapper">
                    <select id="dvfRadius">
                        <option value="0.5">0,5 km</option>
                        <option value="1" selected>1 km</option>
                        <option value="2">2 km</option>
                        <option value="5">5 km</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Période</label>
                <div class="select-wrapper">
                    <select id="dvfPeriod">
                        <option value="1">12 derniers mois</option>
                        <option value="2" selected>2 dernières années</option>
                        <option value="3">3 dernières années</option>
                        <option value="5">5 dernières années</option>
                    </select>
                </div>
            </div>
            <div class="form-group" style="justify-content:flex-end;">
                <label style="visibility:hidden;">.</label>
                <button id="dvfSearchBtn" class="btn-sim-submit" style="width:auto;padding:10px 24px;">
                    Rechercher
                </button>
            </div>
        </div>
        <div id="dvfAddressSuggestions" class="dvf-suggestions" style="display:none;"></div>
    </div>

    <div id="dvfResults" style="display:none;" class="dvf-results">
        <div class="card-header" style="margin-bottom:20px;">
            <h3 id="dvfResultsTitle">Résultats</h3>
            <div style="display:flex;gap:8px;">
                <button id="dvfExportBtn" class="btn-panel-action secondary" style="font-size:.78rem;">
                    Export CSV
                </button>
                <button id="dvfReportBtn" class="btn-panel-action" style="font-size:.78rem;">
                    Rapport PDF
                </button>
            </div>
        </div>

        <div class="dvf-stats-grid" id="dvfStatsGrid"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
            <div>
                <h4 style="font-size:.82rem;font-weight:700;color:#334155;margin-bottom:12px;">Évolution des prix/m²</h4>
                <div class="chart-container" style="height:200px;"><canvas id="dvfPriceChart"></canvas></div>
            </div>
            <div>
                <h4 style="font-size:.82rem;font-weight:700;color:#334155;margin-bottom:12px;">Distribution par surface</h4>
                <div class="chart-container" style="height:200px;"><canvas id="dvfSurfaceChart"></canvas></div>
            </div>
        </div>

        <h4 style="font-size:.82rem;font-weight:700;color:#334155;margin-bottom:12px;">Transactions récentes</h4>
        <div class="dvf-table-wrapper">
            <table class="dvf-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Adresse</th>
                        <th>Surface</th>
                        <th>Prix total</th>
                        <th>Prix/m²</th>
                        <th>Pièces</th>
                    </tr>
                </thead>
                <tbody id="dvfTableBody"></tbody>
            </table>
        </div>
    </div>

    <div id="dvfLoading" style="display:none;" class="dvf-results">
        <div class="dvf-loading">
            <div class="dvf-loader"></div>
            <p>Interrogation de l'API DVF (data.gouv.fr)…</p>
            <small style="color:#94a3b8;">Peut prendre quelques secondes</small>
        </div>
    </div>

    <div id="dvfEmpty" class="dvf-results" style="display:none;">
        <div class="dvf-empty">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style="margin:0 auto 12px;display:block;"><circle cx="24" cy="24" r="22" stroke="#e2e8f0" stroke-width="2"/><path d="M16 24h16M24 16v16" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/></svg>
            <p>Aucune transaction trouvée dans ce secteur pour la période sélectionnée.<br><small>Essayez d'élargir le rayon ou la période.</small></p>
        </div>
    </div>

    <div class="dvf-results" style="margin-top:0;">
        <div style="padding:20px;background:#eff3ff;border-radius:8px;border:1px solid #c7d2fe;">
            <p style="font-size:.78rem;color:#3730a3;margin:0;">
                <strong>Source des données :</strong> Les données DVF (Demandes de Valeurs Foncières) sont issues de la Direction Générale des Finances Publiques (DGFiP) et publiées en open data sur data.gouv.fr. Elles couvrent les mutations à titre onéreux (ventes) depuis le 1er janvier 2018.
            </p>
        </div>
    </div>
    `;
}

function setupDVFEvents(cityData) {
    // Address autocomplete
    const addressInput = document.getElementById('dvfAddress');
    if (addressInput) {
        let autocompleteTimeout;
        addressInput.addEventListener('input', () => {
            clearTimeout(autocompleteTimeout);
            const q = addressInput.value.trim();
            if (q.length < 3) {
                hideSuggestions();
                return;
            }
            autocompleteTimeout = setTimeout(() => fetchAddressSuggestions(q), 350);
        });
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                hideSuggestions();
                performDVFSearch();
            }
        });
    }

    // Search button
    const searchBtn = document.getElementById('dvfSearchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performDVFSearch);
    }

    // Export CSV
    const exportBtn = document.getElementById('dvfExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDVFtoCSV);
    }

    // Hide suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#dvfAddress') && !e.target.closest('#dvfAddressSuggestions')) {
            hideSuggestions();
        }
    });
}

async function fetchAddressSuggestions(query) {
    try {
        const url = `${GEOCODE_API}/?q=${encodeURIComponent(query)}&limit=5&type=municipality,housenumber,street`;
        const resp = await fetch(url);
        if (!resp.ok) return;
        const data = await resp.json();
        showSuggestions(data.features || []);
    } catch (err) {
        console.warn('Autocomplete error:', err);
    }
}

function showSuggestions(features) {
    const container = document.getElementById('dvfAddressSuggestions');
    if (!container || !features.length) { hideSuggestions(); return; }

    container.innerHTML = features.map(f => `
        <div class="dvf-suggestion-item"
             data-lat="${f.geometry.coordinates[1]}"
             data-lon="${f.geometry.coordinates[0]}"
             data-label="${f.properties.label}">
            ${f.properties.label}
        </div>
    `).join('');
    container.style.display = 'block';

    container.querySelectorAll('.dvf-suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('dvfAddress').value = item.dataset.label;
            document.getElementById('dvfAddress').dataset.lat = item.dataset.lat;
            document.getElementById('dvfAddress').dataset.lon = item.dataset.lon;
            hideSuggestions();
        });
    });
}

function hideSuggestions() {
    const c = document.getElementById('dvfAddressSuggestions');
    if (c) c.style.display = 'none';
}

async function performDVFSearch() {
    const addressInput = document.getElementById('dvfAddress');
    const propertyType = document.getElementById('dvfPropertyType')?.value || '';
    const radiusKm = parseFloat(document.getElementById('dvfRadius')?.value || '1');
    const periodYears = parseInt(document.getElementById('dvfPeriod')?.value || '2');

    const query = addressInput?.value?.trim();
    if (!query) {
        addressInput?.focus();
        return;
    }

    // Show loading
    showDVFState('loading');

    try {
        // Get coordinates (use stored coords from autocomplete or geocode)
        let lat = parseFloat(addressInput.dataset?.lat || '');
        let lon = parseFloat(addressInput.dataset?.lon || '');

        if (!lat || !lon) {
            const coords = await geocodeAddress(query);
            if (!coords) {
                showDVFState('empty');
                return;
            }
            lat = coords.lat;
            lon = coords.lon;
        }

        // Calculate date range
        const now = new Date();
        const dateMutation = new Date(now.getFullYear() - periodYears, now.getMonth(), now.getDate())
            .toISOString().split('T')[0];

        // Fetch DVF data from official Étalab API
        const transactions = await fetchDVFTransactions(lat, lon, radiusKm, dateMutation, propertyType);

        if (!transactions || transactions.length === 0) {
            showDVFState('empty');
            return;
        }

        currentDVFResults = transactions;
        displayDVFResults(transactions, query, radiusKm, periodYears);
        showDVFState('results');

    } catch (err) {
        console.error('DVF search error:', err);
        showDVFState('empty');
    }
}

async function geocodeAddress(query) {
    try {
        const url = `${GEOCODE_API}/?q=${encodeURIComponent(query)}&limit=1`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.features && data.features.length > 0) {
            const [lon, lat] = data.features[0].geometry.coordinates;
            return { lat, lon };
        }
        return null;
    } catch {
        return null;
    }
}

async function fetchDVFTransactions(lat, lon, radiusKm, dateMin, propertyType) {
    // API DVF Étalab — endpoint mutations dans un rayon
    let url = `${DVF_API_BASE}/mutations?lat=${lat}&lon=${lon}&dist=${Math.round(radiusKm * 1000)}&date_min=${dateMin}&fields=date_mutation,nature_mutation,valeur_fonciere,adresse_numero,adresse_nom_voie,code_postal,nom_commune,type_local,surface_reelle_bati,nombre_pieces_principales,longitude,latitude&sort=-date_mutation&limit=200`;

    if (propertyType) {
        url += `&type_local=${encodeURIComponent(propertyType)}`;
    }

    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`API DVF error: ${resp.status}`);
        }
        const data = await resp.json();
        return (data.results || []).filter(t =>
            t.nature_mutation === 'Vente' &&
            t.valeur_fonciere > 10000 &&
            t.surface_reelle_bati > 5
        );
    } catch (err) {
        console.warn('DVF API error, using mock data:', err);
        return generateMockDVFData(lat, lon, radiusKm, dateMin, propertyType);
    }
}

function generateMockDVFData(lat, lon, radiusKm, dateMin, propertyType) {
    // Données simulées pour démo (utilisées si l'API est indisponible)
    const types = propertyType ? [propertyType] : ['Appartement', 'Appartement', 'Maison', 'Appartement'];
    const now = new Date();
    const minDate = new Date(dateMin);
    const results = [];

    for (let i = 0; i < 45; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const surface = type === 'Maison'
            ? Math.round(80 + Math.random() * 120)
            : Math.round(25 + Math.random() * 90);
        const priceSqm = type === 'Maison'
            ? Math.round(2500 + Math.random() * 5000)
            : Math.round(3000 + Math.random() * 8000);
        const dateMs = minDate.getTime() + Math.random() * (now.getTime() - minDate.getTime());
        const date = new Date(dateMs);

        const latOffset = (Math.random() - 0.5) * (radiusKm / 111);
        const lonOffset = (Math.random() - 0.5) * (radiusKm / (111 * Math.cos(lat * Math.PI / 180)));

        results.push({
            date_mutation: date.toISOString().split('T')[0],
            nature_mutation: 'Vente',
            valeur_fonciere: surface * priceSqm,
            adresse_numero: String(Math.floor(Math.random() * 100) + 1),
            adresse_nom_voie: 'RUE DE LA PAIX',
            code_postal: '75001',
            nom_commune: 'Paris',
            type_local: type,
            surface_reelle_bati: surface,
            nombre_pieces_principales: Math.floor(surface / 20) + 1,
            longitude: lon + lonOffset,
            latitude: lat + latOffset,
            _isMock: true
        });
    }

    return results.sort((a, b) => new Date(b.date_mutation) - new Date(a.date_mutation));
}

function displayDVFResults(transactions, query, radiusKm, periodYears) {
    // Title
    const title = document.getElementById('dvfResultsTitle');
    if (title) {
        title.textContent = `${transactions.length} transaction${transactions.length > 1 ? 's' : ''} trouvée${transactions.length > 1 ? 's' : ''} — ${query} (${radiusKm} km, ${periodYears} an${periodYears > 1 ? 's' : ''})`;
    }

    // Stats
    const prices = transactions.map(t => t.valeur_fonciere / t.surface_reelle_bati).filter(p => p > 0 && p < 50000);
    const avgPriceSqm = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const medianPriceSqm = prices.length ? prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] : 0;
    const totalVolume = transactions.reduce((a, t) => a + t.valeur_fonciere, 0);
    const avgSurface = transactions.map(t => t.surface_reelle_bati).reduce((a, b) => a + b, 0) / transactions.length;

    const statsGrid = document.getElementById('dvfStatsGrid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${Math.round(avgPriceSqm).toLocaleString('fr-FR')} €</div>
                <div class="dvf-stat-label">Prix moyen/m²</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${Math.round(medianPriceSqm).toLocaleString('fr-FR')} €</div>
                <div class="dvf-stat-label">Prix médian/m²</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${Math.round(avgSurface)} m²</div>
                <div class="dvf-stat-label">Surface moyenne</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${(totalVolume / 1e6).toFixed(1)} M€</div>
                <div class="dvf-stat-label">Volume total</div>
            </div>
        `;
    }

    // Charts
    renderDVFPriceChart(transactions);
    renderDVFSurfaceChart(transactions);

    // Table
    const tbody = document.getElementById('dvfTableBody');
    if (tbody) {
        tbody.innerHTML = transactions.slice(0, 50).map(t => {
            const priceSqm = t.surface_reelle_bati > 0
                ? Math.round(t.valeur_fonciere / t.surface_reelle_bati)
                : 0;
            const address = [t.adresse_numero, t.adresse_nom_voie, t.code_postal, t.nom_commune]
                .filter(Boolean).join(' ');
            return `
                <tr>
                    <td>${formatDate(t.date_mutation)}</td>
                    <td><span style="background:${t.type_local==='Maison'?'#dcfce7':'#dbeafe'};color:${t.type_local==='Maison'?'#166534':'#1e40af'};padding:2px 8px;border-radius:100px;font-size:.7rem;font-weight:600;">${t.type_local || '—'}</span></td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${address}">${address || '—'}</td>
                    <td>${t.surface_reelle_bati ? t.surface_reelle_bati + ' m²' : '—'}</td>
                    <td><strong>${t.valeur_fonciere.toLocaleString('fr-FR')} €</strong></td>
                    <td style="color:${priceSqm > avgPriceSqm*1.1?'#dc2626':priceSqm<avgPriceSqm*0.9?'#16a34a':'#334155'}">${priceSqm ? priceSqm.toLocaleString('fr-FR') + ' €/m²' : '—'}</td>
                    <td>${t.nombre_pieces_principales || '—'}</td>
                </tr>
            `;
        }).join('');

        if (transactions[0]?._isMock) {
            tbody.insertAdjacentHTML('beforebegin', `
                <tr><td colspan="7" style="padding:8px 12px;background:#fef3c7;font-size:.75rem;color:#92400e;">
                    ⚠️ Données de démonstration (API DVF indisponible). En production, les vraies données DVF de data.gouv.fr s'afficheront ici.
                </td></tr>
            `);
        }
    }
}

function renderDVFPriceChart(transactions) {
    const canvas = document.getElementById('dvfPriceChart');
    if (!canvas) return;

    // Group by month
    const byMonth = {};
    transactions.forEach(t => {
        const month = t.date_mutation.substring(0, 7);
        if (!byMonth[month]) byMonth[month] = [];
        if (t.surface_reelle_bati > 0) {
            byMonth[month].push(t.valeur_fonciere / t.surface_reelle_bati);
        }
    });

    const labels = Object.keys(byMonth).sort().slice(-18);
    const avgPrices = labels.map(m => {
        const prices = byMonth[m];
        return prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
    });

    if (window._dvfPriceChart) window._dvfPriceChart.destroy();
    window._dvfPriceChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels.map(m => {
                const [y, mo] = m.split('-');
                return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            }),
            datasets: [{
                label: 'Prix moyen/m²',
                data: avgPrices,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67,97,238,.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: {
                        callback: v => v.toLocaleString('fr-FR') + '€',
                        font: { size: 10 }
                    }
                },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });
}

function renderDVFSurfaceChart(transactions) {
    const canvas = document.getElementById('dvfSurfaceChart');
    if (!canvas) return;

    const bins = [
        { label: '<30m²', min: 0, max: 30 },
        { label: '30-50m²', min: 30, max: 50 },
        { label: '50-80m²', min: 50, max: 80 },
        { label: '80-120m²', min: 80, max: 120 },
        { label: '>120m²', min: 120, max: Infinity }
    ];
    const counts = bins.map(b =>
        transactions.filter(t => t.surface_reelle_bati >= b.min && t.surface_reelle_bati < b.max).length
    );

    if (window._dvfSurfaceChart) window._dvfSurfaceChart.destroy();
    window._dvfSurfaceChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: bins.map(b => b.label),
            datasets: [{
                label: 'Transactions',
                data: counts,
                backgroundColor: 'rgba(67,97,238,.7)',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { font: { size: 10 } } },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });
}

function showDVFState(state) {
    document.getElementById('dvfResults').style.display = state === 'results' ? 'block' : 'none';
    document.getElementById('dvfLoading').style.display = state === 'loading' ? 'block' : 'none';
    document.getElementById('dvfEmpty').style.display = state === 'empty' ? 'block' : 'none';
}

function exportDVFtoCSV() {
    if (!currentDVFResults || !currentDVFResults.length) return;

    const headers = ['Date', 'Type', 'Adresse', 'Code Postal', 'Commune', 'Surface (m²)', 'Prix total (€)', 'Prix/m² (€)', 'Pièces'];
    const rows = currentDVFResults.map(t => {
        const priceSqm = t.surface_reelle_bati > 0
            ? Math.round(t.valeur_fonciere / t.surface_reelle_bati)
            : '';
        const address = [t.adresse_numero, t.adresse_nom_voie].filter(Boolean).join(' ');
        return [
            t.date_mutation,
            t.type_local || '',
            address,
            t.code_postal || '',
            t.nom_commune || '',
            t.surface_reelle_bati || '',
            t.valeur_fonciere || '',
            priceSqm,
            t.nombre_pieces_principales || ''
        ].map(v => `"${v}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dvf_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
}

// Inject needed styles
(function addDVFStyles() {
    const s = document.createElement('style');
    s.textContent = `
        .dvf-suggestions {
            position: absolute;
            top: 100%;
            left: 0; right: 0;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 0 0 8px 8px;
            z-index: 100;
            box-shadow: 0 8px 24px rgba(0,0,0,.1);
            max-height: 200px;
            overflow-y: auto;
        }
        .dvf-search-form { position: relative; }
        .dvf-suggestion-item {
            padding: 10px 14px;
            font-size: .85rem;
            color: #334155;
            cursor: pointer;
            border-bottom: 1px solid #f1f5f9;
            transition: background .15s;
        }
        .dvf-suggestion-item:hover { background: #f8fafc; }
        .dvf-suggestion-item:last-child { border-bottom: none; }
        #dvfAddress { position: relative; }
    `;
    document.head.appendChild(s);
})();
