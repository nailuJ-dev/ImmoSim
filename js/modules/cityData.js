/**
 * Données des villes françaises pour le Simulateur Immobilier
 * 
 * Ce module gère les données immobilières des principales villes françaises,
 * incluant les prix au m², les tendances d'évolution, et les coordonnées
 * géographiques pour l'affichage sur la carte.
 */

// Données des villes (prix au m², évolution, coordonnées)
const CITIES_DATA = [
    {
        name: "Paris",
        region: "Île-de-France",
        pricePerSqm: 10500,
        priceEvolution: 1.5,
        apartmentPricePerSqm: 11200,
        housePricePerSqm: 9800,
        studioPricePerSqm: 12300,
        rentPerSqm: 31.2,
        propertyTaxRate: 1.2,
        coordinates: { lat: 48.8566, lng: 2.3522 },
        economicDynamism: 9,
        transportQuality: 9,
        populationGrowth: 0.3
    },
    {
        name: "Lyon",
        region: "Auvergne-Rhône-Alpes",
        pricePerSqm: 5200,
        priceEvolution: 3.2,
        apartmentPricePerSqm: 5500,
        housePricePerSqm: 4800,
        studioPricePerSqm: 6000,
        rentPerSqm: 15.5,
        propertyTaxRate: 0.9,
        coordinates: { lat: 45.75, lng: 4.85 },
        economicDynamism: 8,
        transportQuality: 8,
        populationGrowth: 0.7
    },
    {
        name: "Marseille",
        region: "Provence-Alpes-Côte d'Azur",
        pricePerSqm: 3200,
        priceEvolution: 2.1,
        apartmentPricePerSqm: 3400,
        housePricePerSqm: 3000,
        studioPricePerSqm: 3800,
        rentPerSqm: 13.2,
        propertyTaxRate: 1.4,
        coordinates: { lat: 43.2965, lng: 5.3698 },
        economicDynamism: 6,
        transportQuality: 6,
        populationGrowth: 0.3
    },
    {
        name: "Bordeaux",
        region: "Nouvelle-Aquitaine",
        pricePerSqm: 4500,
        priceEvolution: 2.8,
        apartmentPricePerSqm: 4800,
        housePricePerSqm: 4200,
        studioPricePerSqm: 5300,
        rentPerSqm: 14.8,
        propertyTaxRate: 1.1,
        coordinates: { lat: 44.8378, lng: -0.5792 },
        economicDynamism: 7,
        transportQuality: 7,
        populationGrowth: 1.1
    },
    {
        name: "Lille",
        region: "Hauts-de-France",
        pricePerSqm: 3300,
        priceEvolution: 2.3,
        apartmentPricePerSqm: 3500,
        housePricePerSqm: 3100,
        studioPricePerSqm: 4000,
        rentPerSqm: 13.5,
        propertyTaxRate: 1.3,
        coordinates: { lat: 50.6292, lng: 3.0573 },
        economicDynamism: 7,
        transportQuality: 7,
        populationGrowth: 0.4
    },
    {
        name: "Nantes",
        region: "Pays de la Loire",
        pricePerSqm: 3800,
        priceEvolution: 3.5,
        apartmentPricePerSqm: 4100,
        housePricePerSqm: 3600,
        studioPricePerSqm: 4500,
        rentPerSqm: 13.8,
        propertyTaxRate: 1.0,
        coordinates: { lat: 47.2184, lng: -1.5536 },
        economicDynamism: 8,
        transportQuality: 7,
        populationGrowth: 1.2
    },
    {
        name: "Strasbourg",
        region: "Grand Est",
        pricePerSqm: 3400,
        priceEvolution: 2.2,
        apartmentPricePerSqm: 3600,
        housePricePerSqm: 3200,
        studioPricePerSqm: 4000,
        rentPerSqm: 13.0,
        propertyTaxRate: 1.2,
        coordinates: { lat: 48.5734, lng: 7.7521 },
        economicDynamism: 7,
        transportQuality: 8,
        populationGrowth: 0.5
    },
    {
        name: "Montpellier",
        region: "Occitanie",
        pricePerSqm: 3300,
        priceEvolution: 2.6,
        apartmentPricePerSqm: 3500,
        housePricePerSqm: 3100,
        studioPricePerSqm: 3900,
        rentPerSqm: 14.0,
        propertyTaxRate: 1.5,
        coordinates: { lat: 43.6112, lng: 3.8767 },
        economicDynamism: 7,
        transportQuality: 6,
        populationGrowth: 1.3
    },
    {
        name: "Rennes",
        region: "Bretagne",
        pricePerSqm: 3500,
        priceEvolution: 3.2,
        apartmentPricePerSqm: 3700,
        housePricePerSqm: 3300,
        studioPricePerSqm: 4100,
        rentPerSqm: 13.2,
        propertyTaxRate: 1.1,
        coordinates: { lat: 48.1173, lng: -1.6778 },
        economicDynamism: 7,
        transportQuality: 7,
        populationGrowth: 0.9
    },
    {
        name: "Nice",
        region: "Provence-Alpes-Côte d'Azur",
        pricePerSqm: 4300,
        priceEvolution: 1.8,
        apartmentPricePerSqm: 4600,
        housePricePerSqm: 4000,
        studioPricePerSqm: 5000,
        rentPerSqm: 16.5,
        propertyTaxRate: 1.3,
        coordinates: { lat: 43.7101, lng: 7.2619 },
        economicDynamism: 6,
        transportQuality: 7,
        populationGrowth: 0.2
    },
    {
        name: "Toulouse",
        region: "Occitanie",
        pricePerSqm: 3500,
        priceEvolution: 2.9,
        apartmentPricePerSqm: 3700,
        housePricePerSqm: 3300,
        studioPricePerSqm: 4100,
        rentPerSqm: 13.5,
        propertyTaxRate: 1.2,
        coordinates: { lat: 43.6047, lng: 1.4442 },
        economicDynamism: 8,
        transportQuality: 7,
        populationGrowth: 1.0
    },
    {
        name: "Grenoble",
        region: "Auvergne-Rhône-Alpes",
        pricePerSqm: 2800,
        priceEvolution: 1.5,
        apartmentPricePerSqm: 3000,
        housePricePerSqm: 2600,
        studioPricePerSqm: 3300,
        rentPerSqm: 12.5,
        propertyTaxRate: 1.2,
        coordinates: { lat: 45.1885, lng: 5.7245 },
        economicDynamism: 7,
        transportQuality: 7,
        populationGrowth: 0.3
    },
    {
        name: "Dijon",
        region: "Bourgogne-Franche-Comté",
        pricePerSqm: 2500,
        priceEvolution: 1.8,
        apartmentPricePerSqm: 2700,
        housePricePerSqm: 2300,
        studioPricePerSqm: 3000,
        rentPerSqm: 11.8,
        propertyTaxRate: 1.3,
        coordinates: { lat: 47.3220, lng: 5.0415 },
        economicDynamism: 6,
        transportQuality: 6,
        populationGrowth: 0.2
    },
    {
        name: "Angers",
        region: "Pays de la Loire",
        pricePerSqm: 2600,
        priceEvolution: 2.7,
        apartmentPricePerSqm: 2800,
        housePricePerSqm: 2400,
        studioPricePerSqm: 3100,
        rentPerSqm: 11.5,
        propertyTaxRate: 1.1,
        coordinates: { lat: 47.4784, lng: -0.5632 },
        economicDynamism: 6,
        transportQuality: 6,
        populationGrowth: 0.6
    },
    {
        name: "Tours",
        region: "Centre-Val de Loire",
        pricePerSqm: 2600,
        priceEvolution: 2.2,
        apartmentPricePerSqm: 2800,
        housePricePerSqm: 2400,
        studioPricePerSqm: 3100,
        rentPerSqm: 11.8,
        propertyTaxRate: 1.2,
        coordinates: { lat: 47.3941, lng: 0.6848 },
        economicDynamism: 6,
        transportQuality: 6,
        populationGrowth: 0.4
    },
    {
        name: "Reims",
        region: "Grand Est",
        pricePerSqm: 2400,
        priceEvolution: 2.0,
        apartmentPricePerSqm: 2600,
        housePricePerSqm: 2200,
        studioPricePerSqm: 2900,
        rentPerSqm: 11.2,
        propertyTaxRate: 1.3,
        coordinates: { lat: 49.2583, lng: 4.0317 },
        economicDynamism: 5,
        transportQuality: 6,
        populationGrowth: 0.3
    },
    {
        name: "Caen",
        region: "Normandie",
        pricePerSqm: 2400,
        priceEvolution: 1.7,
        apartmentPricePerSqm: 2600,
        housePricePerSqm: 2200,
        studioPricePerSqm: 2900,
        rentPerSqm: 11.0,
        propertyTaxRate: 1.4,
        coordinates: { lat: 49.1828, lng: -0.3714 },
        economicDynamism: 5,
        transportQuality: 5,
        populationGrowth: 0.2
    },
    {
        name: "Le Mans",
        region: "Pays de la Loire",
        pricePerSqm: 1800,
        priceEvolution: 1.5,
        apartmentPricePerSqm: 2000,
        housePricePerSqm: 1600,
        studioPricePerSqm: 2200,
        rentPerSqm: 9.8,
        propertyTaxRate: 1.3,
        coordinates: { lat: 48.0061, lng: 0.1996 },
        economicDynamism: 5,
        transportQuality: 6,
        populationGrowth: 0.1
    },
    {
        name: "Clermont-Ferrand",
        region: "Auvergne-Rhône-Alpes",
        pricePerSqm: 2200,
        priceEvolution: 1.9,
        apartmentPricePerSqm: 2400,
        housePricePerSqm: 2000,
        studioPricePerSqm: 2700,
        rentPerSqm: 10.5,
        propertyTaxRate: 1.3,
        coordinates: { lat: 45.7772, lng: 3.0869 },
        economicDynamism: 6,
        transportQuality: 5,
        populationGrowth: 0.3
    },
    {
        name: "Aix-en-Provence",
        region: "Provence-Alpes-Côte d'Azur",
        pricePerSqm: 4600,
        priceEvolution: 2.0,
        apartmentPricePerSqm: 4900,
        housePricePerSqm: 4300,
        studioPricePerSqm: 5400,
        rentPerSqm: 15.8,
        propertyTaxRate: 1.2,
        coordinates: { lat: 43.5297, lng: 5.4474 },
        economicDynamism: 7,
        transportQuality: 6,
        populationGrowth: 0.6
    }
];

