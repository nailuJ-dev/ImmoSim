/**
 * Module Génération de Rapports PDF Professionnels
 * Utilise jsPDF + jsPDF-AutoTable pour générer des rapports branded
 */

import { formatCurrency, formatPercentage } from '../utils/formatter.js';

const REPORT_TYPES = [
    {
        id: 'valuation',
        name: 'Rapport d\'Estimation',
        desc: 'Rapport d\'estimation de valeur avec analyse de marché et facteurs d\'influence. Idéal pour les mandats de vente.',
        icon: '🏠',
        badge: 'Agent'
    },
    {
        id: 'investment',
        name: 'Rapport d\'Investissement',
        desc: 'Analyse complète de la rentabilité locative avec cash-flow, TRI et projection sur 20 ans. Pour les investisseurs.',
        icon: '📈',
        badge: 'Conseiller'
    },
    {
        id: 'notary',
        name: 'Fiche Notariale',
        desc: 'Calcul détaillé des frais de notaire, droits de mutation et frais d\'assiette pour une transaction.',
        icon: '⚖️',
        badge: 'Notaire'
    },
    {
        id: 'market',
        name: 'Analyse de Marché',
        desc: 'Comparatif de marché local avec données DVF, évolution des prix et tendances. Support commercial.',
        icon: '📊',
        badge: 'Pro'
    }
];

export function initReportGenerator() {
    const container = document.getElementById('reportsContent');
    if (!container) return;
    container.innerHTML = buildReportsLayout();
    setupReportEvents();
}

function buildReportsLayout() {
    return `
    <div style="margin-bottom:28px;">
        <h3 style="font-size:.9rem;font-weight:700;color:#334155;margin-bottom:8px;">Choisissez un modèle de rapport</h3>
        <p style="font-size:.82rem;color:#94a3b8;">Les rapports sont générés en PDF, prêts à imprimer ou à envoyer par email à vos clients.</p>
    </div>
    <div class="reports-grid">
        ${REPORT_TYPES.map(t => `
            <div class="report-template" data-report="${t.id}">
                <div class="report-template-icon">${t.icon}</div>
                <div class="report-template-name">${t.name}</div>
                <div class="report-template-desc">${t.desc}</div>
                <span style="background:#e2e8f0;color:#64748b;font-size:.7rem;font-weight:700;padding:2px 10px;border-radius:100px;display:inline-block;margin-bottom:12px;">${t.badge}</span>
                <br>
                <button class="btn-generate-report" data-report="${t.id}">Générer le rapport</button>
            </div>
        `).join('')}
    </div>

    <div style="margin-top:32px;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h3 style="font-size:.9rem;font-weight:700;color:#334155;margin-bottom:16px;">Personnalisation de l'en-tête</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="report-branding-form">
            <div class="form-group">
                <label>Nom de l'agence / cabinet</label>
                <input type="text" id="reportAgencyName" placeholder="Ex: Agence Martin Immobilier" value="">
            </div>
            <div class="form-group">
                <label>Nom du conseiller</label>
                <input type="text" id="reportAdvisorName" placeholder="Ex: Jean Dupont" value="Jean Dupont">
            </div>
            <div class="form-group">
                <label>Téléphone</label>
                <input type="text" id="reportPhone" placeholder="Ex: 06 12 34 56 78">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="reportEmail" placeholder="Ex: contact@agence.fr">
            </div>
            <div class="form-group" style="grid-column:1/-1;">
                <label>Adresse</label>
                <input type="text" id="reportAddress" placeholder="Ex: 12 rue de la Paix, 75001 Paris">
            </div>
        </div>
        <p style="font-size:.72rem;color:#94a3b8;margin-top:12px;">Ces informations apparaîtront dans l'en-tête de tous vos rapports PDF.</p>
    </div>

    <div id="reportPreviewSection" style="display:none;margin-top:24px;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <h3 style="font-size:.9rem;font-weight:700;color:#334155;">Aperçu du rapport</h3>
            <button id="downloadPdfBtn" class="btn-panel-action">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 4 3-4M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Télécharger PDF
            </button>
        </div>
        <div id="reportPreviewContent" style="font-size:.82rem;color:#334155;line-height:1.7;"></div>
    </div>
    `;
}

