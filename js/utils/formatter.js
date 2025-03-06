/**
 * Utilitaires de formatage pour le Simulateur Immobilier
 * 
 * Ce module fournit des fonctions pour formater différents types de valeurs
 * (monnaie, pourcentages, dates, etc.) de manière cohérente dans toute l'application.
 */

/**
 * Formate un montant en euros
 * @param {Number} amount Montant à formater
 * @param {Boolean} includeSymbol Inclure le symbole € (défaut: true)
 * @param {Number} decimals Nombre de décimales (défaut: 0)
 * @returns {String} Montant formaté
 */
export function formatCurrency(amount, includeSymbol = true, decimals = 0) {
    if (amount === null || amount === undefined) return '-';
    
    const formatter = new Intl.NumberFormat('fr-FR', {
        style: includeSymbol ? 'currency' : 'decimal',
        currency: 'EUR',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    
    return formatter.format(amount);
}

/**
 * Formate un pourcentage
 * @param {Number} value Valeur à formater (ex: 12.34)
 * @param {Number} decimals Nombre de décimales (défaut: 1)
 * @param {Boolean} includeSymbol Inclure le symbole % (défaut: true)
 * @returns {String} Pourcentage formaté (ex: "12,3 %")
 */
export function formatPercentage(value, decimals = 1, includeSymbol = true) {
    if (value === null || value === undefined) return '-';
    
    const formatter = new Intl.NumberFormat('fr-FR', {
        style: includeSymbol ? 'percent' : 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    
    // Intl.NumberFormat avec style percent multiplie par 100 automatiquement
    // Si on utilise le style decimal, il faut gérer le symbole % manuellement
    if (includeSymbol && formatter.resolvedOptions().style !== 'percent') {
        return formatter.format(value / 100) + ' %';
    }
    
    return formatter.format(includeSymbol ? value / 100 : value);
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param {Number} value Valeur à formater
 * @param {Number} decimals Nombre de décimales (défaut: 0)
 * @returns {String} Nombre formaté
 */
export function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined) return '-';
    
    const formatter = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
    
    return formatter.format(value);
}

/**
 * Formate une surface en m²
 * @param {Number} area Surface à formater
 * @returns {String} Surface formatée (ex: "75 m²")
 */
export function formatArea(area) {
    if (area === null || area === undefined) return '-';
    
    return formatNumber(area, 0) + ' m²';
}

/**
 * Formate une date selon le format français
 * @param {Date|String} date Date à formater
 * @param {Boolean} includeTime Inclure l'heure (défaut: false)
 * @returns {String} Date formatée (ex: "01/01/2023")
 */
export function formatDate(date, includeTime = false) {
    if (!date) return '-';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('fr-FR', options);
}

/**
 * Formate un nombre d'années (singulier/pluriel)
 * @param {Number} years Nombre d'années
 * @returns {String} Texte formaté (ex: "1 an" ou "2 ans")
 */
export function formatYears(years) {
    if (years === null || years === undefined) return '-';
    
    return years === 1 ? '1 an' : `${years} ans`;
}

/**
 * Formate un taux d'intérêt
 * @param {Number} rate Taux d'intérêt (ex: 3.5 pour 3,5%)
 * @returns {String} Taux formaté (ex: "3,50 %")
 */
export function formatInterestRate(rate) {
    if (rate === null || rate === undefined) return '-';
    
    return formatPercentage(rate, 2);
}

/**
 * Abrège un grand nombre (K pour milliers, M pour millions)
 * @param {Number} value Nombre à abréger
 * @returns {String} Nombre abrégé (ex: "1,2 M€")
 */
export function abbreviateNumber(value) {
    if (value === null || value === undefined) return '-';
    
    if (value >= 1000000) {
        return formatNumber(value / 1000000, 1) + ' M€';
    } else if (value >= 1000) {
        return formatNumber(value / 1000, 0) + ' K€';
    } else {
        return formatNumber(value, 0) + ' €';
    }
}