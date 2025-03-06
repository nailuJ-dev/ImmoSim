/**
 * Gestion de l'interface utilisateur du Simulateur Immobilier
 * 
 * Ce module contient les fonctions qui gèrent les aspects généraux de l'interface 
 * utilisateur, comme la navigation entre les onglets, les animations, le changement 
 * de thème, et autres interactions communes à toute l'application.
 */

// Cache les éléments DOM fréquemment utilisés
const DOM = {
    tabs: null,
    tabButtons: null,
    tabContents: null,
    themeToggle: null,
    forms: null,
    resultsContainers: null,
    backButtons: null,
    subTabs: null,
    subTabButtons: null,
    subTabContents: null,
};

/**
  * Initialise l'interface utilisateur globale
 */
export function initUI() {
    // Initialisation du cache DOM
    cacheDOM();
    
    // Gestion des formulaires
    setupForms();
    
    // Gestion des sliders
    setupRangeSliders();
    
    // Configuration des boutons de retour
    setupBackButtons();
    
    // Sous-onglets dans les résultats
    setupSubTabs();
    
    // Configuration des infobulles
    setupTooltips();
    
    // Animations d'entrée des éléments
    animateElementsIn();
    
    console.log('Interface utilisateur initialisée avec succès');
}

/**
 * Met en cache les éléments DOM fréquemment utilisés
 */
function cacheDOM() {
    DOM.tabs = document.querySelector('.tabs-container');
    DOM.tabButtons = document.querySelectorAll('.tab-btn');
    DOM.tabContents = document.querySelectorAll('.tab-content');
    DOM.themeToggle = document.getElementById('themeToggle');
    DOM.forms = document.querySelectorAll('form');
    DOM.resultsContainers = document.querySelectorAll('.results-container');
    DOM.backButtons = document.querySelectorAll('[id$="BackBtn"]');
    DOM.subTabs = document.querySelectorAll('.sub-tabs');
    DOM.subTabButtons = document.querySelectorAll('.sub-tabs .tab-btn');
    DOM.subTabContents = document.querySelectorAll('.sub-tabs .tab-content');
}

/**
 * Configure la navigation entre les onglets principaux
 */
export function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Configuration des onglets principaux:', tabButtons.length);
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            console.log('Clic sur l\'onglet principal:', tabId);
            
            // Désactive tous les onglets
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Active l'onglet cliqué
            button.classList.add('active');
            const contentToActivate = document.getElementById(tabId);
            if (contentToActivate) {
                contentToActivate.classList.add('active');
            } else {
                console.warn(`Contenu de l'onglet #${tabId} non trouvé`);
            }
            
            // Stocke l'onglet actif dans localStorage
            localStorage.setItem('activeTab', tabId);
        });
    });
    
    // Restaure l'onglet actif s'il était enregistré
    const activeTab = localStorage.getItem('activeTab');
    if (activeTab) {
        const tabToActivate = document.querySelector(`[data-tab="${activeTab}"]`);
        if (tabToActivate) {
            tabToActivate.click();
        }
    }
}

/**
 * Configure les sous-onglets dans les résultats
 */
function setupSubTabs() {
    const subTabsContainers = document.querySelectorAll('.sub-tabs');
    
    console.log('Configuration des conteneurs de sous-onglets:', subTabsContainers.length);
    
    subTabsContainers.forEach(container => {
        const buttons = container.querySelectorAll('.tab-btn');
        
        console.log(`Configuration des boutons pour le conteneur ${container.id || 'sans ID'}:`, buttons.length);
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                console.log('Clic sur le sous-onglet:', tabId);
                
                // Désactive tous les onglets dans ce conteneur
                container.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                container.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Active l'onglet cliqué
                button.classList.add('active');
                const targetContent = container.querySelector(`#${tabId}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                } else {
                    console.warn(`Contenu cible #${tabId} non trouvé`);
                }
            });
        });
    });
}

/**
 * Configure le toggle du thème clair/sombre
 */
export function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Vérifie si un thème est déjà stocké
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Ajoute l'événement click pour basculer le thème
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        
        // Sauvegarde le thème choisi
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    });
}

/**
 * Configure les boutons de retour dans les résultats
 */
