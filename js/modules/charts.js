/**
 * Gestion des graphiques pour le Simulateur Immobilier
 * 
 * Ce module fournit des fonctions pour créer, mettre à jour et gérer les
 * différents graphiques utilisés dans l'application, en s'appuyant sur Chart.js.
 */

// Stockage des instances de graphiques pour pouvoir les mettre à jour ou les détruire
const chartInstances = {};

/**
 * Crée ou met à jour un graphique
 * @param {String} canvasId ID de l'élément canvas
 * @param {String} type Type de graphique (line, bar, pie, etc.)
 * @param {Object} data Données du graphique
 * @param {Object} options Options du graphique
 * @returns {Object} Instance du graphique
 */
export function setupCharts(canvasId, type, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas avec l'ID ${canvasId} non trouvé`);
        return null;
    }
    
    // Si un graphique existe déjà sur ce canvas, on le détruit
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }
    
    // Thème par défaut adapté à l'application
    const defaultOptions = getDefaultChartOptions();
    
    // Fusionne les options par défaut avec les options spécifiques
    const mergedOptions = mergeDeep(defaultOptions, options);
    
    // Ajuste les couleurs du graphique selon le thème actuel (clair/sombre)
    adjustChartColorsForTheme(data, mergedOptions);
    
    // Crée le graphique
    const chart = new Chart(canvas, {
        type,
        data,
        options: mergedOptions
    });
    
    // Stocke l'instance pour pouvoir la référencer plus tard
    chartInstances[canvasId] = chart;
    
    return chart;
}

/**
 * Met à jour les données d'un graphique existant
 * @param {String} canvasId ID de l'élément canvas
 * @param {Object} newData Nouvelles données
 * @param {Boolean} animate Animer la transition (défaut: true)
 */
export function updateChartData(canvasId, newData, animate = true) {
    const chart = chartInstances[canvasId];
    if (!chart) {
        console.error(`Aucun graphique trouvé avec l'ID ${canvasId}`);
        return;
    }
    
    // Met à jour les données
    chart.data = newData;
    
    // Ajuste les couleurs selon le thème actuel
    adjustChartColorsForTheme(chart.data, chart.options);
    
    // Applique les changements
    chart.update(animate ? 'default' : 'none');
}

/**
 * Détruit une instance de graphique
 * @param {String} canvasId ID de l'élément canvas
 */
export function destroyChart(canvasId) {
    const chart = chartInstances[canvasId];
    if (chart) {
        chart.destroy();
        delete chartInstances[canvasId];
    }
}

/**
 * Redimensionne tous les graphiques (utile lors du redimensionnement de la fenêtre)
 */
export function resizeAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
            chart.resize();
        }
    });
}

/**
 * Obtient les options par défaut pour les graphiques
 * @returns {Object} Options par défaut
 */
function getDefaultChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 4,
                displayColors: true
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    padding: 8
                }
            }
        },
        elements: {
            point: {
                radius: 4,
                hoverRadius: 6
            },
            line: {
                tension: 0.3
            }
        }
    };
}

/**
 * Ajuste les couleurs des graphiques en fonction du thème (clair/sombre)
 * @param {Object} data Données du graphique
 * @param {Object} options Options du graphique
 */
function adjustChartColorsForTheme(data, options) {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    // Ajuste les couleurs du texte
    if (options.scales) {
        const textColor = isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
        
        if (options.scales.x) {
            if (!options.scales.x.ticks) options.scales.x.ticks = {};
            options.scales.x.ticks.color = textColor;
        }
        
        if (options.scales.y) {
            if (!options.scales.y.ticks) options.scales.y.ticks = {};
            options.scales.y.ticks.color = textColor;
            
            // Ajuste la couleur des lignes de grille
            if (!options.scales.y.grid) options.scales.y.grid = {};
            options.scales.y.grid.color = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        }
    }
    
    // Ajuste les couleurs de la légende
    if (options.plugins && options.plugins.legend) {
        if (!options.plugins.legend.labels) options.plugins.legend.labels = {};
        options.plugins.legend.labels.color = isDarkTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    }
    
    // Définition des couleurs thématiques pour l'application
    const themeColors = {
        primary: isDarkTheme ? 'rgba(67, 97, 238, 0.8)' : 'rgba(67, 97, 238, 1)',
        secondary: isDarkTheme ? 'rgba(108, 117, 125, 0.8)' : 'rgba(108, 117, 125, 1)',
        success: isDarkTheme ? 'rgba(37, 179, 80, 0.8)' : 'rgba(37, 179, 80, 1)',
        warning: isDarkTheme ? 'rgba(255, 193, 7, 0.8)' : 'rgba(255, 193, 7, 1)',
        danger: isDarkTheme ? 'rgba(220, 53, 69, 0.8)' : 'rgba(220, 53, 69, 1)',
        info: isDarkTheme ? 'rgba(76, 201, 240, 0.8)' : 'rgba(76, 201, 240, 1)'
    };
    
    // Ajuste les couleurs des datasets
    if (data.datasets) {
        const backgroundOpacity = isDarkTheme ? 0.5 : 0.1;
        const colorPalette = [
            themeColors.primary,
            themeColors.success,
            themeColors.warning,
            themeColors.danger,
            themeColors.info,
            themeColors.secondary
        ];
        
        data.datasets.forEach((dataset, index) => {
            const baseColor = colorPalette[index % colorPalette.length];
            const baseColorRGB = extractRGB(baseColor);
            
            // Couleur de ligne/bordure
            if (!dataset.borderColor && dataset.type !== 'pie' && dataset.type !== 'doughnut') {
                dataset.borderColor = baseColor;
            }
            
            // Couleur de fond avec opacité
            if (!dataset.backgroundColor) {
                if (dataset.type === 'line') {
                    dataset.backgroundColor = `rgba(${baseColorRGB}, ${backgroundOpacity})`;
                } else if (dataset.type === 'pie' || dataset.type === 'doughnut') {
                    // Pour les graphiques circulaires, on utilise plusieurs couleurs
                    dataset.backgroundColor = colorPalette;
                } else {
                    dataset.backgroundColor = baseColor;
                }
            }
            
            // Points
            if (!dataset.pointBackgroundColor && dataset.type === 'line') {
                dataset.pointBackgroundColor = baseColor;
            }
            
            // Hover
            if (!dataset.hoverBackgroundColor && (dataset.type === 'pie' || dataset.type === 'doughnut')) {
                dataset.hoverBackgroundColor = colorPalette.map(color => {
                    const rgb = extractRGB(color);
                    return `rgba(${rgb}, 0.8)`;
                });
            }
        });
    }
}

