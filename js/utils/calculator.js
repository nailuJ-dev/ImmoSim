/**
 * Utilitaires de calcul pour le Simulateur Immobilier
 * 
 * Ce module fournit des fonctions de calcul réutilisables pour les différents
 * simulateurs (prêt immobilier, rentabilité, etc.).
 */

/**
 * Calcule les mensualités d'un prêt immobilier
 * @param {Number} principal Montant emprunté (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @returns {Number} Mensualité du prêt
 */
export function calculateLoanPayment(principal, annualRate, years) {
    if (!principal || !annualRate || !years) return 0;
    if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
    
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = years * 12;
    
    // Formule de calcul des mensualités: P = (r*PV) / (1 - (1+r)^-n)
    // Où P est la mensualité, PV le capital emprunté, r le taux mensuel et n le nombre de mensualités
    
    // Si le taux est nul (cas théorique), la mensualité est simplement le montant divisé par le nombre de mois
    if (monthlyRate === 0) return principal / totalPayments;
    
    const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    return monthlyPayment;
}

/**
 * Calcule le tableau d'amortissement d'un prêt immobilier
 * @param {Number} principal Montant emprunté (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @returns {Array} Tableau d'amortissement mensuel
 */
export function calculateAmortizationSchedule(principal, annualRate, years) {
    if (!principal || !annualRate || !years) return [];
    if (principal <= 0 || annualRate <= 0 || years <= 0) return [];
    
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = years * 12;
    const monthlyPayment = calculateLoanPayment(principal, annualRate, years);
    
    const schedule = [];
    let remainingPrincipal = principal;
    
    for (let month = 1; month <= totalPayments; month++) {
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        
        remainingPrincipal -= principalPayment;
        
        // Correction pour les erreurs d'arrondi à la fin du prêt
        if (month === totalPayments) {
            remainingPrincipal = 0;
        }
        
        schedule.push({
            month,
            payment: monthlyPayment,
            principalPayment,
            interestPayment,
            remainingPrincipal
        });
    }
    
    return schedule;
}

/**
 * Calcule le tableau d'amortissement annuel d'un prêt immobilier
 * @param {Number} principal Montant emprunté (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @returns {Array} Tableau d'amortissement annuel
 */
export function calculateAnnualAmortizationSchedule(principal, annualRate, years) {
    const monthlySchedule = calculateAmortizationSchedule(principal, annualRate, years);
    const annualSchedule = [];
    
    for (let year = 1; year <= years; year++) {
        const startIdx = (year - 1) * 12;
        const endIdx = startIdx + 12;
        const yearPayments = monthlySchedule.slice(startIdx, endIdx);
        
        const annualPayment = yearPayments.reduce((sum, month) => sum + month.payment, 0);
        const annualPrincipal = yearPayments.reduce((sum, month) => sum + month.principalPayment, 0);
        const annualInterest = yearPayments.reduce((sum, month) => sum + month.interestPayment, 0);
        
        // Le capital restant est celui du dernier mois de l'année
        const remainingPrincipal = yearPayments.length > 0 
            ? yearPayments[yearPayments.length - 1].remainingPrincipal 
            : 0;
        
        annualSchedule.push({
            year,
            payment: annualPayment,
            principalPayment: annualPrincipal,
            interestPayment: annualInterest,
            remainingPrincipal
        });
    }
    
    return annualSchedule;
}

/**
 * Calcule le montant total des intérêts payés sur un prêt
 * @param {Number} principal Montant emprunté (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @returns {Number} Total des intérêts payés
 */
export function calculateTotalInterest(principal, annualRate, years) {
    const monthlyPayment = calculateLoanPayment(principal, annualRate, years);
    const totalPayments = years * 12;
    const totalPaid = monthlyPayment * totalPayments;
    
    return totalPaid - principal;
}

/**
 * Calcule la capacité d'emprunt maximale avec une approche plus réaliste
 * @param {Number} monthlyIncome Revenus mensuels nets (€)
 * @param {Number} currentDebt Dettes mensuelles actuelles (€)
 * @param {Number} debtRatio Taux d'endettement maximum (%)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @param {Number} insuranceRate Taux d'assurance emprunteur annuel (% du capital, défaut: 0.36%)
 * @param {Number} minLivingExpense Montant minimal de reste à vivre (€, défaut: 1000€)
 * @returns {Number} Capacité d'emprunt maximale
 */
