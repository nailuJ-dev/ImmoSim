/**
 * Gestion de l'interaction avec la carte pour le Simulateur Immobilier
 * 
 * Ce module gère l'affichage et l'interaction avec la carte des villes françaises,
 * permettant une sélection visuelle des villes et l'affichage des indicateurs
 * d'attractivité immobilière.
 */

/**
 * Initialise la carte interactive des villes
 * @param {Array} cityData Données des villes
 */
export function initMapInteraction(cityData) {
    if (!cityData || !cityData.length) {
        console.error('Impossible d\'initialiser la carte sans données de villes');
        return;
    }
    
    // Vérifier si l'élément de carte existe
    const mapElement = document.getElementById('cityMap');
    if (!mapElement) {
        console.warn('Élément de carte non trouvé dans le DOM');
        return;
    }
    
    try {
        // Créer la carte centrée sur la France
        const map = L.map('cityMap', {
            center: [46.603354, 1.888334], // Centre de la France
            zoom: 6,
            minZoom: 5,
            maxZoom: 10,
            zoomControl: true,
            scrollWheelZoom: false // Désactive le zoom avec la molette pour éviter les problèmes de défilement
        });
        
        // Ajouter la couche de tuiles (fond de carte)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Ajouter les marqueurs pour chaque ville
        addCityMarkers(map, cityData);
        
        // Gérer les sélecteurs liés à la carte
        setupMapSelectors(map, cityData);
        
        // Ajuster la carte lorsque l'onglet devient visible
        const valueTabBtn = document.querySelector('[data-tab="value-simulator"]');
        if (valueTabBtn) {
            valueTabBtn.addEventListener('click', () => {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            });
        }
        
        // Ajouter les bordures administratives de la France
        addFranceBorders(map);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error);
        mapElement.innerHTML = '<div class="map-error">Impossible de charger la carte. Veuillez sélectionner une ville dans la liste.</div>';
    }
}

/**
 * Ajoute les marqueurs des villes sur la carte
 * @param {Object} map Instance de la carte Leaflet
 * @param {Array} cityData Données des villes
 */
