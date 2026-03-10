/**
 * Module Analyse de Marché
 * Visualisation des tendances du marché immobilier français,
 * comparaison inter-villes, indices de tension locative
 */

import { formatCurrency, formatPercentage } from '../utils/formatter.js';

export function initMarketAnalysis(cityData) {
    const container = document.getElementById('marketAnalysisContent');
    if (!container || !cityData) return;

    container.innerHTML = buildMarketLayout(cityData);
    renderMarketCharts(cityData);
    setupMarketEvents(cityData);
}

function buildMarketLayout(cityData) {
    const sortedByPrice = [...cityData].sort((a, b) => b.pricePerSqm - a.pricePerSqm);

    return `
    <div class="market-analysis-grid">
        <!-- Prix par ville -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3>Prix au m² par ville</h3>
                <span class="card-badge">20 villes</span>
            </div>
            <div class="chart-container" style="height:320px;">
                <canvas id="marketPriceChart"></canvas>
            </div>
        </div>

        <!-- Évolution des prix -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3>Croissance annuelle des prix</h3>
                <span class="card-badge">%/an</span>
            </div>
            <div class="chart-container" style="height:320px;">
                <canvas id="marketGrowthChart"></canvas>
            </div>
        </div>

        <!-- Rendement brut moyen -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3>Rendement locatif brut</h3>
                <span class="card-badge">Loyer/Prix</span>
            </div>
            <div class="chart-container" style="height:320px;">
                <canvas id="marketYieldChart"></canvas>
            </div>
        </div>

        <!-- Attractivité vs Prix scatter -->
        <div class="dashboard-card">
            <div class="card-header">
                <h3>Attractivité vs Prix</h3>
                <span class="card-badge">Analyse</span>
            </div>
            <div class="chart-container" style="height:320px;">
                <canvas id="marketScatterChart"></canvas>
            </div>
        </div>
    </div>

    <!-- Sélecteur de ville pour analyse détaillée -->
    <div class="dashboard-card" style="margin-top:20px;">
        <div class="card-header">
            <h3>Fiche détaillée par ville</h3>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
            <div class="select-wrapper" style="flex:1;min-width:200px;">
                <select id="marketCitySelect">
                    ${[...cityData].sort((a, b) => a.name.localeCompare(b.name)).map(c =>
                        `<option value="${c.name}">${c.name}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <div id="marketCityDetail"></div>
    </div>

    <!-- Classement multi-critères -->
    <div class="dashboard-card" style="margin-top:20px;">
        <div class="card-header">
            <h3>Classement des villes — Multi-critères</h3>
            <div style="display:flex;gap:8px;">
                <select id="marketSortCriteria" class="filter-select" style="font-size:.78rem;">
                    <option value="pricePerSqm">Prix au m²</option>
                    <option value="priceEvolution">Croissance prix</option>
                    <option value="rentPerSqm">Loyer au m²</option>
                    <option value="yield">Rendement brut</option>
                    <option value="attractivityIndex">Attractivité</option>
                </select>
                <select id="marketSortOrder" class="filter-select" style="font-size:.78rem;">
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                </select>
            </div>
        </div>
        <div class="dvf-table-wrapper">
            <table class="market-table" id="marketRankingTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Ville</th>
                        <th>Région</th>
                        <th>Prix/m²</th>
                        <th>Croissance</th>
                        <th>Loyer/m²</th>
                        <th>Rendement brut</th>
                        <th>Attractivité</th>
                    </tr>
                </thead>
                <tbody id="marketRankingBody"></tbody>
            </table>
        </div>
    </div>
    `;
}

function renderMarketCharts(cityData) {
    const sortedByPrice = [...cityData].sort((a, b) => b.pricePerSqm - a.pricePerSqm);

    // Chart 1: Prix au m² par ville (bar horizontal)
    const priceCanvas = document.getElementById('marketPriceChart');
    if (priceCanvas) {
        const colors = sortedByPrice.map(c => {
            if (c.pricePerSqm > 7000) return 'rgba(220,38,38,.8)';
            if (c.pricePerSqm > 4000) return 'rgba(234,88,12,.8)';
            if (c.pricePerSqm > 2500) return 'rgba(67,97,238,.8)';
            return 'rgba(22,163,74,.8)';
        });
        new Chart(priceCanvas, {
            type: 'bar',
            data: {
                labels: sortedByPrice.map(c => c.name),
                datasets: [{
                    label: 'Prix moyen/m²',
                    data: sortedByPrice.map(c => c.pricePerSqm),
                    backgroundColor: colors,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { callback: v => v.toLocaleString('fr-FR') + '€', font: { size: 10 } }
                    },
                    y: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    // Chart 2: Croissance annuelle (bar)
    const growthCanvas = document.getElementById('marketGrowthChart');
    if (growthCanvas) {
        const sorted = [...cityData].sort((a, b) => b.priceEvolution - a.priceEvolution);
        new Chart(growthCanvas, {
            type: 'bar',
            data: {
                labels: sorted.map(c => c.name),
                datasets: [{
                    label: 'Croissance annuelle (%)',
                    data: sorted.map(c => c.priceEvolution),
                    backgroundColor: sorted.map(c =>
                        c.priceEvolution > 3 ? 'rgba(22,163,74,.8)' :
                        c.priceEvolution > 2 ? 'rgba(67,97,238,.8)' :
                        'rgba(234,88,12,.7)'
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { callback: v => v + '%', font: { size: 10 } } },
                    y: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    // Chart 3: Rendement brut
    const yieldCanvas = document.getElementById('marketYieldChart');
    if (yieldCanvas) {
        const withYield = cityData.map(c => ({
            ...c,
            grossYield: (c.rentPerSqm * 12 / c.pricePerSqm * 100)
        })).sort((a, b) => b.grossYield - a.grossYield);

        new Chart(yieldCanvas, {
            type: 'bar',
            data: {
                labels: withYield.map(c => c.name),
                datasets: [{
                    label: 'Rendement brut (%)',
                    data: withYield.map(c => parseFloat(c.grossYield.toFixed(2))),
                    backgroundColor: withYield.map(c =>
                        c.grossYield > 5 ? 'rgba(22,163,74,.8)' :
                        c.grossYield > 4 ? 'rgba(67,97,238,.8)' :
                        'rgba(234,88,12,.7)'
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { callback: v => v + '%', font: { size: 10 } } },
                    y: { ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    // Chart 4: Scatter — Attractivité vs Prix
    const scatterCanvas = document.getElementById('marketScatterChart');
    if (scatterCanvas) {
        new Chart(scatterCanvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Villes',
                    data: cityData.map(c => ({
                        x: c.pricePerSqm,
                        y: c.attractivityIndex,
                        label: c.name
                    })),
                    backgroundColor: 'rgba(67,97,238,.7)',
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.raw.label} — ${ctx.raw.x.toLocaleString('fr-FR')}€/m² · attractivité ${ctx.raw.y.toFixed(1)}/10`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Prix au m² (€)', font: { size: 11 } },
                        ticks: { callback: v => v.toLocaleString('fr-FR') + '€', font: { size: 10 } }
                    },
                    y: {
                        title: { display: true, text: 'Indice d\'attractivité (0-10)', font: { size: 11 } },
                        min: 0, max: 10,
                        ticks: { font: { size: 10 } }
                    }
                }
            }
        });
    }

    // Initial city detail and ranking
    if (cityData.length > 0) {
        displayCityDetail(cityData[0], cityData);
        renderRanking(cityData, 'pricePerSqm', 'desc');
    }
}

