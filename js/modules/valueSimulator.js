/**
 * Simulateur d'évolution de valeur d'un bien immobilier
 * 
 * Ce module gère les calculs liés à l'évolution de la valeur d'un bien immobilier
 * sur une période donnée, en tenant compte de facteurs tels que l'emplacement,
 * le type de bien, l'âge, et les tendances du marché.
 */

import { findCityByName, getPricePerSqmByType, populateCitySelectors } from './cityData.js';
import { formatCurrency, formatPercentage } from '../utils/formatter.js';
import { showResults, showFormError } from '../ui.js';
import { setupCharts } from './charts.js';
import { saveSimulation } from './storage.js';

// Facteurs d'influence sur l'évolution de la valeur
const INFLUENCE_FACTORS = {
    market: {
        name: "Marché immobilier local",
        description: "Tendance générale des prix dans la ville et sa région.",
        weight: 0.40,
        icon: "📈"
    },
    demographics: {
        name: "Démographie",
        description: "Évolution de la population et attractivité de la ville.",
        weight: 0.20,
        icon: "👥"
    },
    urbanProjects: {
        name: "Projets urbains",
        description: "Développements et infrastructures prévus ou en cours.",
        weight: 0.15,
        icon: "🏗️"
    },
    inflation: {
        name: "Inflation",
        description: "Impact de l'inflation sur les prix immobiliers.",
        weight: 0.10,
        icon: "💰"
    },
    propertyCharacteristics: {
        name: "Caractéristiques du bien",
        description: "Type, taille et état du bien immobilier.",
        weight: 0.15,
        icon: "🏠"
    }
};

// Constantes pour les calculs
const ECONOMIC_GROWTH_RATE = 1.5; // % annuel moyen
const INFLATION_RATE = 1.8; // % annuel moyen
const RENOVATION_IMPACT_FACTOR = 0.7; // Efficacité des rénovations (0-1)

// La simulation et ses résultats
let currentValueSimulation = null;

/**
 * Initialise le simulateur d'évolution de valeur
 * @param {Array} cityData Données des villes
 */
export function initValueSimulator(cityData) {
    if (!cityData || !cityData.length) {
        console.error('Impossible d\'initialiser le simulateur sans données de villes');
        return;
    }
    
    // Remplir les sélecteurs de villes
    populateCitySelectors(cityData);
    
    // Écouter la soumission du formulaire
    document.addEventListener('valueFormSubmit', (event) => {
        handleValueFormSubmit(event, cityData);
    });
    
    // Écouter les changements de ville pour mettre à jour les infos
    const citySelector = document.getElementById('valueCity');
    if (citySelector) {
        citySelector.addEventListener('change', () => {
            updateCityPriceInfo(citySelector.value, cityData);
        });
    }
    
    // Configurer le bouton d'enregistrement de simulation
    const saveButton = document.getElementById('valueSaveBtn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (currentValueSimulation) {
                saveSimulation('value', currentValueSimulation);
            }
        });
    }
    
    // Configurer le bouton d'exportation PDF
    const exportButton = document.getElementById('valueExportBtn');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (currentValueSimulation) {
                exportValueResultsToPDF(currentValueSimulation);
            }
        });
    }
}

/**
 * Met à jour les informations de prix pour la ville sélectionnée
 * @param {String} cityName Nom de la ville
 * @param {Array} cityData Données des villes
 */
function updateCityPriceInfo(cityName, cityData) {
    const infoElement = document.getElementById('cityPriceInfo');
    if (!infoElement) return;
    
    const city = findCityByName(cityData, cityName);
    if (!city) {
        infoElement.textContent = '';
        return;
    }
    
    infoElement.textContent = `Prix moyen: ${formatCurrency(city.pricePerSqm)}/m² (${formatPercentage(city.priceEvolution)} par an)`;
    
    // Change la couleur en fonction de l'évolution des prix
    if (city.priceEvolution > 2.5) {
        infoElement.className = 'info-text positive';
    } else if (city.priceEvolution < 1.0) {
        infoElement.className = 'info-text neutral';
    } else {
        infoElement.className = 'info-text';
    }
}

/**
 * Gère la soumission du formulaire d'évolution de valeur
 * @param {Event} event Événement de soumission
 * @param {Array} cityData Données des villes
 */
function handleValueFormSubmit(event, cityData) {
    const formValues = event.detail.formValues;
    
    // Validation
    if (!validateValueForm(formValues)) {
        return;
    }
    
    // Exécute la simulation
    const simulationResults = simulateValueEvolution(formValues, cityData);
    currentValueSimulation = {
        inputs: formValues,
        results: simulationResults
    };
    
    // Affiche les résultats
    displayValueResults(simulationResults);
    
    // Affiche la section des résultats
    showResults('valueForm', 'valueResults');
}