export function calculateBorrowingCapacity(monthlyIncome, currentDebt, debtRatio, annualRate, years, insuranceRate = 0.36, minLivingExpense = 1000) {
    if (!monthlyIncome || monthlyIncome <= 0) return 0;
    
    // Conversion du taux d'endettement en décimal
    const debtRatioDecimal = debtRatio / 100;
    
    // Calcul du montant mensuel disponible pour le prêt selon le taux d'endettement
    const maxMonthlyPayment = (monthlyIncome * debtRatioDecimal) - (currentDebt || 0);
    
    if (maxMonthlyPayment <= 0) return 0;
    
    // Vérification du reste à vivre
    const remainingAfterDebt = monthlyIncome - currentDebt - maxMonthlyPayment;
    if (remainingAfterDebt < minLivingExpense) {
        // Ajustement si le reste à vivre est trop faible
        const adjustedMaxPayment = monthlyIncome - currentDebt - minLivingExpense;
        if (adjustedMaxPayment <= 0) return 0;
        return calculateCapacityFromPayment(adjustedMaxPayment, annualRate, years, insuranceRate);
    }
    
    return calculateCapacityFromPayment(maxMonthlyPayment, annualRate, years, insuranceRate);
}

/**
 * Calcule la capacité d'emprunt à partir de la mensualité maximale
 * @param {Number} maxMonthlyPayment Mensualité maximale (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @param {Number} insuranceRate Taux d'assurance emprunteur annuel (%)
 * @returns {Number} Capacité d'emprunt
 */
function calculateCapacityFromPayment(maxMonthlyPayment, annualRate, years, insuranceRate) {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyInsuranceRate = insuranceRate / 100 / 12;
    const totalPayments = years * 12;
    
    // Cas spécial: taux d'intérêt nul ou négatif
    if (monthlyRate <= 0) {
        // Avec assurance uniquement
        return maxMonthlyPayment / monthlyInsuranceRate;
    }
    
    // Formule qui intègre à la fois le taux d'intérêt et l'assurance
    // Principe: sur la mensualité maximale, une partie va à l'assurance et le reste aux intérêts+capital
    
    // Approche itérative pour trouver la capacité d'emprunt avec assurance
    let loanAmount = 100000; // Point de départ arbitraire
    let tolerance = 1; // Tolérance de 1€
    let maxIterations = 50;
    let iterations = 0;
    
    while (iterations < maxIterations) {
        // Mensualité pour le remboursement du prêt (intérêts + capital)
        const loanPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
        
        // Mensualité pour l'assurance
        const insurancePayment = loanAmount * monthlyInsuranceRate;
        
        // Mensualité totale
        const totalPayment = loanPayment + insurancePayment;
        
        // Différence avec la mensualité maximale
        const diff = maxMonthlyPayment - totalPayment;
        
        // Si la différence est inférieure à la tolérance, on a trouvé la solution
        if (Math.abs(diff) < tolerance) {
            break;
        }
        
        // Ajustement de la capacité d'emprunt
        loanAmount = loanAmount * (maxMonthlyPayment / totalPayment);
        
        iterations++;
    }
    
    // Arrondi à l'euro près
    return Math.floor(loanAmount);
}

/**
 * Calcule les frais de notaire
 * @param {Number} propertyPrice Prix du bien (€)
 * @param {Number} notaryFeeRate Taux des frais de notaire (%)
 * @returns {Number} Frais de notaire
 */
export function calculateNotaryFees(propertyPrice, notaryFeeRate) {
    if (!propertyPrice || propertyPrice <= 0) return 0;
    
    return propertyPrice * (notaryFeeRate / 100);
}

/**
 * Calcule le prix au m²
 * @param {Number} propertyPrice Prix du bien (€)
 * @param {Number} area Surface du bien (m²)
 * @returns {Number} Prix au m²
 */
export function calculatePricePerSqm(propertyPrice, area) {
    if (!propertyPrice || !area || propertyPrice <= 0 || area <= 0) return 0;
    
    return propertyPrice / area;
}

/**
 * Calcule la rentabilité brute d'un investissement locatif
 * @param {Number} annualRent Loyer annuel (€)
 * @param {Number} propertyPrice Prix du bien (€)
 * @returns {Number} Rentabilité brute (%)
 */
