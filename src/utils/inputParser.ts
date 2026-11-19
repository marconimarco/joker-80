/**
 * Utility centralizzata di parsing sicuro degli input telemetrici, CSV, simulazioni e UI.
 * Unica fonte condivisa tra Catalogo, CSV Importer, All-Python Modal, Engine e Scanner
 * per prevenire corruzione di codici SSCC a 17-18 cifre, stringhe booleane ("false") o valori 0 persi.
 */

const PRESERVED_IDENTIFIER_KEYS = new Set([
  'sscc_code',
  'sscc',
  'id_lotto_materiale',
  'id_lotto',
  'lotto',
  'codice_fornitore',
  'fornitore',
  'id_spedizione',
  'id_contratto_vettore',
  'destinazione',
  'destinazione_hub',
  'vettore_logistico',
  'grado_qualita_stampa_iso',
  'qualita_stampa_iso',
  'etichetta_gs1',
  'id_pallet',
  'classe_rotazione',
  'coordinate_partenza',
  'macchina_o_nodo',
  'timestamp',
  'timestamp_ms',
  'stato_operativo',
  'evento_o_allarme',
  'ricetta_attiva',
  'operatore',
  'note'
]);

const BOOLEAN_KEYS = new Set([
  'sagoma_fuori_asse',
  'carico_pattini_integri',
  'conflitto_rilevato'
]);

export function finiteOr(value: any, fallback: number): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function parseBooleanInput(value: any, fallback: boolean = false): boolean {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off' || normalized === 'f') {
    return false;
  }
  if (normalized === 'true' || normalized === '1' || normalized === 'si' || normalized === 'sì' || normalized === 'on' || normalized === 't') {
    return true;
  }
  return fallback;
}

export function parseFlexibleInput(val: any, key?: string): any {
  if (val === undefined || val === null) return val;
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (Array.isArray(val) || (typeof val === 'object' && val !== null)) return val;
  if (typeof val !== 'string') return val;

  const trimmed = val.trim();
  const normalizedKey = key ? key.toLowerCase().trim() : '';

  if (trimmed === '') {
    if (normalizedKey && PRESERVED_IDENTIFIER_KEYS.has(normalizedKey)) {
      return '';
    }
    return undefined;
  }

  // Campi booleani espliciti: interpreta "false", "true", "0", "1", "no", "sì" in modo rigoroso
  if (normalizedKey && BOOLEAN_KEYS.has(normalizedKey)) {
    return parseBooleanInput(trimmed, false);
  }
  const lower = trimmed.toLowerCase();
  if (lower === 'true' || lower === 'false') {
    return lower === 'true';
  }

  // Preserva sempre SSCC, seriali, lotti, gradi ISO e numeri con zero iniziale o >= 10 cifre come stringa
  if (
    (normalizedKey && PRESERVED_IDENTIFIER_KEYS.has(normalizedKey)) ||
    (trimmed.length >= 10 && /^\d+$/.test(trimmed)) ||
    (trimmed.length > 1 && trimmed.startsWith('0') && /^\d+$/.test(trimmed))
  ) {
    return trimmed;
  }

  // Array o oggetti JSON (es. "[12.4, 14.1, 20.0]" o maschere)
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      const cleaned = trimmed.replace(/^\[|\]$/g, '');
      const parts = cleaned
        .split(/[,;\s]+/)
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      const nums = parts.map(Number);
      if (nums.length > 0 && nums.every(n => Number.isFinite(n))) return nums;
      if (parts.length > 0) return parts;
    }
  }

  // Liste separate da virgola
  if (trimmed.includes(',')) {
    const parts = trimmed
      .split(',')
      .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
    const nums = parts.map(Number);
    if (nums.length > 0 && nums.every(n => Number.isFinite(n))) return nums;
    return parts;
  }

  // Numero puro entro precisione sicura IEEE-754
  const parsedNum = Number(trimmed);
  if (Number.isFinite(parsedNum) && !Number.isNaN(parseFloat(trimmed))) {
    return parsedNum;
  }

  return val;
}
