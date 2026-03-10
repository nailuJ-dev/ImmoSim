/**
 * Module Optimiseur Fiscal
 * Compare automatiquement les dispositifs de défiscalisation immobilière :
 * Pinel, Denormandie, LMNP (micro-BIC / réel), Déficit foncier, Malraux, Nu (micro / réel)
 */

import { formatCurrency, formatPercentage } from '../utils/formatter.js';

const REGIMES = [
    {
        id: 'lmnp_reel',
        name: 'LMNP Réel',
        shortName: 'LMNP (réel)',
        desc: 'Loueur Meublé Non Professionnel au régime réel. Amortissement du bien possible, déduction de toutes les charges réelles.',
        icon: '🛋️',
        conditions: 'Bien meublé, revenus locatifs < 23 000€/an ou < 50% revenus totaux',
        color: '#4361ee'
    },
    {
        id: 'lmnp_micro',
        name: 'LMNP Micro-BIC',
        shortName: 'LMNP (micro)',
        desc: 'Abattement forfaitaire de 50% sur les recettes. Simple mais moins avantageux avec de lourdes charges.',
        icon: '📦',
        conditions: 'Bien meublé, recettes < 77 700€/an',
        color: '#7c3aed'
    },
    {
        id: 'nu_reel',
        name: 'Location nue — Réel',
        shortName: 'Nu (réel)',
        desc: 'Déduction de toutes les charges réelles. Déficit foncier imputable sur le revenu global (max 10 700€/an).',
        icon: '🏢',
        conditions: 'Revenus fonciers > 15 000€/an (sinon micro-foncier préférable)',
        color: '#2563eb'
    },
    {
        id: 'micro_foncier',
        name: 'Micro-foncier',
        shortName: 'Micro-foncier',
        desc: 'Abattement forfaitaire de 30% sur les loyers bruts. Simple à gérer.',
        icon: '📄',
        conditions: 'Location nue, revenus fonciers < 15 000€/an',
        color: '#0891b2'
    },
    {
        id: 'pinel',
        name: 'Dispositif Pinel',
        shortName: 'Pinel',
        desc: 'Réduction d\'impôt sur 6, 9 ou 12 ans (9%, 12%, 14% du prix d\'achat). Loyer et locataires plafonnés.',
        icon: '⭐',
        conditions: 'Bien neuf/VEFA, zones éligibles (A, Abis, B1), loyers plafonnés',
        color: '#059669'
    },
    {
        id: 'denormandie',
        name: 'Denormandie',
        shortName: 'Denormandie',
        desc: 'Similaire à Pinel mais pour l\'ancien avec travaux (min 25% du coût total). Zones détendues éligibles.',
        icon: '🏚️',
        conditions: 'Bien ancien, 222 communes éligibles, 25% de travaux minimum',
        color: '#d97706'
    },
    {
        id: 'deficit_foncier',
        name: 'Déficit Foncier',
        shortName: 'Déficit foncier',
        desc: 'Les travaux créent un déficit déductible du revenu global (max 10 700€/an). Jusqu\'à 21 400€ si travaux énergie.',
        icon: '🔧',
        conditions: 'Location nue, régime réel, travaux importants sur bien existant',
        color: '#dc2626'
    }
];

export function initTaxOptimizer() {
    const container = document.getElementById('taxOptimizerContent');
    if (!container) return;

    container.innerHTML = buildTaxOptimizerLayout();
    setupTaxOptimizerEvents();
}

