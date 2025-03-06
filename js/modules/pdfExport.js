/**
 * Module d'export des résultats en PDF pour le Simulateur Immobilier
 * 
 * Ce module gère la création et le téléchargement de documents PDF
 * contenant les résultats des simulations.
 */

import { formatCurrency, formatPercentage, formatDate, formatArea } from '../utils/formatter.js';

/**
 * Exporte les résultats d'une simulation d'évolution de valeur en PDF
 * @param {Object} simulation Données de la simulation
 */
export function exportValueResultsToPDF(simulation) {
    if (!window.jsPDF) {
        console.error('La bibliothèque jsPDF n\'est pas disponible');
        alert('L\'exportation PDF nécessite la bibliothèque jsPDF. Veuillez réessayer plus tard.');
        return;
    }
    
    try {
        const doc = new window.jsPDF();
        const results = simulation.results;
        const inputs = simulation.inputs;
        
        // Titre du document
        doc.setFontSize(18);
        doc.text('Simulation d\'Évolution de Valeur Immobilière', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Rapport généré le ${formatDate(new Date())}`, 105, 22, { align: 'center' });
        
        // Informations sur le bien
        doc.setFontSize(14);
        doc.text('Caractéristiques du bien', 14, 35);
        
        doc.setFontSize(10);
        const propertyDetails = [
            `Ville: ${inputs.city}`,
            `Type de bien: ${getPropertyTypeName(inputs.propertyType)}`,
            `Surface: ${formatArea(inputs.area)}`,
            `Nombre de pièces: ${inputs.rooms}`,
            `Âge du bien: ${getPropertyAgeName(inputs.propertyAge)}`,
            `Durée de projection: ${inputs.projectionYears} ans`
        ];
        
        propertyDetails.forEach((detail, index) => {
            doc.text(detail, 14, 45 + (index * 7));
        });
        
        // Résultats principaux
        doc.setFontSize(14);
        doc.text('Résultats de la simulation', 14, 90);
        
        doc.setFontSize(10);
        const simulationResults = [
            `Valeur initiale: ${formatCurrency(results.initialValue)}`,
            `Valeur finale: ${formatCurrency(results.finalValue)}`,
            `Évolution totale: ${formatPercentage(results.totalGrowth)}`,
            `Évolution annuelle: ${formatPercentage(results.annualizedGrowth * 100)}`,
            `Budget rénovation: ${formatCurrency(inputs.renovationBudget || 0)}`
        ];
        
        simulationResults.forEach((result, index) => {
            doc.text(result, 14, 100 + (index * 7));
        });
        
        // Facteurs d'influence
        doc.setFontSize(14);
        doc.text('Facteurs d\'influence', 14, 145);
        
        doc.setFontSize(10);
        if (results.influenceFactors && results.influenceFactors.length) {
            results.influenceFactors.forEach((factor, index) => {
                const yPos = 155 + (index * 15);
                doc.text(`${factor.name}`, 14, yPos);
                doc.text(`Impact: ${formatPercentage(factor.impact * 10)}`, 14, yPos + 5);
                
                // Barre d'impact
                const barWidth = factor.score * 10; // Échelle 0-100
                const barColor = getScoreColor(factor.score);
                
                doc.setFillColor(...barColor);
                doc.rect(100, yPos - 3, barWidth, 5, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.rect(100, yPos - 3, 100, 5, 'D');
            });
        } else {
            doc.text('Aucun facteur d\'influence disponible.', 14, 155);
        }
        
        // Pied de page
        doc.setFontSize(8);
        doc.text('Simulateur Immobilier | Ce document est fourni à titre informatif uniquement', 105, 285, { align: 'center' });
        
        // Téléchargement du PDF
        doc.save(`evolution-valeur-${inputs.city.replace(/\s+/g, '-')}.pdf`);
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    }
}

/**
 * Exporte les résultats d'une simulation d'investissement locatif en PDF
 * @param {Object} simulation Données de la simulation
 */
export function exportInvestmentResultsToPDF(simulation) {
    if (!window.jsPDF) {
        console.error('La bibliothèque jsPDF n\'est pas disponible');
        alert('L\'exportation PDF nécessite la bibliothèque jsPDF. Veuillez réessayer plus tard.');
        return;
    }
    
    try {
        const doc = new window.jsPDF();
        const results = simulation.results;
        const inputs = simulation.inputs;
        
        // Titre du document
        doc.setFontSize(18);
        doc.text('Simulation d\'Investissement Locatif', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Rapport généré le ${formatDate(new Date())}`, 105, 22, { align: 'center' });
        
        // Informations sur le bien
        doc.setFontSize(14);
        doc.text('Caractéristiques du bien', 14, 35);
        
        doc.setFontSize(10);
        const propertyDetails = [
            `Ville: ${inputs.city}`,
            `Type de bien: ${getPropertyTypeName(inputs.propertyType)}`,
            `Surface: ${formatArea(inputs.area)}`,
            `Prix d'achat: ${formatCurrency(inputs.purchasePrice)}`,
            `Loyer mensuel: ${formatCurrency(inputs.monthlyRent)}`,
            `Bien ${inputs.isFurnished ? 'meublé' : 'non meublé'}`
        ];
        
        propertyDetails.forEach((detail, index) => {
            doc.text(detail, 14, 45 + (index * 7));
        });
        
        // Informations de financement
        doc.setFontSize(14);
        doc.text('Financement', 14, 90);
        
        doc.setFontSize(10);
        const financingDetails = [
            `Apport: ${formatCurrency(inputs.downPayment)}`,
            `Emprunt: ${formatCurrency(inputs.loanAmount)}`,
            `Taux: ${formatPercentage(inputs.interestRate)}`,
            `Durée: ${inputs.loanDuration} ans`,
            `Mensualité: ${formatCurrency(results.financing.monthlyLoanPayment)}`
        ];
        
        financingDetails.forEach((detail, index) => {
            doc.text(detail, 14, 100 + (index * 7));
        });
        
        // Résultats de l'investissement
        doc.setFontSize(14);
        doc.text('Résultats de l\'investissement', 14, 140);
        
        doc.setFontSize(10);
        const investmentResults = [
            `Investissement total: ${formatCurrency(results.financing.totalInvestment)}`,
            `Rentabilité brute: ${formatPercentage(results.performance.grossYield)}`,
            `Rentabilité nette: ${formatPercentage(results.performance.netYield)}`,
            `Cash-flow mensuel: ${formatCurrency(results.performance.monthlyCashflow)}`,
            `Cash-flow annuel: ${formatCurrency(results.performance.annualCashflow)}`,
            `Indice de performance: ${Math.round(results.performance.performanceIndex)}/100`
        ];
        
        investmentResults.forEach((result, index) => {
            doc.text(result, 14, 150 + (index * 7));
        });
        
        // Projection à long terme
        doc.setFontSize(14);
        doc.text('Projection sur 20 ans', 14, 190);
        
        doc.setFontSize(10);
        const projectionResults = [
            `Valeur finale du bien: ${formatCurrency(results.projection.finalPropertyValue)}`,
            `Solde du crédit: ${formatCurrency(results.projection.finalLoanBalance)}`,
            `Cash-flow cumulé: ${formatCurrency(results.projection.totalCashflow)}`,
            `Patrimoine constitué: ${formatCurrency(results.projection.finalPropertyValue - results.projection.finalLoanBalance + results.projection.totalCashflow)}`
        ];
        
        projectionResults.forEach((result, index) => {
            doc.text(result, 14, 200 + (index * 7));
        });
        
        // Recommandations
        if (results.recommendations && results.recommendations.length) {
            doc.setFontSize(14);
            doc.text('Recommandations', 14, 230);
            
            doc.setFontSize(10);
            results.recommendations.slice(0, 3).forEach((reco, index) => {
                const yPos = 240 + (index * 12);
                doc.setFontStyle('bold');
                doc.text(reco.title, 14, yPos);
                doc.setFontStyle('normal');
                
                // Ajouter la description avec un retour à la ligne si nécessaire
                const description = doc.splitTextToSize(reco.description, 180);
                doc.text(description, 14, yPos + 5);
            });
        }
        
        // Pied de page
        doc.setFontSize(8);
        doc.text('Simulateur Immobilier | Ce document est fourni à titre informatif uniquement', 105, 285, { align: 'center' });
        
        // Téléchargement du PDF
        doc.save(`investissement-${inputs.city.replace(/\s+/g, '-')}.pdf`);
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    }
}