/**
 * Charge les données des villes et effectue tout traitement nécessaire avant utilisation
 * @returns {Promise<Array>} Données des villes enrichies
 */
export async function loadCityData() {
    try {
        // Dans une application réelle, on pourrait charger les données depuis une API
        // Pour cette simulation, on utilise les données statiques définies ci-dessus
        
        // Simulation d'une requête asynchrone
        return new Promise((resolve) => {
            setTimeout(() => {
                // Enrichit les données avec des calculs supplémentaires
                const enrichedData = CITIES_DATA.map(city => ({
                    ...city,
                    // Calcul d'un indice global d'attractivité immobilière
                    attractivityIndex: calculateAttractivityIndex(city),
                    // Classification de l'évolution des prix
                    growthCategory: getGrowthCategory(city.priceEvolution)
                }));
                
                resolve(enrichedData);
            }, 300); // Délai simulé pour donner l'impression d'un chargement
        });
    } catch (error) {
        console.error('Erreur lors du chargement des données des villes:', error);
        throw error;
    }
}

/**
 * Calcule un indice d'attractivité immobilière (0-10) basé sur divers facteurs
 * @param {Object} city Données d'une ville
 * @returns {Number} Indice d'attractivité
 */
function calculateAttractivityIndex(city) {
    // Formule simplifiée d'attractivité basée sur plusieurs facteurs
    const economicFactor = city.economicDynamism * 0.4;
    const transportFactor = city.transportQuality * 0.2;
    const growthFactor = city.populationGrowth * 2.0;
    const priceFactor = (1 - (city.pricePerSqm / 12000)) * 3.0; // Inverse du prix, car plus c'est cher, moins c'est attractif
    
    let index = economicFactor + transportFactor + growthFactor + priceFactor;
    
    // Plafonne l'indice entre 0 et 10
    return Math.max(0, Math.min(10, index));
}

