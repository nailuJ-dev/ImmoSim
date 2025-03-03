/**
 * Fonctionnalités liées au simulateur d'investissement locatif
 */

// Variables globales
let cashFlowChart = null;
let projectionChart = null;

// Fonction d'initialisation
function initInvestissementSimulator() {
    const investissementForm = document.getElementById('investissement-form');
    const investissementResult = document.getElementById('investissement-result');
    
    if (investissementForm) {
        investissementForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculerInvestissementLocatif();
        });
    }

    // Masquer les résultats jusqu'à ce qu'ils soient générés
    if (investissementResult) {
        investissementResult.classList.remove('show');
    }
    
    // Masquer la section des recommandations jusqu'à ce qu'elle soit remplie
    const recommendationsCard = document.getElementById('recommendations-card');
    if (recommendationsCard) {
        recommendationsCard.style.display = 'none';
    }
    
    // Précharger des valeurs par défaut pour faciliter l'utilisation
    // prechargerValeursDefaut();
}

// Préchargement de valeurs par défaut
function prechargerValeursDefaut() {
    // Si aucune valeur n'est déjà entrée, on peut précharger des valeurs par défaut
    const prixAcquisition = document.getElementById('inv-prix-acquisition');
    if (prixAcquisition && prixAcquisition.value === '') {
        prixAcquisition.value = 200000;
    }
    
    const apport = document.getElementById('inv-apport');
    if (apport && apport.value === '') {
        apport.value = 40000;
    }
    
    const loyerMensuel = document.getElementById('inv-loyer-mensuel');
    if (loyerMensuel && loyerMensuel.value === '') {
        loyerMensuel.value = 800;
    }
    
    const taxeFonciere = document.getElementById('inv-taxe-fonciere');
    if (taxeFonciere && taxeFonciere.value === '') {
        taxeFonciere.value = 1200;
    }
}

