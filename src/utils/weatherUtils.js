/**
 * Weather Utility Functions
 */

/**
 * Rainfall display logic with 2D intensity matrix.
 * Returns null when mm < 1 AND prob < 50% (no card shown).
 * Returns { showCard: false, summaryHint: "..." } when mm < 1 but prob >= 50%.
 * Returns full card data when mm >= 1.
 *
 * @param {number} prob - Rain probability percentage (0-100)
 * @param {string|number} mmStr - Rain amount string (e.g. "2.5mm") or number
 * @returns {Object|null}
 */
export function getRainStatus(prob, mmStr) {
    let mm = 0;
    if (typeof mmStr === 'string') {
        mm = parseFloat(mmStr.replace('mm', '')) || 0;
    } else {
        mm = mmStr || 0;
    }
    const p = prob || 0;

    // Gate 1: Nothing to show
    if (p <= 0 && mm <= 0) return null;

    // Gate 2: Below 1mm — no rainfall card
    if (mm < 1) {
        // But if probability is notable, return a summary-only hint
        if (p >= 50) {
            return {
                showCard: false,
                summaryHint: `Light showers possible (${p}%)`,
                icon: '🌦️',
                intensity: 'hint',
                mm,
                prob: p
            };
        }
        return null; // Below threshold, no display at all
    }

    // Gate 3: mm >= 1 — show full rainfall card
    // 2D Matrix: precipitation amount × probability
    let intensity, icon;

    if (mm >= 10 || (p >= 80 && mm >= 5)) {
        // HEAVY: high precipitation or very high confidence + moderate amount
        intensity = 'heavy';
        icon = '⛈️';
    } else if (mm >= 2 && p >= 40) {
        // MODERATE-HIGH: decent rain, decent probability
        intensity = 'moderate-high';
        icon = '🌧️';
    } else if (mm >= 2 && p < 40) {
        // MODERATE-LOW: decent rain but low confidence
        intensity = 'moderate';
        icon = '🌧️';
    } else if (mm >= 1 && p >= 40) {
        // LIGHT-LIKELY: light rain but likely
        intensity = 'light';
        icon = '🌦️';
    } else {
        // TRACE: 1-2mm with low probability
        intensity = 'trace';
        icon = '🌤️';
    }

    // Label format: xmm(y%)
    let label = `${mm.toFixed(1)}mm`;
    if (p > 0) label += `(${p}%)`;

    return {
        showCard: true,
        icon,
        label,
        intensity,
        mm,
        prob: p
    };
}

/**
 * Get CSS color style for rain intensity
 * @param {string} intensity - 'light', 'moderate', 'heavy', 'trace', 'moderate-high', 'hint'
 * @returns {Object} Style object
 */
export function getRainStyle(intensity) {
    switch (intensity) {
        case 'heavy':
            return { color: '#ef4444', fontWeight: 'bold' };
        case 'moderate-high':
            return { color: '#3b82f6', fontWeight: '600' };
        case 'moderate':
            return { color: '#60a5fa', fontWeight: '500' };
        case 'light':
            return { color: '#64748b', fontWeight: '500' };
        case 'trace':
            return { color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9em' };
        case 'hint':
            return { color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85em' };
        default:
            return { color: '#e2e8f0', opacity: 0.9 };
    }
}