/**
 * Détermine la catégorie de croissance des prix
 * @param {Number} evolution Taux d'évolution des prix en pourcentage
 * @returns {String} Catégorie de croissance
 */
function getGrowthCategory(evolution) {
    if (evolution < 0) return 'negative';
    if (evolution < 1.0) return 'low';
    if (evolution < 2.5) return 'medium';
    return 'high';
}

/**
 * Trouve les données d'une ville par son nom
 * @param {Array} cities Liste des villes
 * @param {String} cityName Nom de la ville à trouver
 * @returns {Object|null} Données de la ville ou null si non trouvée
 */
export function findCityByName(cities, cityName) {
    return cities.find(city => city.name === cityName) || null;
}

/**
 * Obtient le prix au m² pour un type de bien spécifique dans une ville
 * @param {Array} cities Liste des villes
 * @param {String} cityName Nom de la ville
 * @param {String} propertyType Type de bien (apartment, house, studio)
 * @returns {Number} Prix au m²
 */
export function getPricePerSqmByType(cities, cityName, propertyType) {
    const city = findCityByName(cities, cityName);
    if (!city) return 0;
    
    switch (propertyType) {
        case 'apartment':
            return city.apartmentPricePerSqm;
        case 'house':
            return city.housePricePerSqm;
        case 'studio':
            return city.studioPricePerSqm;
        default:
            return city.pricePerSqm;
    }
}