function buildTaxOptimizerLayout() {
    return `
    <div class="tax-optimizer-grid">
        <div class="sim-form-col">
            <form id="taxForm" class="sim-form">
                <div class="form-section">
                    <h3>Profil fiscal</h3>
                    <div class="form-group">
                        <label>Tranche marginale d'imposition (TMI)</label>
                        <div class="select-wrapper">
                            <select id="taxTMI" required>
                                <option value="0">0% — Non imposable</option>
                                <option value="11">11%</option>
                                <option value="30" selected>30%</option>
                                <option value="41">41%</option>
                                <option value="45">45%</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Revenus fonciers existants (€/an)</label>
                        <input type="number" id="taxExistingRents" min="0" value="0" placeholder="0">
                    </div>
                </div>
                <div class="form-section">
                    <h3>Bien immobilier</h3>
                    <div class="form-group">
                        <label>Prix d'achat (€)</label>
                        <input type="number" id="taxPurchasePrice" min="50000" required placeholder="Ex: 200 000">
                    </div>
                    <div class="form-group">
                        <label>Budget travaux (€)</label>
                        <input type="number" id="taxWorksBudget" min="0" value="0" placeholder="Ex: 30 000">
                    </div>
                    <div class="form-group">
                        <label>Surface (m²)</label>
                        <input type="number" id="taxArea" min="9" required placeholder="Ex: 60">
                    </div>
                </div>
                <div class="form-section">
                    <h3>Location</h3>
                    <div class="form-group">
                        <label>Loyer mensuel (€)</label>
                        <input type="number" id="taxMonthlyRent" min="100" required placeholder="Ex: 700">
                    </div>
                    <div class="form-group">
                        <label>Charges annuelles (€)</label>
                        <input type="number" id="taxAnnualCharges" min="0" value="2000" placeholder="Ex: 2 000">
                    </div>
                    <div class="form-group">
                        <label>Durée de détention souhaitée (années)</label>
                        <div class="select-wrapper">
                            <select id="taxHoldingPeriod">
                                <option value="6">6 ans (Pinel courte durée)</option>
                                <option value="9" selected>9 ans</option>
                                <option value="12">12 ans (Pinel longue durée)</option>
                                <option value="20">20 ans</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-sim-submit">Comparer les régimes</button>
                    <button type="reset" class="btn-sim-reset">Réinitialiser</button>
                </div>
            </form>
        </div>
        <div id="taxResults" style="display:none;">
            <div class="tax-results-header" style="margin-bottom:20px;">
                <h3 style="font-size:1rem;font-weight:700;color:#0f172a;">Comparatif des dispositifs fiscaux</h3>
                <p id="taxResultsSub" style="font-size:.82rem;color:#64748b;"></p>
            </div>
            <div id="taxRegimeCards" class="tax-regime-cards"></div>
            <div style="margin-top:24px;">
                <h4 style="font-size:.85rem;font-weight:700;color:#334155;margin-bottom:12px;">Gain fiscal cumulé sur la période</h4>
                <div class="chart-container" style="height:260px;"><canvas id="taxCompareChart"></canvas></div>
            </div>
            <div id="taxBestRecommendation" style="margin-top:20px;padding:20px;background:#eff3ff;border-radius:12px;border:1px solid #c7d2fe;"></div>
        </div>
    </div>
    `;
}

function setupTaxOptimizerEvents() {
    const form = document.getElementById('taxForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        computeTaxOptimization();
    });

    form.addEventListener('reset', () => {
        document.getElementById('taxResults').style.display = 'none';
    });
}

function computeTaxOptimization() {
    const tmi = parseInt(document.getElementById('taxTMI')?.value || '30');
    const purchasePrice = parseFloat(document.getElementById('taxPurchasePrice')?.value || '0');
    const worksBudget = parseFloat(document.getElementById('taxWorksBudget')?.value || '0');
    const area = parseFloat(document.getElementById('taxArea')?.value || '0');
    const monthlyRent = parseFloat(document.getElementById('taxMonthlyRent')?.value || '0');
    const annualCharges = parseFloat(document.getElementById('taxAnnualCharges')?.value || '2000');
    const holdingPeriod = parseInt(document.getElementById('taxHoldingPeriod')?.value || '9');
    const existingRents = parseFloat(document.getElementById('taxExistingRents')?.value || '0');

    if (!purchasePrice || !monthlyRent) return;

    const annualRent = monthlyRent * 12;
    const socialTaxRate = 0.172;
    const totalInvestment = purchasePrice + worksBudget + purchasePrice * 0.075; // avec frais notaire

    // Compute each regime
    const results = REGIMES.map(regime => computeRegime(regime, {
        tmi: tmi / 100,
        purchasePrice,
        worksBudget,
        area,
        annualRent,
        annualCharges,
        holdingPeriod,
        existingRents,
        totalInvestment,
        socialTaxRate
    }));

    // Sort by net yield descending
    results.sort((a, b) => b.netYield - a.netYield);

    displayTaxResults(results, { purchasePrice, annualRent, holdingPeriod, tmi, totalInvestment });
    document.getElementById('taxResults').style.display = 'block';
}