/**
 * Valide les données du formulaire d'évolution de valeur
 * @param {Object} formValues Valeurs du formulaire
 * @returns {Boolean} true si valide, false sinon
 */
function validateValueForm(formValues) {
    if (!formValues.city) {
        showFormError('valueForm', 'Veuillez sélectionner une ville.');
        return false;
    }
    
    if (!formValues.area || formValues.area < 9) {
        showFormError('valueForm', 'La surface doit être d\'au moins 9 m².');
        return false;
    }
    
    if (!formValues.currentValue || formValues.currentValue < 10000) {
        showFormError('valueForm', 'La valeur actuelle doit être d\'au moins 10 000 €.');
        return false;
    }
    
    if (!formValues.rooms || formValues.rooms < 1) {
        showFormError('valueForm', 'Le nombre de pièces doit être d\'au moins 1.');
        return false;
    }
    
    return true;
}

/**
 * Simule l'évolution de valeur d'un bien immobilier
 * @param {Object} formValues Valeurs du formulaire
 * @param {Array} cityData Données des villes
 * @returns {Object} Résultats de la simulation
 */
function simulateValueEvolution(formValues, cityData) {
    const {
        city,
        propertyType,
        area,
        rooms,
        propertyAge,
        currentValue,
        projectionYears,
        renovationBudget
    } = formValues;
    
    // Récupère les données de la ville
    const cityInfo = findCityByName(cityData, city);
    if (!cityInfo) {
        throw new Error(`Ville non trouvée: ${city}`);
    }
    
    // Calcule le prix théorique au m² pour ce type de bien
    const theoreticalPricePerSqm = getPricePerSqmByType(cityData, city, propertyType);
    
    // Facteur d'âge du bien
    const ageFactor = getAgeFactor(propertyAge);
    
    // Valeur initiale actualisée (pour nos calculs)
    const initialValue = currentValue;
    
    // Impact des rénovations
    const renovationImpact = calculateRenovationImpact(renovationBudget, initialValue);
    
    // Année par année, calcule l'évolution de la valeur
    const yearlyValues = [];
    let currentYearValue = initialValue;
    
    for (let year = 0; year <= projectionYears; year++) {
        // Impact cumulatif des rénovations (s'applique progressivement)
        const appliedRenovationImpact = renovationImpact * Math.min(1, year / 2);
        
        // Facteurs d'évolution de valeur spécifiques à l'année
        const yearlyGrowthFactor = calculateYearlyGrowthFactor(cityInfo, year);
        
        // Calcul de la valeur pour cette année
        if (year === 0) {
            yearlyValues.push({
                year,
                value: currentYearValue,
                growthRate: 0
            });
        } else {
            // Calcul de la valeur avec tous les facteurs combinés
            const yearGrowth = yearlyGrowthFactor + appliedRenovationImpact;
            const newValue = currentYearValue * (1 + yearGrowth / 100);
            
            yearlyValues.push({
                year,
                value: newValue,
                growthRate: yearGrowth
            });
            
            currentYearValue = newValue;
        }
    }
    
    // Calcul des facteurs d'influence
    const influenceFactors = calculateInfluenceFactors(cityInfo, propertyAge, propertyType);
    
    // Prépare l'objet résultat
    const results = {
        initialValue,
        finalValue: yearlyValues[yearlyValues.length - 1].value,
        totalGrowth: (yearlyValues[yearlyValues.length - 1].value / initialValue - 1) * 100,
        annualizedGrowth: Math.pow(yearlyValues[yearlyValues.length - 1].value / initialValue, 1 / projectionYears) - 1,
        yearlyValues,
        influenceFactors,
        cityInfo,
        propertyDetails: {
            type: propertyType,
            age: propertyAge,
            area,
            rooms
        },
        renovationImpact
    };
    
    return results;
}

/**
 * Calcule le facteur d'âge qui influence la valorisation
 * @param {String} propertyAge Catégorie d'âge du bien
 * @returns {Number} Facteur d'âge
 */
function getAgeFactor(propertyAge) {
    switch (propertyAge) {
        case 'new':
            return 1.1; // Bonus pour les biens neufs
        case 'recent':
            return 1.05; // Léger bonus pour les biens récents
        case 'old':
            return 0.95; // Léger malus pour les biens anciens
        case 'veryOld':
            return 0.9; // Malus pour les biens très anciens
        default:
            return 1.0;
    }
}

