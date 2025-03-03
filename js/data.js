/**
 * Données de marché immobilier pour le simulateur
 */

// Évolution annuelle moyenne par ville (en %)
const evolutionParVille = {
    'paris': 2.5,
    'marseille': 2.0,
    'lyon': 3.2,
    'toulouse': 2.8,
    'nice': 1.9,
    'nantes': 3.1,
    'montpellier': 2.9,
    'strasbourg': 2.3,
    'bordeaux': 3.5,
    'lille': 2.2,
    'rennes': 3.0,
    'reims': 2.4,
    'le-havre': 1.8,
    'saint-etienne': 1.5,
    'toulon': 2.1,
    'grenoble': 2.5,
    'dijon': 2.2,
    'angers': 2.7,
    'nimes': 2.1,
    'villeurbanne': 3.0,
    'le-mans': 2.0,
    'clermont-ferrand': 2.3,
    'aix-en-provence': 2.9,
    'brest': 1.9,
    'tours': 2.4,
    'limoges': 1.8,
    'amiens': 1.9,
    'perpignan': 2.0,
    'metz': 2.1,
    'besancon': 2.2,
    'orleans': 2.3,
    'rouen': 2.1,
    'mulhouse': 1.8,
    'caen': 2.0,
    'nancy': 2.1,
    'saint-denis': 2.6,
    'argenteuil': 2.7,
    'montreuil': 3.2,
    'roubaix': 1.9,
    'dunkerque': 1.7,
    'tourcoing': 1.8,
    'avignon': 2.3,
    'nanterre': 3.0,
    'poitiers': 2.2,
    'creteil': 2.8,
    'versailles': 2.9,
    'courbevoie': 3.1,
    'vitry-sur-seine': 2.8,
    'colombes': 2.9,
    'asnieres-sur-seine': 3.0,
    'aulnay-sous-bois': 2.7,
    'pau': 2.2,
    'rueil-malmaison': 3.1,
    'antibes': 2.2,
    'la-rochelle': 2.6,
    'saint-maur-des-fosses': 2.9,
    'calais': 1.6,
    'champigny-sur-marne': 2.8,
    'aubervilliers': 2.7,
    'cannes': 2.1
};

// Prix moyen au m² par ville (en €)
const prixM2ParVille = {
    'paris': 10800,
    'marseille': 3800,
    'lyon': 5300,
    'toulouse': 3800,
    'nice': 4600,
    'nantes': 4100,
    'montpellier': 3600,
    'strasbourg': 3500,
    'bordeaux': 4900,
    'lille': 3400,
    'rennes': 3800,
    'reims': 2300,
    'le-havre': 2100,
    'saint-etienne': 1800,
    'toulon': 3000,
    'grenoble': 2900,
    'dijon': 2500,
    'angers': 2700,
    'nimes': 2300,
    'villeurbanne': 4200,
    'le-mans': 2000,
    'clermont-ferrand': 2200,
    'aix-en-provence': 4800,
    'brest': 2000,
    'tours': 2600,
    'limoges': 1600,
    'amiens': 2100,
    'perpignan': 2200,
    'metz': 2200,
    'besancon': 2200,
    'orleans': 2400,
    'rouen': 2300,
    'mulhouse': 1900,
    'caen': 2300,
    'nancy': 2400,
    'saint-denis': 4300,
    'argenteuil': 3400,
    'montreuil': 6500,
    'roubaix': 1800,
    'dunkerque': 1700,
    'tourcoing': 1800,
    'avignon': 2500,
    'nanterre': 5500,
    'poitiers': 2000,
    'creteil': 4400,
    'versailles': 6900,
    'courbevoie': 7600,
    'vitry-sur-seine': 4700,
    'colombes': 5300,
    'asnieres-sur-seine': 6200,
    'aulnay-sous-bois': 3300,
    'pau': 2200,
    'rueil-malmaison': 6100,
    'antibes': 4800,
    'la-rochelle': 3900,
    'saint-maur-des-fosses': 5900,
    'calais': 1500,
    'champigny-sur-marne': 4100,
    'aubervilliers': 4300,
    'cannes': 4900
};

// Évaluation des rentabilités
const evaluationRentabilite = {
    brute: {
        faible: 3.0,
        moyenne: 5.0,
        bonne: 7.0,
        excellente: 9.0
    },
    nette: {
        faible: 2.0,
        moyenne: 3.5,
        bonne: 5.0,
        excellente: 7.0
    }
};

// Fonction pour évaluer une rentabilité
function evaluerRentabilite(valeur, type) {
    const seuils = evaluationRentabilite[type];
    
    if (valeur < seuils.faible) {
        return "Très faible";
    } else if (valeur < seuils.moyenne) {
        return "Faible";
    } else if (valeur < seuils.bonne) {
        return "Moyenne";
    } else if (valeur < seuils.excellente) {
        return "Bonne";
    } else {
        return "Excellente";
    }
}

// Fonction pour formater un montant en euros
function formatMontant(montant) {
    return Math.round(montant).toLocaleString('fr-FR') + ' €';
}

// Fonction pour formater un pourcentage
function formatPourcentage(pourcentage) {
    return pourcentage.toFixed(1) + '%';
}

// Fonction pour calculer les mensualités d'un prêt immobilier
function calculerMensualite(montant, tauxAnnuel, dureeAnnees) {
    const tauxMensuel = tauxAnnuel / 12 / 100;
    const nombreMensualites = dureeAnnees * 12;
    
    if (tauxMensuel === 0) {
        return montant / nombreMensualites;
    }
    
    return montant * tauxMensuel * Math.pow(1 + tauxMensuel, nombreMensualites) / (Math.pow(1 + tauxMensuel, nombreMensualites) - 1);
}