function setupReportEvents() {
    document.querySelectorAll('.btn-generate-report').forEach(btn => {
        btn.addEventListener('click', () => generateReport(btn.dataset.report));
    });

    document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadCurrentPDF);
}

let currentReportData = null;
let currentReportType = null;

function generateReport(reportType) {
    currentReportType = reportType;

    // Get branding info
    const branding = {
        agencyName: document.getElementById('reportAgencyName')?.value || 'ImmoSim Pro',
        advisorName: document.getElementById('reportAdvisorName')?.value || '',
        phone: document.getElementById('reportPhone')?.value || '',
        email: document.getElementById('reportEmail')?.value || '',
        address: document.getElementById('reportAddress')?.value || ''
    };

    // Get latest simulation data from storage
    let reportData = null;
    try {
        const stored = localStorage.getItem('immoSimData');
        if (stored) reportData = JSON.parse(stored);
    } catch {}

    currentReportData = reportData;

    // Build preview
    const preview = buildReportPreview(reportType, branding, reportData);
    document.getElementById('reportPreviewContent').innerHTML = preview;
    document.getElementById('reportPreviewSection').style.display = 'block';
    document.getElementById('reportPreviewSection').scrollIntoView({ behavior: 'smooth' });
}

function buildReportPreview(type, branding, data) {
    const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const typeNames = {
        valuation: 'Rapport d\'Estimation de Valeur',
        investment: 'Rapport d\'Analyse d\'Investissement',
        notary: 'Fiche de Simulation Notariale',
        market: 'Analyse de Marché Immobilier'
    };

    const headerHtml = `
        <div style="border-bottom:3px solid #4361ee;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
                <div style="font-size:1.3rem;font-weight:800;color:#0f172a;">${typeNames[type] || 'Rapport Immobilier'}</div>
                <div style="font-size:.8rem;color:#64748b;margin-top:4px;">Préparé le ${now}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:.95rem;font-weight:700;color:#0f172a;">${branding.agencyName}</div>
                ${branding.advisorName ? `<div style="font-size:.78rem;color:#64748b;">${branding.advisorName}</div>` : ''}
                ${branding.phone ? `<div style="font-size:.75rem;color:#94a3b8;">${branding.phone}</div>` : ''}
                ${branding.email ? `<div style="font-size:.75rem;color:#94a3b8;">${branding.email}</div>` : ''}
            </div>
        </div>
    `;

    const disclaimerHtml = `
        <div style="margin-top:24px;padding:12px;background:#f8fafc;border-radius:6px;font-size:.72rem;color:#94a3b8;line-height:1.6;">
            <strong>Avertissement :</strong> Ce rapport est fourni à titre informatif et ne constitue pas un conseil financier ou juridique. Les projections présentées sont des estimations basées sur des hypothèses de marché et sont sujettes à des variations. Nous vous recommandons de consulter un professionnel qualifié avant toute décision d'investissement. Données DVF issues de data.gouv.fr (DGFiP).
        </div>
    `;

    let bodyHtml = '';

    switch (type) {
        case 'valuation':
            bodyHtml = buildValuationReport(data);
            break;
        case 'investment':
            bodyHtml = buildInvestmentReport(data);
            break;
        case 'notary':
            bodyHtml = buildNotaryReport(data);
            break;
        case 'market':
            bodyHtml = buildMarketReport();
            break;
    }

    return headerHtml + bodyHtml + disclaimerHtml;
}

