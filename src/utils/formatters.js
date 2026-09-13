/**
 * Formatters for Brazilian Standard (pt-BR)
 * Ensures all dates, times, and currencies follow Brazilian standards consistently.
 */

/**
 * Formats any date string (YYYY-MM-DD, ISO string, or Date) to Brazilian standard 'DD/MM/YYYY'.
 * Safely avoids UTC/timezone day shifting for YYYY-MM-DD format.
 */
export function formatDateBR(dateInput, fallback = '—') {
  if (!dateInput) return fallback;
  try {
    const str = String(dateInput).trim();
    if (!str) return fallback;

    // Check if already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      return str;
    }

    // Direct match for YYYY-MM-DD to avoid timezone off-by-one errors
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split('-');
      return `${day}/${month}/${year}`;
    }

    // General ISO / timestamp date parsing
    const dateObj = new Date(str);
    if (isNaN(dateObj.getTime())) {
      return str;
    }

    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return fallback;
  }
}

/**
 * Formats a timestamp / ISO date to 'DD/MM/YYYY HH:mm'
 */
export function formatDateTimeBR(dateInput, fallback = '—') {
  if (!dateInput) return fallback;
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return String(dateInput);

    const date = dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${date} às ${time}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats numbers into Brazilian currency format (R$ 1.234,56 or R$ 1.234)
 */
export function formatCurrencyBR(val, hideDecimalsIfZero = false) {
  const num = Number(val) || 0;
  if (hideDecimalsIfZero && num % 1 === 0) {
    return `R$ ${num.toLocaleString('pt-BR')}`;
  }
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}