/**
 * Extrait les composantes RGB d'une couleur (format rgba ou hex)
 * @param {String} color Couleur à analyser
 * @returns {String} Composantes RGB (format "r, g, b")
 */
function extractRGB(color) {
    if (color.startsWith('rgba')) {
        const matches = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
        if (matches) {
            return `${matches[1]}, ${matches[2]}, ${matches[3]}`;
        }
    } else if (color.startsWith('rgb')) {
        const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
        if (matches) {
            return `${matches[1]}, ${matches[2]}, ${matches[3]}`;
        }
    }
    
    // Par défaut, retourne les composantes RGB du bleu primaire
    return '67, 97, 238';
}

/**
 * Fusionne profondément deux objets
 * @param {Object} target Objet cible
 * @param {Object} source Objet source
 * @returns {Object} Objet fusionné
 */
function mergeDeep(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

/**
 * Vérifie si une valeur est un objet
 * @param {*} item Valeur à vérifier
 * @returns {Boolean} true si c'est un objet
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// Écouteur pour le changement de thème
document.addEventListener('DOMContentLoaded', () => {
    // Surveille les changements de classe sur le body pour détecter le changement de thème
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && mutation.target === document.body) {
                // Si la classe a changé, on met à jour les graphiques
                Object.keys(chartInstances).forEach(canvasId => {
                    const chart = chartInstances[canvasId];
                    if (chart) {
                        adjustChartColorsForTheme(chart.data, chart.options);
                        chart.update();
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, { attributes: true });
    
    // Gère le redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        // Utilise un debounce pour ne pas exécuter trop souvent
        if (window.resizeTimeout) {
            clearTimeout(window.resizeTimeout);
        }
        
        window.resizeTimeout = setTimeout(() => {
            resizeAllCharts();
        }, 250);
    });
});

// Exporte des fonctions spécifiques pour les différents types de graphiques

/**
 * Crée un graphique en ligne (évolution dans le temps)
 * @param {String} canvasId ID de l'élément canvas
 * @param {Array} labels Étiquettes (axe X)
 * @param {Array} datasets Ensembles de données
 * @param {Object} options Options spécifiques
 * @returns {Object} Instance du graphique
 */
export function createLineChart(canvasId, labels, datasets, options = {}) {
    return setupCharts(canvasId, 'line', { labels, datasets }, options);
}

/**
 * Crée un graphique à barres
 * @param {String} canvasId ID de l'élément canvas
 * @param {Array} labels Étiquettes (axe X)
 * @param {Array} datasets Ensembles de données
 * @param {Object} options Options spécifiques
 * @returns {Object} Instance du graphique
 */
export function createBarChart(canvasId, labels, datasets, options = {}) {
    return setupCharts(canvasId, 'bar', { labels, datasets }, options);
}

/**
 * Crée un graphique circulaire
 * @param {String} canvasId ID de l'élément canvas
 * @param {Array} labels Étiquettes
 * @param {Array} data Données
 * @param {Object} options Options spécifiques
 * @returns {Object} Instance du graphique
 */
export function createPieChart(canvasId, labels, data, options = {}) {
    const datasets = [{
        data,
        // Les couleurs seront définies automatiquement par adjustChartColorsForTheme
    }];
    
    return setupCharts(canvasId, 'pie', { labels, datasets }, options);
}

/**
 * Crée un graphique de comparaison horizontale
 * @param {String} canvasId ID de l'élément canvas
 * @param {Array} labels Étiquettes (axe Y)
 * @param {Array} datasets Ensembles de données
 * @param {Object} options Options spécifiques
 * @returns {Object} Instance du graphique
 */
export function createHorizontalBarChart(canvasId, labels, datasets, options = {}) {
    // Options par défaut pour un graphique à barres horizontales
    const defaultHorizontalOptions = {
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true
            }
        }
    };
    
    const mergedOptions = mergeDeep(defaultHorizontalOptions, options);
    
    return setupCharts(canvasId, 'bar', { labels, datasets }, mergedOptions);
}