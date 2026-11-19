/**
 * Parser CSV centralizzato e analizzatore semantico delle colonne per JOKER 80 / SM.I.LE80:
 * - Tipologia 1: Log Eventi e Stati (MES/SCADA multi-nodo)
 * - Tipologia 2: Log Telematico Alta Velocità (PLC/Inverter/Accelerometri)
 * - Formato Verticale: Tabella Parametro / Valore (OPC-UA / Export diretto)
 */
import { parseFlexibleInput } from './inputParser';

export interface PlantMachineRef {
  id: string;
  nome: string;
  categoria: string;
}

export interface CsvTargetParameterOption {
  key: string;
  label: string;
  unit: string;
  calcs: string;
}

export const CANONICAL_CSV_TARGETS: CsvTargetParameterOption[] = [
  { key: 'camion_attesa', label: 'Camion in attesa piazzale', unit: 'unità', calcs: 'Calcoli #1, #13' },
  { key: 'minuti_ritardo', label: 'Ritardo arrivo camion / baie', unit: 'min', calcs: 'Calcoli #1, #2' },
  { key: 'ritardo_stimato_minuti', label: 'Ritardo stimato banchina', unit: 'min', calcs: 'Calcolo #2' },
  { key: 'baie_libere', label: 'Baie di carico libere', unit: 'baie', calcs: 'Calcolo #2' },
  { key: 'baie_totali', label: 'Baie totali da coprire', unit: 'baie', calcs: 'Calcolo #3' },
  { key: 'ore_lavoro_disponibili', label: 'Ore lavoro turno disponibili', unit: 'ore', calcs: 'Calcolo #3' },
  { key: 'saturazione_wms', label: 'Saturazione magazzino WMS', unit: '%', calcs: 'Calcoli #1, #6' },
  { key: 'umidita_rilevata', label: 'Umidità materiali / cartone', unit: '%', calcs: 'Calcolo #4' },
  { key: 'spessore_interfalda_mm', label: 'Spessore interfalda', unit: 'mm', calcs: 'Calcolo #4' },
  { key: 'sscc_code', label: 'Codice SSCC pallet (GS1)', unit: 'testo', calcs: 'Calcoli #5, #21' },
  { key: 'qualita_stampa_iso', label: 'Grado qualità stampa ISO', unit: 'CLASSE', calcs: 'Calcoli #5, #21' },
  { key: 'celle_libere_3d', label: 'Celle 3D libere SmartStore', unit: 'celle', calcs: 'Calcolo #6' },
  { key: 'peso_bilancia_kg', label: 'Peso bilancia pallet', unit: 'kg', calcs: 'Calcoli #6, #10' },
  { key: 'sagoma_fuori_asse', label: 'Sagoma pallet fuori asse', unit: 'sì/no', calcs: 'Calcolo #6' },
  { key: 'pressione_pattini_bar', label: 'Pressione pattini scaffalatura', unit: 'bar', calcs: 'Calcolo #7' },
  { key: 'micro_inclinazione', label: 'Micro-inclinazione montanti', unit: '°', calcs: 'Calcolo #7' },
  { key: 'carico_pattini_integri', label: 'Integrità pattini di carico', unit: 'sì/no', calcs: 'Calcolo #7' },
  { key: 'saturazione_buffer', label: 'Saturazione buffer piazzale (0-1)', unit: 'indice', calcs: 'Calcolo #13' },
  { key: 'rpm_tavola_bema', label: 'Velocità tavola Bema', unit: 'RPM', calcs: 'Calcolo #14' },
  { key: 'vibrazione_cuscinetti_g', label: 'Vibrazione / Accelerazione cuscinetti Bema', unit: 'g', calcs: 'Calcolo #14' },
  { key: 'tensione_newton', label: 'Tensione film fasciatore Bema', unit: 'N', calcs: 'Calcolo #15' },
  { key: 'pre_stiro_pct', label: 'Pre-stiro applicato', unit: '%', calcs: 'Calcoli #14, #15' },
  { key: 'velocita_svolgimento', label: 'Velocità svolgimento film', unit: 'm/s', calcs: 'Calcolo #15' },
  { key: 'navette_attive', label: 'Navette LGV/AGV in missione', unit: 'unità', calcs: 'Calcolo #16' },
  { key: 'nodi_critici', label: 'Nodi critici congestione LGV', unit: 'nodi', calcs: 'Calcolo #16' },
  { key: 'soc_medio_flotta_pct', label: 'Carica media batterie flotta (SoC)', unit: '%', calcs: 'Calcolo #17' },
  { key: 'temperatura_batterie_c', label: 'Temperatura batterie LGV/AGV', unit: '°C', calcs: 'Calcolo #17' },
  { key: 'pressione_vuoto_bar', label: 'Pressione vuoto ventose robot', unit: 'bar', calcs: 'Calcolo #18' },
  { key: 'coppia_motori_nm', label: 'Coppia motori giunti robot', unit: 'Nm', calcs: 'Calcolo #18' },
  { key: 'potenza_erogata_totale_kw', label: 'Potenza erogata ricarica microgrid', unit: 'kW', calcs: 'Calcolo #19' },
  { key: 'throughput_pallet_ora', label: 'Throughput pallet ispezionati', unit: 'plt/h', calcs: 'Calcolo #20' },
  { key: 'umidita_legno_pct', label: 'Umidità legno pallet (Woodpecker)', unit: '%', calcs: 'Calcolo #20' },
  { key: 'forza_deformazione_pattini_n', label: 'Forza deformazione pattini legno', unit: 'N', calcs: 'Calcolo #20' },
  { key: 'contrasto_ottico_pct', label: 'Contrasto ottico etichetta', unit: '%', calcs: 'Calcolo #21' },
  { key: 'temp_testina_termica_c', label: 'Temperatura testina termica Raptor', unit: '°C', calcs: 'Calcolo #21' }
];

