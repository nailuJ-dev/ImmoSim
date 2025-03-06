/**
 * Module de comparaison de scénarios pour le Simulateur Immobilier
 * 
 * Ce module permet de comparer différents scénarios d'investissement ou
 * d'évolution de valeur, afin d'aider l'utilisateur à prendre des décisions.
 */

import { getSimulations, deleteSimulation, formatSimulationDate } from './storage.js';
import { formatCurrency, formatPercentage, formatArea } from '../utils/formatter.js';
import { setupCharts, createBarChart, createLineChart } from './charts.js';
import { showSuccessMessage } from '../ui.js';

// Stocke les options d'affichage actuelles
const displayOptions = {
    activeType: 'value', // 'value' ou 'investment'
    selectedScenarios: [] // IDs des scénarios sélectionnés
};

/**
 * Initialise le module de comparaison
 */
export function initComparison() {
    // Récupère les éléments DOM
    const scenariosList = document.getElementById('scenariosList');
    const comparisonTable = document.getElementById('comparisonTable');
    const compareValueBtn = document.getElementById('compareValueBtn');
    const compareInvestBtn = document.getElementById('compareInvestBtn');
    
    if (!scenariosList || !comparisonTable) {
        console.error('Éléments DOM manquants pour le module de comparaison');
        return;
    }
    
    // Écoute les événements d'enregistrement et de suppression de simulations
    document.addEventListener('simulationSaved', loadScenarios);
    document.addEventListener('simulationDeleted', loadScenarios);
    
    // Écoute le clic sur les boutons de type de comparaison
    if (compareValueBtn) {
        compareValueBtn.addEventListener('click', () => {
            setComparisonType('value');
        });
    }
    
    if (compareInvestBtn) {
        compareInvestBtn.addEventListener('click', () => {
            setComparisonType('investment');
        });
    }
    
    // Chargement initial des scénarios
    loadScenarios();
    
    // Si au moins un scénario est disponible, le sélectionner par défaut
    setTimeout(() => {
        const firstScenario = document.querySelector('.scenario-card');
        if (firstScenario) {
            firstScenario.click();
        }
    }, 100);
}

/**
 * Charge et affiche les scénarios sauvegardés
 */
function loadScenarios() {
    const scenariosList = document.getElementById('scenariosList');
    if (!scenariosList) return;
    
    // Récupère tous les scénarios sauvegardés
    const allScenarios = getSimulations();
    
    // Vide la liste actuelle
    scenariosList.innerHTML = '';
    
    if (allScenarios.length === 0) {
        // Affiche un message si aucun scénario n'est sauvegardé
        scenariosList.innerHTML = `
            <div class="empty-state">
                Aucun scénario enregistré. Utilisez les simulateurs et cliquez sur "Enregistrer" pour comparer différents scénarios.
            </div>
        `;
        
        // Vide également le tableau de comparaison
        clearComparisonTable();
        displayOptions.selectedScenarios = [];
        
        return;
    }
    
    // Crée un élément pour chaque scénario
    allScenarios.forEach(scenario => {
        const scenarioElement = document.createElement('div');
        scenarioElement.className = 'scenario-card';
        scenarioElement.dataset.id = scenario.id;
        scenarioElement.dataset.type = scenario.type;
        
        // Détermine si ce scénario est actuellement sélectionné
        if (displayOptions.selectedScenarios.includes(scenario.id)) {
            scenarioElement.classList.add('selected');
        }
        
        // Crée le contenu du scénario
        scenarioElement.innerHTML = `
            <div class="scenario-title">${scenario.name}</div>
            <div class="scenario-meta">
                <span class="scenario-type">${getScenarioTypeName(scenario.type)}</span>
                <span class="scenario-date">${formatSimulationDate(scenario.createdAt)}</span>
            </div>
            <div class="scenario-actions">
                <button class="btn-delete" title="Supprimer ce scénario">×</button>
            </div>
        `;
        
        // Ajoute les descriptions si disponibles
        if (scenario.description) {
            const descriptionEl = document.createElement('div');
            descriptionEl.className = 'scenario-description';
            descriptionEl.textContent = scenario.description;
            scenarioElement.insertBefore(descriptionEl, scenarioElement.querySelector('.scenario-actions'));
        }
        
        // Ajoute l'événement de clic pour sélectionner ce scénario
        scenarioElement.addEventListener('click', (event) => {
            // Ignore le clic si c'était sur le bouton de suppression
            if (event.target.classList.contains('btn-delete')) return;
            
            toggleScenarioSelection(scenario.id);
        });
        
        // Ajoute l'événement de clic pour le bouton de suppression
        const deleteBtn = scenarioElement.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Empêche la propagation du clic
                deleteScenario(scenario.id);
            });
        }
        
        scenariosList.appendChild(scenarioElement);
    });
    
    // Met à jour la table de comparaison avec les scénarios actuellement sélectionnés
    updateComparisonTable();
}

