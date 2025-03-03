/**
 * Fonctionnalités d'exportation des résultats en PDF
 */

// Fonction pour exporter les résultats de valorisation en PDF
function exportValorisationPDF() {
    // Récupérer les données pour l'exportation
    const dateExport = new Date().toLocaleDateString('fr-FR');
    const prixAcquisition = document.getElementById('initial-value').textContent;
    const valeurFinale = document.getElementById('final-value').textContent;
    const dureeProjection = document.getElementById('projection-years').textContent;
    const evolution = document.getElementById('value-evolution').textContent;
    const prixM2 = document.getElementById('price-per-sqm').textContent;
    const evolutionAnnuelle = document.getElementById('yearly-evolution').textContent;
    const cityName = document.getElementById('city-name').textContent;
    
    // Créer le contenu du PDF
    const pdfContent = `
        <div class="pdf-container">
            <div class="pdf-header">
                <h1>SimImmo - Rapport d'évolution de valeur</h1>
                <p>Généré le ${dateExport}</p>
            </div>
            
            <div class="pdf-section">
                <h2>Résumé de la simulation</h2>
                <p>Votre bien d'une valeur initiale de <strong>${prixAcquisition}</strong> 
                pourrait valoir <strong>${valeurFinale}</strong> 
                dans <strong>${dureeProjection} ans</strong>, 
                soit une évolution de <strong>${evolution}</strong>.</p>
            </div>
            
            <div class="pdf-section">
                <h2>Détails de l'estimation</h2>
                <table class="pdf-table">
                    <tr>
                        <td>Prix au m²</td>
                        <td>${prixM2}</td>
                    </tr>
                    <tr>
                        <td>Évolution annuelle moyenne</td>
                        <td>${evolutionAnnuelle}</td>
                    </tr>
                    <tr>
                        <td>Ville</td>
                        <td>${cityName}</td>
                    </tr>
                </table>
            </div>
            
            <div class="pdf-section">
                <h2>Facteurs influençant cette projection</h2>
                <ul>
                    <li>Dynamisme du marché à ${cityName}</li>
                    <li>Évolution démographique de la zone</li>
                    <li>Projets urbains et infrastructures</li>
                    <li>Inflation prévue</li>
                </ul>
                <p class="pdf-disclaimer">Cette simulation est basée sur des tendances historiques et ne constitue pas une garantie de performance future.</p>
            </div>
            
            <div class="pdf-footer">
                <p>© 2025 SimImmo - Simulateur d'Investissement Immobilier</p>
            </div>
        </div>
    `;
    
    // Appliquer des styles pour le PDF
    const styles = `
        .pdf-container {
            font-family: Arial, sans-serif;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .pdf-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
        }
        .pdf-header h1 {
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .pdf-section {
            margin-bottom: 25px;
        }
        .pdf-section h2 {
            color: #3498db;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .pdf-table td {
            border: 1px solid #ddd;
            padding: 10px;
        }
        .pdf-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .pdf-disclaimer {
            font-style: italic;
            color: #7f8c8d;
            font-size: 12px;
        }
        .pdf-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
    `;
    
    // Créer un élément temporaire pour le PDF
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    
    // Appliquer les styles
    const style = document.createElement('style');
    style.textContent = styles;
    element.appendChild(style);
    
    // Options pour html2pdf
    const opt = {
        margin:       [10, 10],
        filename:     `SimImmo_Valorisation_${dateExport.replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Générer le PDF
    html2pdf().from(element).set(opt).save();
}

// Fonction pour exporter les résultats d'investissement en PDF
function exportInvestissementPDF() {
    // Récupérer les données pour l'exportation
    const dateExport = new Date().toLocaleDateString('fr-FR');
    const rentabiliteBrute = document.getElementById('rentabilite-brute').textContent;
    const rentabiliteNette = document.getElementById('rentabilite-nette').textContent;
    const cashFlowMensuel = document.getElementById('cash-flow-mensuel').textContent;
    const coutTotal = document.getElementById('cout-total').textContent;
    const mensualiteCredit = document.getElementById('mensualite-credit').textContent;
    const revenus = document.getElementById('revenus-annuels').textContent;
    
    // Créer le contenu du PDF
    const pdfContent = `
        <div class="pdf-container">
            <div class="pdf-header">
                <h1>SimImmo - Rapport d'investissement locatif</h1>
                <p>Généré le ${dateExport}</p>
            </div>
            
            <div class="pdf-section">
                <h2>Résumé de l'investissement</h2>
                <p>Votre investissement présente une rentabilité brute de <strong>${rentabiliteBrute}</strong> 
                et une rentabilité nette de <strong>${rentabiliteNette}</strong>. 
                Le cash-flow mensuel est <strong>${cashFlowMensuel}</strong>.</p>
            </div>
            
            <div class="pdf-section">
                <h2>Détails financiers</h2>
                <table class="pdf-table">
                    <tr>
                        <td>Coût total de l'opération</td>
                        <td>${coutTotal}</td>
                    </tr>
                    <tr>
                        <td>Mensualité du crédit</td>
                        <td>${mensualiteCredit}</td>
                    </tr>
                    <tr>
                        <td>Revenus locatifs annuels</td>
                        <td>${revenus}</td>
                    </tr>
                    <tr>
                        <td>Cash-flow mensuel</td>
                        <td>${cashFlowMensuel}</td>
                    </tr>
                </table>
            </div>
            
            <div class="pdf-section">
                <h2>Recommandations</h2>
                <div id="pdf-recommendations">
                    <!-- Sera rempli dynamiquement -->
                </div>
                <p class="pdf-disclaimer">Ces recommandations sont fournies à titre indicatif et ne constituent pas un conseil en investissement personnalisé.</p>
            </div>
            
            <div class="pdf-footer">
                <p>© 2025 SimImmo - Simulateur d'Investissement Immobilier</p>
            </div>
        </div>
    `;
    
    // Appliquer des styles pour le PDF
    const styles = `
        .pdf-container {
            font-family: Arial, sans-serif;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .pdf-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
        }
        .pdf-header h1 {
            color: #2c3e50;
            margin-bottom: 5px;
        }
        .pdf-section {
            margin-bottom: 25px;
        }
        .pdf-section h2 {
            color: #3498db;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .pdf-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .pdf-table td {
            border: 1px solid #ddd;
            padding: 10px;
        }
        .pdf-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .pdf-disclaimer {
            font-style: italic;
            color: #7f8c8d;
            font-size: 12px;
        }
        .pdf-footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 15px;
        }
    `;
    
    // Créer un élément temporaire pour le PDF
    const element = document.createElement('div');
    element.innerHTML = pdfContent;
    
    // Ajouter les recommandations au PDF
    const recommendationsElement = element.querySelector('#pdf-recommendations');
    const originalRecommendations = document.getElementById('recommendations-list');
    
    if (originalRecommendations && recommendationsElement) {
        // Créer une liste pour les recommandations
        const ul = document.createElement('ul');
        
        // Copier chaque élément de la liste originale
        Array.from(originalRecommendations.children).forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = item.innerHTML;
            ul.appendChild(li);
        });
        
        recommendationsElement.appendChild(ul);
    }
    
    // Appliquer les styles
    const style = document.createElement('style');
    style.textContent = styles;
    element.appendChild(style);
    
    // Options pour html2pdf
    const opt = {
        margin:       [10, 10],
        filename:     `SimImmo_Investissement_${dateExport.replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Générer le PDF
    html2pdf().from(element).set(opt).save();
}

// Initialisation des boutons d'exportation
document.addEventListener('DOMContentLoaded', function() {
    // Bouton d'export pour la valorisation
    const valorisationPdfBtn = document.getElementById('valorisation-pdf');
    if (valorisationPdfBtn) {
        valorisationPdfBtn.addEventListener('click', exportValorisationPDF);
    }
    
    // Bouton d'export pour l'investissement
    const investissementPdfBtn = document.getElementById('investissement-pdf');
    if (investissementPdfBtn) {
        investissementPdfBtn.addEventListener('click', exportInvestissementPDF);
    }
    
    // Boutons de reset
    const valorisationResetBtn = document.getElementById('valorisation-reset');
    if (valorisationResetBtn) {
        valorisationResetBtn.addEventListener('click', function() {
            document.getElementById('valorisation-form').reset();
            document.getElementById('valorisation-result').classList.remove('show');
            document.getElementById('valorisation').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    const investissementResetBtn = document.getElementById('investissement-reset');
    if (investissementResetBtn) {
        investissementResetBtn.addEventListener('click', function() {
            document.getElementById('investissement-form').reset();
            document.getElementById('investissement-result').classList.remove('show');
            document.getElementById('investissement').scrollIntoView({ behavior: 'smooth' });
        });
    }
});