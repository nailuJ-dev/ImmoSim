/**
 * Calculateur de pouvoir d'achat immobilier (version améliorée)
 * 
 * Ce module permet d'estimer la capacité d'emprunt d'un utilisateur et
 * le type de bien accessible en fonction de ses revenus et du marché local.
 */

import { findCityByName, populateCitySelectors } from './cityData.js';
import { 
    calculateBorrowingCapacity, 
    calculateTotalBudget,
    calculateTotalLoanPayment
} from '../utils/calculator.js';
import { formatCurrency, formatPercentage, formatArea, abbreviateNumber } from '../utils/formatter.js';
import { showResults, showFormError } from '../ui.js';
import { createHorizontalBarChart } from './charts.js';

// Constantes de calcul
const TOP_CITIES_COUNT = 10; // Nombre de villes à comparer
const PROPERTY_TYPES = ['apartment', 'house', 'studio'];
const DEFAULT_INSURANCE_RATE = 0.36; // Taux d'assurance par défaut: 0.36% du capital par an
const DEFAULT_APPLICATION_FEES = 1000; // Frais de dossier standard: 1000€
const MIN_LIVING_EXPENSE = 1050; // Reste à vivre minimum: 1050€ par mois (approximation)

/**
 * Initialise le calculateur de pouvoir d'achat
 * @param {Array} cityData Données des villes
 */
