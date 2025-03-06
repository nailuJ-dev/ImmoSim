/**
 * Simulateur d'investissement locatif
 * 
 * Ce module gère les calculs et l'affichage des résultats de la simulation
 * d'investissement locatif, incluant la rentabilité, le cash-flow, et les
 * projections financières sur le long terme.
 */

import { findCityByName, getPricePerSqmByType, populateCitySelectors, getRentPerSqm, getPropertyTaxRate } from './cityData.js';
import { 
    calculateLoanPayment, 
    calculateGrossYield, 
    calculateNetYield,
    calculateMonthlyCashflow,
    calculateNotaryFees,
    calculateFutureValue,
    calculateAnnualAmortizationSchedule,
    calculateMicroFoncierTax,
    calculateRealRegimeTax,
    calculateLMNPTax
} from '../utils/calculator.js';
import { 
    formatCurrency, 
    formatPercentage, 
    formatNumber,
    abbreviateNumber,
    formatYears
} from '../utils/formatter.js';
import { setupCharts } from './charts.js';
import { showResults, showFormError } from '../ui.js';
import { saveSimulation } from './storage.js';

// Constantes pour les calculs
const AVERAGE_PROPERTY_VALUE_GROWTH = 1.5; // % par an
const AVERAGE_RENT_GROWTH = 1.0; // % par an
const SOCIAL_TAX_RATE = 17.2; // %
const DEFAULT_PROJECTION_YEARS = 20;

// La simulation et ses résultats
let currentInvestmentSimulation = null;

/**
 * Initialise le simulateur d'investissement locatif
 * @param {Array} cityData Données des villes
 */
export function initInvestmentSimulator(cityData) {
    if (!cityData || !cityData.length) {
        console.error('Impossible d\'initialiser le simulateur sans données de villes');
        return;
    }
    
    console.log('Initialisation du simulateur d\'investissement locatif');
    
    // Écouter la soumission du formulaire
    document.addEventListener('investmentFormSubmit', (event) => {
        handleInvestmentFormSubmit(event, cityData);
    });
    
    // Configuration du bouton de retour
    setupInvestmentBackButton();
    
    // Modification de la structure des onglets lors du chargement initial
    convertTabsToLinearLayout();
    
    // Calcul automatique du montant du prêt
    const purchasePriceInput = document.getElementById('purchasePrice');
    const downPaymentInput = document.getElementById('downPayment');
    const loanAmountInput = document.getElementById('loanAmount');
    const notaryFeesInput = document.getElementById('notaryFees');
    const renovationCostInput = document.getElementById('renovationCost');
    
    // Fonction pour calculer le montant du prêt
    function updateLoanAmount() {
        if (purchasePriceInput && downPaymentInput && loanAmountInput && notaryFeesInput && renovationCostInput) {
            const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
            const downPayment = parseFloat(downPaymentInput.value) || 0;
            const notaryFeesRate = parseFloat(notaryFeesInput.value) || 0;
            const renovationCost = parseFloat(renovationCostInput.value) || 0;
            
            // Calcul des frais de notaire
            const notaryFees = purchasePrice * (notaryFeesRate / 100);
            
            // Montant total de l'opération
            const totalAmount = purchasePrice + notaryFees + renovationCost;
            
            // Montant du prêt
            const loanAmount = Math.max(0, totalAmount - downPayment);
            
            loanAmountInput.value = Math.round(loanAmount);
        }
    }
    
    // Ajouter les écouteurs d'événements pour mettre à jour le montant du prêt
    if (purchasePriceInput) purchasePriceInput.addEventListener('input', updateLoanAmount);
    if (downPaymentInput) downPaymentInput.addEventListener('input', updateLoanAmount);
    if (notaryFeesInput) notaryFeesInput.addEventListener('input', updateLoanAmount);
    if (renovationCostInput) renovationCostInput.addEventListener('input', updateLoanAmount);
    
    // Aide à l'estimation du montant du loyer
    const investCityInput = document.getElementById('investCity');
    const investAreaInput = document.getElementById('investArea');
    const monthlyRentInput = document.getElementById('monthlyRent');
    
    function suggestRent() {
        if (investCityInput && investAreaInput && monthlyRentInput) {
            const cityName = investCityInput.value;
            const area = parseFloat(investAreaInput.value) || 0;
            
            if (cityName && area > 0) {
                const rentPerSqm = getRentPerSqm(cityData, cityName);
                if (rentPerSqm) {
                    // Suggère un loyer si le champ est vide ou si la valeur actuelle est très différente de l'estimation
                    const suggestedRent = Math.round(rentPerSqm * area);
                    const currentRent = parseFloat(monthlyRentInput.value) || 0;
                    
                    if (currentRent === 0 || Math.abs(currentRent - suggestedRent) / suggestedRent > 0.3) {
                        monthlyRentInput.value = suggestedRent;
                        monthlyRentInput.classList.add('suggested-value');
                        
                        // Retire la classe après quelques secondes
                        setTimeout(() => {
                            monthlyRentInput.classList.remove('suggested-value');
                        }, 3000);
                    }
                }
            }
        }
    }
    
    // Écouter les changements de ville et d'aire pour suggérer un loyer
    if (investCityInput) investCityInput.addEventListener('change', suggestRent);
    if (investAreaInput) investAreaInput.addEventListener('input', suggestRent);
    
    // Aide à l'estimation de la taxe foncière
    const propertyTaxInput = document.getElementById('propertyTax');
    
    function suggestPropertyTax() {
        if (investCityInput && purchasePriceInput && propertyTaxInput) {
            const cityName = investCityInput.value;
            const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
            
            if (cityName && purchasePrice > 0) {
                const taxRate = getPropertyTaxRate(cityData, cityName);
                if (taxRate) {
                    // Estimation simplifiée de la taxe foncière (en réalité c'est plus complexe)
                    const suggestedTax = Math.round(purchasePrice * taxRate / 100);
                    const currentTax = parseFloat(propertyTaxInput.value) || 0;
                    
                    if (currentTax === 0 || Math.abs(currentTax - suggestedTax) / suggestedTax > 0.3) {
                        propertyTaxInput.value = suggestedTax;
                        propertyTaxInput.classList.add('suggested-value');
                        
                        // Retire la classe après quelques secondes
                        setTimeout(() => {
                            propertyTaxInput.classList.remove('suggested-value');
                        }, 3000);
                    }
                }
            }
        }
    }
    
    // Écouter les changements de ville et de prix pour suggérer la taxe foncière
    if (investCityInput) investCityInput.addEventListener('change', suggestPropertyTax);
    if (purchasePriceInput) purchasePriceInput.addEventListener('change', suggestPropertyTax);
    
    // Configurer le bouton d'enregistrement de simulation
    const saveButton = document.getElementById('investSaveBtn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            if (currentInvestmentSimulation) {
                saveSimulation('investment', currentInvestmentSimulation);
            }
        });
    }
    
    // Mise à jour du régime fiscal en fonction du type de bien
    const fiscalRegimeSelect = document.getElementById('fiscalRegime');
    const isFurnishedCheckbox = document.getElementById('isFurnished');
    
    if (fiscalRegimeSelect && isFurnishedCheckbox) {
        isFurnishedCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Si meublé, propose les régimes LMNP ou BIC
                updateFiscalRegimeOptions(['lmnp', 'bic']);
            } else {
                // Si non meublé, propose les régimes micro-foncier ou réel
                updateFiscalRegimeOptions(['microFoncier', 'reel']);
            }
        });
    }
    
    // Fonction pour mettre à jour les options du régime fiscal
    function updateFiscalRegimeOptions(allowedRegimes) {
        if (!fiscalRegimeSelect) return;
        
        // Sauvegarde la sélection actuelle si possible
        const currentValue = fiscalRegimeSelect.value;
        
        // Vide le sélecteur
        while (fiscalRegimeSelect.options.length > 0) {
            fiscalRegimeSelect.remove(0);
        }
        
        // Ajoute les nouvelles options
        const options = {
            microFoncier: { text: 'Micro-foncier', value: 'microFoncier' },
            reel: { text: 'Régime réel', value: 'reel' },
            lmnp: { text: 'LMNP (Loueur Meublé Non Professionnel)', value: 'lmnp' },
            bic: { text: 'BIC (Bénéfices Industriels et Commerciaux)', value: 'bic' }
        };
        
        allowedRegimes.forEach(regime => {
            const option = document.createElement('option');
            option.value = options[regime].value;
            option.textContent = options[regime].text;
            fiscalRegimeSelect.appendChild(option);
        });
        
        // Restaure la sélection si elle est toujours valide
        if (allowedRegimes.includes(currentValue)) {
            fiscalRegimeSelect.value = currentValue;
        }
    }
    
    // Configurer le bouton d'exportation PDF
    const exportButton = document.getElementById('investExportBtn');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            if (currentInvestmentSimulation) {
                exportInvestmentResultsToPDF(currentInvestmentSimulation);
            }
        });
    }
}

