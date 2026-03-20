import React, { useState, useCallback } from 'react';

/**
 * NumericInput
 * - Free typing — no up/down arrows
 * - Formats to 1,234,567.89 when user leaves the field (on blur)
 * - Shows raw number while typing (on focus) for easy editing
 * - className prop allows full style control
 */
function formatNum(raw) {
    const n = parseFloat(String(raw).replace(/,/g, ''));
    if (isNaN(n)) return '';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stripFormat(val) {
    return String(val).replace(/,/g, '');
}

export default function NumericInput({ value, onChange, placeholder = '0.00', className = '', ...rest }) {
    const [focused, setFocused] = useState(false);

    // While typing: show raw value
    // When blurred: show formatted value
    const display = focused
        ? stripFormat(value)      // raw while typing — e.g. "500"
        : formatNum(value);       // formatted when resting — e.g. "500.00"

    const handleFocus = useCallback((e) => {
        setFocused(true);
        // Select all text on focus for easy overwrite
        setTimeout(() => e.target.select(), 0);
    }, []);

    const handleBlur = useCallback(() => {
        setFocused(false);
    }, []);

    const handleChange = useCallback((e) => {
        // Only allow: digits, dot, minus
        const raw = e.target.value.replace(/[^0-9.\-]/g, '');
        onChange(raw);
    }, [onChange]);

    return (
        <input
            type="text"
            inputMode="decimal"
            value={display}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
            {...rest}
        />
    );
}