export type ColumnMatchConfidence = 'exact' | 'inferred' | 'manual' | 'metadata' | 'unmapped';

export interface CsvColumnAnalysis {
  sourceColumn: string;
  sampleValue: string;
  mappedTarget: string; // '' se ignorata/non mappata, '__METADATA__' se campo descrittivo evento/timestamp
  confidence: ColumnMatchConfidence;
  note: string;
}

export interface ParsedPlantCsvResult {
  columns: string[];
  rows: Array<Record<string, string>>;
  extractedInputs: Record<string, any>;
  detectedNodes: { existing: string[]; unknown: string[] };
  isHighSpeed: boolean;
  detectedFormat: 'multi_node' | 'single_machine' | 'vertical_kv';
  columnAnalysis: CsvColumnAnalysis[];
}

const KNOWN_CANONICAL_SET = new Set<string>([
  ...CANONICAL_CSV_TARGETS.map(t => t.key),
  'giri_minuto_rpm',
  'accelerazione_g',
  'tensione_film_n',
  'vibrazione_g',
  'vibrazione_cuscinetti_bema_g',
  'spessore_micro',
  'grado_qualita_stampa_iso',
  'stato_carica_medio_soc',
  'batteria_soc',
  'temperatura_media_c',
  'pezzi_prodotti'
]);

const METADATA_COLUMN_HINTS = new Set<string>([
  'timestamp',
  'timestamp_ms',
  'data',
  'ora',
  'datetime',
  'macchina_o_nodo',
  'macchina',
  'nodo',
  'asset',
  'device',
  'linea',
  'stato_operativo',
  'evento_o_allarme',
  'evento',
  'allarme',
  'ricetta_attiva',
  'ricetta',
  'operatore',
  'note',
  'vibrazioni_rms_mms',
  'frequenza_hz',
  'corrente_inverter_a',
  'pressione_bar'
]);

/**
 * Divide una riga CSV rispettando eventuali virgolette (RFC-4180 semplificato).
 */