/**
 * Calcule l'impact des rénovations sur la valeur du bien
 * @param {Number} renovationBudget Budget de rénovation
 * @param {Number} propertyValue Valeur du bien
 * @returns {Number} Impact en pourcentage sur la croissance annuelle
 */
function calculateRenovationImpact(renovationBudget, propertyValue) {
    if (!renovationBudget || renovationBudget <= 0) return 0;
    
    // Ratio du budget par rapport à la valeur du bien
    const budgetRatio = renovationBudget / propertyValue;
    
    // Impact plafonné et pondéré par le facteur d'efficacité
    return Math.min(5, budgetRatio * 100 * RENOVATION_IMPACT_FACTOR);
}

/**
 * Calcule le facteur de croissance annuel pour une année spécifique
 * @param {Object} cityInfo Informations sur la ville
 * @param {Number} year Année de projection
 * @returns {Number} Facteur de croissance en pourcentage
 */
function calculateYearlyGrowthFactor(cityInfo, year) {
    // Taux de base: évolution des prix dans la ville
    let baseGrowthRate = cityInfo.priceEvolution;
    
    // Fluctuation aléatoire limitée pour simuler des variations annuelles
    // (plus prononcées dans les premières années, puis se stabilisant)
    const randomVariation = (Math.random() - 0.5) * 2 * Math.max(0.5, 2 - year * 0.1);
    
    // Avec l'inflation et le taux de croissance économique
    const economicInfluence = (ECONOMIC_GROWTH_RATE - INFLATION_RATE) * 0.2;
    
    // Facteur cyclique qui simule les cycles immobiliers (7-8 ans)
    const cycleFactor = Math.sin(year * Math.PI / 4) * 0.5;
    
    // Combinaison de tous les facteurs
    return baseGrowthRate + randomVariation + economicInfluence + cycleFactor;
}

/**
 * Calcule l'impact des différents facteurs d'influence
 * @param {Object} cityInfo Informations sur la ville
 * @param {String} propertyAge Catégorie d'âge du bien
 * @param {String} propertyType Type de bien
 * @returns {Array} Facteurs d'influence calculés
 */
function calculateInfluenceFactors(cityInfo, propertyAge, propertyType) {
    const factors = [];
    
    // Facteur marché
    const marketScore = cityInfo.priceEvolution * 1.5;
    factors.push({
        ...INFLUENCE_FACTORS.market,
        score: marketScore,
        impact: marketScore * INFLUENCE_FACTORS.market.weight
    });
    
    // Facteur démographie
    const demographicsScore = cityInfo.populationGrowth * 3 + cityInfo.economicDynamism * 0.5;
    factors.push({
        ...INFLUENCE_FACTORS.demographics,
        score: demographicsScore,
        impact: demographicsScore * INFLUENCE_FACTORS.demographics.weight
    });
    
    // Facteur projets urbains (simulé en fonction du dynamisme économique)
    const urbanScore = cityInfo.economicDynamism * 0.8;
    factors.push({
        ...INFLUENCE_FACTORS.urbanProjects,
        score: urbanScore,
        impact: urbanScore * INFLUENCE_FACTORS.urbanProjects.weight
    });
    
    // Facteur inflation
    const inflationScore = INFLATION_RATE * 2;
    factors.push({
        ...INFLUENCE_FACTORS.inflation,
        score: inflationScore,
        impact: inflationScore * INFLUENCE_FACTORS.inflation.weight
    });
    
    // Facteur caractéristiques du bien
    let propertyScore = 5; // Score de base
    
    // Ajustement selon l'âge
    switch (propertyAge) {
        case 'new': propertyScore += 2; break;
        case 'recent': propertyScore += 1; break;
        case 'old': propertyScore -= 1; break;
        case 'veryOld': propertyScore -= 2; break;
    }
    
    // Ajustement selon le type
    switch (propertyType) {
        case 'apartment': propertyScore += 0.5; break;
        case 'house': propertyScore += 1; break;
        case 'studio': propertyScore -= 0.5; break;
        case 'loft': propertyScore += 1.5; break;
    }
    
    factors.push({
        ...INFLUENCE_FACTORS.propertyCharacteristics,
        score: propertyScore,
        impact: propertyScore * INFLUENCE_FACTORS.propertyCharacteristics.weight
    });
    
    // Tri par impact décroissant
    return factors.sort((a, b) => b.impact - a.impact);
}

/**
 * Affiche les résultats de la simulation dans l'interface
 * @param {Object} results Résultats de la simulation
 */