/**
 * Change le type de comparaison (valeur ou investissement)
 * @param {String} type Type de comparaison ('value' ou 'investment')
 */
function setComparisonType(type) {
    if (type !== 'value' && type !== 'investment') return;
    
    // Met à jour le type actif
    displayOptions.activeType = type;
    
    // Met à jour l'interface utilisateur
    const compareValueBtn = document.getElementById('compareValueBtn');
    const compareInvestBtn = document.getElementById('compareInvestBtn');
    
    if (compareValueBtn) {
        compareValueBtn.classList.toggle('active', type === 'value');
    }
    
    if (compareInvestBtn) {
        compareInvestBtn.classList.toggle('active', type === 'investment');
    }
    
    // Rafraîchit la table de comparaison
    updateComparisonTable();
}

/**
 * Active/désactive la sélection d'un scénario
 * @param {String} scenarioId Identifiant du scénario
 */
function toggleScenarioSelection(scenarioId) {
    const index = displayOptions.selectedScenarios.indexOf(scenarioId);
    
    if (index === -1) {
        // Ajoute le scénario s'il n'est pas déjà sélectionné
        displayOptions.selectedScenarios.push(scenarioId);
    } else {
        // Retire le scénario s'il était déjà sélectionné
        displayOptions.selectedScenarios.splice(index, 1);
    }
    
    // Met à jour l'apparence des cartes de scénario
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach(card => {
        const isSelected = displayOptions.selectedScenarios.includes(card.dataset.id);
        card.classList.toggle('selected', isSelected);
    });
    
    // Met à jour la table de comparaison
    updateComparisonTable();
}

/**
 * Supprime un scénario
 * @param {String} scenarioId Identifiant du scénario
 */
function deleteScenario(scenarioId) {
    // Demande confirmation
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) {
        return;
    }
    
    // Supprime le scénario du stockage
    const deleted = deleteSimulation(scenarioId);
    
    if (deleted) {
        // Retire le scénario de la sélection si nécessaire
        const index = displayOptions.selectedScenarios.indexOf(scenarioId);
        if (index !== -1) {
            displayOptions.selectedScenarios.splice(index, 1);
        }
        
        // Affiche un message de confirmation
        showSuccessMessage('Scénario supprimé avec succès');
        
        // Recharge la liste des scénarios
        loadScenarios();
    }
}

/**
 * Met à jour le tableau de comparaison avec les scénarios sélectionnés
 */
function updateComparisonTable() {
    // Si aucun scénario n'est sélectionné, vide le tableau
    if (displayOptions.selectedScenarios.length === 0) {
        clearComparisonTable();
        return;
    }
    
    // Récupère tous les scénarios
    const allScenarios = getSimulations();
    
    // Filtre les scénarios sélectionnés du type actif
    const selectedScenarios = allScenarios.filter(scenario => 
        displayOptions.selectedScenarios.includes(scenario.id) && 
        (displayOptions.activeType === 'all' || scenario.type === displayOptions.activeType)
    );
    
    // Si aucun scénario du type actif n'est sélectionné, vide le tableau
    if (selectedScenarios.length === 0) {
        clearComparisonTable();
        return;
    }
    
    // Affiche les scénarios appropriés selon le type actif
    if (displayOptions.activeType === 'value') {
        displayValueComparison(selectedScenarios);
    } else {
        displayInvestmentComparison(selectedScenarios);
    }
}

/**
 * Vide le tableau de comparaison
 */
function clearComparisonTable() {
    const tableBody = document.querySelector('#comparisonTable tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
    }
    
    // Vide également le graphique
    setupCharts('comparisonChart', 'bar', { labels: [], datasets: [] });
}

/**
 * Affiche la comparaison des scénarios d'évolution de valeur
 * @param {Array} scenarios Liste des scénarios à comparer
 */