/**
 * Exporte les résultats d'un calcul de pouvoir d'achat en PDF
 * @param {Object} results Résultats du calcul
 */
export function exportPurchasingPowerResultsToPDF(results) {
    if (!window.jsPDF) {
        console.error('La bibliothèque jsPDF n\'est pas disponible');
        alert('L\'exportation PDF nécessite la bibliothèque jsPDF. Veuillez réessayer plus tard.');
        return;
    }
    
    try {
        const doc = new window.jsPDF();
        
        // Titre du document
        doc.setFontSize(18);
        doc.text('Estimation de Pouvoir d\'Achat Immobilier', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Rapport généré le ${formatDate(new Date())}`, 105, 22, { align: 'center' });
        
        // Informations sur les revenus
        doc.setFontSize(14);
        doc.text('Revenus et charges', 14, 35);
        
        doc.setFontSize(10);
        const incomeDetails = [
            `Revenus mensuels: ${formatCurrency(results.income.monthlyIncome)}`,
            `Revenus complémentaires: ${formatCurrency(results.income.additionalIncome)}`,
            `Total mensuel: ${formatCurrency(results.income.totalMonthlyIncome)}`,
            `Dettes actuelles: ${formatCurrency(results.income.currentDebt)}`
        ];
        
        incomeDetails.forEach((detail, index) => {
            doc.text(detail, 14, 45 + (index * 7));
        });
        
        // Informations sur le financement
        doc.setFontSize(14);
        doc.text('Capacité d\'emprunt', 14, 80);
        
        doc.setFontSize(10);
        const financingDetails = [
            `Capacité d'emprunt: ${formatCurrency(results.financing.borrowingCapacity)}`,
            `Apport personnel: ${formatCurrency(results.financing.personalContribution)}`,
            `Budget total: ${formatCurrency(results.financing.totalBudget)}`,
            `Budget net (hors frais): ${formatCurrency(results.financing.netBudget)}`,
            `Mensualité maximale: ${formatCurrency(results.financing.monthlyPayment)}`,
            `Taux d'endettement: ${formatPercentage(results.financing.debtRatioActual * 100)}`
        ];
        
        financingDetails.forEach((detail, index) => {
            doc.text(detail, 14, 90 + (index * 7));
        });
        
        // Biens accessibles
        doc.setFontSize(14);
        doc.text(`Biens accessibles à ${results.property.city?.name || 'la ville sélectionnée'}`, 14, 130);
        
        doc.setFontSize(10);
        const propertyTypes = [
            `Appartement: ${formatArea(results.property.accessibleSurfaces.apartment)}`,
            `Maison: ${formatArea(results.property.accessibleSurfaces.house)}`,
            `Studio: ${formatArea(results.property.accessibleSurfaces.studio)}`
        ];
        
        propertyTypes.forEach((type, index) => {
            doc.text(type, 14, 140 + (index * 7));
        });
        
        // Comparaison des villes
        if (results.cityComparison && results.cityComparison.length) {
            doc.setFontSize(14);
            doc.text('Comparaison avec d\'autres villes', 14, 170);
            
            doc.setFontSize(10);
            doc.text('Ville', 14, 180);
            doc.text('Surface accessible', 100, 180);
            doc.text('Prix moyen au m²', 160, 180);
            
            results.cityComparison.slice(0, 8).forEach((city, index) => {
                const yPos = 190 + (index * 7);
                doc.text(city.name, 14, yPos);
                doc.text(formatArea(city.accessibleSurface), 100, yPos);
                doc.text(formatCurrency(city.pricePerSqm), 160, yPos);
            });
        }
        
        // Pied de page
        doc.setFontSize(8);
        doc.text('Simulateur Immobilier | Ce document est fourni à titre informatif uniquement', 105, 285, { align: 'center' });
        
        // Téléchargement du PDF
        doc.save(`pouvoir-achat-immobilier.pdf`);
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
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

/**
 * Obtient le nom lisible de l'âge d'un bien
 * @param {String} age Âge du bien
 * @returns {String} Nom lisible
 */
function getPropertyAgeName(age) {
    switch (age) {
        case 'new': return 'Neuf (< 5 ans)';
        case 'recent': return 'Récent (5-15 ans)';
        case 'old': return 'Ancien (15-50 ans)';
        case 'veryOld': return 'Très ancien (> 50 ans)';
        default: return age;
    }
}

/**
 * Obtient la couleur correspondant à un score
 * @param {Number} score Score (0-10)
 * @returns {Array} Composantes RGB de la couleur
 */
function getScoreColor(score) {
    if (score >= 7) return [37, 179, 80]; // Vert (positif)
    if (score >= 4) return [255, 193, 7]; // Jaune (neutre)
    return [220, 53, 69]; // Rouge (négatif)
}