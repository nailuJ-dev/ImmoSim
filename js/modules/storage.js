/**
 * Gestion du stockage local pour le Simulateur Immobilier
 * 
 * Ce module permet de sauvegarder et récupérer les simulations de l'utilisateur
 * en utilisant le stockage local du navigateur (localStorage).
 */

import { createModalFromTemplate, openModal, closeModal, showSuccessMessage } from '../ui.js';
import { formatDate } from '../utils/formatter.js';

// Clé utilisée pour stocker les simulations dans localStorage
const STORAGE_KEY = 'simulateur_immobilier_simulations';

// Limite du nombre de simulations sauvegardées
const MAX_SAVED_SIMULATIONS = 20;

/**
 * Initialise le système de stockage
 */
export function setupStorage() {
    // Vérifie si localStorage est disponible
    if (!isLocalStorageAvailable()) {
        console.warn('Le stockage local n\'est pas disponible. Les simulations ne pourront pas être sauvegardées.');
        return;
    }
    
    // Crée un espace de stockage vide si nécessaire
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            value: [],      // Simulations d'évolution de valeur
            investment: [], // Simulations d'investissement locatif
            lastUpdated: new Date().toISOString()
        }));
    }
    
    // Nettoie les anciennes simulations si nécessaire
    cleanupOldSimulations();
}

/**
 * Vérifie si localStorage est disponible
 * @returns {Boolean} true si disponible
 */
function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Sauvegarde une simulation
 * @param {String} type Type de simulation ('value' ou 'investment')
 * @param {Object} simulation Données de la simulation
 */
export function saveSimulation(type, simulation) {
    if (!isLocalStorageAvailable()) {
        alert('Le stockage local n\'est pas disponible. Impossible de sauvegarder la simulation.');
        return;
    }
    
    // Affiche la modale de sauvegarde
    const modal = createModalFromTemplate('saveScenarioTemplate', 'saveSimulationModal');
    if (!modal) return;
    
    // Configure les boutons de la modale
    const confirmButton = modal.querySelector('#confirmSaveBtn');
    const cancelButton = modal.querySelector('#cancelSaveBtn');
    
    confirmButton.addEventListener('click', () => {
        const nameInput = modal.querySelector('#scenarioName');
        const descriptionInput = modal.querySelector('#scenarioDescription');
        
        const name = nameInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (!name) {
            // Met en évidence le champ nom si vide
            nameInput.classList.add('error');
            nameInput.focus();
            return;
        }
        
        // Prépare les données à sauvegarder
        const simulationData = {
            id: generateUniqueId(),
            name,
            description,
            type,
            data: simulation,
            createdAt: new Date().toISOString()
        };
        
        // Sauvegarde dans localStorage
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        savedData[type].unshift(simulationData); // Ajoute au début du tableau
        
        // Limite le nombre de simulations sauvegardées
        if (savedData[type].length > MAX_SAVED_SIMULATIONS) {
            savedData[type] = savedData[type].slice(0, MAX_SAVED_SIMULATIONS);
        }
        
        savedData.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
        
        // Ferme la modale et affiche un message de succès
        closeModal('saveSimulationModal');
        showSuccessMessage('Simulation enregistrée avec succès');
        
        // Déclenche un événement pour informer les autres modules
        document.dispatchEvent(new CustomEvent('simulationSaved', {
            detail: { type, simulation: simulationData }
        }));
    });
    
    cancelButton.addEventListener('click', () => {
        closeModal('saveSimulationModal');
    });
    
    // Ouvre la modale
    openModal('saveSimulationModal');
}

/**
 * Récupère toutes les simulations sauvegardées
 * @param {String} type Type de simulation ('value' ou 'investment'), si omis retourne tous les types
 * @returns {Array} Liste des simulations
 */
export function getSimulations(type = null) {
    if (!isLocalStorageAvailable()) return [];
    
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!savedData) return [];
        
        if (type) {
            return savedData[type] || [];
        } else {
            // Combine les simulations de différents types
            return [
                ...savedData.value.map(sim => ({ ...sim, typeLabel: 'Évolution de valeur' })),
                ...savedData.investment.map(sim => ({ ...sim, typeLabel: 'Investissement locatif' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des simulations:', error);
        return [];
    }
}

/**
 * Récupère une simulation spécifique par son ID
 * @param {String} id Identifiant de la simulation
 * @returns {Object|null} Simulation trouvée ou null
 */
export function getSimulationById(id) {
    const allSimulations = getSimulations();
    return allSimulations.find(sim => sim.id === id) || null;
}

/**
 * Supprime une simulation
 * @param {String} id Identifiant de la simulation
 * @returns {Boolean} true si supprimée avec succès
 */
export function deleteSimulation(id) {
    if (!isLocalStorageAvailable()) return false;
    
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!savedData) return false;
        
        // Cherche la simulation dans les deux types
        let deleted = false;
        
        ['value', 'investment'].forEach(type => {
            const index = savedData[type].findIndex(sim => sim.id === id);
            if (index !== -1) {
                savedData[type].splice(index, 1);
                deleted = true;
            }
        });
        
        if (deleted) {
            savedData.lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
            
            // Déclenche un événement pour informer les autres modules
            document.dispatchEvent(new CustomEvent('simulationDeleted', {
                detail: { id }
            }));
        }
        
        return deleted;
    } catch (error) {
        console.error('Erreur lors de la suppression de la simulation:', error);
        return false;
    }
}

/**
 * Nettoie les anciennes simulations (limite le nombre total)
 */
function cleanupOldSimulations() {
    if (!isLocalStorageAvailable()) return;
    
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!savedData) return;
        
        // Limite le nombre de simulations de chaque type
        ['value', 'investment'].forEach(type => {
            if (savedData[type] && savedData[type].length > MAX_SAVED_SIMULATIONS) {
                savedData[type] = savedData[type].slice(0, MAX_SAVED_SIMULATIONS);
            }
        });
        
        savedData.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    } catch (error) {
        console.error('Erreur lors du nettoyage des anciennes simulations:', error);
    }
}

/**
 * Génère un identifiant unique
 * @returns {String} Identifiant unique
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Formate une date de création pour l'affichage
 * @param {String} isoDate Date au format ISO
 * @returns {String} Date formatée
 */
export function formatSimulationDate(isoDate) {
    try {
        return formatDate(new Date(isoDate), true);
    } catch (error) {
        return 'Date inconnue';
    }
}