// Calcul du rendement d'un investissement locatif
function calculerInvestissementLocatif() {
    // Récupération des valeurs du formulaire
    const prixAchat = parseFloat(document.getElementById('inv-prix-acquisition').value);
    const fraisNotaire = parseFloat(document.getElementById('inv-frais-notaire').value) / 100;
    const fraisAgence = parseFloat(document.getElementById('inv-frais-agence').value) / 100;
    const montantTravaux = parseFloat(document.getElementById('inv-travaux').value) || 0;
    const typeMeuble = document.getElementById('inv-meuble').value;
    
    const apportPersonnel = parseFloat(document.getElementById('inv-apport').value);
    const dureePret = parseInt(document.getElementById('inv-duree-pret').value);
    const tauxInteret = parseFloat(document.getElementById('inv-taux-interet').value) / 100;
    const assurancePret = parseFloat(document.getElementById('inv-assurance-pret').value) / 100;
    const fraisDossier = parseFloat(document.getElementById('inv-frais-dossier').value) || 0;
    
    const loyerMensuel = parseFloat(document.getElementById('inv-loyer-mensuel').value);
    const chargesRecup = parseFloat(document.getElementById('inv-charges-recup').value) || 0;
    const vacanceLocative = parseFloat(document.getElementById('inv-vacance-locative').value) / 100;
    const risqueImpayes = parseFloat(document.getElementById('inv-impaye').value) / 100;
    const fraisGestion = parseFloat(document.getElementById('inv-gestion-locative').value) / 100;
    
    const taxeFonciere = parseFloat(document.getElementById('inv-taxe-fonciere').value);
    const chargesCopro = parseFloat(document.getElementById('inv-charges-copro').value) || 0;
    const provisionEntretien = parseFloat(document.getElementById('inv-entretien').value) / 100;
    const trancheMarginal = parseFloat(document.getElementById('inv-tranche-marginale').value) / 100;
    const regimeFiscal = document.getElementById('inv-regime-fiscal').value;
    
    // Calcul du coût total de l'opération
    const fraisNotaireEuros = prixAchat * fraisNotaire;
    const fraisAgenceEuros = prixAchat * fraisAgence;
    const coutTotal = prixAchat + fraisNotaireEuros + fraisAgenceEuros + montantTravaux;
    
    // Détails des frais de notaire pour l'affichage
    const detailsNotaire = {
        montant: fraisNotaireEuros,
        pourcentage: fraisNotaire * 100
    };
    
    // Calcul du montant emprunté
    const montantEmprunte = coutTotal - apportPersonnel;
    
    // Calcul de la mensualité du crédit
    const tauxMensuel = tauxInteret / 12;
    const nombreMensualites = dureePret * 12;
    const mensualiteHorsAssurance = calculerMensualite(montantEmprunte, tauxInteret * 100, dureePret);
    const mensualiteAssurance = montantEmprunte * assurancePret / 12;
    const mensualiteCredit = mensualiteHorsAssurance + mensualiteAssurance;
    
    // Calcul des revenus locatifs annuels et mensuels
    const loyerAnnuelBrut = loyerMensuel * 12;
    const perteVacance = loyerAnnuelBrut * vacanceLocative;
    const perteImpayes = loyerAnnuelBrut * risqueImpayes;
    const fraisGestionAnnuels = loyerAnnuelBrut * fraisGestion;
    const loyerAnnuelNet = loyerAnnuelBrut - perteVacance - perteImpayes - fraisGestionAnnuels;
    const loyerMensuelNet = loyerAnnuelNet / 12;
    
    // Calcul des charges annuelles
    const entretienAnnuel = prixAchat * provisionEntretien;
    const chargesAnnuelles = taxeFonciere + chargesCopro + entretienAnnuel;
    const chargesMensuelles = chargesAnnuelles / 12;
    
    // Calcul du cash-flow
    const cashFlowMensuel = loyerMensuelNet - mensualiteCredit - chargesMensuelles;
    const cashFlowAnnuel = cashFlowMensuel * 12;
    
    // Calcul des indicateurs de rentabilité
    const rentabiliteBrute = (loyerAnnuelBrut / prixAchat) * 100;
    const rentabiliteNette = ((loyerAnnuelNet - chargesAnnuelles) / coutTotal) * 100;
    
    // Calcul de l'imposition
    let impotAnnuel = 0;
    
    if (regimeFiscal === 'micro-foncier') {
        // Abattement forfaitaire de 30%
        const revenuImposable = loyerAnnuelNet * 0.7;
        impotAnnuel = revenuImposable * trancheMarginal;
    } else if (regimeFiscal === 'reel') {
        // Déduction des intérêts d'emprunt, charges, etc.
        const interetsAnnuels = mensualiteHorsAssurance * 12 - (montantEmprunte / nombreMensualites) * 12;
        const revenuImposable = loyerAnnuelNet - interetsAnnuels - chargesAnnuelles;
        impotAnnuel = Math.max(0, revenuImposable * trancheMarginal);
    } else if (regimeFiscal === 'micro-bic') {
        // Abattement forfaitaire de 50% pour le meublé
        const revenuImposable = loyerAnnuelNet * 0.5;
        impotAnnuel = revenuImposable * trancheMarginal;
    } else if (regimeFiscal === 'reel-bic') {
        // Amortissement du bien et des meubles possible
        const dureeTotaleAmortissement = 25; // années
        const amortissementAnnuel = prixAchat / dureeTotaleAmortissement;
        const interetsAnnuels = mensualiteHorsAssurance * 12 - (montantEmprunte / nombreMensualites) * 12;
        const revenuImposable = loyerAnnuelNet - interetsAnnuels - chargesAnnuelles - amortissementAnnuel;
        impotAnnuel = Math.max(0, revenuImposable * trancheMarginal);
    }
    
    // Calcul du cash-flow après impôt
    const cashFlowApresImpot = cashFlowAnnuel - impotAnnuel;
    const cashFlowMensuelApresImpot = cashFlowApresImpot / 12;
    
    // Calcul du ratio d'endettement (mensualité / revenus locatifs)
    const ratioEndettement = mensualiteCredit / loyerMensuelNet;
    
    // Calcul du retour sur investissement (en années)
    const roi = apportPersonnel > 0 ? apportPersonnel / cashFlowApresImpot : 0;
    
    // Mise à jour des résultats affichés
    document.getElementById('rentabilite-brute').textContent = formatPourcentage(rentabiliteBrute);
    document.getElementById('rentabilite-nette').textContent = formatPourcentage(rentabiliteNette);
    document.getElementById('cash-flow-mensuel').textContent = cashFlowMensuelApresImpot > 0 
        ? `+${formatMontant(cashFlowMensuelApresImpot)}` 
        : formatMontant(cashFlowMensuelApresImpot);
    
    document.getElementById('cout-total').textContent = formatMontant(coutTotal);
    document.getElementById('mensualite-credit').textContent = `${formatMontant(mensualiteCredit)}/mois`;
    document.getElementById('revenus-annuels').textContent = formatMontant(loyerAnnuelNet);
    document.getElementById('cashflow-mensuel').textContent = cashFlowMensuelApresImpot > 0 
        ? `+${formatMontant(cashFlowMensuelApresImpot)}` 
        : formatMontant(cashFlowMensuelApresImpot);
        
    // Mise à jour du détail des coûts initiaux
    if (document.getElementById('detail-prix-achat')) {
        document.getElementById('detail-prix-achat').textContent = formatMontant(prixAchat);
        document.getElementById('detail-notaire').textContent = formatMontant(fraisNotaireEuros);
        document.getElementById('detail-notaire-pct').textContent = formatPourcentage(fraisNotaire * 100);
        document.getElementById('detail-agence').textContent = formatMontant(fraisAgenceEuros);
        document.getElementById('detail-agence-pct').textContent = formatPourcentage(fraisAgence * 100);
        document.getElementById('detail-travaux').textContent = formatMontant(montantTravaux);
        document.getElementById('detail-cout-total').textContent = formatMontant(coutTotal);
        document.getElementById('detail-apport').textContent = formatMontant(apportPersonnel);
        document.getElementById('detail-apport-pct').textContent = formatPourcentage((apportPersonnel / coutTotal) * 100);
        document.getElementById('detail-emprunt').textContent = formatMontant(montantEmprunte);
        document.getElementById('detail-emprunt-pct').textContent = formatPourcentage((montantEmprunte / coutTotal) * 100);
    }
    
    // Détail financier
    document.getElementById('detail-revenus').textContent = formatMontant(loyerMensuelNet);
    document.getElementById('detail-credit').textContent = `-${formatMontant(mensualiteCredit)}`;
    document.getElementById('detail-taxe').textContent = `-${formatMontant(taxeFonciere)}`;
    document.getElementById('detail-charges').textContent = `-${formatMontant(chargesCopro)}`;
    document.getElementById('detail-gestion').textContent = `-${formatMontant(fraisGestionAnnuels/12)}`;
    document.getElementById('detail-impot').textContent = `-${formatMontant(impotAnnuel)}`;
    
    // Performance
    document.getElementById('perf-renta-brute').textContent = formatPourcentage(rentabiliteBrute);
    document.getElementById('perf-renta-nette').textContent = formatPourcentage(rentabiliteNette);
    document.getElementById('perf-cashflow').textContent = cashFlowApresImpot > 0 
        ? `+${formatMontant(cashFlowApresImpot)}` 
        : formatMontant(cashFlowApresImpot);
    document.getElementById('perf-endettement').textContent = `${formatPourcentage(ratioEndettement * 100)}`;
    document.getElementById('perf-roi').textContent = roi > 0 ? `${roi.toFixed(1)} ans` : "N/A";
    
    // Mise à jour du graphique de rentabilité
    const rentabiliteValue = document.getElementById('rentabilite-meter-value');
    const rentabiliteMarker = document.getElementById('rentabilite-marker');
    
    // Déterminer la position sur l'échelle (0-100%)
    let score = 0;
    if (rentabiliteNette <= 2) {
        score = rentabiliteNette * 20; // 0-2% → 0-40%
    } else if (rentabiliteNette <= 5) {
        score = 40 + (rentabiliteNette - 2) * 20; // 2-5% → 40-100%
    } else {
        score = 100; // >5% → 100%
    }
    
    rentabiliteValue.style.width = `${score}%`;
    rentabiliteMarker.style.left = `${score}%`;
    
    // Création graphique cash-flow
    creerGraphiqueCashFlow(loyerMensuelNet, mensualiteCredit, chargesMensuelles);
    
    // Création graphique projection
    creerGraphiqueProjection(prixAchat, apportPersonnel, cashFlowApresImpot, dureePret);
    
    // Générer des recommandations personnalisées
    genererRecommandations({
        loyerMensuel: loyerMensuelNet,
        mensualiteCredit: mensualiteCredit,
        cashFlowMensuel: cashFlowMensuelApresImpot,
        rentabiliteBrute: rentabiliteBrute / 100,
        fraisGestion: fraisGestion,
        vacanceLocative: vacanceLocative,
        trancheMarginal: trancheMarginal,
        regimeFiscal: regimeFiscal,
        typeMeuble: typeMeuble,
        taxeFonciere: taxeFonciere
    });
    
    // Afficher les résultats
    const investissementResult = document.getElementById('investissement-result');
    investissementResult.classList.add('show');
    
    // Défilement vers les résultats
    investissementResult.scrollIntoView({ behavior: 'smooth' });
}

