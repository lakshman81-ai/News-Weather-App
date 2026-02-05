/**
 * Weather Utility Functions
 */

/**
 * Determine the display status for rainfall based on probability and amount.
 * @param {number} prob - Rain probability percentage (0-100)
 * @param {string|number} mmStr - Rain amount string (e.g. "2.5mm") or number
 * @returns {Object} { icon, label, className, intensity }
 */
export function getRainStatus(prob, mmStr) {
    let mm = 0;
    if (typeof mmStr === 'string') {
        mm = parseFloat(mmStr.replace('mm', '')) || 0;
    } else {
        mm = mmStr || 0;
    }

    const p = prob || 0;

    // Default state
    if (p < 10 && mm < 0.1) {
        return null; // No rain worth showing
    }

    // Intensity calculation
    let intensity = 'light';
    let icon = '🌧️';
    let className = 'rain-light';

    if (mm >= 10 || (p > 80 && mm > 5)) {
        intensity = 'heavy';
        icon = '⛈️';
        className = 'rain-heavy';
    } else if (mm >= 2 || p > 60) {
        intensity = 'moderate';
        icon = '🌧️';
        className = 'rain-moderate';
    } else {
        // Light rain / Drizzle
        icon = '🌦️';
        className = 'rain-light';
    }

    // Label formatting
    let label = '';
    if (p > 0) label += `${p}%`;
    if (mm > 0) {
        if (label) label += ' • ';
        label += `${mm.toFixed(1)}mm`;
    } else if (p > 0) {
        label += ' chance';
    }

    return { icon, label, className, intensity, mm, prob: p };
}

/**
 * Get CSS color style for rain intensity
 * @param {string} intensity - 'light', 'moderate', 'heavy'
 * @returns {Object} Style object
 */
export function getRainStyle(intensity) {
    switch (intensity) {
        case 'heavy':
            return { color: '#ef4444', fontWeight: 'bold' }; // Red/Danger
        case 'moderate':
            return { color: '#3b82f6', fontWeight: '600' }; // Blue
        case 'light':
        default:
            return { color: '#94a3b8' }; // Muted/Grey
    }
}