/**
 * Configure le bouton de retour vers le formulaire d'investissement
 */
function setupInvestmentBackButton() {
    const backButton = document.getElementById('investBackBtn');
    
    if (!backButton) {
        console.warn('Bouton de retour d\'investissement non trouvé');
        return;
    }
    
    console.log('Configuration du bouton de retour d\'investissement');
    
    backButton.addEventListener('click', () => {
        console.log('Clic sur le bouton de retour d\'investissement');
        
        const resultsContainer = document.getElementById('investmentResults');
        const formContainer = document.getElementById('investmentForm')?.closest('.form-container');
        
        if (!resultsContainer || !formContainer) {
            console.warn('Conteneurs de résultats ou de formulaire non trouvés');
            return;
        }
        
        // Cache les résultats et affiche le formulaire
        resultsContainer.style.display = 'none';
        formContainer.style.display = 'block';
        
        // Scroll vers le haut du formulaire
        formContainer.scrollIntoView({ behavior: 'smooth' });
    });
}

/**
 * Convertit la structure en onglets en une présentation linéaire
 */
function convertTabsToLinearLayout() {
    // Attendre que le DOM soit complètement chargé
    document.addEventListener('DOMContentLoaded', () => {
        // Trouver le conteneur de sous-onglets dans les résultats d'investissement
        const subTabsContainer = document.querySelector('#investmentResults .sub-tabs');
        if (!subTabsContainer) {
            console.warn('Conteneur de sous-onglets non trouvé');
            return;
        }
        
        try {
            console.log('Conversion de la structure en onglets vers une présentation linéaire');
            
            // Supprimer la barre de navigation des onglets
            const tabsNav = subTabsContainer.querySelector('.tabs');
            if (tabsNav) {
                tabsNav.remove();
            }
            
            // Obtenir les contenus des onglets
            const monthlyView = document.getElementById('monthly-view');
            const annualView = document.getElementById('annual-view');
            const recommendationsView = document.getElementById('recommendations');
            
            // Ajouter des titres de section
            if (monthlyView) {
                const monthlyTitle = document.createElement('h3');
                monthlyTitle.textContent = 'Détail mensuel';
                monthlyTitle.className = 'section-title';
                monthlyView.insertBefore(monthlyTitle, monthlyView.firstChild);
            }
            
            if (annualView) {
                const annualTitle = document.createElement('h3');
                annualTitle.textContent = 'Projection annuelle';
                annualTitle.className = 'section-title';
                annualView.insertBefore(annualTitle, annualView.firstChild);
            }
            
            if (recommendationsView) {
                const recoTitle = document.createElement('h3');
                recoTitle.textContent = 'Recommandations et optimisations';
                recoTitle.className = 'section-title';
                recommendationsView.insertBefore(recoTitle, recommendationsView.firstChild);
            }
            
            // S'assurer que tous les contenus sont visibles
            if (monthlyView) monthlyView.classList.add('active');
            if (annualView) annualView.classList.add('active');
            if (recommendationsView) recommendationsView.classList.add('active');
            
            // Ajouter des séparateurs visuels
            const separator1 = document.createElement('div');
            separator1.className = 'section-separator';
            if (monthlyView && annualView) {
                monthlyView.insertAdjacentElement('afterend', separator1);
            }
            
            const separator2 = document.createElement('div');
            separator2.className = 'section-separator';
            if (annualView && recommendationsView) {
                annualView.insertAdjacentElement('afterend', separator2);
            }
            
            // Ajouter du CSS pour les nouveaux éléments
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .section-title {
                    margin-top: var(--spacing-xl);
                    margin-bottom: var(--spacing-md);
                    padding-bottom: var(--spacing-sm);
                    border-bottom: 1px solid var(--border-color);
                    color: var(--primary);
                    font-size: var(--font-size-xl);
                }
                
                .section-separator {
                    margin: var(--spacing-xl) 0;
                    height: 1px;
                    background-color: var(--border-color);
                    opacity: 0.5;
                }
                
                #investmentResults .tab-content {
                    display: block !important;
                    margin-bottom: var(--spacing-xl);
                }
            `;
            
            document.head.appendChild(styleElement);
            
            console.log('Conversion terminée avec succès');
        } catch (error) {
            console.error('Erreur lors de la conversion de la structure en onglets:', error);
        }
    });
}

/**
 * Gère la soumission du formulaire d'investissement locatif
 * @param {Event} event Événement de soumission
 * @param {Array} cityData Données des villes
 */
function handleInvestmentFormSubmit(event, cityData) {
    const formValues = event.detail.formValues;
    
    // Validation
    if (!validateInvestmentForm(formValues)) {
        return;
    }
    
    // Exécute la simulation
    const simulationResults = simulateInvestment(formValues, cityData);
    currentInvestmentSimulation = {
        inputs: formValues,
        results: simulationResults
    };
    
    // Affiche les résultats
    displayInvestmentResults(simulationResults);
    
    // Affiche la section des résultats
    showResults('investmentForm', 'investmentResults');
}

/**
 * Valide les données du formulaire d'investissement locatif
 * @param {Object} formValues Valeurs du formulaire
 * @returns {Boolean} true si valide, false sinon
 */
function validateInvestmentForm(formValues) {
    if (!formValues.city) {
        showFormError('investmentForm', 'Veuillez sélectionner une ville.');
        return false;
    }
    
    if (!formValues.purchasePrice || formValues.purchasePrice < 10000) {
        showFormError('investmentForm', 'Le prix d\'achat doit être d\'au moins 10 000 €.');
        return false;
    }
    
    if (!formValues.area || formValues.area < 9) {
        showFormError('investmentForm', 'La surface doit être d\'au moins 9 m².');
        return false;
    }
    
    if (!formValues.monthlyRent || formValues.monthlyRent < 100) {
        showFormError('investmentForm', 'Le loyer mensuel doit être d\'au moins 100 €.');
        return false;
    }
    
    if (!formValues.interestRate || formValues.interestRate <= 0) {
        showFormError('investmentForm', 'Le taux d\'intérêt doit être supérieur à 0%.');
        return false;
    }
    
    // Validation du montant du prêt
    const totalAmount = parseFloat(formValues.purchasePrice) + 
                       (parseFloat(formValues.purchasePrice) * parseFloat(formValues.notaryFees) / 100) + 
                       parseFloat(formValues.renovationCost || 0);
    const downPayment = parseFloat(formValues.downPayment);
    
    if (downPayment >= totalAmount) {
        showFormError('investmentForm', 'L\'apport personnel ne peut pas être supérieur ou égal au montant total de l\'opération.');
        return false;
    }
    
    return true;
}

/**
 * Simule un investissement locatif
 * @param {Object} formValues Valeurs du formulaire
 * @param {Array} cityData Données des villes
 * @returns {Object} Résultats de la simulation
 */
function simulateInvestment(formValues, cityData) {
    // Parse les valeurs du formulaire
    const {
        city,
        purchasePrice: purchasePriceStr,
        area: areaStr,
        propertyType,
        renovationCost: renovationCostStr,
        isFurnished,
        downPayment: downPaymentStr,
        loanAmount: loanAmountStr,
        interestRate: interestRateStr,
        loanDuration: loanDurationStr,
        notaryFees: notaryFeesStr,
        monthlyRent: monthlyRentStr,
        vacancyRate: vacancyRateStr,
        unpaidRate: unpaidRateStr,
        rentIncrease: rentIncreaseStr,
        managementFees: managementFeesStr,
        propertyTax: propertyTaxStr,
        condoFees: condoFeesStr,
        maintenanceCost: maintenanceCostStr,
        fiscalRegime,
        taxBracket: taxBracketStr
    } = formValues;
    
    // Conversion des valeurs en nombres
    const purchasePrice = parseFloat(purchasePriceStr);
    const area = parseFloat(areaStr);
    const renovationCost = parseFloat(renovationCostStr) || 0;
    const downPayment = parseFloat(downPaymentStr) || 0;
    const loanAmount = parseFloat(loanAmountStr) || 0;
    const interestRate = parseFloat(interestRateStr);
    const loanDuration = parseInt(loanDurationStr, 10);
    const notaryFeesRate = parseFloat(notaryFeesStr);
    const monthlyRent = parseFloat(monthlyRentStr);
    const vacancyRate = parseFloat(vacancyRateStr) / 100;
    const unpaidRate = parseFloat(unpaidRateStr) / 100;
    const rentIncrease = parseFloat(rentIncreaseStr) / 100;
    const managementFeesRate = parseFloat(managementFeesStr) / 100;
    const propertyTax = parseFloat(propertyTaxStr) || 0;
    const condoFees = parseFloat(condoFeesStr) || 0;
    const maintenanceCostRate = parseFloat(maintenanceCostStr) / 100;
    const taxBracket = parseFloat(taxBracketStr) / 100;
    
    // Récupère les données de la ville
    const cityInfo = findCityByName(cityData, city);
    
    // Calculs financiers de base
    
    // 1. Frais de notaire
    const notaryFees = calculateNotaryFees(purchasePrice, notaryFeesRate);
    
    // 2. Investissement total
    const totalInvestment = purchasePrice + notaryFees + renovationCost;
    
    // 3. Mensualité du prêt
    const monthlyLoanPayment = calculateLoanPayment(loanAmount, interestRate, loanDuration);
    
    // 4. Tableau d'amortissement annuel
    const amortizationSchedule = calculateAnnualAmortizationSchedule(loanAmount, interestRate, loanDuration);
    
    // 5. Revenus locatifs
    const adjustedMonthlyRent = monthlyRent * (1 - vacancyRate) * (1 - unpaidRate);
    const annualRent = adjustedMonthlyRent * 12;
    
    // 6. Charges
    const monthlyManagementFees = adjustedMonthlyRent * managementFeesRate;
    const monthlyPropertyTax = propertyTax / 12;
    const monthlyCondoFees = condoFees / 12;
    const monthlyMaintenanceCost = adjustedMonthlyRent * maintenanceCostRate;
    
    // Total des charges mensuelles hors prêt
    const monthlyExpensesWithoutLoan = monthlyManagementFees + monthlyPropertyTax + 
                                      monthlyCondoFees + monthlyMaintenanceCost;
    
    // 7. Fiscalité
    // Calcul de l'impôt en fonction du régime fiscal
    const annualExpenses = monthlyExpensesWithoutLoan * 12 + monthlyLoanPayment * 12;
    let annualTax = 0;
    
    switch (fiscalRegime) {
        case 'microFoncier':
            annualTax = calculateMicroFoncierTax(annualRent, taxBracket * 100, SOCIAL_TAX_RATE);
            break;
        case 'reel':
            annualTax = calculateRealRegimeTax(annualRent, annualExpenses, taxBracket * 100, SOCIAL_TAX_RATE);
            break;
        case 'lmnp':
            annualTax = calculateLMNPTax(annualRent, annualExpenses, taxBracket * 100, true);
            break;
        case 'bic':
            annualTax = calculateLMNPTax(annualRent, annualExpenses, taxBracket * 100, false);
            break;
    }
    
    const monthlyTax = annualTax / 12;
    
    // 8. Cash-flow
    const totalMonthlyExpenses = monthlyLoanPayment + monthlyExpensesWithoutLoan + monthlyTax;
    const monthlyCashflow = adjustedMonthlyRent - totalMonthlyExpenses;
    
    // 9. Rentabilité
    const grossYield = calculateGrossYield(monthlyRent * 12, totalInvestment);
    const netYield = calculateNetYield(monthlyRent * 12, totalInvestment, (monthlyExpensesWithoutLoan + monthlyTax) * 12);
    
    // 10. Projection sur 20 ans
    const projectionYears = DEFAULT_PROJECTION_YEARS;
    const propertyValueGrowthRate = cityInfo ? cityInfo.priceEvolution : AVERAGE_PROPERTY_VALUE_GROWTH;
    
    const financialProjection = [];
    let cumulativeCashflow = 0;
    
    for (let year = 1; year <= projectionYears; year++) {
        // Valeur du bien à cette année
        const propertyValue = calculateFutureValue(purchasePrice, propertyValueGrowthRate, year);
        
        // Loyer ajusté avec l'augmentation annuelle
        const yearlyRent = monthlyRent * 12 * Math.pow(1 + rentIncrease, year - 1);
        const adjustedYearlyRent = yearlyRent * (1 - vacancyRate) * (1 - unpaidRate);
        
        // Charges ajustées avec l'inflation
        const yearlyExpensesWithoutLoan = monthlyExpensesWithoutLoan * 12 * Math.pow(1 + rentIncrease/2, year - 1);
        
        // Mensualité du prêt (constante)
        const yearlyLoanPayment = year <= loanDuration ? monthlyLoanPayment * 12 : 0;
        
        // Cash-flow pour cette année
        const yearlyCashflow = adjustedYearlyRent - yearlyExpensesWithoutLoan - yearlyLoanPayment;
        cumulativeCashflow += yearlyCashflow;
        
        // Solde du prêt à la fin de cette année
        const loanBalance = year <= loanDuration ? amortizationSchedule[year - 1].remainingPrincipal : 0;
        
        financialProjection.push({
            year,
            propertyValue,
            loanBalance,
            yearlyRent: adjustedYearlyRent,
            yearlyExpenses: yearlyExpensesWithoutLoan + yearlyLoanPayment,
            yearlyCashflow,
            cumulativeCashflow
        });
    }
    
    // Préparation des recommandations
    const recommendations = generateRecommendations({
        purchasePrice,
        area,
        monthlyRent,
        monthlyCashflow,
        grossYield,
        netYield,
        cityInfo,
        fiscalRegime,
        isFurnished,
        loanDuration,
        interestRate,
        downPayment,
        totalInvestment,
        managementFeesRate
    });
    
    // Création de scénarios d'optimisation
    const optimizationScenarios = generateOptimizationScenarios({
        monthlyRent,
        monthlyCashflow,
        managementFeesRate,
        renovationCost,
        isFurnished,
        fiscalRegime,
        loanDuration,
        interestRate,
        maintenanceCostRate,
        purchasePrice,
        area
    });
    
    // Calcul de l'indice de performance globale (0-100)
    const performanceIndex = calculatePerformanceIndex({
        grossYield,
        netYield,
        monthlyCashflow,
        propertyValueGrowthRate,
        loanToValueRatio: loanAmount / totalInvestment,
        debtServiceCoverageRatio: adjustedMonthlyRent / (monthlyLoanPayment || 1)
    });
    
    // Préparation de l'objet résultat
    return {
        city: cityInfo,
        propertyDetails: {
            purchasePrice,
            area,
            propertyType,
            renovationCost,
            isFurnished,
            pricePerSqm: purchasePrice / area
        },
        financing: {
            downPayment,
            loanAmount,
            interestRate,
            loanDuration,
            monthlyLoanPayment,
            notaryFees,
            totalInvestment
        },
        rentalIncome: {
            monthlyRent,
            adjustedMonthlyRent,
            annualRent: adjustedMonthlyRent * 12,
            vacancyRate,
            unpaidRate,
            rentIncrease
        },
        expenses: {
            monthlyManagementFees,
            monthlyPropertyTax,
            monthlyCondoFees,
            monthlyMaintenanceCost,
            monthlyExpensesWithoutLoan,
            totalMonthlyExpenses
        },
        fiscality: {
            fiscalRegime,
            taxBracket: taxBracket * 100,
            monthlyTax,
            annualTax
        },
        performance: {
            grossYield,
            netYield,
            monthlyCashflow,
            annualCashflow: monthlyCashflow * 12,
            performanceIndex
        },
        projection: {
            years: projectionYears,
            propertyValueGrowthRate,
            financialProjection,
            finalPropertyValue: financialProjection[projectionYears - 1].propertyValue,
            finalLoanBalance: financialProjection[projectionYears - 1].loanBalance,
            totalCashflow: financialProjection[projectionYears - 1].cumulativeCashflow
        },
        recommendations,
        optimizationScenarios
    };
}

/**
 * Calcule un indice de performance global pour l'investissement
 * @param {Object} params Paramètres
 * @returns {Number} Indice de performance (0-100)
 */
function calculatePerformanceIndex(params) {
    const {
        grossYield,
        netYield,
        monthlyCashflow,
        propertyValueGrowthRate,
        loanToValueRatio,
        debtServiceCoverageRatio
    } = params;
    
    // Pondération des différents facteurs
    const weights = {
        grossYield: 0.2,
        netYield: 0.3,
        cashflow: 0.25,
        appreciation: 0.15,
        leverage: 0.1
    };
    
    // Score pour chaque facteur (0-10)
    const scores = {
        grossYield: Math.min(10, grossYield / 0.8), // 8% = score maximal
        netYield: Math.min(10, netYield / 0.6),     // 6% = score maximal
        cashflow: monthlyCashflow > 0 ? Math.min(10, monthlyCashflow / 30) : 0, // 300€ = score maximal
        appreciation: Math.min(10, propertyValueGrowthRate * 3), // 3.33% = score maximal
        leverage: Math.min(10, (loanToValueRatio > 0 ? debtServiceCoverageRatio / 0.15 : 5)) // DSCR de 1.5 = score maximal
    };
    
    // Calcul du score pondéré
    let weightedScore = 0;
    for (const factor in weights) {
        weightedScore += scores[factor] * weights[factor];
    }
    
    // Conversion en score sur 100
    return Math.min(100, Math.max(0, weightedScore * 10));
}

/**
 * Génère des recommandations personnalisées pour l'investissement
 * @param {Object} params Paramètres de l'investissement
 * @returns {Array} Liste de recommandations
 */
function generateRecommendations(params) {
    const {
        purchasePrice,
        area,
        monthlyRent,
        monthlyCashflow,
        grossYield,
        netYield,
        cityInfo,
        fiscalRegime,
        isFurnished,
        loanDuration,
        interestRate,
        downPayment,
        totalInvestment,
        managementFeesRate
    } = params;
    
    const recommendations = [];
    
    // Recommandation sur le prix d'achat et le loyer
    const pricePerSqm = purchasePrice / area;
    const rentPerSqm = monthlyRent / area;
    
    if (cityInfo) {
        const cityAvgPricePerSqm = cityInfo.pricePerSqm;
        const cityAvgRentPerSqm = cityInfo.rentPerSqm;
        
        if (pricePerSqm > cityAvgPricePerSqm * 1.15) {
            recommendations.push({
                title: "Prix d'achat élevé",
                description: `Le prix au m² (${formatCurrency(pricePerSqm, true, 0)}/m²) est supérieur à la moyenne de ${cityInfo.name} (${formatCurrency(cityAvgPricePerSqm, true, 0)}/m²). Vérifiez que les caractéristiques du bien justifient cette prime.`
            });
        }
        
        if (rentPerSqm < cityAvgRentPerSqm * 0.85) {
            recommendations.push({
                title: "Loyer potentiellement sous-évalué",
                description: `Le loyer au m² (${formatCurrency(rentPerSqm, true, 0)}/m²) est inférieur à la moyenne de ${cityInfo.name} (${formatCurrency(cityAvgRentPerSqm, true, 0)}/m²). Il pourrait être possible d'augmenter le loyer.`
            });
        }
    }
    
    // Recommandation sur le cash-flow
    if (monthlyCashflow < 0) {
        recommendations.push({
            title: "Cash-flow négatif",
            description: `Votre investissement génère un cash-flow mensuel négatif de ${formatCurrency(monthlyCashflow)}. Envisagez d'augmenter le loyer, de réduire les charges ou d'augmenter votre apport personnel pour améliorer ce résultat.`
        });
    } else if (monthlyCashflow < 100) {
        recommendations.push({
            title: "Cash-flow faible",
            description: `Votre cash-flow mensuel (${formatCurrency(monthlyCashflow)}) est positif mais relativement faible. Il pourrait être insuffisant pour couvrir d'éventuels imprévus.`
        });
    }
    
    // Recommandation sur la rentabilité
    if (grossYield < 4) {
        recommendations.push({
            title: "Rentabilité brute faible",
            description: `Votre rentabilité brute (${formatPercentage(grossYield)}) est inférieure au seuil recommandé de 4%. Cet investissement pourrait être davantage orienté sur la plus-value à long terme que sur les revenus.`
        });
    }
    
    if (netYield < 2) {
        recommendations.push({
            title: "Rentabilité nette faible",
            description: `Votre rentabilité nette (${formatPercentage(netYield)}) est faible. Évaluez si les perspectives de plus-value compensent ce rendement.`
        });
    }
    
    // Recommandation sur le régime fiscal
    if (!isFurnished && fiscalRegime === 'microFoncier' && (monthlyRent * 12) > 15000) {
        recommendations.push({
            title: "Optimisation fiscale possible",
            description: "Avec des revenus locatifs supérieurs à 15 000 € par an, le régime réel pourrait être plus avantageux que le micro-foncier. Consultez un expert-comptable."
        });
    }
    
    if (!isFurnished && fiscalRegime === 'reel' && (monthlyRent * 12) < 15000) {
        recommendations.push({
            title: "Simplification fiscale possible",
            description: "Avec des revenus locatifs inférieurs à 15 000 € par an, le régime micro-foncier pourrait être plus simple à gérer, sauf si vos charges déductibles sont significatives."
        });
    }
    
    if (!isFurnished) {
        recommendations.push({
            title: "Meublé vs Non meublé",
            description: "La location meublée (LMNP) peut offrir des avantages fiscaux supérieurs. Évaluez si cette option est adaptée à votre bien et à votre cible locative."
        });
    }
    
    // Recommandation sur le financement
    if (loanDuration > 20 && interestRate > 3) {
        recommendations.push({
            title: "Durée de prêt élevée",
            description: `Un prêt de ${loanDuration} ans à ${formatPercentage(interestRate)} augmente significativement le coût total. Envisagez de réduire la durée si possible, ou de renégocier après quelques années.`
        });
    }
    
    if (downPayment < totalInvestment * 0.1) {
        recommendations.push({
            title: "Apport personnel faible",
            description: "Un apport personnel inférieur à 10% peut fragiliser votre investissement. Envisagez d'augmenter votre apport pour améliorer votre cash-flow et réduire les risques."
        });
    }
    
    // Recommandation sur la gestion
    if (managementFeesRate > 0.08) {
        recommendations.push({
            title: "Frais de gestion élevés",
            description: `Vos frais de gestion (${formatPercentage(managementFeesRate * 100)}) sont relativement élevés. Comparez les offres de plusieurs agences ou envisagez la gestion en direct si possible.`
        });
    }
    
    return recommendations;
}