function displayValueComparison(scenarios) {
    // Met à jour les en-têtes du tableau
    const tableHead = document.querySelector('#comparisonTable thead tr');
    if (tableHead) {
        tableHead.innerHTML = `
            <th>Scénario</th>
            <th>Ville</th>
            <th>Type</th>
            <th>Surface</th>
            <th>Valeur initiale</th>
            <th>Valeur finale</th>
            <th>Évolution</th>
            <th>Actions</th>
        `;
    }
    
    // Met à jour le corps du tableau
    const tableBody = document.querySelector('#comparisonTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Données pour le graphique
    const chartData = {
        labels: [],
        initialValues: [],
        finalValues: []
    };
    
    // Ajoute chaque scénario au tableau
    scenarios.forEach(scenario => {
        const data = scenario.data;
        if (!data || !data.results) {
            console.warn(`Données manquantes pour le scénario ${scenario.id}`);
            return;
        }
        
        const results = data.results;
        const inputs = data.inputs;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${scenario.name}</td>
            <td>${inputs.city || 'N/A'}</td>
            <td>${getPropertyTypeName(inputs.propertyType) || 'N/A'}</td>
            <td>${formatArea(inputs.area) || 'N/A'}</td>
            <td>${formatCurrency(results.initialValue) || 'N/A'}</td>
            <td>${formatCurrency(results.finalValue) || 'N/A'}</td>
            <td>${formatPercentage(results.totalGrowth) || 'N/A'}</td>
            <td>
                <button class="btn-remove" title="Retirer de la comparaison">−</button>
            </td>
        `;
        
        // Ajoute l'événement de clic pour retirer ce scénario de la comparaison
        const removeBtn = row.querySelector('.btn-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                toggleScenarioSelection(scenario.id);
            });
        }
        
        tableBody.appendChild(row);
        
        // Ajoute les données au graphique
        chartData.labels.push(scenario.name);
        chartData.initialValues.push(results.initialValue);
        chartData.finalValues.push(results.finalValue);
    });
    
    // Crée le graphique de comparaison
    createValueComparisonChart(chartData);
}

/**
 * Affiche la comparaison des scénarios d'investissement locatif
 * @param {Array} scenarios Liste des scénarios à comparer
 */
function displayInvestmentComparison(scenarios) {
    // Met à jour les en-têtes du tableau
    const tableHead = document.querySelector('#comparisonTable thead tr');
    if (tableHead) {
        tableHead.innerHTML = `
            <th>Scénario</th>
            <th>Ville</th>
            <th>Investissement</th>
            <th>Loyer mensuel</th>
            <th>Rentabilité</th>
            <th>Cash-flow</th>
            <th>Indice de perf.</th>
            <th>Actions</th>
        `;
    }
    
    // Met à jour le corps du tableau
    const tableBody = document.querySelector('#comparisonTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Données pour le graphique
    const chartData = {
        labels: [],
        rentabilities: [],
        cashflows: [],
        performances: []
    };
    
    // Ajoute chaque scénario au tableau
    scenarios.forEach(scenario => {
        const data = scenario.data;
        if (!data || !data.results) {
            console.warn(`Données manquantes pour le scénario ${scenario.id}`);
            return;
        }
        
        const results = data.results;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${scenario.name}</td>
            <td>${results.city?.name || 'N/A'}</td>
            <td>${formatCurrency(results.financing?.totalInvestment) || 'N/A'}</td>
            <td>${formatCurrency(results.rentalIncome?.monthlyRent) || 'N/A'}</td>
            <td>${formatPercentage(results.performance?.netYield) || 'N/A'}</td>
            <td>${formatCurrency(results.performance?.monthlyCashflow) || 'N/A'}</td>
            <td>${results.performance?.performanceIndex ? Math.round(results.performance.performanceIndex) + '/100' : 'N/A'}</td>
            <td>
                <button class="btn-remove" title="Retirer de la comparaison">−</button>
            </td>
        `;
        
        // Ajoute l'événement de clic pour retirer ce scénario de la comparaison
        const removeBtn = row.querySelector('.btn-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                toggleScenarioSelection(scenario.id);
            });
        }
        
        tableBody.appendChild(row);
        
        // Ajoute les données au graphique
        chartData.labels.push(scenario.name);
        chartData.rentabilities.push(results.performance?.netYield || 0);
        chartData.cashflows.push(results.performance?.monthlyCashflow || 0);
        chartData.performances.push(results.performance?.performanceIndex || 0);
    });
    
    // Crée le graphique de comparaison
    createInvestmentComparisonChart(chartData);
}

/**
 * Crée un graphique pour comparer les scénarios d'évolution de valeur
 * @param {Object} data Données pour le graphique
 */
