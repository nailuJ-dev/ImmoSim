/**
 * Fichier principal d'initialisation du simulateur immobilier
 */

// Fonction exécutée lorsque le document est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des onglets
    initTabs();
    
    // Initialisation des simulateurs
    initValorisationSimulator();
    initInvestissementSimulator();
    
    // Initialisation des info-bulles
    initTooltips();
    
    // Initialisation du responsive pour les tableaux
    initResponsiveTables();
});

// Gestion des onglets
function initTabs() {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            // Retirer la classe active de tous les onglets
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            // Ajouter la classe active à l'onglet cliqué
            tab.classList.add('active');
            
            // Masquer tous les contenus d'onglet
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Afficher le contenu correspondant à l'onglet cliqué
            document.getElementById(tab.dataset.tab).classList.add('active');
            
            // Masquer les résultats précédents lors du changement d'onglet
            document.querySelectorAll('.result-card').forEach(result => result.classList.remove('show'));
        });
    });
}

// Fonction pour masquer tous les résultats
function masquerResultats() {
    document.querySelectorAll('.result-card').forEach(result => {
        result.classList.remove('show');
    });
    
    // Masquer également les recommandations
    const recommendationsCard = document.getElementById('recommendations-card');
    if (recommendationsCard) {
        recommendationsCard.style.display = 'none';
    }
}

// Initialisation des info-bulles
function initTooltips() {
    // Si besoin d'une initialisation spécifique pour les info-bulles
    // Actuellement, elles fonctionnent avec du CSS uniquement (hover)
}

// Initialisation des tableaux responsives
function initResponsiveTables() {
    // Cette fonction peut être utilisée pour ajouter des comportements spécifiques
    // aux tableaux en mode responsive si nécessaire
}

// Fonction utilitaire pour arrondir les nombres avec 2 décimales
function roundNumber(number, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
}