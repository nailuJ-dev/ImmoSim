/**
 * ImmoSim Pro — Dashboard Orchestrator
 * Point d'entrée principal de l'application professionnelle
 */

import { initUI, setupThemeToggle } from './ui.js';
import { initValueSimulator } from './modules/valueSimulator.js';
import { initInvestmentSimulator } from './modules/investSimulator.js';
import { initComparison } from './modules/comparison.js';
import { initPurchasingPower } from './modules/purchasingPower.js';
import { initMapInteraction } from './modules/mapInteraction.js';
import { loadCityData } from './modules/cityData.js';
import { setupStorage } from './modules/storage.js';
import { initClientManager } from './modules/clientManager.js';
import { initDVFData } from './modules/dvfData.js';
import { initTaxOptimizer } from './modules/taxOptimizer.js';
import { initMarketAnalysis } from './modules/marketAnalysis.js';
import { initReportGenerator } from './modules/reportGenerator.js';

// ===== NAVIGATION =====

const PANEL_LABELS = {
    'dashboard': 'Tableau de bord',
    'clients': 'Portefeuille Clients',
    'value-simulator': 'Simulateur de Valeur',
    'investment-simulator': 'Investissement Locatif',
    'purchasing-power': 'Pouvoir d\'Achat',
    'comparison': 'Comparaison de Scénarios',
    'dvf': 'Données DVF',
    'tax-optimizer': 'Optimiseur Fiscal',
    'market-analysis': 'Analyse de Marché',
    'reports': 'Rapports PDF'
};

function setupNavigation() {
    // Nav items in sidebar
    document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const panelId = item.dataset.panel;
            navigateTo(panelId);
            // Close mobile sidebar
            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });

    // Quick access buttons in dashboard
    document.querySelectorAll('.quick-btn[data-panel]').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.panel));
    });

    // Card actions
    document.querySelectorAll('.card-action[data-panel]').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.panel));
    });

    // Sidebar toggle (collapse)
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
    }

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });
    }
}

function navigateTo(panelId) {
    // Update nav items
    document.querySelectorAll('.nav-item[data-panel]').forEach(item => {
        item.classList.toggle('active', item.dataset.panel === panelId);
    });

    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === 'panel-' + panelId);
    });

    // Update breadcrumb
    const label = document.getElementById('currentSectionLabel');
    if (label) label.textContent = PANEL_LABELS[panelId] || panelId;

    // Scroll to top
    document.querySelector('.content-area').scrollTo(0, 0);
}

// ===== DASHBOARD MARKET TABLE =====

function populateMarketTable(cityData) {
    const tbody = document.getElementById('marketTableBody');
    if (!tbody || !cityData) return;

    // Show top 8 cities sorted by price
    const topCities = [...cityData].sort((a, b) => b.pricePerSqm - a.pricePerSqm).slice(0, 8);

    tbody.innerHTML = topCities.map(city => {
        const grossYield = ((city.rentPerSqm * 12) / city.pricePerSqm * 100).toFixed(1);
        const evo = city.priceEvolution;
        const tensionClass = evo > 2.5 ? 'tension-high' : evo > 1.5 ? 'tension-medium' : 'tension-low';
        const tensionLabel = evo > 2.5 ? 'Élevée' : evo > 1.5 ? 'Modérée' : 'Faible';
        const trendClass = evo >= 0 ? 'up' : 'down';
        const trendSign = evo >= 0 ? '+' : '';
        return `
            <tr>
                <td><strong>${city.name}</strong> <small style="color:#94a3b8">${city.region}</small></td>
                <td>${city.pricePerSqm.toLocaleString('fr-FR')} €/m²</td>
                <td><span class="trend-badge ${trendClass}">${trendSign}${evo}%/an</span></td>
                <td>${city.rentPerSqm} €/m²</td>
                <td><strong>${grossYield}%</strong></td>
                <td><span class="tension-dot ${tensionClass}"></span>${tensionLabel}</td>
            </tr>
        `;
    }).join('');
}

// ===== INIT =====

async function initDashboard() {
    try {
        console.log('Initialisation ImmoSim Pro...');

        // Navigation
        setupNavigation();

        // Theme
        setupThemeToggle();

        // Load city data
        const cityData = await loadCityData();
        console.log(`Données chargées: ${cityData.length} villes`);

        // Storage
        setupStorage();

        // Dashboard market table
        populateMarketTable(cityData);

        // Core simulators (re-use existing modules)
        initUI();
        initValueSimulator(cityData);
        initInvestmentSimulator(cityData);
        initComparison();
        initPurchasingPower(cityData);
        initMapInteraction(cityData);

        // New Pro modules
        initClientManager();
        initDVFData(cityData);
        initTaxOptimizer();
        initMarketAnalysis(cityData);
        initReportGenerator();

        console.log('ImmoSim Pro initialisé avec succès');
    } catch (error) {
        console.error('Erreur initialisation:', error);
    }
}

document.addEventListener('DOMContentLoaded', initDashboard);
