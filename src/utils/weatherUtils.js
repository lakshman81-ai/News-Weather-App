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

    // Default state - lowered thresholds slightly to ensure "Traces" are visible
    // if requested. The user said "Rainfall icon not appearing".
    // If there is ANY indication of rain, we should probably show it, especially
    // if the model provided a non-zero probability.
    if (p <= 0 && mm <= 0) {
        return null;
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
        // Light rain / Drizzle / Low Probability
        // If probability is very low but non-zero, use cloud with rain
        if (p < 30 && mm < 1) {
             icon = '🌦️'; // Sun behind rain cloud implies intermittent/light
        } else {
             icon = '🌧️';
        }
        className = 'rain-light';
    }

    // Label formatting
    let label = '';

    // Always show probability if > 0
    if (p > 0) label += `${p}%`;

    // Show MM if significant or if it's the only metric
    if (mm > 0) {
        if (label) label += ' • ';
        // If < 0.1 but > 0, show "Trace"
        if (mm < 0.1) {
            label += 'Trace';
        } else {
            label += `${mm.toFixed(1)}mm`;
        }
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
            // Ensure visible contrast against dark backgrounds
            // #94a3b8 is slate-400, decent. Let's try slate-300 for better visibility?
            // actually stick to standard text-muted-ish but slightly brighter for importance
            return { color: '#cbd5e1' }; // Slate-300
    }
}