function buildValuationReport(data) {
    const sim = data?.value;
    if (!sim?.results) {
        return buildDemoSection('Estimation de Valeur', [
            { label: 'Bien', value: 'Appartement T3 — 75 m²' },
            { label: 'Ville', value: 'Lyon (Auvergne-Rhône-Alpes)' },
            { label: 'Valeur actuelle', value: '290 000 €' },
            { label: 'Valeur estimée à 10 ans', value: '378 500 €' },
            { label: 'Évolution totale', value: '+30,5%' },
            { label: 'Évolution annualisée', value: '+2,7%/an' },
            { label: 'Prix moyen du secteur', value: '5 200 €/m²' }
        ], 'Analyse basée sur les tendances historiques du marché et les données DVF du secteur.');
    }

    const r = sim.results;
    return `
        <div style="margin-bottom:20px;">
            <h3 style="font-size:.9rem;font-weight:700;color:#334155;border-left:3px solid #4361ee;padding-left:10px;margin-bottom:12px;">1. Caractéristiques du bien</h3>
            ${buildTable([
                ['Type', sim.inputs?.propertyType || '—'],
                ['Surface', (sim.inputs?.area || '—') + ' m²'],
                ['Ville', sim.inputs?.city || '—'],
                ['Valeur actuelle', formatCurrency(r.initialValue)]
            ])}
        </div>
        <div style="margin-bottom:20px;">
            <h3 style="font-size:.9rem;font-weight:700;color:#334155;border-left:3px solid #4361ee;padding-left:10px;margin-bottom:12px;">2. Résultats de la simulation</h3>
            ${buildTable([
                ['Valeur estimée finale', formatCurrency(r.finalValue), '#4361ee'],
                ['Évolution totale', formatPercentage(r.totalGrowth)],
                ['Évolution annualisée', formatPercentage(r.annualizedGrowth * 100) + '/an'],
                ['Période de projection', (sim.inputs?.projectionYears || '—') + ' ans']
            ])}
        </div>
    `;
}

function buildInvestmentReport(data) {
    const sim = data?.investment;
    if (!sim?.results) {
        return buildDemoSection('Investissement Locatif', [
            { label: 'Prix d\'achat', value: '200 000 €' },
            { label: 'Investissement total', value: '215 000 €' },
            { label: 'Loyer mensuel', value: '850 €' },
            { label: 'Rentabilité brute', value: '5,10%' },
            { label: 'Rentabilité nette', value: '3,80%' },
            { label: 'Cash-flow mensuel', value: '-120 € (avec crédit)' },
            { label: 'TRI sur 20 ans', value: '6,5%' }
        ], 'Calculs réalisés avec le régime LMNP au réel. TMI 30%.');
    }
    const r = sim.results;
    return `
        <div style="margin-bottom:20px;">
            <h3 style="font-size:.9rem;font-weight:700;color:#334155;border-left:3px solid #4361ee;padding-left:10px;margin-bottom:12px;">1. Récapitulatif de l'investissement</h3>
            ${buildTable([
                ['Investissement total', formatCurrency(r.totalInvestment)],
                ['Rentabilité brute', formatPercentage(r.grossYield), '#4361ee'],
                ['Rentabilité nette', formatPercentage(r.netYield), '#4361ee'],
                ['Cash-flow mensuel', formatCurrency(r.monthlyCashflow), r.monthlyCashflow >= 0 ? '#16a34a' : '#dc2626'],
                ['Mensualité crédit', formatCurrency(r.monthlyPayment)],
                ['Fiscalité annuelle', formatCurrency(r.annualTax)]
            ])}
        </div>
    `;
}

function buildNotaryReport(data) {
    return buildDemoSection('Calcul des Frais de Notaire', [
        { label: 'Prix de vente', value: '350 000 €' },
        { label: 'Type de bien', value: 'Ancien' },
        { label: 'Droits de mutation (DMTO)', value: '20 300 €' },
        { label: 'Émoluments TTC', value: '3 150 €' },
        { label: 'Frais et débours', value: '400 €' },
        { label: 'Contribution de sécurité immobilière (CSI)', value: '350 €' },
        { label: 'TOTAL frais d\'acte estimés', value: '24 200 €' },
        { label: '% du prix de vente', value: '6,91%' }
    ], 'Estimations calculées selon le barème en vigueur (décret 2020-179). Montants définitifs à confirmer par le notaire.');
}

function buildMarketReport() {
    return buildDemoSection('Indicateurs de Marché', [
        { label: 'Ville analysée', value: 'Lyon — Auvergne-Rhône-Alpes' },
        { label: 'Prix moyen au m²', value: '5 200 €' },
        { label: 'Évolution annuelle', value: '+3,2%' },
        { label: 'Loyer moyen au m²', value: '15,5 €' },
        { label: 'Rendement brut moyen', value: '3,6%' },
        { label: 'Tension locative', value: 'Élevée (zone A)' },
        { label: 'Nb transactions DVF (12 mois)', value: '2 341' }
    ], 'Données issues de data.gouv.fr (DVF) et de l\'INSEE.');
}