export function splitCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === separator && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function classifyMachineRole(nodeName: string): 'BEMA' | 'LGV' | 'BAIA' | 'WMS' | 'WOODPECKER' | 'ROBOT' | 'RAPTOR' | 'ALTRO' {
  const lower = nodeName.toLowerCase();
  if (lower.includes('bema') || lower.includes('silkworm') || lower.includes('fasciat')) return 'BEMA';
  if (lower.includes('agv') || lower.includes('lgv') || lower.includes('navett')) return 'LGV';
  if (lower.includes('baia') || lower.includes('banchina') || lower.includes('dock') || lower.includes('inbound') || lower.includes('outbound')) return 'BAIA';
  if (lower.includes('smartstore') || lower.includes('wms') || lower.includes('magazzin')) return 'WMS';
  if (lower.includes('woodpecker') || lower.includes('legno')) return 'WOODPECKER';
  if (lower.includes('raptor') || lower.includes('etichett')) return 'RAPTOR';
  if (lower.includes('robot') || lower.includes('pallettiz')) return 'ROBOT';
  return 'ALTRO';
}

function matchesExistingPlantMachine(nodeName: string, plantMachines: PlantMachineRef[]): boolean {
  const lowerNode = nodeName.toLowerCase().trim();
  if (!lowerNode) return false;

  const directMatch = plantMachines.some(
    m =>
      m.nome.toLowerCase().includes(lowerNode) ||
      m.id.toLowerCase().includes(lowerNode) ||
      lowerNode.includes(m.nome.toLowerCase()) ||
      lowerNode.includes(m.id.toLowerCase())
  );
  if (directMatch) return true;

  const role = classifyMachineRole(lowerNode);
  if (role === 'ALTRO') return false;

  return plantMachines.some(m => {
    const mName = `${m.nome} ${m.id} ${m.categoria}`.toLowerCase();
    if (role === 'BEMA') return mName.includes('bema') || mName.includes('silkworm') || mName.includes('fasciat');
    if (role === 'LGV') return mName.includes('agv') || mName.includes('lgv') || mName.includes('navett');
    if (role === 'BAIA') return mName.includes('baia') || mName.includes('inbound') || mName.includes('outbound');
    if (role === 'WMS') return mName.includes('smartstore') || mName.includes('wms');
    if (role === 'WOODPECKER') return mName.includes('woodpecker');
    if (role === 'RAPTOR') return mName.includes('raptor');
    if (role === 'ROBOT') return mName.includes('robot') || mName.includes('pallettiz');
    return false;
  });
}

/**
 * Riconosce semanticamente una colonna proveniente da PLC/MES/SCADA esterni (IT/EN/Sigle)
 * abbinandola al parametro canonico JOKER 80 più adatto.
 */