function setupBackButtons() {
    const backButtons = document.querySelectorAll('[id$="BackBtn"]');
    
    console.log('Configuration des boutons de retour:', backButtons.length);
    
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const buttonId = button.id;
            console.log('Clic sur le bouton de retour:', buttonId);
            
            // Détermine à quel simulateur appartient ce bouton
            let resultsId, formSelector;
            if (buttonId === 'valueBackBtn') {
                resultsId = 'valueResults';
                formSelector = '#valueForm';
            } else if (buttonId === 'investBackBtn') {
                resultsId = 'investmentResults';
                formSelector = '#investmentForm';
            } else if (buttonId === 'ppBackBtn') {
                resultsId = 'purchasingPowerResults';
                formSelector = '#purchasingPowerForm';
            } else {
                resultsId = buttonId.replace('BackBtn', 'Results');
                formSelector = `#${buttonId.replace('BackBtn', 'Form')}`;
            }
            
            const results = document.getElementById(resultsId);
            const form = document.querySelector(formSelector)?.closest('.form-container');
            
            if (!results || !form) {
                console.warn(`Conteneur de résultats #${resultsId} ou formulaire ${formSelector} non trouvé`);
                return;
            }
            
            // Cache les résultats et affiche le formulaire
            results.style.display = 'none';
            form.style.display = 'block';
            
            // Scroll vers le haut du formulaire
            form.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

/**
 * Configure les sliders avec feedback visuel de la valeur
 */
function setupRangeSliders() {
    // Projection Years Slider
    const projectionSlider = document.getElementById('projectionYears');
    const projectionValue = document.getElementById('projectionYearsValue');
    if (projectionSlider && projectionValue) {
        updateRangeValue(projectionSlider, projectionValue, ' ans');
        projectionSlider.addEventListener('input', () => {
            updateRangeValue(projectionSlider, projectionValue, ' ans');
        });
    }
    
    // Loan Duration Slider
    const loanSlider = document.getElementById('loanDuration');
    const loanValue = document.getElementById('loanDurationValue');
    if (loanSlider && loanValue) {
        updateRangeValue(loanSlider, loanValue, ' ans');
        loanSlider.addEventListener('input', () => {
            updateRangeValue(loanSlider, loanValue, ' ans');
        });
    }
    
    // Purchasing Power Loan Duration Slider
    const ppLoanSlider = document.getElementById('ppLoanDuration');
    const ppLoanValue = document.getElementById('ppLoanDurationValue');
    if (ppLoanSlider && ppLoanValue) {
        updateRangeValue(ppLoanSlider, ppLoanValue, ' ans');
        ppLoanSlider.addEventListener('input', () => {
            updateRangeValue(ppLoanSlider, ppLoanValue, ' ans');
        });
    }
}

/**
 * Met à jour la valeur affichée d'un slider
 */
function updateRangeValue(slider, valueElement, suffix = '') {
    valueElement.textContent = slider.value + suffix;
}

/**
 * Configuration générale des formulaires
 */
function setupForms() {
    DOM.forms.forEach(form => {
        // Supprime le comportement par défaut des formulaires
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            
            // Identifie le formulaire
            const formId = form.id;
            
            // Déclenche l'événement personnalisé correspondant au formulaire
            const submitEvent = new CustomEvent(`${formId}Submit`, {
                detail: {
                    formData: new FormData(form),
                    formValues: Object.fromEntries(new FormData(form))
                }
            });
            
            document.dispatchEvent(submitEvent);
        });
        
        // Configuration des événements reset
        form.addEventListener('reset', () => {
            // Délai pour permettre aux valeurs du formulaire de se réinitialiser
            setTimeout(() => {
                // Réinitialiser les sliders
                setupRangeSliders();
                
                // Déclencher un événement personnalisé de réinitialisation
                const resetEvent = new CustomEvent(`${form.id}Reset`);
                document.dispatchEvent(resetEvent);
            }, 10);
        });
    });
}

/**
 * Configure les infobulles personnalisées
 */
function setupTooltips() {
    const infoIcons = document.querySelectorAll('.info-icon');
    
    infoIcons.forEach(icon => {
        const tooltipText = icon.getAttribute('title');
        if (!tooltipText) return;
        
        // Supprimer l'attribut title pour éviter l'infobulle native
        icon.removeAttribute('title');
        
        // Créer le conteneur de l'infobulle
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        
        // Gestionnaires d'événements pour afficher/masquer l'infobulle
        icon.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltip);
            positionTooltip(tooltip, icon);
            
            // Ajouter une classe après un court délai pour l'animation
            setTimeout(() => {
                tooltip.classList.add('visible');
            }, 10);
        });
        
        icon.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
            
            // Supprimer l'élément après l'animation
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        });
    });
}

/**
 * Positionne une infobulle par rapport à son élément déclencheur
 */