export function calculateGrossYield(annualRent, propertyPrice) {
    if (!annualRent || !propertyPrice || annualRent <= 0 || propertyPrice <= 0) return 0;
    
    return (annualRent / propertyPrice) * 100;
}

/**
 * Calcule la rentabilité nette d'un investissement locatif
 * @param {Number} annualRent Loyer annuel (€)
 * @param {Number} propertyPrice Prix du bien (€)
 * @param {Number} annualExpenses Charges annuelles (€)
 * @returns {Number} Rentabilité nette (%)
 */
export function calculateNetYield(annualRent, propertyPrice, annualExpenses) {
    if (!annualRent || !propertyPrice || annualRent <= 0 || propertyPrice <= 0) return 0;
    
    const netIncome = annualRent - (annualExpenses || 0);
    return (netIncome / propertyPrice) * 100;
}

/**
 * Calcule le cash-flow mensuel
 * @param {Number} monthlyRent Loyer mensuel (€)
 * @param {Number} monthlyExpenses Charges mensuelles (€)
 * @returns {Number} Cash-flow mensuel
 */
export function calculateMonthlyCashflow(monthlyRent, monthlyExpenses) {
    if (!monthlyRent) return -monthlyExpenses || 0;
    
    return monthlyRent - (monthlyExpenses || 0);
}

/**
 * Calcule la taxe foncière estimée
 * @param {Number} propertyValue Valeur du bien (€)
 * @param {Number} taxRate Taux de la taxe (%)
 * @returns {Number} Taxe foncière annuelle
 */
export function estimatePropertyTax(propertyValue, taxRate) {
    if (!propertyValue || !taxRate || propertyValue <= 0 || taxRate <= 0) return 0;
    
    // Formule simplifiée (la taxe foncière réelle dépend de nombreux facteurs locaux)
    return propertyValue * (taxRate / 100);
}

/**
 * Calcule l'impôt sur les revenus fonciers en régime réel
 * @param {Number} annualRent Loyer annuel (€)
 * @param {Number} annualExpenses Charges annuelles (€)
 * @param {Number} taxRate Taux marginal d'imposition (%)
 * @param {Number} socialTaxRate Taux des prélèvements sociaux (17.2%)
 * @returns {Number} Impôt annuel
 */
export function calculateRealRegimeTax(annualRent, annualExpenses, taxRate, socialTaxRate = 17.2) {
    if (!annualRent || annualRent <= 0) return 0;
    
    const netIncome = annualRent - (annualExpenses || 0);
    if (netIncome <= 0) return 0;
    
    const incomeTax = netIncome * (taxRate / 100);
    const socialTax = netIncome * (socialTaxRate / 100);
    
    return incomeTax + socialTax;
}

/**
 * Calcule l'impôt sur les revenus fonciers en régime micro-foncier
 * @param {Number} annualRent Loyer annuel (€)
 * @param {Number} taxRate Taux marginal d'imposition (%)
 * @param {Number} socialTaxRate Taux des prélèvements sociaux (17.2%)
 * @returns {Number} Impôt annuel
 */
export function calculateMicroFoncierTax(annualRent, taxRate, socialTaxRate = 17.2) {
    if (!annualRent || annualRent <= 0) return 0;
    
    // Abattement forfaitaire de 30%
    const netIncome = annualRent * 0.7;
    
    const incomeTax = netIncome * (taxRate / 100);
    const socialTax = netIncome * (socialTaxRate / 100);
    
    return incomeTax + socialTax;
}

/**
 * Calcule l'impôt pour un loueur meublé non professionnel (LMNP)
 * @param {Number} annualRent Loyer annuel (€)
 * @param {Number} annualExpenses Charges annuelles (€)
 * @param {Number} taxRate Taux marginal d'imposition (%)
 * @param {Boolean} microBIC Régime micro-BIC (true) ou réel (false)
 * @returns {Number} Impôt annuel
 */
export function calculateLMNPTax(annualRent, annualExpenses, taxRate, microBIC = true) {
    if (!annualRent || annualRent <= 0) return 0;
    
    let netIncome;
    
    if (microBIC) {
        // Régime micro-BIC: abattement forfaitaire de 50%
        netIncome = annualRent * 0.5;
    } else {
        // Régime réel: déduction des charges et amortissements
        netIncome = annualRent - (annualExpenses || 0);
    }
    
    if (netIncome <= 0) return 0;
    
    return netIncome * (taxRate / 100);
}