function computeRegime(regime, params) {
    const { tmi, purchasePrice, worksBudget, annualRent, annualCharges, holdingPeriod, totalInvestment, socialTaxRate } = params;

    let annualTax = 0;
    let totalTaxGain = 0;
    let annualNetIncome = 0;
    let notes = '';

    switch (regime.id) {
        case 'lmnp_reel': {
            // Amortissement du bien (hors terrain ~15%) sur 30 ans + travaux sur 10 ans
            const buildingValue = purchasePrice * 0.85;
            const annualDepreciation = buildingValue / 30 + worksBudget / 10;
            const taxableIncome = Math.max(0, annualRent - annualCharges - annualDepreciation);
            annualTax = taxableIncome * tmi; // LMNP exempté de prélèvements sociaux si non professionnel
            annualNetIncome = annualRent - annualCharges - annualTax;
            const deficitCarried = Math.max(0, annualCharges + annualDepreciation - annualRent);
            totalTaxGain = (annualRent - annualCharges - annualRent * tmi) - (annualRent - annualCharges - annualTax);
            totalTaxGain = totalTaxGain * holdingPeriod;
            notes = `Amortissement: ${Math.round(annualDepreciation).toLocaleString('fr-FR')}€/an`;
            break;
        }
        case 'lmnp_micro': {
            const taxableIncome = annualRent * 0.5;
            annualTax = taxableIncome * tmi;
            annualNetIncome = annualRent - annualCharges - annualTax;
            notes = `Base imposable: 50% des recettes = ${Math.round(annualRent * 0.5).toLocaleString('fr-FR')}€`;
            break;
        }
        case 'nu_reel': {
            const taxableIncome = Math.max(0, annualRent - annualCharges);
            annualTax = taxableIncome * (tmi + socialTaxRate);
            annualNetIncome = annualRent - annualCharges - annualTax;
            // Deficit foncier if any
            const deficit = annualCharges - annualRent;
            if (deficit > 0) {
                const deductibleDeficit = Math.min(deficit, 10700);
                totalTaxGain += deductibleDeficit * tmi;
                notes = `Déficit foncier déductible: ${Math.round(deductibleDeficit).toLocaleString('fr-FR')}€`;
            }
            notes = notes || 'Toutes charges réelles déductibles';
            break;
        }
        case 'micro_foncier': {
            const taxableIncome = annualRent * 0.7;
            annualTax = taxableIncome * (tmi + socialTaxRate);
            annualNetIncome = annualRent - annualCharges - annualTax;
            notes = `Base imposable: 70% des loyers = ${Math.round(annualRent * 0.7).toLocaleString('fr-FR')}€`;
            break;
        }
        case 'pinel': {
            // Réduction d'impôt Pinel
            const reductionRates = { 6: 0.09, 9: 0.12, 12: 0.14 };
            const rate = reductionRates[holdingPeriod] || 0.12;
            const maxBase = Math.min(purchasePrice, 300000);
            const totalReduction = maxBase * rate;
            const annualReduction = totalReduction / holdingPeriod;
            const taxableIncome = Math.max(0, annualRent - annualCharges);
            annualTax = Math.max(0, taxableIncome * (tmi + socialTaxRate) - annualReduction);
            annualNetIncome = annualRent - annualCharges - annualTax;
            totalTaxGain = annualReduction * holdingPeriod;
            notes = `Réduction: ${Math.round(annualReduction).toLocaleString('fr-FR')}€/an (total: ${Math.round(totalReduction).toLocaleString('fr-FR')}€)`;
            break;
        }
        case 'denormandie': {
            // Identique à Pinel mais pour l'ancien avec travaux
            if (worksBudget < purchasePrice * 0.25) {
                // Pas éligible si moins de 25% de travaux
                annualTax = annualRent * 0.7 * (tmi + socialTaxRate);
                annualNetIncome = annualRent - annualCharges - annualTax;
                notes = '⚠️ Travaux insuffisants (min. 25% du coût total)';
                break;
            }
            const totalCost = purchasePrice + worksBudget;
            const maxBase = Math.min(totalCost, 300000);
            const reductionRates2 = { 6: 0.09, 9: 0.12, 12: 0.14 };
            const rate2 = reductionRates2[holdingPeriod] || 0.12;
            const totalReduction2 = maxBase * rate2;
            const annualReduction2 = totalReduction2 / holdingPeriod;
            const taxableIncome2 = Math.max(0, annualRent - annualCharges);
            annualTax = Math.max(0, taxableIncome2 * (tmi + socialTaxRate) - annualReduction2);
            annualNetIncome = annualRent - annualCharges - annualTax;
            totalTaxGain = annualReduction2 * holdingPeriod;
            notes = `Réduction: ${Math.round(annualReduction2).toLocaleString('fr-FR')}€/an sur bien rénové`;
            break;
        }
        case 'deficit_foncier': {
            // Travaux déductibles, déficit sur revenu global max 10 700€/an (21 400€ si réno énergétique)
            const maxDeductible = worksBudget >= 10000 ? 21400 : 10700;
            const annualWorksDeduction = Math.min(worksBudget / 3, maxDeductible); // étalé sur 3 ans
            const taxableIncome3 = Math.max(0, annualRent - annualCharges);
            const deficit3 = Math.max(0, annualCharges + annualWorksDeduction - annualRent);
            const deductibleFromGlobal = Math.min(deficit3, maxDeductible);
            annualTax = taxableIncome3 * (tmi + socialTaxRate);
            const taxSaving = deductibleFromGlobal * tmi; // saving on global income
            annualNetIncome = annualRent - annualCharges - annualTax + taxSaving;
            totalTaxGain = taxSaving * Math.min(3, holdingPeriod);
            notes = `Déficit global max: ${maxDeductible.toLocaleString('fr-FR')}€/an`;
            break;
        }
    }

    const netYield = totalInvestment > 0 ? (annualNetIncome / totalInvestment) * 100 : 0;
    const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;

    return {
        ...regime,
        annualTax,
        annualNetIncome,
        netYield,
        grossYield,
        totalTaxGain,
        notes
    };
}