// Création du graphique de cash-flow
function creerGraphiqueCashFlow(loyerMensuel, mensualiteCredit, chargesMensuelles) {
    const cashFlowCanvas = document.getElementById('cashflow-chart');
    
    // Vérifier si l'élément canvas existe
    if (!cashFlowCanvas) {
        console.error("L'élément canvas 'cashflow-chart' n'existe pas dans le document");
        return;
    }
    
    const ctx = cashFlowCanvas.getContext('2d');
    
    // Détruire le graphique existant s'il y en a un
    if (cashFlowChart) {
        cashFlowChart.destroy();
    }
    
    // Variables pour le graphique
    const revenus = loyerMensuel;
    const depenseCredit = mensualiteCredit;
    const depenseCharges = chargesMensuelles;
    const cashFlow = revenus - depenseCredit - depenseCharges;
    
    // Données pour le graphique
    const data = {
        labels: ['Revenus', 'Dépenses', 'Cash-flow'],
        datasets: [
            {
                label: 'Loyers perçus',
                data: [revenus, 0, 0],
                backgroundColor: 'rgba(46, 204, 113, 0.7)',
                borderColor: 'rgba(46, 204, 113, 1)',
                borderWidth: 1
            },
            {
                label: 'Crédit',
                data: [0, depenseCredit, 0],
                backgroundColor: 'rgba(231, 76, 60, 0.7)',
                borderColor: 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            },
            {
                label: 'Charges',
                data: [0, depenseCharges, 0],
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            },
            {
                label: 'Cash-flow',
                data: [0, 0, cashFlow],
                backgroundColor: cashFlow >= 0 ? 'rgba(46, 204, 113, 0.7)' : 'rgba(231, 76, 60, 0.7)',
                borderColor: cashFlow >= 0 ? 'rgba(46, 204, 113, 1)' : 'rgba(231, 76, 60, 1)',
                borderWidth: 1
            }
        ]
    };
    
    // Créer le nouveau graphique
    cashFlowChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + ' €';
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
                                label += context.parsed.y.toFixed(0) + ' €';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Création du graphique de projection sur la durée
function creerGraphiqueProjection(prixAchat, apportPersonnel, cashFlowAnnuel, dureePret) {
    const projectionCanvas = document.getElementById('projection-chart');
    
    // Vérifier si l'élément canvas existe
    if (!projectionCanvas) {
        console.error("L'élément canvas 'projection-chart' n'existe pas dans le document");
        return;
    }
    
    const ctx = projectionCanvas.getContext('2d');
    
    // Détruire le graphique existant s'il y en a un
    if (projectionChart) {
        projectionChart.destroy();
    }
    
    // Nombre d'années à projeter (au moins 20 ans, ou durée du prêt si plus longue)
    const dureeProjection = Math.max(20, dureePret);
    
    // Hypothèses pour la projection
    const tauxInflation = 0.02; // 2% par an
    const tauxValorisationBien = 0.025; // 2.5% par an
    const tauxAugmentationLoyer = 0.015; // 1.5% par an (inférieur à l'inflation)
    
    // Projection année par année
    const labels = Array.from({length: dureeProjection + 1}, (_, i) => `Année ${i}`);
    const dataValeurBien = [prixAchat];
    const dataSoldeCredit = [prixAchat - apportPersonnel];
    const dataCashFlowCumule = [0];
    const dataPatrimoineNet = [apportPersonnel];
    
    let valeurBien = prixAchat;
    let soldeCredit = prixAchat - apportPersonnel;
    let cashFlowCumule = 0;
    let cashFlowAnnuelActuel = cashFlowAnnuel;
    
    for (let i = 1; i <= dureeProjection; i++) {
        // Évolution de la valeur du bien
        valeurBien *= (1 + tauxValorisationBien);
        
        // Évolution du solde du crédit (remboursement linéaire simple)
        if (i <= dureePret) {
            soldeCredit -= (prixAchat - apportPersonnel) / dureePret;
        } else {
            soldeCredit = 0;
        }
        
        // Évolution du cash-flow (augmentation avec l'inflation)
        cashFlowAnnuelActuel *= (1 + tauxAugmentationLoyer);
        cashFlowCumule += cashFlowAnnuelActuel;
        
        // Calcul du patrimoine net (Valeur bien - Solde crédit + Cash-flow cumulé)
        const patrimoineNet = valeurBien - soldeCredit + cashFlowCumule;
        
        // Ajout des données pour cette année
        dataValeurBien.push(valeurBien);
        dataSoldeCredit.push(Math.max(0, soldeCredit)); // Pas de solde négatif
        dataCashFlowCumule.push(cashFlowCumule);
        dataPatrimoineNet.push(patrimoineNet);
    }
    
    // Création du graphique
    projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Valeur du bien',
                    data: dataValeurBien,
                    borderColor: 'rgba(52, 152, 219, 1)',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Solde du crédit',
                    data: dataSoldeCredit,
                    borderColor: 'rgba(231, 76, 60, 1)',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Cash-flow cumulé',
                    data: dataCashFlowCumule,
                    borderColor: 'rgba(46, 204, 113, 1)',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2,
                    fill: false
                },
                {
                    label: 'Patrimoine net',
                    data: dataPatrimoineNet,
                    borderColor: 'rgba(243, 156, 18, 1)',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
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

// Fonction pour générer des recommandations d'amélioration du cash-flow
function genererRecommandations(donnees) {
    const recommandationsList = document.getElementById('recommendations-list');
    if (!recommandationsList) return;
    
    // Vider la liste existante
    recommandationsList.innerHTML = '';
    
    const recommendations = [];
    
    // Analyser le cash-flow actuel et la rentabilité
    const {
        loyerMensuel, mensualiteCredit, cashFlowMensuel, 
        rentabiliteBrute, fraisGestion, vacanceLocative, 
        trancheMarginal, regimeFiscal, typeMeuble, taxeFonciere
    } = donnees;
    
    // Recommandation 1: Optimisation fiscale
    if (typeMeuble === 'non-meuble' && regimeFiscal === 'micro-foncier') {
        recommendations.push({
            texte: "Envisagez de passer au <strong>régime réel</strong> pour déduire plus de charges de vos revenus locatifs. Cela pourrait réduire votre imposition annuelle.",
            impact: `Impact estimé: <span class="recommendations-impact">+5% à +15%</span> sur votre cash-flow après impôt.`
        });
    } else if (typeMeuble === 'non-meuble') {
        recommendations.push({
            texte: "Envisagez de <strong>louer votre bien en meublé</strong> pour bénéficier du statut LMNP, fiscalement plus avantageux.",
            impact: `Impact estimé: <span class="recommendations-impact">+10% à +20%</span> sur votre cash-flow après impôt.`
        });
    }
    
    // Recommandation 2: Réduction des vacances locatives
    if (vacanceLocative > 0.03) {
        recommendations.push({
            texte: "Réduisez les périodes de vacance locative en améliorant la qualité de votre annonce, en ajustant le prix du loyer ou en faisant appel à un gestionnaire professionnel.",
            impact: `Impact estimé: <span class="recommendations-impact">+${Math.round(loyerMensuel * (vacanceLocative - 0.03) * 12)} €/an</span> de revenus supplémentaires.`
        });
    }
    
    // Recommandation 3: Augmentation du loyer (si applicable)
    if (rentabiliteBrute < 0.05) {
        recommendations.push({
            texte: "Votre rentabilité brute est inférieure à 5%. Envisagez d'augmenter légèrement le loyer après avoir effectué quelques améliorations au logement (peinture fraîche, petites rénovations).",
            impact: `Impact estimé: <span class="recommendations-impact">+3% à +5%</span> sur vos revenus locatifs.`
        });
    }
    
    // Recommandation 4: Optimisation de la gestion locative
    if (fraisGestion > 0.05) {
        recommendations.push({
            texte: "Vos frais de gestion locative sont élevés. Comparez les offres de plusieurs agences ou envisagez une gestion directe si vous en avez la possibilité.",
            impact: `Impact estimé: <span class="recommendations-impact">+${Math.round((fraisGestion - 0.05) * loyerMensuel * 12)} €/an</span> de frais économisés.`
        });
    }
    
    // Recommandation 5: Réduction des mensualités de crédit
    if (mensualiteCredit > (loyerMensuel * 0.8)) {
        recommendations.push({
            texte: "Vos mensualités de crédit représentent une part importante de vos revenus locatifs. Envisagez de renégocier votre prêt pour obtenir un taux plus avantageux ou prolonger sa durée.",
            impact: `Impact estimé: <span class="recommendations-impact">+5% à +10%</span> sur votre cash-flow mensuel.`
        });
    }
    
    // Recommandation 6: Exonération de taxe foncière
    if (taxeFonciere > 0) {
        recommendations.push({
            texte: "Renseignez-vous sur les possibles exonérations de taxe foncière dans votre commune, notamment pour les logements économes en énergie ou les logements neufs.",
            impact: `Impact estimé: <span class="recommendations-impact">jusqu'à ${Math.round(taxeFonciere)} €/an</span> d'économies possibles.`
        });
    }
    
    // Si cashflow négatif, ajouter une recommandation spécifique
    if (cashFlowMensuel < 0) {
        recommendations.push({
            texte: "<strong>Attention</strong>: Votre cash-flow mensuel est négatif. Considérez soit d'augmenter votre apport personnel pour réduire les mensualités, soit de chercher un bien avec un meilleur rendement locatif.",
            impact: `<span class="recommendations-impact negative">Un cash-flow négatif représente un risque financier</span> à long terme.`
        });
    }
    
    // Si peu de recommandations, ajouter des conseils généraux
    if (recommendations.length < 3) {
        recommendations.push({
            texte: "Pensez à revoir régulièrement votre assurance habitation et votre assurance prêt pour bénéficier des meilleures conditions.",
            impact: "Impact estimé: <span class=\"recommendations-impact\">+2% à +5%</span> d'économies possibles."
        });
    }
    
    // Ajouter chaque recommandation à la liste
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = `${rec.texte}<br><small>${rec.impact}</small>`;
        recommandationsList.appendChild(li);
    });
    
    // Afficher la section des recommandations
    const recommendationsCard = document.getElementById('recommendations-card');
    if (recommendationsCard) {
        recommendationsCard.style.display = 'block';
    }
}