function positionTooltip(tooltip, triggerElement) {
    const rect = triggerElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    tooltip.style.top = `${rect.top + scrollTop - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + scrollLeft + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
}

/**
 * Anime l'entrée des éléments dans la page
 */
function animateElementsIn() {
    const elements = document.querySelectorAll('.form-section, .tab-content > h2, .results-overview');
    
    elements.forEach((element, index) => {
        // Ajoute un délai croissant pour une animation en cascade
        const delay = 100 + (index * 50);
        
        setTimeout(() => {
            element.classList.add('fade-in');
        }, delay);
    });
}

/**
 * Affiche un message de succès temporaire
 */
export function showSuccessMessage(message, duration = 3000) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    
    document.body.appendChild(successMessage);
    
    // Animation d'entrée
    setTimeout(() => {
        successMessage.classList.add('show');
    }, 10);
    
    // Suppression après la durée spécifiée
    setTimeout(() => {
        successMessage.classList.remove('show');
        
        // Supprime l'élément après l'animation
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 300);
    }, duration);
}

/**
 * Affiche un message d'erreur dans un formulaire
 */
export function showFormError(formId, message) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Supprime les erreurs existantes
    const existingError = form.querySelector('.form-error');
    if (existingError) {
        existingError.parentNode.removeChild(existingError);
    }
    
    // Crée le nouveau message d'erreur
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    
    // Insère l'erreur en haut du formulaire
    form.insertBefore(errorElement, form.firstChild);
    
    // Scroll vers l'erreur
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Supprime l'erreur après 5 secondes
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.classList.add('fade-out');
            
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Réinitialise les sous-onglets dans un conteneur
 * @param {HTMLElement} container Conteneur contenant les sous-onglets
 */
function resetSubTabs(container) {
    const subTabsContainer = container.querySelector('.sub-tabs');
    if (!subTabsContainer) return;
    
    // Désactive tous les onglets
    subTabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    subTabsContainer.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Active le premier onglet
    const firstTabBtn = subTabsContainer.querySelector('.tab-btn');
    if (firstTabBtn) {
        firstTabBtn.classList.add('active');
        const tabId = firstTabBtn.getAttribute('data-tab');
        const firstTabContent = subTabsContainer.querySelector(`#${tabId}`);
        if (firstTabContent) {
            firstTabContent.classList.add('active');
        }
    }
}

/**
 * Affiche le conteneur de résultats et masque le formulaire
 */
export function showResults(formId, resultsId) {
    const form = document.getElementById(formId)?.closest('.form-container');
    const results = document.getElementById(resultsId);
    
    if (!form || !results) {
        console.warn(`Formulaire #${formId} ou résultats #${resultsId} non trouvés`);
        return;
    }
    
    console.log(`Affichage des résultats #${resultsId}`);
    
    // Masque le formulaire et affiche les résultats
    form.style.display = 'none';
    results.style.display = 'block';
    
    // Scroll vers le haut des résultats
    results.scrollIntoView({ behavior: 'smooth' });
    
    // Réinitialise les sous-onglets si présents dans les résultats
    resetSubTabs(results);
}

/**
 * Crée une modale avec le contenu d'un template
 */
export function createModalFromTemplate(templateId, modalId = null) {
    const template = document.getElementById(templateId);
    if (!template) {
        console.error(`Template avec l'ID ${templateId} non trouvé`);
        return null;
    }
    
    const modalContent = template.content.cloneNode(true);
    const modal = modalContent.querySelector('.modal');
    
    if (modalId) {
        modal.id = modalId;
    }
    
    document.body.appendChild(modal);
    
    // Configure les boutons de fermeture
    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal.id));
    }
    
    // Ferme la modale si on clique en dehors
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
    
    return modal;
}

/**
 * Ouvre une modale
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Empêche le défilement du body
}

/**
 * Ferme une modale
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    document.body.style.overflow = ''; // Restaure le défilement
    
    // Supprime la modale après l'animation
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }, 300);
}

// Ajoute les styles CSS pour les éléments générés dynamiquement
(function addDynamicStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .tooltip {
            position: absolute;
            background-color: var(--gray-800);
            color: var(--white);
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
            max-width: 200px;
            text-align: center;
        }
        
        .tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .tooltip::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid var(--gray-800);
        }
        
        .success-message {
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: var(--success);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            z-index: 1100;
            opacity: 0;
            transform: translateX(20px);
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .success-message.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .form-error {
            background-color: var(--danger);
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            animation: shake 0.5s;
        }
        
        .form-error.fade-out {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .error-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--danger);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1100;
            display: flex;
            align-items: center;
            animation: slideDown 0.3s forwards;
        }
        
        .error-icon {
            margin-right: 12px;
            font-size: 20px;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translate(-50%, -20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .fade-in {
            animation: fadeIn 0.5s forwards;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(styleElement);
})();