/**
 * Génère des scénarios d'optimisation pour l'investissement
 * @param {Object} params Paramètres de l'investissement
 * @returns {Array} Liste de scénarios d'optimisation
 */
function generateOptimizationScenarios(params) {
    const {
        monthlyRent,
        monthlyCashflow,
        managementFeesRate,
        renovationCost,
        isFurnished,
        fiscalRegime,
        loanDuration,
        interestRate,
        maintenanceCostRate,
        purchasePrice,
        area
    } = params;
    
    const scenarios = [];
    
    // Scénario 1: Augmentation du loyer
    const rentIncrease = Math.round(monthlyRent * 0.05); // +5%
    scenarios.push({
        name: `Augmentation du loyer de ${formatCurrency(rentIncrease)}`,
        cashflowImpact: `+${formatCurrency(rentIncrease)}`,
        yieldImpact: `+${formatPercentage(rentIncrease * 12 / purchasePrice * 100)}`,
        easiness: 'Moyenne',
        description: `Augmenter le loyer de 5% améliorerait votre cash-flow mensuel de ${formatCurrency(rentIncrease)}.`
    });
    
    // Scénario 2: Gestion en direct (si applicable)
    if (managementFeesRate > 0) {
        const selfManagementSavings = Math.round(monthlyRent * managementFeesRate);
        scenarios.push({
            name: "Gestion en direct",
            cashflowImpact: `+${formatCurrency(selfManagementSavings)}`,
            yieldImpact: `+${formatPercentage(selfManagementSavings * 12 / purchasePrice * 100)}`,
            easiness: 'Difficile',
            description: "Gérer vous-même la location vous ferait économiser les frais d'agence, mais demanderait plus de temps et d'expertise."
        });
    }
    
    // Scénario 3: Meublé (si applicable)
    if (!isFurnished) {
        const furnishedRentIncrease = Math.round(monthlyRent * 0.15); // +15%
        const furnishingCost = Math.round(area * 75); // 75€/m² pour meubler
        scenarios.push({
            name: "Passage en location meublée",
            cashflowImpact: `+${formatCurrency(furnishedRentIncrease)}`,
            yieldImpact: `+${formatPercentage(furnishedRentIncrease * 12 / purchasePrice * 100)}`,
            easiness: 'Moyenne',
            description: `Meubler votre bien (coût estimé: ${formatCurrency(furnishingCost)}) permettrait d'augmenter le loyer d'environ 15% et d'optimiser votre fiscalité.`
        });
    }
    
    // Scénario 4: Changement de régime fiscal (si applicable)
    if (fiscalRegime === 'microFoncier' && monthlyRent > 1250) { // 15000€/an
        scenarios.push({
            name: "Passage au régime réel",
            cashflowImpact: "Variable",
            yieldImpact: "Variable",
            easiness: 'Complexe',
            description: "Le régime réel pourrait être plus avantageux avec vos revenus locatifs. Consultez un expert-comptable pour une analyse personnalisée."
        });
    }
    
    // Scénario 5: Renégociation du prêt (si applicable)
    if (loanDuration > 15 && interestRate > 3) {
        const refinancingSavings = Math.round(purchasePrice * 0.01 / 12); // Estimation simplifiée
        scenarios.push({
            name: "Renégociation du prêt",
            cashflowImpact: `+${formatCurrency(refinancingSavings)}`,
            yieldImpact: `+${formatPercentage(refinancingSavings * 12 / purchasePrice * 100)}`,
            easiness: 'Variable',
            description: "Renégocier votre prêt ou le racheter après quelques années pourrait réduire vos mensualités si les taux baissent."
        });
    }
    
    // Scénario 6: Réduction des provisions pour travaux (si applicable)
    if (maintenanceCostRate > 0.03) {
        const maintenanceSavings = Math.round(monthlyRent * (maintenanceCostRate - 0.03));
        scenarios.push({
            name: "Ajustement des provisions pour travaux",
            cashflowImpact: `+${formatCurrency(maintenanceSavings)}`,
            yieldImpact: `+${formatPercentage(maintenanceSavings * 12 / purchasePrice * 100)}`,
            easiness: 'Facile',
            description: "Réduire vos provisions pour travaux à 3% améliorerait votre cash-flow, mais pourrait vous exposer à des dépenses imprévues."
        });
    }
    
    // Scénario 7: Rénovation pour augmenter le loyer (si applicable)
    if (renovationCost < purchasePrice * 0.05) {
        const additionalRenovation = Math.round(purchasePrice * 0.05);
        const renovationRentIncrease = Math.round(monthlyRent * 0.1); // +10%
        scenarios.push({
            name: "Rénovation qualitative",
            cashflowImpact: `+${formatCurrency(renovationRentIncrease)}`,
            yieldImpact: "Variable",
            easiness: 'Moyenne',
            description: `Investir ${formatCurrency(additionalRenovation)} en rénovations pourrait permettre d'augmenter le loyer d'environ 10% et de réduire la vacance locative.`
        });
    }
    
    return scenarios;
}