/**
 * Calcule la valeur future d'un bien immobilier
 * @param {Number} currentValue Valeur actuelle (€)
 * @param {Number} annualGrowthRate Taux de croissance annuel (%)
 * @param {Number} years Nombre d'années
 * @returns {Number} Valeur future
 */
export function calculateFutureValue(currentValue, annualGrowthRate, years) {
    if (!currentValue || currentValue <= 0 || !years || years <= 0) return currentValue || 0;
    
    return currentValue * Math.pow(1 + (annualGrowthRate / 100), years);
}

/**
 * Calcule le budget immobilier total en tenant compte des frais supplémentaires
 * @param {Number} borrowingCapacity Capacité d'emprunt (€)
 * @param {Number} personalContribution Apport personnel (€)
 * @param {Number} notaryFeesRate Taux des frais de notaire (%)
 * @param {Number} applicationFees Frais de dossier bancaire (€, défaut: 1000€)
 * @returns {Object} Budget total et détails
 */
export function calculateTotalBudget(borrowingCapacity, personalContribution, notaryFeesRate, applicationFees = 1000) {
    // Budget brut (emprunt + apport)
    const grossBudget = borrowingCapacity + personalContribution;
    
    // Frais de notaire
    const notaryFees = grossBudget * (notaryFeesRate / 100);
    
    // Budget disponible pour l'acquisition
    const netBudget = grossBudget - notaryFees - applicationFees;
    
    return {
        grossBudget,
        netBudget,
        notaryFees,
        applicationFees
    };
}

/**
 * Calcule la mensualité totale du prêt incluant l'assurance
 * @param {Number} principal Montant emprunté (€)
 * @param {Number} annualRate Taux d'intérêt annuel (%)
 * @param {Number} years Durée du prêt en années
 * @param {Number} insuranceRate Taux d'assurance emprunteur annuel (% du capital)
 * @returns {Object} Mensualité totale et détails
 */
export function calculateTotalLoanPayment(principal, annualRate, years, insuranceRate = 0.36) {
    // Mensualité pour le remboursement du prêt (intérêts + capital)
    const loanPayment = calculateLoanPayment(principal, annualRate, years);
    
    // Mensualité pour l'assurance
    const insurancePayment = (principal * insuranceRate / 100) / 12;
    
    // Mensualité totale
    const totalPayment = loanPayment + insurancePayment;
    
    return {
        totalPayment,
        loanPayment,
        insurancePayment
    };
}

/**
 * Calcule le taux de rendement interne (TRI) d'un investissement
 * @param {Number} initialInvestment Investissement initial (€)
 * @param {Array} cashflows Flux de trésorerie annuels (€)
 * @param {Number} finalValue Valeur finale (€)
 * @returns {Number} TRI (%) ou null si non calculable
 */
export function calculateIRR(initialInvestment, cashflows, finalValue) {
    if (!initialInvestment || initialInvestment <= 0 || !cashflows || cashflows.length === 0) {
        return null;
    }
    
    // Ajoute la valeur finale au dernier flux de trésorerie
    const modifiedCashflows = [...cashflows];
    modifiedCashflows[modifiedCashflows.length - 1] += finalValue;
    
    // Investissement initial négatif (sortie d'argent)
    const allCashflows = [-initialInvestment, ...modifiedCashflows];
    
    // Algorithme de Newton-Raphson pour trouver le TRI
    let guess = 0.1; // Estimation initiale (10%)
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivativeNpv = 0;
        
        for (let t = 0; t < allCashflows.length; t++) {
            npv += allCashflows[t] / Math.pow(1 + guess, t);
            derivativeNpv -= t * allCashflows[t] / Math.pow(1 + guess, t + 1);
        }
        
        if (Math.abs(npv) < tolerance) {
            return guess * 100; // Convertit en pourcentage
        }
        
        const newGuess = guess - npv / derivativeNpv;
        
        if (Math.abs(newGuess - guess) < tolerance) {
            return newGuess * 100; // Convertit en pourcentage
        }
        
        guess = newGuess;
    }
    
    return null; // Pas de convergence
}