function buildDemoSection(title, rows, note) {
    return `
        <div style="margin-bottom:20px;">
            <h3 style="font-size:.9rem;font-weight:700;color:#334155;border-left:3px solid #4361ee;padding-left:10px;margin-bottom:12px;">${title}</h3>
            ${buildTable(rows.map(r => [r.label, r.value]))}
            ${note ? `<p style="font-size:.72rem;color:#94a3b8;margin-top:8px;font-style:italic;">${note}</p>` : ''}
            <div style="padding:8px 12px;background:#fef3c7;border-radius:6px;margin-top:8px;font-size:.72rem;color:#92400e;">
                💡 Lancez d'abord une simulation pour obtenir des données réelles dans ce rapport.
            </div>
        </div>
    `;
}

function buildTable(rows) {
    return `
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
            ${rows.map(([label, value, color]) => `
                <tr>
                    <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;width:55%;">${label}</td>
                    <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:${color || '#0f172a'};text-align:right;">${value}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function downloadCurrentPDF() {
    if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
        alert('La bibliothèque PDF est en cours de chargement. Veuillez réessayer dans quelques instants.');
        return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const branding = {
        agencyName: document.getElementById('reportAgencyName')?.value || 'ImmoSim Pro',
        advisorName: document.getElementById('reportAdvisorName')?.value || '',
        phone: document.getElementById('reportPhone')?.value || '',
        email: document.getElementById('reportEmail')?.value || '',
        address: document.getElementById('reportAddress')?.value || ''
    };

    const typeNames = {
        valuation: 'Rapport d\'Estimation de Valeur',
        investment: 'Rapport d\'Analyse d\'Investissement',
        notary: 'Fiche de Simulation Notariale',
        market: 'Analyse de Marché Immobilier'
    };

    const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = margin;

    // Header bar
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, pageWidth, 18, 'F');

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ImmoSim Pro', margin, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(branding.agencyName, pageWidth - margin, 12, { align: 'right' });

    y = 26;

    // Title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(typeNames[currentReportType] || 'Rapport Immobilier', margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Préparé le ${now}`, margin, y);

    if (branding.advisorName) {
        doc.text(`Par ${branding.advisorName}`, pageWidth - margin, y, { align: 'right' });
    }
    y += 4;

    // Separator line
    doc.setDrawColor(67, 97, 238);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Content table based on report type
    const tableData = getReportTableData(currentReportType);

    if (tableData.sections) {
        tableData.sections.forEach(section => {
            // Section title
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, y - 3, pageWidth - margin * 2, 7, 'F');
            doc.setTextColor(51, 65, 85);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(section.title, margin + 2, y + 2);
            y += 10;

            // Auto table for section rows
            if (typeof doc.autoTable === 'function') {
                doc.autoTable({
                    startY: y,
                    head: [],
                    body: section.rows,
                    margin: { left: margin, right: margin },
                    styles: { fontSize: 9, cellPadding: 3 },
                    columnStyles: {
                        0: { textColor: [100, 116, 139], cellWidth: 80 },
                        1: { textColor: [15, 23, 42], fontStyle: 'bold', halign: 'right' }
                    },
                    theme: 'plain',
                    didParseCell: (data) => {
                        if (data.column.index === 1 && section.highlights?.includes(data.row.index)) {
                            data.cell.styles.textColor = [67, 97, 238];
                        }
                    }
                });
                y = doc.lastAutoTable.finalY + 8;
            } else {
                // Fallback without autotable
                section.rows.forEach(row => {
                    doc.setTextColor(100, 116, 139);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8.5);
                    doc.text(row[0], margin + 2, y);
                    doc.setTextColor(15, 23, 42);
                    doc.setFont('helvetica', 'bold');
                    doc.text(row[1] || '', pageWidth - margin - 2, y, { align: 'right' });
                    y += 6;
                });
                y += 4;
            }

            if (y > 260) {
                doc.addPage();
                y = margin;
            }
        });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY - 4, pageWidth, 16, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport généré par ImmoSim Pro • Données indicatives • À valider avec un professionnel', margin, footerY + 4);
    doc.text(`Page 1/${doc.getNumberOfPages()}`, pageWidth - margin, footerY + 4, { align: 'right' });

    // Disclaimer page
    doc.addPage();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Avertissement légal', margin, margin + 10);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const disclaimer = `Ce rapport est fourni à titre informatif uniquement et ne constitue pas un conseil financier, juridique ou fiscal. Les projections et estimations présentées sont basées sur des hypothèses de marché et des données historiques, et sont sujettes à des variations significatives. ImmoSim Pro ne peut être tenu responsable des décisions prises sur la base de ce document.\n\nLes données DVF utilisées proviennent de la Direction Générale des Finances Publiques (DGFiP) et sont publiées en open data sur data.gouv.fr sous licence Ouverte v2.0.\n\nNous vous recommandons vivement de consulter un professionnel qualifié (notaire, avocat fiscaliste, expert-comptable, conseiller en gestion de patrimoine) avant toute décision d'investissement.\n\nDocument généré le ${now} par ImmoSim Pro.`;
    const lines = doc.splitTextToSize(disclaimer, pageWidth - margin * 2);
    doc.text(lines, margin, margin + 22);

    // Save
    const filename = `rapport_immosim_${currentReportType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

function getReportTableData(type) {
    const sections = [];

    switch (type) {
        case 'valuation':
            sections.push({
                title: 'Caractéristiques du bien',
                rows: [
                    ['Type de bien', 'Appartement T3'],
                    ['Surface habitable', '75 m²'],
                    ['Localisation', 'Lyon, Auvergne-Rhône-Alpes'],
                    ['Année de construction', 'Ancien (avant 2000)']
                ]
            }, {
                title: 'Résultats de l\'estimation',
                rows: [
                    ['Valeur actuelle', '290 000 €'],
                    ['Valeur estimée à 10 ans', '378 500 €'],
                    ['Évolution totale', '+30,5%'],
                    ['Taux annualisé', '+2,7%/an'],
                    ['Prix moyen du secteur', '5 200 €/m²']
                ],
                highlights: [0, 1]
            });
            break;
        case 'investment':
            sections.push({
                title: 'Récapitulatif de l\'investissement',
                rows: [
                    ['Prix d\'acquisition', '200 000 €'],
                    ['Frais de notaire', '15 000 €'],
                    ['Budget travaux', '0 €'],
                    ['Investissement total', '215 000 €']
                ]
            }, {
                title: 'Rentabilité',
                rows: [
                    ['Loyer mensuel', '850 €'],
                    ['Rentabilité brute', '5,10%'],
                    ['Rentabilité nette', '3,80%'],
                    ['Cash-flow mensuel', '-120 € (avec crédit 20 ans)'],
                    ['TRI sur 20 ans', '6,5%']
                ],
                highlights: [1, 2]
            });
            break;
        case 'notary':
            sections.push({
                title: 'Frais de notaire estimés',
                rows: [
                    ['Prix de vente', '350 000 €'],
                    ['Droits de mutation (DMTO)', '20 300 €'],
                    ['Émoluments notariaux TTC', '3 150 €'],
                    ['Frais et débours', '400 €'],
                    ['Contribution de sécurité immobilière', '350 €'],
                    ['TOTAL frais d\'acte', '24 200 €'],
                    ['Pourcentage du prix', '6,91%']
                ],
                highlights: [5, 6]
            });
            break;
        case 'market':
            sections.push({
                title: 'Indicateurs de marché — Lyon',
                rows: [
                    ['Prix moyen au m² (appartements)', '5 200 €/m²'],
                    ['Évolution sur 12 mois', '+3,2%'],
                    ['Loyer moyen au m²', '15,5 €/m²'],
                    ['Rendement brut moyen', '3,6%'],
                    ['Tension locative', 'Élevée (zone A)'],
                    ['Transactions DVF (12 mois)', '2 341'],
                    ['Source', 'data.gouv.fr (DGFiP)']
                ]
            });
            break;
    }

    return { sections };
}