export function inferColumnMapping(
  colName: string,
  sampleValues: string[],
  nodeRoleHint: ReturnType<typeof classifyMachineRole> = 'ALTRO'
): { target: string; confidence: ColumnMatchConfidence; note: string } {
  const lc = colName.toLowerCase().trim().replace(/[\s-]+/g, '_');
  const numericSamples = sampleValues.map(s => Number(String(s).replace(',', '.'))).filter(n => Number.isFinite(n));
  const avgSample = numericSamples.length > 0 ? numericSamples.reduce((a, b) => a + b, 0) / numericSamples.length : NaN;

  // 1. Nomi canonici esatti / alias diretti supportati dal motore
  if (lc === 'giri_minuto_rpm' || lc === 'rpm_tavola_bema') {
    return { target: 'rpm_tavola_bema', confidence: 'exact', note: 'Velocità tavola Bema (Calcolo #14)' };
  }
  if (lc === 'accelerazione_g' || lc === 'vibrazione_cuscinetti_g' || lc === 'vibrazione_g' || lc === 'vibrazione_cuscinetti_bema_g') {
    return { target: 'vibrazione_cuscinetti_g', confidence: 'exact', note: 'Vibrazioni cuscinetti in g (Calcolo #14)' };
  }
  if (lc === 'tensione_film_n' || lc === 'tensione_newton') {
    return { target: 'tensione_newton', confidence: 'exact', note: 'Tensione film Bema in N (Calcolo #15)' };
  }
  if (KNOWN_CANONICAL_SET.has(lc) && lc !== 'temperatura_media_c' && lc !== 'pezzi_prodotti') {
    const def = CANONICAL_CSV_TARGETS.find(t => t.key === lc);
    return { target: lc, confidence: 'exact', note: def ? `${def.label} (${def.calcs})` : 'Parametro canonico JOKER 80' };
  }

  // 2. Metadati standard di contesto evento / serie temporale
  if (METADATA_COLUMN_HINTS.has(lc) || lc.includes('macchina') || lc.includes('nodo') || lc.includes('asset') || lc.includes('timestamp')) {
    if (lc === 'vibrazioni_rms_mms') {
      return { target: '__METADATA__', confidence: 'metadata', note: 'Velocità RMS (mm/s) informativa: per #14 si usa accelerazione in g' };
    }
    if (lc === 'pressione_bar' && Number.isFinite(avgSample) && avgSample < 0) {
      return { target: 'pressione_vuoto_bar', confidence: 'inferred', note: 'Pressione negativa riconosciuta come vuoto robot (#18)' };
    }
    if (lc === 'pressione_bar') {
      return { target: '__METADATA__', confidence: 'metadata', note: 'Pressione pneumatica di linea informativa (bar)' };
    }
    return { target: '__METADATA__', confidence: 'metadata', note: 'Colonna di contesto (orario / nodo / evento / note)' };
  }
  if (lc === 'temperatura_media_c' || lc === 'pezzi_prodotti') {
    return { target: '__METADATA__', confidence: 'metadata', note: 'Instradata automaticamente in base al macchinario della riga' };
  }

  // 3. Inferenza intelligente per CSV esterni di altri PLC / fornitori (inglese o sigle)
  if (lc.includes('rpm') || lc.includes('speed_rot') || lc.includes('rotazion') || lc.includes('giri')) {
    return { target: 'rpm_tavola_bema', confidence: 'inferred', note: 'Riconosciuto automaticamente come giri tavola (#14)' };
  }
  if ((lc.includes('vib') || lc.includes('acc')) && !lc.includes('mms') && !lc.includes('mm_s')) {
    return { target: 'vibrazione_cuscinetti_g', confidence: 'inferred', note: 'Riconosciuto automaticamente come vibrazione in g (#14)' };
  }
  if (lc.includes('tens') && (lc.includes('film') || lc.includes('wrap') || lc.includes('n'))) {
    return { target: 'tensione_newton', confidence: 'inferred', note: 'Riconosciuto automaticamente come tensione film (#15)' };
  }
  if (lc.includes('prestir') || lc.includes('pre_stretch') || lc.includes('prestretch')) {
    return { target: 'pre_stiro_pct', confidence: 'inferred', note: 'Riconosciuto automaticamente come pre-stiro % (#14, #15)' };
  }
  if ((lc.includes('film') || lc.includes('wrap')) && (lc.includes('thick') || lc.includes('spess') || lc.includes('mic'))) {
    return { target: 'spessore_film_micron', confidence: 'inferred', note: 'Riconosciuto automaticamente come spessore film in µm (#15)' };
  }
  if (lc.includes('soc') || lc.includes('battery_pct') || lc.includes('batteria') || lc.includes('charge')) {
    return { target: 'soc_medio_flotta_pct', confidence: 'inferred', note: 'Riconosciuto automaticamente come carica batteria AGV (#17)' };
  }
  if (lc.includes('temp') && (lc.includes('batt') || nodeRoleHint === 'LGV')) {
    return { target: 'temperatura_batterie_c', confidence: 'inferred', note: 'Riconosciuto come temperatura batterie LGV (#17)' };
  }
  if (lc.includes('temp') && (lc.includes('head') || lc.includes('testin') || nodeRoleHint === 'RAPTOR')) {
    return { target: 'temp_testina_termica_c', confidence: 'inferred', note: 'Riconosciuto come temperatura testina Raptor (#21)' };
  }
  if (lc.includes('sscc') || lc.includes('barcode') || lc.includes('etichetta_gs1')) {
    return { target: 'sscc_code', confidence: 'inferred', note: 'Riconosciuto come codice SSCC pallet (#5, #21)' };
  }
  if (lc.includes('iso') || lc.includes('print_grade') || lc.includes('qualita_stampa')) {
    return { target: 'qualita_stampa_iso', confidence: 'inferred', note: 'Riconosciuto come grado qualità stampa ISO (#5, #21)' };
  }
  if (lc.includes('delay') || lc.includes('ritard')) {
    return { target: 'ritardo_stimato_minuti', confidence: 'inferred', note: 'Riconosciuto come ritardo banchina in minuti (#1, #2)' };
  }
  if ((lc.includes('truck') || lc.includes('camion')) && (lc.includes('wait') || lc.includes('queue') || lc.includes('attes') || lc.includes('cod'))) {
    return { target: 'camion_attesa', confidence: 'inferred', note: 'Riconosciuto come camion in coda/attesa (#1, #13)' };
  }
  if (lc.includes('wms') && (lc.includes('sat') || lc.includes('fill') || lc.includes('occ'))) {
    return { target: 'saturazione_wms', confidence: 'inferred', note: 'Riconosciuto come saturazione magazzino WMS (#1, #6)' };
  }
  if (lc.includes('cell') && (lc.includes('free') || lc.includes('lib') || lc.includes('avail'))) {
    return { target: 'celle_libere_3d', confidence: 'inferred', note: 'Riconosciuto come celle 3D libere (#6)' };
  }
  if ((lc.includes('wood') || lc.includes('legn')) && (lc.includes('hum') || lc.includes('moist') || lc.includes('umid'))) {
    return { target: 'umidita_legno_pct', confidence: 'inferred', note: 'Riconosciuto come umidità legno pallet (#20)' };
  }
  if (lc.includes('hum') || lc.includes('moist') || lc.includes('umid')) {
    return { target: 'umidita_rilevata', confidence: 'inferred', note: 'Riconosciuto come umidità materiali (%) (#4)' };
  }
  if (lc.includes('vac') || lc.includes('vuot')) {
    return { target: 'pressione_vuoto_bar', confidence: 'inferred', note: 'Riconosciuto come pressione vuoto ventose robot (#18)' };
  }
  if (lc.includes('torq') || lc.includes('copp')) {
    return { target: 'coppia_motori_nm', confidence: 'inferred', note: 'Riconosciuto come coppia motori robot (#18)' };
  }
  if (lc.includes('power') || lc.includes('potenz') || lc.includes('kw')) {
    return { target: 'potenza_erogata_totale_kw', confidence: 'inferred', note: 'Riconosciuto come potenza erogata kW (#19)' };
  }
  if (lc.includes('throughput') || lc.includes('plt_h') || lc.includes('pallet_h')) {
    return { target: 'throughput_pallet_ora', confidence: 'inferred', note: 'Riconosciuto come throughput pallet/ora (#20)' };
  }

  return {
    target: '',
    confidence: 'unmapped',
    note: 'Colonna non standard: abbinala manualmente nel wizard se ti serve nei calcoli'
  };
}