function addCityMarkers(map, cityData) {
    // Créer un groupe de marqueurs pour pouvoir les manipuler ensemble
    const markers = L.layerGroup().addTo(map);
    
    // Ajouter un marqueur pour chaque ville
    cityData.forEach(city => {
        if (!city.coordinates || !city.coordinates.lat || !city.coordinates.lng) {
            console.warn(`Coordonnées manquantes pour ${city.name}`);
            return;
        }
        
        // Détermine la couleur du marqueur en fonction de l'évolution des prix
        const markerColor = getMarkerColor(city.priceEvolution);
        
        // Crée un marqueur personnalisé
        const marker = L.circleMarker([city.coordinates.lat, city.coordinates.lng], {
            radius: getMarkerSize(city),
            fillColor: markerColor,
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
        
        // Ajoute une infobulle (popup)
        marker.bindPopup(createPopupContent(city), {
            maxWidth: 300,
            className: 'city-popup'
        });
        
        // Ajoute un événement au survol
        marker.on('mouseover', function(e) {
            this.openPopup();
            this.setStyle({ weight: 2, fillOpacity: 1 });
        });
        
        marker.on('mouseout', function(e) {
            this.closePopup();
            this.setStyle({ weight: 1, fillOpacity: 0.8 });
        });
        
        // Ajoute un événement au clic pour sélectionner la ville
        marker.on('click', function(e) {
            selectCity(city.name);
            this.openPopup();
        });
        
        // Stocke la référence à la ville dans le marqueur
        marker.cityName = city.name;
        
        // Ajoute le marqueur au groupe
        markers.addLayer(marker);
    });
    
    // Stocke la référence au groupe de marqueurs sur la carte pour y accéder plus tard
    map.cityMarkers = markers;
}

/**
 * Sélectionne une ville dans les listes déroulantes
 * @param {String} cityName Nom de la ville à sélectionner
 */
function selectCity(cityName) {
    // Sélectionne la ville dans tous les sélecteurs disponibles
    const selectors = [
        document.getElementById('valueCity'),
        document.getElementById('investCity'),
        document.getElementById('ppCity')
    ];
    
    selectors.forEach(selector => {
        if (selector) {
            // Trouve l'option correspondant à la ville
            const option = Array.from(selector.options).find(opt => opt.value === cityName);
            if (option) {
                selector.value = cityName;
                
                // Déclenche l'événement change pour mettre à jour les informations associées
                const event = new Event('change', { bubbles: true });
                selector.dispatchEvent(event);
            }
        }
    });
}

/**
 * Configure les interactions entre les sélecteurs de ville et la carte
 * @param {Object} map Instance de la carte Leaflet
 * @param {Array} cityData Données des villes
 */
function setupMapSelectors(map, cityData) {
    const selectors = [
        document.getElementById('valueCity'),
        document.getElementById('investCity'),
        document.getElementById('ppCity')
    ];
    
    // Pour chaque sélecteur de ville
    selectors.forEach(selector => {
        if (!selector) return;
        
        // Quand une ville est sélectionnée dans la liste
        selector.addEventListener('change', () => {
            const selectedCity = selector.value;
            if (selectedCity && map.cityMarkers) {
                // Trouve le marqueur correspondant à la ville
                let selectedMarker = null;
                map.cityMarkers.eachLayer(marker => {
                    if (marker.cityName === selectedCity) {
                        selectedMarker = marker;
                    }
                });
                
                if (selectedMarker) {
                    // Centre la carte sur la ville sélectionnée
                    map.setView(selectedMarker.getLatLng(), 8);
                    selectedMarker.openPopup();
                    
                    // Met en évidence le marqueur
                    map.cityMarkers.eachLayer(marker => {
                        if (marker === selectedMarker) {
                            marker.setStyle({ weight: 3, fillOpacity: 1 });
                        } else {
                            marker.setStyle({ weight: 1, fillOpacity: 0.8 });
                        }
                    });
                }
            }
        });
    });
}

/**
 * Détermine la couleur du marqueur en fonction de l'évolution des prix
 * @param {Number} priceEvolution Évolution des prix (%)
 * @returns {String} Code couleur hexadécimal
 */
function getMarkerColor(priceEvolution) {
    if (priceEvolution < 0) return '#e63946'; // Décroissance
    if (priceEvolution < 1.0) return '#a9d6b8'; // Faible croissance
    if (priceEvolution < 2.5) return '#74c69d'; // Croissance modérée
    return '#2fb380'; // Forte croissance
}

/**
 * Détermine la taille du marqueur en fonction de l'importance de la ville
 * @param {Object} city Données de la ville
 * @returns {Number} Taille du marqueur (rayon)
 */
function getMarkerSize(city) {
    // Base la taille sur une combinaison de facteurs
    const baseSize = 5;
    const priceSize = Math.min(5, city.pricePerSqm / 2000); // Max +5 pour les villes chères
    const dynamismSize = city.economicDynamism / 2; // Max +5 pour les villes dynamiques
    
    return baseSize + priceSize + dynamismSize;
}

/**
 * Crée le contenu HTML de l'infobulle pour une ville
 * @param {Object} city Données de la ville
 * @returns {String} Contenu HTML
 */
function createPopupContent(city) {
    const growthClass = getGrowthClass(city.priceEvolution);
    
    // Formater les prix au m²
    const pricePerSqm = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(city.pricePerSqm);
    
    // Formater l'évolution des prix
    const evolution = new Intl.NumberFormat('fr-FR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(city.priceEvolution / 100);
    
    return `
        <div class="city-popup-content">
            <h3>${city.name}</h3>
            <div class="city-region">${city.region}</div>
            <div class="city-price">${pricePerSqm}/m²</div>
            <div class="city-evolution ${growthClass}">
                <span class="evolution-arrow">${getEvolutionArrow(city.priceEvolution)}</span>
                ${evolution}/an
            </div>
            <div class="city-stats">
                <div class="stat">
                    <span class="stat-label">Attractivité</span>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" style="width: ${city.attractivityIndex * 10}%"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Obtient la classe CSS correspondant à l'évolution des prix
 * @param {Number} evolution Évolution des prix (%)
 * @returns {String} Nom de classe CSS
 */
function getGrowthClass(evolution) {
    if (evolution < 0) return 'negative';
    if (evolution < 1.0) return 'low';
    if (evolution < 2.5) return 'medium';
    return 'high';
}

/**
 * Obtient la flèche correspondant à l'évolution des prix
 * @param {Number} evolution Évolution des prix (%)
 * @returns {String} Caractère flèche
 */
function getEvolutionArrow(evolution) {
    if (evolution < 0) return '↓';
    if (evolution < 1.0) return '→';
    return '↑';
}

/**
 * Ajoute les bordures administratives de la France
 * @param {Object} map Instance de la carte Leaflet
 */
function addFranceBorders(map) {
    // Simplification: dans une implémentation réelle, nous chargerions un GeoJSON avec les frontières
    // Pour cet exemple, nous utilisons un cercle simplifié qui englobe la France
    const franceBounds = [
        [51.1, -5.5], // Nord-Ouest
        [51.1, 9.5],  // Nord-Est
        [41.3, 9.5],  // Sud-Est
        [41.3, -5.5], // Sud-Ouest
        [51.1, -5.5]  // Fermeture du polygone
    ];
    
    const borderStyle = {
        color: '#3388ff',
        weight: 1,
        opacity: 0.5,
        fill: false
    };
    
    L.polygon(franceBounds, borderStyle).addTo(map);
}

// Ajoute les styles CSS spécifiques à la carte
(function addMapStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .city-popup {
            padding: 0;
        }
        
        .city-popup .leaflet-popup-content-wrapper {
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        
        .city-popup .leaflet-popup-content {
            margin: 0;
            width: 220px !important;
        }
        
        .city-popup-content {
            padding: 12px;
        }
        
        .city-popup-content h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .city-region {
            color: var(--text-light);
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .city-price {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .city-evolution {
            font-size: 12px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .city-evolution.high {
            color: #2fb380;
        }
        
        .city-evolution.medium {
            color: #74c69d;
        }
        
        .city-evolution.low {
            color: #a9d6b8;
        }
        
        .city-evolution.negative {
            color: #e63946;
        }
        
        .evolution-arrow {
            font-size: 14px;
        }
        
        .city-stats {
            margin-bottom: 12px;
        }
        
        .stat {
            margin-bottom: 8px;
        }
        
        .stat-label {
            font-size: 12px;
            display: block;
            margin-bottom: 3px;
        }
        
        .stat-bar {
            height: 4px;
            background-color: var(--gray-200);
            border-radius: 2px;
            overflow: hidden;
        }
        
        .stat-bar-fill {
            height: 100%;
            background-color: var(--primary);
            border-radius: 2px;
        }
        
        .map-error {
            padding: 20px;
            text-align: center;
            color: var(--text-light);
            font-style: italic;
        }
    `;
    
    document.head.appendChild(styleElement);
})();