/**
 * Affiche les résultats de la simulation dans l'interface
 * @param {Object} results Résultats de la simulation
 */
function displayInvestmentResults(results) {
    console.log("Affichage des résultats d'investissement:", results);
    
    try {
        // Vérifier que le conteneur de résultats est visible
        const resultsContainer = document.getElementById('investmentResults');
        const formContainer = document.getElementById('investmentForm')?.closest('.form-container');
        
        if (!resultsContainer || !formContainer) {
            console.error("Conteneurs de résultats ou de formulaire non trouvés");
            return;
        }
        
        // Afficher les résultats et masquer le formulaire
        resultsContainer.style.display = 'block';
        formContainer.style.display = 'none';
        
        // Affichage des valeurs principales
        updateElementText('totalInvestmentResult', formatCurrency(results.financing?.totalInvestment || 0));
        updateElementText('rentabilityResult', formatPercentage(results.performance?.grossYield || 0));
        updateElementText('netRentabilityResult', formatPercentage(results.performance?.netYield || 0));
        updateElementText('cashflowResult', formatCurrency(results.performance?.monthlyCashflow || 0));
        
        // Affichage des détails mensuels
        updateElementText('grossRentResult', formatCurrency(results.rentalIncome?.monthlyRent || 0));
        updateElementText('vacancyAdjustmentResult', formatCurrency(-(results.rentalIncome?.monthlyRent - results.rentalIncome?.adjustedMonthlyRent || 0)));
        updateElementText('unpaidAdjustmentResult', formatCurrency(0)); // Déjà inclus dans le calcul précédent
        updateElementText('netRentResult', formatCurrency(results.rentalIncome?.adjustedMonthlyRent || 0));
        
        updateElementText('loanPaymentResult', formatCurrency(-(results.financing?.monthlyLoanPayment || 0)));
        updateElementText('propertyTaxMonthlyResult', formatCurrency(-(results.expenses?.monthlyPropertyTax || 0)));
        updateElementText('condoFeesMonthlyResult', formatCurrency(-(results.expenses?.monthlyCondoFees || 0)));
        updateElementText('managementFeesResult', formatCurrency(-(results.expenses?.monthlyManagementFees || 0)));
        updateElementText('maintenanceResult', formatCurrency(-(results.expenses?.monthlyMaintenanceCost || 0)));
        updateElementText('rentalTaxResult', formatCurrency(-(results.fiscality?.monthlyTax || 0)));
        updateElementText('totalExpensesResult', formatCurrency(-(results.expenses?.totalMonthlyExpenses || 0)));
        
        updateElementText('netCashflowResult', formatCurrency(results.performance?.monthlyCashflow || 0));
        
        // Configuration de la jauge de rentabilité
        setupGauge(results.performance?.performanceIndex || 0);
        
        // Création du graphique d'évolution du cash-flow
        if (results.projection && results.projection.financialProjection) {
            setupCashflowChart(results.projection.financialProjection);
        }
        
        // Affichage des projections à long terme
        updateElementText('valueAfter20Result', formatCurrency(results.projection?.finalPropertyValue || 0));
        updateElementText('loanBalanceResult', formatCurrency(results.projection?.finalLoanBalance || 0));
        updateElementText('totalCashflowResult', formatCurrency(results.projection?.totalCashflow || 0));
        
        const totalEquity = (results.projection?.finalPropertyValue || 0) - 
                           (results.projection?.finalLoanBalance || 0) + 
                           (results.projection?.totalCashflow || 0);
        updateElementText('totalEquityResult', formatCurrency(totalEquity));
        
        // Remplissage du tableau de projection
        if (results.projection && results.projection.financialProjection) {
            fillProjectionTable(results.projection.financialProjection);
        }
        
        // Affichage des recommandations
        if (results.recommendations) {
            displayRecommendations(results.recommendations);
        }
        
        // Affichage des scénarios d'optimisation
        if (results.optimizationScenarios) {
            displayOptimizationScenarios(results.optimizationScenarios);
        }
        
        // S'assurer que toutes les sections sont visibles
        showAllResultSections();
        
        console.log("Affichage des résultats terminé avec succès");
    } catch (error) {
        console.error("Erreur lors de l'affichage des résultats:", error);
    }
}

