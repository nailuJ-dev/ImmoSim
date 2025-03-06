/**
 * Simulateur Immobilier - Point d'entrée de l'application
 * 
 * Ce fichier coordonne l'initialisation des différents modules et composants
 * de l'application, et gère le chargement initial des données nécessaires.
 */

// Import des modules nécessaires
import { initUI, setupTabNavigation, setupThemeToggle } from './ui.js';
import { initValueSimulator } from './modules/valueSimulator.js';
import { initInvestmentSimulator } from './modules/investSimulator.js';
import { initComparison } from './modules/comparison.js';
import { initPurchasingPower } from './modules/purchasingPower.js';
import { initMapInteraction } from './modules/mapInteraction.js';
import { loadCityData } from './modules/cityData.js';
import { setupStorage } from './modules/storage.js';

// Fonction principale d'initialisation de l'application
async function initApp() {
    try {
        console.log('Initialisation du Simulateur Immobilier...');
        
        // Initialisation de l'interface utilisateur de base
        setupTabNavigation();
        setupThemeToggle();
        
        // Chargement des données des villes (attendre que les données soient chargées)
        const cityData = await loadCityData();
        console.log(`Données chargées pour ${cityData.length} villes`);
        
        // Initialisation du stockage local
        setupStorage();
        
        // Initialisation des différents simulateurs
        initUI();
        initValueSimulator(cityData);
        initInvestmentSimulator(cityData);
        initComparison();
        initPurchasingPower(cityData);
        
        // Initialisation de la carte interactive
        initMapInteraction(cityData);
        
        console.log('Application initialisée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        displayErrorMessage('Une erreur est survenue lors du chargement de l\'application. Veuillez réessayer.');
    }
}

// Affiche un message d'erreur à l'utilisateur
function displayErrorMessage(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div class="error-text">${message}</div>
    `;
    
    document.body.appendChild(errorContainer);
    
    // Supprime le message après 8 secondes
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.parentNode.removeChild(errorContainer);
        }
    }, 8000);
}

// Démarrer l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', initApp);

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur globale:', event.error);
    displayErrorMessage('Une erreur inattendue s\'est produite. Veuillez réessayer ou recharger la page.');
});