/**
 * Obtient le loyer moyen au m² dans une ville
 * @param {Array} cities Liste des villes
 * @param {String} cityName Nom de la ville
 * @returns {Number} Loyer au m²
 */
export function getRentPerSqm(cities, cityName) {
    const city = findCityByName(cities, cityName);
    return city ? city.rentPerSqm : 0;
}

/**
 * Obtient le taux moyen de la taxe foncière dans une ville
 * @param {Array} cities Liste des villes
 * @param {String} cityName Nom de la ville
 * @returns {Number} Taux de taxe foncière
 */
export function getPropertyTaxRate(cities, cityName) {
    const city = findCityByName(cities, cityName);
    return city ? city.propertyTaxRate : 0;
}

/**
 * Remplir les sélecteurs de villes dans les formulaires
 * @param {Array} cities Liste des villes
 */
export function populateCitySelectors(cities) {
    const selectors = [
        document.getElementById('valueCity'),
        document.getElementById('investCity'),
        document.getElementById('ppCity')
    ];
    
    selectors.forEach(selector => {
        if (!selector) return;
        
        // Vide le sélecteur (sauf l'option par défaut)
        while (selector.options.length > 1) {
            selector.remove(1);
        }
        
        // Trie les villes par nom
        const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));
        
        // Ajoute les options pour chaque ville
        sortedCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.name;
            option.textContent = city.name;
            option.dataset.region = city.region;
            option.dataset.price = city.pricePerSqm;
            option.dataset.evolution = city.priceEvolution;
            selector.appendChild(option);
        });
    });
}