function displayCityDetail(city, allCities) {
    const container = document.getElementById('marketCityDetail');
    if (!container) return;

    const grossYield = (city.rentPerSqm * 12 / city.pricePerSqm * 100).toFixed(1);
    const rank = [...allCities].sort((a, b) => b.pricePerSqm - a.pricePerSqm)
        .findIndex(c => c.name === city.name) + 1;
    const attractivityPct = Math.round(city.attractivityIndex * 10);

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${city.pricePerSqm.toLocaleString('fr-FR')} €/m²</div>
                <div class="dvf-stat-label">Prix moyen</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">+${city.priceEvolution}%</div>
                <div class="dvf-stat-label">Croissance annuelle</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${city.rentPerSqm} €/m²</div>
                <div class="dvf-stat-label">Loyer moyen</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${grossYield}%</div>
                <div class="dvf-stat-label">Rendement brut</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">#${rank}</div>
                <div class="dvf-stat-label">Rang par prix</div>
            </div>
            <div class="dvf-stat-card">
                <div class="dvf-stat-val">${city.attractivityIndex.toFixed(1)}/10</div>
                <div class="dvf-stat-label">Attractivité</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
                <h4 style="font-size:.8rem;font-weight:700;color:#334155;margin-bottom:8px;">Indicateurs économiques</h4>
                <div style="display:flex;flex-direction:column;gap:6px;font-size:.8rem;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Dynamisme économique</span>
                        <strong>${city.economicDynamism}/10</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Qualité des transports</span>
                        <strong>${city.transportQuality}/10</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Croissance démographique</span>
                        <strong>+${city.populationGrowth}%/an</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Taxe foncière (taux indicatif)</span>
                        <strong>${city.propertyTaxRate}%</strong>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="font-size:.8rem;font-weight:700;color:#334155;margin-bottom:8px;">Prix par type de bien</h4>
                <div style="display:flex;flex-direction:column;gap:6px;font-size:.8rem;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Appartement</span>
                        <strong>${city.apartmentPricePerSqm.toLocaleString('fr-FR')} €/m²</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Maison</span>
                        <strong>${city.housePricePerSqm.toLocaleString('fr-FR')} €/m²</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Studio</span>
                        <strong>${city.studioPricePerSqm.toLocaleString('fr-FR')} €/m²</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#64748b;">Région</span>
                        <strong>${city.region}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderRanking(cityData, criteria, order) {
    const tbody = document.getElementById('marketRankingBody');
    if (!tbody) return;

    const sorted = [...cityData].sort((a, b) => {
        let va = a[criteria];
        let vb = b[criteria];
        if (criteria === 'yield') {
            va = a.rentPerSqm * 12 / a.pricePerSqm * 100;
            vb = b.rentPerSqm * 12 / b.pricePerSqm * 100;
        }
        return order === 'desc' ? vb - va : va - vb;
    });

    tbody.innerHTML = sorted.map((city, i) => {
        const grossYield = (city.rentPerSqm * 12 / city.pricePerSqm * 100).toFixed(1);
        const growthColor = city.priceEvolution > 3 ? '#16a34a' : city.priceEvolution > 2 ? '#f59e0b' : '#94a3b8';
        const yieldColor = parseFloat(grossYield) > 5 ? '#16a34a' : parseFloat(grossYield) > 4 ? '#4361ee' : '#ea580c';

        return `
            <tr>
                <td style="color:#94a3b8;font-weight:700;">${i + 1}</td>
                <td><strong>${city.name}</strong></td>
                <td style="color:#64748b;font-size:.78rem;">${city.region}</td>
                <td>${city.pricePerSqm.toLocaleString('fr-FR')} €</td>
                <td style="color:${growthColor};font-weight:600;">+${city.priceEvolution}%</td>
                <td>${city.rentPerSqm} €</td>
                <td style="color:${yieldColor};font-weight:700;">${grossYield}%</td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="flex:1;height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
                            <div style="height:100%;width:${city.attractivityIndex * 10}%;background:#4361ee;border-radius:2px;"></div>
                        </div>
                        <span style="font-size:.75rem;color:#64748b;">${city.attractivityIndex.toFixed(1)}</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupMarketEvents(cityData) {
    // City selector
    document.getElementById('marketCitySelect')?.addEventListener('change', (e) => {
        const city = cityData.find(c => c.name === e.target.value);
        if (city) displayCityDetail(city, cityData);
    });

    // Sort criteria
    const updateRanking = () => {
        const criteria = document.getElementById('marketSortCriteria')?.value || 'pricePerSqm';
        const order = document.getElementById('marketSortOrder')?.value || 'desc';
        renderRanking(cityData, criteria, order);
    };
    document.getElementById('marketSortCriteria')?.addEventListener('change', updateRanking);
    document.getElementById('marketSortOrder')?.addEventListener('change', updateRanking);
}