/**
 * Met à jour le texte d'un élément DOM s'il existe
 * @param {String} elementId ID de l'élément
 * @param {String} text Texte à afficher
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        console.warn(`Élément avec ID ${elementId} non trouvé`);
    }
}

/**
 * Assure que toutes les sections des résultats sont visibles
 */
function showAllResultSections() {
    // Obtenir toutes les sections qui étaient dans des onglets
    const monthlyView = document.getElementById('monthly-view');
    const annualView = document.getElementById('annual-view');
    const recommendationsView = document.getElementById('recommendations');
    
    // S'assurer que chaque section est visible, si elle existe
    if (monthlyView) monthlyView.style.display = 'block';
    if (annualView) annualView.style.display = 'block';
    if (recommendationsView) recommendationsView.style.display = 'block';
    
    console.log("Visibilité forcée de toutes les sections de résultats");
}

/**
 * Remplit le tableau de projection financière
 * @param {Array} projection Données de projection financière
 */
function fillProjectionTable(projection) {
    const tableBody = document.querySelector('#projectionTable tbody');
    if (!tableBody) {
        console.warn('Tableau de projection financière non trouvé');
        return;
    }
    
    // Vide le tableau
    tableBody.innerHTML = '';
    
    // Ajoute les lignes
    projection.forEach(year => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${year.year}</td>
            <td>${formatCurrency(year.propertyValue)}</td>
            <td>${formatCurrency(year.loanBalance)}</td>
            <td>${formatCurrency(year.yearlyCashflow)}</td>
            <td>${formatCurrency(year.cumulativeCashflow)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Affiche les recommandations
 * @param {Array} recommendations Liste des recommandations
 */
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    if (!container) {
        console.warn('Conteneur de recommandations non trouvé');
        return;
    }
    
    // Vide le conteneur
    container.innerHTML = '';
    
    if (recommendations.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucune recommandation spécifique pour cet investissement.</div>';
        return;
    }
    
    // Ajoute les recommandations
    recommendations.forEach(recommendation => {
        const element = document.createElement('div');
        element.className = 'recommendation-item';
        
        element.innerHTML = `
            <h5>${recommendation.title}</h5>
            <p>${recommendation.description}</p>
        `;
        
        container.appendChild(element);
    });
}

/**
 * Affiche les scénarios d'optimisation
 * @param {Array} scenarios Liste des scénarios
 */
function displayOptimizationScenarios(scenarios) {
    const tableBody = document.querySelector('#scenariosTable tbody');
    if (!tableBody) {
        console.warn('Tableau des scénarios d\'optimisation non trouvé');
        return;
    }
    
    // Vide le tableau
    tableBody.innerHTML = '';
    
    // Ajoute les lignes
    scenarios.forEach(scenario => {
        const row = document.createElement('tr');
        
        // Classe pour la facilité de mise en œuvre
        let easinessClass = '';
        switch (scenario.easiness) {
            case 'Facile': easinessClass = 'easy'; break;
            case 'Moyenne': easinessClass = 'medium'; break;
            case 'Difficile': easinessClass = 'hard'; break;
            case 'Complexe': easinessClass = 'complex'; break;
            default: easinessClass = '';
        }
        
        row.innerHTML = `
            <td>
                <div class="scenario-name">${scenario.name}</div>
                <div class="scenario-description">${scenario.description}</div>
            </td>
            <td>${scenario.cashflowImpact}</td>
            <td>${scenario.yieldImpact}</td>
            <td><span class="easiness ${easinessClass}">${scenario.easiness}</span></td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Configure la jauge de rentabilité
 * @param {Number} performanceIndex Indice de performance (0-100)
 */
function setupGauge(performanceIndex) {
    const gauge = document.getElementById('rentabilityGauge');
    const gaugeValue = document.getElementById('gaugeValue');
    
    if (!gauge || !gaugeValue) {
        console.warn('Éléments de jauge non trouvés');
        return;
    }
    
    // Met à jour la jauge
    gauge.querySelector('.gauge-fill').style.height = `${performanceIndex}%`;
    gaugeValue.textContent = `${Math.round(performanceIndex)}%`;
    
    // Ajoute une classe en fonction de la performance
    gauge.className = 'gauge';
    if (performanceIndex >= 75) gauge.classList.add('excellent');
    else if (performanceIndex >= 60) gauge.classList.add('good');
    else if (performanceIndex >= 40) gauge.classList.add('average');
    else gauge.classList.add('poor');
}

/**
 * Initialise le graphique d'évolution du cash-flow
 * @param {Array} projection Données de projection financière
 */
function setupCashflowChart(projection) {
    const chartCanvas = document.getElementById('cashflowChart');
    if (!chartCanvas) {
        console.warn('Canvas du graphique de cash-flow non trouvé');
        return;
    }
    
    // Préparation des données pour le graphique
    const labels = projection.map(item => `Année ${item.year}`);
    const propertyValues = projection.map(item => item.propertyValue);
    const loanBalances = projection.map(item => item.loanBalance);
    const cumulativeCashflows = projection.map(item => item.cumulativeCashflow);
    
    // Configuration du graphique
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Valeur du bien (€)',
                data: propertyValues,
                borderColor: 'rgba(67, 97, 238, 1)',
                backgroundColor: 'rgba(67, 97, 238, 0.05)',
                borderWidth: 2,
                yAxisID: 'y',
                type: 'line'
            },
            {
                label: 'Solde du crédit (€)',
                data: loanBalances,
                borderColor: 'rgba(220, 53, 69, 1)',
                backgroundColor: 'rgba(220, 53, 69, 0.05)',
                borderWidth: 2,
                yAxisID: 'y',
                type: 'line'
            },
            {
                label: 'Cash-flow cumulé (€)',
                data: cumulativeCashflows,
                backgroundColor: 'rgba(37, 179, 80, 0.7)',
                borderColor: 'rgba(37, 179, 80, 1)',
                borderWidth: 1,
                yAxisID: 'y2',
                type: 'bar'
            }
        ]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Valeur (€)'
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    callback: function(value) {
                        return abbreviateNumber(value);
                    }
                }
            },
            y2: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Cash-flow (€)'
                },
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    callback: function(value) {
                        return abbreviateNumber(value);
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
                        return `${context.dataset.label}: ${formatCurrency(value)}`;
                    }
                }
            }
        }
    };
    
    // Crée le graphique
    setupCharts('cashflowChart', 'bar', chartData, chartOptions);
}

/**
 * Exporte les résultats en PDF
 * @param {Object} simulation Données de la simulation
 */
function exportInvestmentResultsToPDF(simulation) {
    // Note: Dans une implémentation réelle, cette fonction utiliserait
    // la bibliothèque jsPDF pour générer le document PDF.
    // Pour cette démo, on affiche simplement un message dans la console.
    console.log('Fonction d\'export PDF appelée avec:', simulation);
    alert('L\'export PDF sera implémenté dans une version future.');
}

// Ajout de styles CSS pour les éléments spécifiques
(function addInvestmentSimulatorStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .suggested-value {
            animation: pulse 2s;
        }
        
        @keyframes pulse {
            0% { background-color: rgba(37, 179, 80, 0.2); }
            50% { background-color: rgba(37, 179, 80, 0.3); }
            100% { background-color: transparent; }
        }
        
        .gauge.excellent .gauge-fill {
            background: linear-gradient(to top, #25b350, #74c69d);
        }
        
        .gauge.good .gauge-fill {
            background: linear-gradient(to top, #74c69d, #a9d6b8);
        }
        
        .gauge.average .gauge-fill {
            background: linear-gradient(to top, #ffc107, #ffecb3);
        }
        
        .gauge.poor .gauge-fill {
            background: linear-gradient(to top, #dc3545, #f8d7da);
        }
        
        .scenario-name {
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .scenario-description {
            font-size: 14px;
            color: var(--text-light);
        }
        
        .easiness {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
        }
        
        .easiness.easy {
            background-color: rgba(37, 179, 80, 0.2);
            color: var(--success);
        }
        
        .easiness.medium {
            background-color: rgba(255, 193, 7, 0.2);
            color: var(--warning);
        }
        
        .easiness.hard {
            background-color: rgba(220, 53, 69, 0.2);
            color: var(--danger);
        }
        
        .easiness.complex {
            background-color: rgba(108, 117, 125, 0.2);
            color: var(--secondary);
        }
        
        .section-title {
            margin-top: var(--spacing-xl);
            margin-bottom: var(--spacing-md);
            padding-bottom: var(--spacing-sm);
            border-bottom: 1px solid var(--border-color);
            color: var(--primary);
            font-size: var(--font-size-xl);
        }
        
        .section-separator {
            margin: var(--spacing-xl) 0;
            height: 1px;
            background-color: var(--border-color);
            opacity: 0.5;
        }
        
        #investmentResults .tab-content {
            display: block !important;
            margin-bottom: var(--spacing-xl);
        }
    `;
    
    document.head.appendChild(styleElement);
})();