function displayValueResults(results) {
    // Affichage des valeurs principales
    document.getElementById('initialValueResult').textContent = formatCurrency(results.initialValue);
    document.getElementById('finalValueResult').textContent = formatCurrency(results.finalValue);
    document.getElementById('valueGrowthResult').textContent = formatPercentage(results.totalGrowth);
    document.getElementById('annualGrowthResult').textContent = formatPercentage(results.annualizedGrowth * 100);
    
    // Création du graphique d'évolution
    setupValueChart(results.yearlyValues);
    
    // Affichage des facteurs d'influence
    displayInfluenceFactors(results.influenceFactors);
}

/**
 * Initialise le graphique d'évolution de valeur
 * @param {Array} yearlyValues Valeurs annuelles du bien
 */
function setupValueChart(yearlyValues) {
    const chartCanvas = document.getElementById('valueChart');
    if (!chartCanvas) return;
    
    // Préparation des données pour le graphique
    const labels = yearlyValues.map(item => `Année ${item.year}`);
    const values = yearlyValues.map(item => item.value);
    
    // Configuration du graphique
    const chartData = {
        labels,
        datasets: [{
            label: 'Valeur du bien (€)',
            data: values,
            backgroundColor: 'rgba(67, 97, 238, 0.1)',
            borderColor: 'rgba(67, 97, 238, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(67, 97, 238, 1)',
            pointRadius: 4,
            tension: 0.3,
            fill: true
        }]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    callback: function(value) {
                        return formatCurrency(value, false);
                    }
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        const year = yearlyValues[context.dataIndex];
                        let label = formatCurrency(value);
                        
                        // Ajoute le taux de croissance pour les années > 0
                        if (year.year > 0) {
                            label += ` (${formatPercentage(year.growthRate)}/an)`;
                        }
                        
                        return label;
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };
    
    // Crée le graphique
    setupCharts('valueChart', 'line', chartData, chartOptions);
}

/**
 * Affiche les facteurs d'influence dans l'interface
 * @param {Array} factors Facteurs d'influence calculés
 */
function displayInfluenceFactors(factors) {
    const factorsContainer = document.getElementById('factorsGrid');
    if (!factorsContainer) return;
    
    // Vide le conteneur
    factorsContainer.innerHTML = '';
    
    // Crée un élément pour chaque facteur
    factors.forEach(factor => {
        const factorElement = document.createElement('div');
        factorElement.className = 'factor-item';
        
        // Détermine la classe de score
        let scoreClass;
        if (factor.score > 7) scoreClass = 'positive';
        else if (factor.score > 4) scoreClass = 'neutral';
        else scoreClass = 'negative';
        
        factorElement.innerHTML = `
            <div class="factor-icon">${factor.icon}</div>
            <div class="factor-content">
                <h5 class="factor-name">${factor.name}</h5>
                <div class="factor-bar">
                    <div class="factor-bar-fill ${scoreClass}" style="width: ${Math.min(100, Math.max(0, factor.score * 10))}%"></div>
                </div>
                <p class="factor-description">${factor.description}</p>
            </div>
        `;
        
        factorsContainer.appendChild(factorElement);
    });
}

/**
 * Exporte les résultats en PDF
 * @param {Object} simulation Données de la simulation
 */
function exportValueResultsToPDF(simulation) {
    // Note: Dans une implémentation réelle, cette fonction utiliserait
    // la bibliothèque jsPDF pour générer le document PDF.
    // Pour cette démo, on affiche simplement un message dans la console.
    console.log('Fonction d\'export PDF appelée avec:', simulation);
    alert('L\'export PDF sera implémenté dans une version future.');
}

// Ajout de styles CSS pour les éléments spécifiques
(function addValueSimulatorStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .factor-item {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            background-color: var(--gray-100);
            border-radius: var(--border-radius-md);
            margin-bottom: 12px;
        }
        
        .factor-icon {
            font-size: 24px;
            margin-right: 16px;
            background-color: var(--gray-200);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .factor-content {
            flex: 1;
        }
        
        .factor-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .factor-bar {
            height: 6px;
            background-color: var(--gray-300);
            border-radius: 3px;
            margin-bottom: 8px;
            overflow: hidden;
        }
        
        .factor-bar-fill {
            height: 100%;
            border-radius: 3px;
            background-color: var(--gray-500);
        }
        
        .factor-bar-fill.positive {
            background-color: var(--success);
        }
        
        .factor-bar-fill.negative {
            background-color: var(--danger);
        }
        
        .factor-description {
            font-size: 14px;
            color: var(--text-light);
            margin: 0;
        }
        
        #factorsGrid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 16px;
        }
        
        .info-text.positive {
            color: var(--success);
        }
        
        .info-text.neutral {
            color: var(--warning);
        }
    `;
    
    document.head.appendChild(styleElement);
})();