export function initPurchasingPower(cityData) {
    if (!cityData || !cityData.length) {
        console.error('Impossible d\'initialiser le calculateur sans données de villes');
        return;
    }
    
    // Écouter la soumission du formulaire
    document.addEventListener('purchasingPowerFormSubmit', (event) => {
        handlePurchasingPowerFormSubmit(event, cityData);
    });
    
    // Écouter les changements de ville pour mettre à jour les informations
    const citySelector = document.getElementById('ppCity');
    if (citySelector) {
        citySelector.addEventListener('change', () => {
            const selectedCity = citySelector.value;
            updateCityDisplay(selectedCity);
        });
    }
    
    // Configurer le bouton d'exportation PDF
    const exportButton = document.getElementById('ppExportBtn');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            alert('L\'export PDF sera implémenté dans une version future.');
        });
    }
    
    // Configurer le bouton de retour
    const backButton = document.getElementById('ppBackBtn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            const resultsContainer = document.getElementById('purchasingPowerResults');
            const formContainer = document.getElementById('purchasingPowerForm');
            
            if (resultsContainer && formContainer) {
                resultsContainer.style.display = 'none';
                formContainer.style.display = 'block';
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/**
 * Met à jour l'affichage du nom de la ville sélectionnée
 * @param {String} cityName Nom de la ville
 */
function updateCityDisplay(cityName) {
    const cityDisplay = document.getElementById('selectedCityDisplay');
    if (cityDisplay && cityName) {
        cityDisplay.textContent = cityName;
    }
}

/**
 * Gère la soumission du formulaire de pouvoir d'achat
 * @param {Event} event Événement de soumission
 * @param {Array} cityData Données des villes
 */
function handlePurchasingPowerFormSubmit(event, cityData) {
    const formValues = event.detail.formValues;
    
    // Validation
    if (!validatePurchasingPowerForm(formValues)) {
        return;
    }
    
    // Exécute les calculs
    const results = calculatePurchasingPower(formValues, cityData);
    
    // Affiche les résultats
    displayPurchasingPowerResults(results, cityData);
    
    // Affiche la section des résultats
    showResults('purchasingPowerForm', 'purchasingPowerResults');
}

/**
 * Valide les données du formulaire de pouvoir d'achat
 * @param {Object} formValues Valeurs du formulaire
 * @returns {Boolean} true si valide, false sinon
 */
function validatePurchasingPowerForm(formValues) {
    if (!formValues.city) {
        showFormError('purchasingPowerForm', 'Veuillez sélectionner une ville.');
        return false;
    }
    
    if (!formValues.monthlyIncome || formValues.monthlyIncome < 500) {
        showFormError('purchasingPowerForm', 'Veuillez indiquer des revenus mensuels d\'au moins 500 €.');
        return false;
    }
    
    if (!formValues.interestRate || formValues.interestRate <= 0) {
        showFormError('purchasingPowerForm', 'Le taux d\'intérêt doit être supérieur à 0%.');
        return false;
    }
    
    // Validation supplémentaire: Ratio d'endettement réaliste
    const debtRatio = parseFloat(formValues.debtRatio);
    if (debtRatio > 40) {
        showFormError('purchasingPowerForm', 'Le taux d\'endettement ne peut pas dépasser 40% selon les règles bancaires françaises actuelles.');
        return false;
    }
    
    return true;
}

/**
 * Calcule le pouvoir d'achat immobilier avec une approche réaliste
 * @param {Object} formValues Valeurs du formulaire
 * @param {Array} cityData Données des villes
 * @returns {Object} Résultats du calcul
 */
function calculatePurchasingPower(formValues, cityData) {
    // Parse les valeurs du formulaire
    const {
        city,
        monthlyIncome: monthlyIncomeStr,
        additionalIncome: additionalIncomeStr,
        currentDebt: currentDebtStr,
        personalContribution: personalContributionStr,
        interestRate: interestRateStr,
        loanDuration: loanDurationStr,
        debtRatio: debtRatioStr,
        notaryFees: notaryFeesStr,
        propertyType
    } = formValues;
    
    // Conversion des valeurs en nombres
    const monthlyIncome = parseFloat(monthlyIncomeStr);
    const additionalIncome = parseFloat(additionalIncomeStr) || 0;
    const currentDebt = parseFloat(currentDebtStr) || 0;
    const personalContribution = parseFloat(personalContributionStr) || 0;
    const interestRate = parseFloat(interestRateStr);
    const loanDuration = parseInt(loanDurationStr, 10);
    const debtRatio = parseFloat(debtRatioStr);
    const notaryFeesRate = parseFloat(notaryFeesStr);
    
    // Revenus totaux
    const totalMonthlyIncome = monthlyIncome + additionalIncome;
    
    // Calcul de la capacité d'emprunt avec l'approche améliorée
    const borrowingCapacity = calculateBorrowingCapacity(
        totalMonthlyIncome,
        currentDebt,
        debtRatio,  // On passe le taux en pourcentage
        interestRate,
        loanDuration,
        DEFAULT_INSURANCE_RATE, // Taux d'assurance standard
        MIN_LIVING_EXPENSE // Reste à vivre minimum
    );
    
    // Calcul du budget total avec les frais
    const budgetDetails = calculateTotalBudget(
        borrowingCapacity,
        personalContribution,
        notaryFeesRate,
        DEFAULT_APPLICATION_FEES
    );
    
    // Mensualité du prêt (avec assurance)
    const loanPaymentDetails = calculateTotalLoanPayment(
        borrowingCapacity,
        interestRate,
        loanDuration,
        DEFAULT_INSURANCE_RATE
    );
    
    // Calcul du taux d'endettement réel
    const debtRatioActual = totalMonthlyIncome > 0 ? 
        (loanPaymentDetails.totalPayment + currentDebt) / totalMonthlyIncome : 0;
    
    // Récupère les données de la ville
    const cityInfo = findCityByName(cityData, city);
    
    // Calcul des surfaces accessibles selon le type de bien
    const accessibleSurfaces = {};
    PROPERTY_TYPES.forEach(type => {
        let pricePerSqm = 0;
        
        if (cityInfo) {
            switch (type) {
                case 'apartment':
                    pricePerSqm = cityInfo.apartmentPricePerSqm;
                    break;
                case 'house':
                    pricePerSqm = cityInfo.housePricePerSqm;
                    break;
                case 'studio':
                    pricePerSqm = cityInfo.studioPricePerSqm;
                    break;
                default:
                    pricePerSqm = cityInfo.pricePerSqm;
            }
        }
        
        // Si le prix au m² est disponible et supérieur à zéro
        const accessibleSurface = pricePerSqm > 0 ? budgetDetails.netBudget / pricePerSqm : 0;
        accessibleSurfaces[type] = accessibleSurface;
    });
    
    // Comparaison avec d'autres villes
    const cityComparison = calculateCityComparison(
        cityData,
        budgetDetails.netBudget,
        propertyType || 'apartment'
    );
    
    // Génération de conseils basés sur les résultats
    const advice = generateAdvice({
        income: totalMonthlyIncome,
        borrowingCapacity,
        netBudget: budgetDetails.netBudget,
        debtRatio: debtRatioActual,
        loanDuration,
        personalContribution
    });
    
    return {
        income: {
            monthlyIncome,
            additionalIncome,
            totalMonthlyIncome,
            currentDebt
        },
        financing: {
            personalContribution,
            borrowingCapacity,
            totalBudget: budgetDetails.grossBudget,
            netBudget: budgetDetails.netBudget,
            notaryFees: budgetDetails.notaryFees,
            applicationFees: budgetDetails.applicationFees,
            interestRate,
            loanDuration,
            maxMonthlyPayment: loanPaymentDetails.totalPayment,
            loanPayment: loanPaymentDetails.loanPayment,
            insurancePayment: loanPaymentDetails.insurancePayment,
            debtRatioActual
        },
        property: {
            city: cityInfo,
            propertyType,
            accessibleSurfaces
        },
        cityComparison,
        advice
    };
}

/**
 * Génère des conseils personnalisés basés sur les résultats
 * @param {Object} data Données des résultats
 * @returns {Array} Liste de conseils
 */
function generateAdvice(data) {
    const advice = [];
    
    // Conseil sur l'apport personnel
    const contributionRatio = data.personalContribution / data.borrowingCapacity;
    if (contributionRatio < 0.1) {
        advice.push({
            title: "Apport personnel",
            text: "Augmenter votre apport personnel à au moins 10% du montant emprunté améliorerait vos conditions de prêt et pourrait vous permettre d'obtenir un meilleur taux."
        });
    }
    
    // Conseil sur la durée du prêt
    if (data.loanDuration > 25) {
        advice.push({
            title: "Durée du prêt",
            text: "Un prêt sur plus de 25 ans augmente significativement le coût total. Envisagez de réduire la durée si votre budget le permet."
        });
    } else if (data.loanDuration < 15 && data.debtRatio > 0.3) {
        advice.push({
            title: "Durée du prêt",
            text: "Allonger la durée de votre prêt pourrait réduire vos mensualités et améliorer votre taux d'endettement."
        });
    }
    
    // Conseil sur le taux d'endettement
    if (data.debtRatio > 0.33) {
        advice.push({
            title: "Taux d'endettement",
            text: "Votre taux d'endettement est élevé. Les banques préfèrent généralement qu'il reste sous 33%. Envisagez d'augmenter votre apport ou de viser un bien moins cher."
        });
    }
    
    // Conseil sur le budget
    if (data.netBudget < 150000 && data.income > 2500) {
        advice.push({
            title: "Budget limité",
            text: "Avec vos revenus, vous pourriez envisager d'augmenter votre capacité d'emprunt en réduisant vos dettes actuelles ou en constituant un apport personnel plus important."
        });
    }
    
    return advice;
}

/**
 * Calcule la comparaison avec d'autres villes
 * @param {Array} cityData Données des villes
 * @param {Number} budget Budget disponible
 * @param {String} propertyType Type de bien
 * @returns {Array} Résultats de la comparaison
 */
function calculateCityComparison(cityData, budget, propertyType) {
    // Si aucune donnée ou budget nul, retourne un tableau vide
    if (!cityData || !cityData.length || !budget) {
        return [];
    }
    
    // Calcule la surface accessible dans chaque ville
    const citySurfaces = cityData.map(city => {
        let pricePerSqm = 0;
        
        switch (propertyType) {
            case 'apartment':
                pricePerSqm = city.apartmentPricePerSqm;
                break;
            case 'house':
                pricePerSqm = city.housePricePerSqm;
                break;
            case 'studio':
                pricePerSqm = city.studioPricePerSqm;
                break;
            default:
                pricePerSqm = city.pricePerSqm;
        }
        
        const accessibleSurface = pricePerSqm > 0 ? budget / pricePerSqm : 0;
        
        return {
            name: city.name,
            pricePerSqm,
            accessibleSurface,
            // Indice d'attractivité global (combinaison de différents facteurs)
            attractivityIndex: city.attractivityIndex || 0
        };
    });
    
    // Trie les villes par surface accessible (décroissant)
    const sortedCities = citySurfaces
        .filter(city => city.accessibleSurface > 0)  // Exclut les villes où le budget est insuffisant
        .sort((a, b) => b.accessibleSurface - a.accessibleSurface);
    
    // Retourne les N meilleures villes
    return sortedCities.slice(0, TOP_CITIES_COUNT);
}

/**
 * Affiche les résultats du calcul de pouvoir d'achat
 * @param {Object} results Résultats du calcul
 * @param {Array} cityData Données des villes
 */
function displayPurchasingPowerResults(results, cityData) {
    // Affichage des valeurs principales
    document.getElementById('borrowingCapacityResult').textContent = formatCurrency(results.financing.borrowingCapacity);
    document.getElementById('maxPropertyValueResult').textContent = formatCurrency(results.financing.totalBudget);
    document.getElementById('monthlyPaymentResult').textContent = formatCurrency(results.financing.maxMonthlyPayment);
    document.getElementById('debtRatioResult').textContent = formatPercentage(results.financing.debtRatioActual * 100);
    
    // Affichage des surfaces accessibles
    document.getElementById('apartmentSizeResult').textContent = formatArea(results.property.accessibleSurfaces.apartment);
    document.getElementById('houseSizeResult').textContent = formatArea(results.property.accessibleSurfaces.house);
    document.getElementById('studioSizeResult').textContent = formatArea(results.property.accessibleSurfaces.studio);
    
    // Mise à jour du nom de la ville sélectionnée
    updateCityDisplay(results.property.city?.name || 'cette ville');
    
    // Création du graphique de comparaison des villes
    createCitiesComparisonChart(results.cityComparison);
    
    // Affichage des conseils
    displayAdvice(results.advice);
}

/**
 * Affiche les conseils personnalisés
 * @param {Array} advice Liste de conseils
 */
function displayAdvice(advice) {
    const adviceContainer = document.querySelector('.property-possibilities');
    if (!adviceContainer || !advice || advice.length === 0) return;
    
    // Vérifie si la section de conseils existe déjà
    let adviceSection = document.querySelector('.purchasing-advice');
    
    // Si non, créer la section
    if (!adviceSection) {
        adviceSection = document.createElement('div');
        adviceSection.className = 'purchasing-advice';
        adviceSection.innerHTML = '<h4>Conseils personnalisés</h4>';
        adviceContainer.appendChild(adviceSection);
    } else {
        // Sinon, vider la section
        adviceSection.innerHTML = '<h4>Conseils personnalisés</h4>';
    }
    
    // Créer un conteneur pour les conseils
    const adviceList = document.createElement('div');
    adviceList.className = 'advice-list';
    
    // Ajouter chaque conseil
    advice.forEach(item => {
        const adviceItem = document.createElement('div');
        adviceItem.className = 'advice-item';
        adviceItem.innerHTML = `
            <h5>${item.title}</h5>
            <p>${item.text}</p>
        `;
        adviceList.appendChild(adviceItem);
    });
    
    adviceSection.appendChild(adviceList);
}

/**
 * Crée le graphique de comparaison des villes
 * @param {Array} cityComparison Données de comparaison des villes
 */
function createCitiesComparisonChart(cityComparison) {
    const chartCanvas = document.getElementById('citiesComparisonChart');
    if (!chartCanvas || !cityComparison || !cityComparison.length) {
        return;
    }
    
    // Trie les villes par surface accessible (ordre croissant pour affichage horizontal)
    const sortedCities = [...cityComparison].sort((a, b) => a.accessibleSurface - b.accessibleSurface);
    
    // Extrait les données pour le graphique
    const labels = sortedCities.map(city => city.name);
    const surfaces = sortedCities.map(city => city.accessibleSurface);
    const prices = sortedCities.map(city => city.pricePerSqm);
    
    // Normalization for colors (0-100 scale)
    const maxPrice = Math.max(...prices);
    const normalizedPrices = prices.map(price => price / maxPrice * 100);
    
    // Generate colors based on price (green for cheaper, red for expensive)
    const barColors = normalizedPrices.map(norm => {
        const r = Math.min(255, Math.round(norm * 2.55));
        const g = Math.min(255, Math.round(255 - norm * 1.5));
        const b = 80;
        return `rgba(${r}, ${g}, ${b}, 0.7)`;
    });
    
    // Generate border colors (slightly darker)
    const borderColors = barColors.map(color => {
        return color.replace('0.7', '1.0');
    });
    
    // Configuration des données
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Surface accessible (m²)',
                data: surfaces,
                backgroundColor: barColors,
                borderColor: borderColors,
                borderWidth: 1
            }
        ]
    };
    
    // Options du graphique
    const chartOptions = {
        indexAxis: 'y',  // Pour un graphique horizontal
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Surface (m²)'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Ville'
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const index = context.dataIndex;
                        const surface = surfaces[index];
                        const price = prices[index];
                        
                        return [
                            `Surface: ${formatArea(surface)}`,
                            `Prix: ${formatCurrency(price)}/m²`
                        ];
                    }
                }
            },
            legend: {
                display: false
            }
        }
    };
    
    // Crée le graphique
    createHorizontalBarChart('citiesComparisonChart', labels, chartData.datasets, chartOptions);
}

// Ajoute les styles CSS spécifiques au calculateur de pouvoir d'achat
(function addPurchasingPowerStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .property-icon {
            position: relative;
        }
        
        .property-icon.apartment::before {
            content: '🏢';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
        }
        
        .property-icon.house::before {
            content: '🏠';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
        }
        
        .property-icon.studio::before {
            content: '🏘️';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
        }
        
        .purchasing-advice {
            margin-top: 2rem;
            background-color: var(--gray-100);
            border-radius: var(--border-radius-md);
            padding: 1.5rem;
        }
        
        .advice-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .advice-item {
            background-color: var(--white);
            border-left: 4px solid var(--primary);
            padding: 1rem;
            border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
        }
        
        .advice-item h5 {
            color: var(--primary);
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .advice-item p {
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.4;
        }
    `;
    
    document.head.appendChild(styleElement);
})();