function displayTaxResults(results, params) {
    const { purchasePrice, annualRent, holdingPeriod, tmi, totalInvestment } = params;
    const best = results[0];

    // Subtitle
    const sub = document.getElementById('taxResultsSub');
    if (sub) {
        sub.textContent = `Bien à ${purchasePrice.toLocaleString('fr-FR')}€ · Loyer ${(annualRent / 12).toLocaleString('fr-FR')}€/mois · TMI ${tmi}% · Détention ${holdingPeriod} ans`;
    }

    // Regime cards
    const cards = document.getElementById('taxRegimeCards');
    if (cards) {
        cards.innerHTML = results.map((r, i) => `
            <div class="regime-card ${i === 0 ? 'best' : ''}">
                <div class="regime-card-header">
                    <span class="regime-name">${r.icon} ${r.name}</span>
                    <span class="regime-net" style="color:${r.color}">${r.netYield.toFixed(2)}% net</span>
                </div>
                <div class="regime-desc">${r.desc}</div>
                <div style="display:flex;gap:12px;margin-top:8px;font-size:.75rem;color:#64748b;">
                    <span>Impôt/an: <strong style="color:#0f172a;">${Math.round(r.annualTax).toLocaleString('fr-FR')}€</strong></span>
                    <span>Revenu net/an: <strong style="color:#0f172a;">${Math.round(r.annualNetIncome).toLocaleString('fr-FR')}€</strong></span>
                    ${r.totalTaxGain > 0 ? `<span>Gain fiscal total: <strong style="color:${r.color};">+${Math.round(r.totalTaxGain).toLocaleString('fr-FR')}€</strong></span>` : ''}
                </div>
                <div style="font-size:.72rem;color:#94a3b8;margin-top:6px;">${r.notes}</div>
                ${i === 0 ? '<span class="regime-recommended">Recommandé pour votre profil</span>' : ''}
                <div style="font-size:.7rem;color:#cbd5e1;margin-top:4px;">${r.conditions}</div>
            </div>
        `).join('');
    }

    // Chart
    renderTaxCompareChart(results, holdingPeriod);

    // Best recommendation box
    const recBox = document.getElementById('taxBestRecommendation');
    if (recBox) {
        recBox.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:16px;">
                <div style="font-size:2rem;">${best.icon}</div>
                <div>
                    <h4 style="font-size:.95rem;font-weight:700;color:#1e3a8a;margin-bottom:6px;">
                        Recommandation : ${best.name}
                    </h4>
                    <p style="font-size:.82rem;color:#1e40af;margin-bottom:8px;">${best.desc}</p>
                    <p style="font-size:.78rem;color:#3730a3;">
                        <strong>Rendement net estimé :</strong> ${best.netYield.toFixed(2)}% —
                        <strong>Gain fiscal sur ${holdingPeriod} ans :</strong> ${Math.round(best.totalTaxGain).toLocaleString('fr-FR')}€
                    </p>
                    <p style="font-size:.72rem;color:#64748b;margin-top:8px;">
                        ⚠️ Ces projections sont indicatives. Consultez un expert-comptable ou un conseiller fiscal pour valider votre situation personnelle.
                    </p>
                </div>
            </div>
        `;
    }
}

function renderTaxCompareChart(results, holdingPeriod) {
    const canvas = document.getElementById('taxCompareChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Show cumulated tax gain over holding period for each regime
    const labels = results.map(r => r.shortName);
    const netYields = results.map(r => parseFloat(r.netYield.toFixed(2)));
    const taxGains = results.map(r => Math.round(r.totalTaxGain));
    const colors = results.map(r => r.color);

    if (window._taxCompareChart) window._taxCompareChart.destroy();
    window._taxCompareChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Rendement net (%)',
                    data: netYields,
                    backgroundColor: colors.map(c => c + 'cc'),
                    borderRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`
                    }
                }
            },
            scales: {
                y1: {
                    position: 'left',
                    ticks: {
                        callback: v => v + '%',
                        font: { size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,.05)' }
                },
                x: { ticks: { font: { size: 10 } } }
            }
        }
    });
}