function createValueComparisonChart(data) {
    const chartCanvas = document.getElementById('comparisonChart');
    if (!chartCanvas) return;
    
    // Configuration des données
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Valeur initiale',
                data: data.initialValues,
                backgroundColor: 'rgba(108, 117, 125, 0.7)',
                borderColor: 'rgba(108, 117, 125, 1)',
                borderWidth: 1
            },
            {
                label: 'Valeur projetée',
                data: data.finalValues,
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1
            }
        ]
    };
    
    // Options du graphique
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Valeur (€)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, false);
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        return `${context.dataset.label}: ${formatCurrency(value)}`;
                    }
                }
            }
        }
    };
    
    // Crée le graphique
    createBarChart('comparisonChart', data.labels, chartData.datasets, chartOptions);
}

/**
 * Crée un graphique pour comparer les scénarios d'investissement locatif
 * @param {Object} data Données pour le graphique
 */
function createInvestmentComparisonChart(data) {
    const chartCanvas = document.getElementById('comparisonChart');
    if (!chartCanvas) return;
    
    // Configuration des données
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: 'Rentabilité nette (%)',
                data: data.rentabilities.map(value => value * 100), // Conversion en pourcentage
                backgroundColor: 'rgba(37, 179, 80, 0.7)',
                borderColor: 'rgba(37, 179, 80, 1)',
                borderWidth: 1,
                yAxisID: 'y-percent'
            },
            {
                label: 'Cash-flow mensuel (€)',
                data: data.cashflows,
                backgroundColor: 'rgba(67, 97, 238, 0.7)',
                borderColor: 'rgba(67, 97, 238, 1)',
                borderWidth: 1,
                yAxisID: 'y-euros'
            },
            {
                label: 'Indice de performance (/100)',
                data: data.performances,
                backgroundColor: 'rgba(255, 193, 7, 0.7)',
                borderColor: 'rgba(255, 193, 7, 1)',
                borderWidth: 1,
                yAxisID: 'y-percent'
            }
        ]
    };
    
    // Options du graphique
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            'y-percent': {
                type: 'linear',
                position: 'left',
                title: {
                    display: true,
                    text: 'Pourcentage (%)'
                },
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                },
                min: 0
            },
            'y-euros': {
                type: 'linear',
                position: 'right',
                title: {
                    display: true,
                    text: 'Cash-flow (€)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, false);
                    }
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        const datasetLabel = context.dataset.label;
                        
                        if (datasetLabel.includes('%') || datasetLabel.includes('/100')) {
                            return `${datasetLabel}: ${value.toFixed(1)}%`;
                        } else {
                            return `${datasetLabel}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    };
    
    // Crée le graphique
    createBarChart('comparisonChart', data.labels, chartData.datasets, chartOptions);
}

/**
 * Obtient le nom lisible d'un type de scénario
 * @param {String} type Type de scénario
 * @returns {String} Nom lisible
 */
function getScenarioTypeName(type) {
    switch (type) {
        case 'value': return 'Évolution de valeur';
        case 'investment': return 'Investissement locatif';
        default: return type;
    }
}

/**
 * Obtient le nom lisible d'un type de bien
 * @param {String} type Type de bien
 * @returns {String} Nom lisible
 */
function getPropertyTypeName(type) {
    switch (type) {
        case 'apartment': return 'Appartement';
        case 'house': return 'Maison';
        case 'studio': return 'Studio';
        case 'loft': return 'Loft';
        default: return type;
    }
}

// Ajoute les styles CSS spécifiques à la comparaison
(function addComparisonStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .scenario-card {
            position: relative;
            cursor: pointer;
        }
        
        .scenario-card.selected {
            border: 2px solid var(--primary);
            background-color: rgba(67, 97, 238, 0.05);
        }
        
        .scenario-description {
            font-size: 12px;
            color: var(--text-light);
            margin: 5px 0;
            line-height: 1.3;
        }
        
        .scenario-actions {
            position: absolute;
            top: 8px;
            right: 8px;
        }
        
        .btn-delete,
        .btn-remove {
            background: none;
            border: none;
            color: var(--gray-500);
            font-size: 16px;
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 50%;
            transition: all 0.2s;
        }
        
        .btn-delete:hover,
        .btn-remove:hover {
            color: var(--danger);
            background-color: rgba(220, 53, 69, 0.1);
        }
    `;
    
    document.head.appendChild(styleElement);
})();