function extractMetricsFromEventNote(
  nodeRole: ReturnType<typeof classifyMachineRole>,
  rowObj: Record<string, string>,
  extractedInputs: Record<string, any>
) {
  const text = `${rowObj.evento_o_allarme || ''} ${rowObj.note || ''}`.toLowerCase();
  if (!text.trim()) return;

  const delayMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m|min|minuti)\s*(?:di\s*)?ritard|ritard[oa]\s*(?:di\s*)?(\d+(?:[.,]\d+)?)/i);
  if (delayMatch) {
    const val = Number((delayMatch[1] || delayMatch[2]).replace(',', '.'));
    if (Number.isFinite(val)) {
      extractedInputs.minuti_ritardo = val;
      extractedInputs.ritardo_stimato_minuti = val;
    }
  }

  const satMatch = text.match(/saturazion[ei][^\d]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (satMatch) {
    const val = Number(satMatch[1].replace(',', '.'));
    if (Number.isFinite(val)) {
      extractedInputs.saturazione_wms = val;
    }
  }

  const socMatch = text.match(/(?:soc|batteria)[^\d]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (socMatch) {
    const val = Number(socMatch[1].replace(',', '.'));
    if (Number.isFinite(val)) {
      extractedInputs.soc_medio_flotta_pct = val;
    }
  }

  const umidLegnoMatch = text.match(/umidit[àa]\s*(?:legno)?[^\d]*(\d+(?:[.,]\d+)?)\s*%/i);
  if (umidLegnoMatch) {
    const val = Number(umidLegnoMatch[1].replace(',', '.'));
    if (Number.isFinite(val)) {
      if (nodeRole === 'WOODPECKER' || text.includes('legno')) {
        extractedInputs.umidita_legno_pct = val;
      } else {
        extractedInputs.umidita_rilevata = val;
      }
    }
  }
}

export function parsePlantCsvContent(
  csvText: string,
  plantMachines: PlantMachineRef[] = [],
  selectedMachineId: string = 'AUTO_DETECT',
  columnOverrides: Record<string, string> = {}
): ParsedPlantCsvResult {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Il file CSV deve contenere almeno una riga di intestazione e almeno una riga di dati.');
  }

  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';
  const rawHeaderCols = splitCsvLine(firstLine, separator);
  const headerLower = rawHeaderCols.map(c => c.toLowerCase());

  const nodeColIdx = headerLower.findIndex(
    c => c.includes('macchina') || c.includes('nodo') || c.includes('asset') || c.includes('device') || c.includes('linea')
  );
  const paramColIdx = headerLower.findIndex(
    c => c.includes('parametro') || c.includes('chiave') || c.includes('key') || c.includes('tag') || c.includes('variabile')
  );
  const valColIdx = headerLower.findIndex(
    c => c === 'valore' || c === 'val' || c === 'value' || c.includes('valore') || c === 'lettura' || c === 'misura'
  );

  const isWideMatrix = paramColIdx === -1 && valColIdx === -1 && rawHeaderCols.length >= 2;
  const rows: Array<Record<string, string>> = [];
  const extractedInputs: Record<string, any> = {};
  const foundNodesSet = new Set<string>();

  const selectedMachineRef = selectedMachineId !== 'AUTO_DETECT'
    ? plantMachines.find(m => m.id === selectedMachineId)
    : undefined;
  const selectedRoleHint = selectedMachineRef ? classifyMachineRole(`${selectedMachineRef.nome} ${selectedMachineRef.categoria}`) : 'ALTRO';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = splitCsvLine(line, separator);
    const rowObj: Record<string, string> = {};
    rawHeaderCols.forEach((col, cIdx) => {
      rowObj[col] = vals[cIdx] ?? '';
    });
    rows.push(rowObj);
  }

  // Analisi intelligente delle colonne (per Wizard e mapping automatico/manuale)
  const columnAnalysis: CsvColumnAnalysis[] = rawHeaderCols.map(colName => {
    const samples = rows.slice(0, 6).map(r => r[colName]).filter(Boolean);
    const sampleValue = samples[0] ?? '';
    const override = columnOverrides[colName];
    if (override !== undefined) {
      if (override === '') {
        return { sourceColumn: colName, sampleValue, mappedTarget: '', confidence: 'unmapped', note: 'Esclusa manualmente nel wizard' };
      }
      const targetDef = CANONICAL_CSV_TARGETS.find(t => t.key === override);
      return {
        sourceColumn: colName,
        sampleValue,
        mappedTarget: override,
        confidence: 'manual',
        note: targetDef ? `Abbinata manualmente: ${targetDef.label} (${targetDef.calcs})` : 'Abbinata manualmente'
      };
    }
    const inferred = inferColumnMapping(colName, samples, selectedRoleHint);
    return {
      sourceColumn: colName,
      sampleValue,
      mappedTarget: inferred.target,
      confidence: inferred.confidence,
      note: inferred.note
    };
  });

  const colToTargetMap = new Map<string, string>();
  columnAnalysis.forEach(ca => {
    if (ca.mappedTarget && ca.mappedTarget !== '__METADATA__') {
      colToTargetMap.set(ca.sourceColumn, ca.mappedTarget);
    }
  });

  for (const rowObj of rows) {
    if (isWideMatrix) {
      const rowNodeName = nodeColIdx !== -1 ? (rowObj[rawHeaderCols[nodeColIdx]] || '') : '';
      if (rowNodeName) {
        foundNodesSet.add(rowNodeName);
      }
      const effectiveNodeName = rowNodeName || selectedMachineRef?.nome || selectedMachineRef?.id || '';
      const nodeRole = classifyMachineRole(effectiveNodeName);

      rawHeaderCols.forEach(colName => {
        const rawVal = rowObj[colName];
        if (rawVal === undefined || rawVal === '') return;

        // Se c'è una colonna esplicita con mapping manuale escluso (`override === ''`), rispettala
        if (columnOverrides[colName] === '') return;

        // Instradamento specifico per colonna generica temperatura_media_c e pezzi_prodotti in Log Eventi
        if (colName.toLowerCase() === 'temperatura_media_c' && columnOverrides[colName] === undefined) {
          const parsedTemp = parseFlexibleInput(rawVal, colName);
          if (parsedTemp !== undefined) {
            if (nodeRole === 'LGV') {
              extractedInputs.temperatura_batterie_c = parsedTemp;
            } else if (nodeRole === 'RAPTOR') {
              extractedInputs.temp_testina_termica_c = parsedTemp;
            } else if (extractedInputs.temperatura_media_c === undefined) {
              extractedInputs.temperatura_media_c = parsedTemp;
            }
          }
          return;
        }

        if (colName.toLowerCase() === 'pezzi_prodotti' && nodeRole === 'WOODPECKER' && columnOverrides[colName] === undefined) {
          const parsedQty = parseFlexibleInput(rawVal, colName);
          if (parsedQty !== undefined && Number(parsedQty) > 0) {
            extractedInputs.throughput_pallet_ora = parsedQty;
          }
        }

        const mappedTarget = colToTargetMap.get(colName);
        const keyToWrite = mappedTarget || colName;
        const parsed = parseFlexibleInput(rawVal, keyToWrite);
        if (parsed !== undefined) {
          extractedInputs[colName] = parsed;
          if (mappedTarget && mappedTarget !== colName) {
            extractedInputs[mappedTarget] = parsed;
          }
        }
      });

      extractMetricsFromEventNote(nodeRole, rowObj, extractedInputs);
    } else {
      const nodeName = nodeColIdx !== -1 ? (rowObj[rawHeaderCols[nodeColIdx]] || '') : '';
      const paramKey = paramColIdx !== -1 ? (rowObj[rawHeaderCols[paramColIdx]] || '') : (rawHeaderCols[0] ? (rowObj[rawHeaderCols[0]] || '') : '');
      const valRaw = valColIdx !== -1 ? rowObj[rawHeaderCols[valColIdx]] : (rawHeaderCols[1] ? rowObj[rawHeaderCols[1]] : undefined);

      if (nodeName) {
        foundNodesSet.add(nodeName);
      }
      if (paramKey && valRaw !== undefined && valRaw !== '') {
        const inferred = inferColumnMapping(paramKey, [valRaw], selectedRoleHint);
        const canonicalKey = inferred.target && inferred.target !== '__METADATA__' ? inferred.target : paramKey;
        const parsed = parseFlexibleInput(valRaw, canonicalKey);
        if (parsed !== undefined) {
          extractedInputs[paramKey] = parsed;
          if (canonicalKey !== paramKey) {
            extractedInputs[canonicalKey] = parsed;
          }
        }
      }
    }
  }

  if (selectedMachineRef) {
    extractedInputs.macchina_riferimento = selectedMachineRef.id;
  }

  const existing: string[] = [];
  const unknown: string[] = [];
  foundNodesSet.forEach(nodeName => {
    if (matchesExistingPlantMachine(nodeName, plantMachines)) {
      existing.push(nodeName);
    } else {
      unknown.push(nodeName);
    }
  });

  const isHighSpeed = rawHeaderCols.some(c => {
    const lc = c.toLowerCase();
    return lc.includes('hz') || lc.includes('vibraz') || lc.includes('accelerazion') || lc.includes('rpm') || lc.includes('timestamp_ms');
  });

  const detectedFormat: 'multi_node' | 'single_machine' | 'vertical_kv' = !isWideMatrix
    ? 'vertical_kv'
    : isHighSpeed
      ? 'single_machine'
      : 'multi_node';

  return {
    columns: rawHeaderCols,
    rows,
    extractedInputs,
    detectedNodes: { existing, unknown },
    isHighSpeed,
    detectedFormat,
    columnAnalysis
  };
}
