/**
 * Fonctionnalités liées au simulateur d'évolution de valeur
 */

// Variables globales
let evolutionChart = null;

// Fonction d'initialisation
function initValorisationSimulator() {
    const valorisationForm = document.getElementById('valorisation-form');
    const valorisationResult = document.getElementById('valorisation-result');
    
    if (valorisationForm) {
        valorisationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculerEvolutionValeur();
        });
    }

    // Masquer les résultats jusqu'à ce qu'ils soient générés
    if (valorisationResult) {
        valorisationResult.classList.remove('show');
    }
    
    // Précharger des valeurs par défaut pour faciliter l'utilisation
    // prechargerValeursDefaut();
}

// Préchargement de valeurs par défaut
function prechargerValeursDefaut() {
    // Si aucune valeur n'est déjà entrée, on peut précharger des valeurs par défaut
    const prixAcquisition = document.getElementById('prix-acquisition');
    if (prixAcquisition && prixAcquisition.value === '') {
        prixAcquisition.value = 250000;
    }
    
    const surface = document.getElementById('surface');
    if (surface && surface.value === '') {
        surface.value = 60;
    }
    
    const anneeConstruction = document.getElementById('annee-construction');
    if (anneeConstruction && anneeConstruction.value === '') {
        anneeConstruction.value = 2000;
    }
}

// Calcul de l'évolution de la valeur d'un bien
function calculerEvolutionValeur() {
    // Récupération des valeurs du formulaire
    const prixAcquisition = parseFloat(document.getElementById('prix-acquisition').value);
    const surface = parseFloat(document.getElementById('surface').value);
    const ville = document.getElementById('ville').value;
    const typeBien = document.getElementById('type-bien').value;
    const anneeConstruction = parseInt(document.getElementById('annee-construction').value);
    const dureeProjection = parseInt(document.getElementById('duree-projection').value);
    
    // Calculs
    const prixM2 = prixAcquisition / surface;
    const tauxEvolutionAnnuel = evolutionParVille[ville] || 2.0; // Valeur par défaut si la ville n'est pas dans la liste
    
    // Facteur de correction basé sur l'âge du bien
    const anneeActuelle = new Date().getFullYear();
    const ageBien = anneeActuelle - anneeConstruction;
    let facteurAge = 1;
    
    if (ageBien < 5) {
        facteurAge = 1.1; // Bien récent, meilleure valorisation
    } else if (ageBien > 50) {
        facteurAge = 0.9; // Bien ancien, valorisation plus faible
    }
    
    // Facteur type de bien
    const facteurType = typeBien === 'appartement' ? 1.05 : 0.95;
    
    // Calcul du taux annuel ajusté
    const tauxAnnuelAjuste = tauxEvolutionAnnuel * facteurAge * facteurType;
    
    // Calcul de la valeur finale
    const facteurEvolution = Math.pow(1 + tauxAnnuelAjuste / 100, dureeProjection);
    const valeurFinale = prixAcquisition * facteurEvolution;
    const evolutionTotale = valeurFinale - prixAcquisition;
    const pourcentageEvolution = ((valeurFinale / prixAcquisition) - 1) * 100;
    
    // Mise à jour des résultats
    document.getElementById('initial-value').textContent = formatMontant(prixAcquisition);
    document.getElementById('final-value').textContent = formatMontant(valeurFinale);
    document.getElementById('projection-years').textContent = dureeProjection;
    document.getElementById('value-evolution').textContent = `+${formatPourcentage(pourcentageEvolution)}`;
    document.getElementById('price-per-sqm').textContent = formatMontant(prixM2) + '/m²';
    document.getElementById('yearly-evolution').textContent = `+${formatPourcentage(tauxAnnuelAjuste)}`;
    document.getElementById('total-evolution').textContent = `+${formatMontant(evolutionTotale)}`;
    
    // Indice de confiance (basé sur la différence entre le prix du bien et le prix moyen au m² dans la ville)
    const prixMoyenVille = prixM2ParVille[ville] || 4000;
    const ecartPrixMoyen = Math.abs((prixM2 / prixMoyenVille) - 1);
    const indiceConfiance = Math.max(50, Math.min(90, 85 - ecartPrixMoyen * 100));
    document.getElementById('confidence-index').textContent = `${Math.round(indiceConfiance)}%`;
    
    // Mise à jour du nom de la ville dans le tableau des facteurs
    document.getElementById('city-name').textContent = ville.charAt(0).toUpperCase() + ville.slice(1);
    
    // Création du graphique d'évolution
    creerGraphiqueEvolution(prixAcquisition, tauxAnnuelAjuste, dureeProjection);
    
    // Afficher les résultats
    const valorisationResult = document.getElementById('valorisation-result');
    valorisationResult.classList.add('show');
    
    // Défilement vers les résultats
    valorisationResult.scrollIntoView({ behavior: 'smooth' });
}

// Création du graphique d'évolution
function creerGraphiqueEvolution(prixInitial, tauxAnnuel, duree) {
    const evolutionCanvas = document.getElementById('evolution-chart');
    
    // Vérifier si l'élément canvas existe
    if (!evolutionCanvas) {
        console.error("L'élément canvas 'evolution-chart' n'existe pas dans le document");
        return;
    }
    
    const ctx = evolutionCanvas.getContext('2d');
    
    // Données pour le graphique
    const labels = Array.from({length: duree + 1}, (_, i) => `Année ${i}`);
    const donnees = [prixInitial];
    
    // Calculer les valeurs pour chaque année
    for (let i = 1; i <= duree; i++) {
        const valeur = prixInitial * Math.pow(1 + tauxAnnuel / 100, i);
        donnees.push(valeur);
    }
    
    // Détruire le graphique existant s'il y en a un
    if (evolutionChart) {
        evolutionChart.destroy();
    }
    
    // Créer le nouveau graphique
    evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valeur estimée (€)',
                data: donnees,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(52, 152, 219, 1)',
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return formatMontant(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatMontant(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}