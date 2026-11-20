import { FactoryTenant, QuantumExecutionResult } from '../types/quantum';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { INDUSTRIAL_THRESHOLDS } from '../data/industrialThresholds';
import { finiteOr } from '../utils/inputParser';

export type TelemetryDataSource = 
  | 'DAEMON_PYTHON_MTLS' 
  | 'UPLOAD_CSV_EVENTI' 
  | 'UPLOAD_CSV_TELEMETRIA' 
  | 'GATEWAY_AUTOSCAN';

export interface MachineTelemetrySnapshot {
  machineKey: string;
  nome: string;
  stato: 'IN_MARCIA' | 'STANDBY' | 'ALLARME' | 'MANUTENZIONE';
  vibrazioneG: number;
  temperaturaC: number;
  velocitaRpm: number;
  batteriaSoC: number;
  pressioneVuotoBar: number;
  cicliOra: number;
  ritardoMinuti: number;
}

export interface CalculationTelemetrySnapshot {
  calcId: number;
  calcNome: string;
  sottoFunzione: string;
  livelloAllarme: 'NORMALE' | 'ATTENZIONE' | 'CRITICO';
  metricaValore: string | number;
  metricaEtichetta: string;
  rischioPercent: number;
}

export interface PlantTelemetryRecord {
  id: string;
  timestamp: string; // Formatted date string
  timestampIso: string;
  timestampEpoch: number;
  stabilimentoId: string;
  stabilimentoNome: string;
  azienda: string;
  fonte: TelemetryDataSource;
  indiceSaluteGlobale: number; // 0-100%
  oee: number; // Overall Equipment Effectiveness %
  criticiCount: number;
  attenzioneCount: number;
  normaliCount: number;
  throughputPalletOra: number;
  potenzaAssorbitaKw: number;
  macchinari: Record<string, MachineTelemetrySnapshot>;
  calcoli: CalculationTelemetrySnapshot[];
}

const STORAGE_KEY_HISTORY = 'joker80_telemetry_history_records_v2';

const LEGACY_CALC_TITLES: Record<number, string> = {
  1: QUANTUM_CALCULATIONS.find(c => c.id === 1)?.name || 'Quantum Boltzmann Machines (QBM)',
  14: QUANTUM_CALCULATIONS.find(c => c.id === 14)?.name || 'Quantum Fourier Transform (QFT)',
  16: QUANTUM_CALCULATIONS.find(c => c.id === 16)?.name || 'Dynamic Graph QAOA & QRL',
  17: QUANTUM_CALCULATIONS.find(c => c.id === 17)?.name || 'Quantum Bipartite Matching',
};

function sanitizeHistoryRecord(record: PlantTelemetryRecord): PlantTelemetryRecord {
  const updatedCalcoli = Array.isArray(record.calcoli)
    ? record.calcoli.map(c => {
        const canonicalName = LEGACY_CALC_TITLES[c.calcId] || c.calcNome;
        let metricaValore = c.metricaValore;
        let metricaEtichetta = c.metricaEtichetta;
        if (c.calcId === 14 && typeof metricaValore === 'string' && metricaValore.includes('mm/s')) {
          metricaValore = metricaValore.replace('mm/s', 'g');
        }
        if (c.calcId === 16 && metricaEtichetta === 'QPU Routing Fidelity') {
          metricaEtichetta = 'Fluidità Rotta LGV';
        }
        return {
          ...c,
          calcNome: canonicalName,
          metricaValore,
          metricaEtichetta,
        };
      })
    : [];

  return {
    ...record,
    calcoli: updatedCalcoli,
  };
}

export class PlantTelemetryHistoryService {
  /**
   * Initializes or gets the full historical time-series logs
   */
  static getHistoryRecords(): PlantTelemetryRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .map(sanitizeHistoryRecord)
            .sort((a, b) => a.timestampEpoch - b.timestampEpoch);
        }
      }
    } catch (e) {
      console.error('Error reading telemetry history', e);
    }

    const seeded = this.generateInitialSeedHistory();
    this.saveRecords(seeded);
    return seeded;
  }

  /**
   * Save records to localStorage (retaining up to 366 days & 2000 compact points)
   */
  private static saveRecords(records: PlantTelemetryRecord[]) {
    try {
      const oneYearAgo = Date.now() - 366 * 24 * 3600 * 1000;
      const annual = records
        .filter(r => typeof r.timestampEpoch === 'number' && r.timestampEpoch >= oneYearAgo)
        .sort((a, b) => a.timestampEpoch - b.timestampEpoch)
        .slice(-2000);

      // Keep lightweight calcoli summary when history grows to stay well within localStorage quota
      const compacted = annual.map(r => ({
        ...r,
        calcoli: Array.isArray(r.calcoli)
          ? r.calcoli.filter(c => [1, 2, 14, 15, 16, 17, 19, 20].includes(c.calcId))
          : []
      }));

      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(compacted));
      } catch {
        // Fallback if browser localStorage quota is tight
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(compacted.slice(-800)));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('telemetry-history-updated'));
      }
    } catch (e) {
      console.error('Failed to save telemetry records', e);
    }
  }

  /**
   * Synchronize annual chronological history with backend disk storage (/api/telemetry/history)
   */
  static async syncFromServer(): Promise<PlantTelemetryRecord[]> {
    const localRecords = this.getHistoryRecords();
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
      return localRecords;
    }
    try {
      const res = await fetch('/api/telemetry/history');
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        return localRecords;
      }
      const data = await res.json();
      const serverRecords: PlantTelemetryRecord[] = Array.isArray(data?.records) ? data.records : [];
      if (serverRecords.length === 0) {
        // Push local history baseline to server once if server file is still empty
        if (localRecords.length > 0) {
          fetch('/api/telemetry/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: localRecords })
          }).catch(() => {});
        }
        return localRecords;
      }

      const byId = new Map<string, PlantTelemetryRecord>();
      for (const rec of localRecords) {
        if (rec?.id) byId.set(rec.id, sanitizeHistoryRecord(rec));
      }
      for (const rec of serverRecords) {
        if (rec?.id) byId.set(rec.id, sanitizeHistoryRecord(rec));
      }
      const merged = Array.from(byId.values()).sort((a, b) => a.timestampEpoch - b.timestampEpoch);
      this.saveRecords(merged);
      return merged;
    } catch {
      return localRecords;
    }
  }

  /**
   * Record a new data ingress event (from CSV upload or Python Daemon scan)
   */
  static recordNewSnapshot(
    tenant: FactoryTenant,
    fonte: TelemetryDataSource,
    calcoliResults?: { calcId: number; calcNome: string; livelloAllarme: 'NORMALE' | 'ATTENZIONE' | 'CRITICO'; res: QuantumExecutionResult }[],
    customMetrics?: {
      indiceSalute?: number;
      oee?: number;
      bemaVibrazione?: number;
      bemaRpm?: number;
      lgvSoc?: number;
      baieRitardo?: number;
      potenzaKw?: number;
      throughputPalletOra?: number;
    }
  ): PlantTelemetryRecord {
    const all = this.getHistoryRecords();
    const now = new Date();
    const epoch = now.getTime();
    const formatted = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
                      now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Prevent automatic background scans from flooding the annual timeline on rapid page refreshes,
    // while ALWAYS preserving every CSV upload (UPLOAD_CSV_EVENTI / UPLOAD_CSV_TELEMETRIA).
    const isCsvUpload = fonte === 'UPLOAD_CSV_EVENTI' || fonte === 'UPLOAD_CSV_TELEMETRIA';
    if (!isCsvUpload) {
      const recentSamePlant = [...all]
        .reverse()
        .find(r => r.stabilimentoId === tenant.id && r.fonte === fonte);
      if (recentSamePlant && epoch - recentSamePlant.timestampEpoch < 5 * 60 * 1000) {
        return recentSamePlant;
      }
    }

    let critici = 0;
    let attenzione = 0;
    let normali = 0;

    const calcoli: CalculationTelemetrySnapshot[] = [];
    if (calcoliResults && calcoliResults.length > 0) {
      for (const item of calcoliResults) {
        if (item.livelloAllarme === 'CRITICO') critici++;
        else if (item.livelloAllarme === 'ATTENZIONE') attenzione++;
        else normali++;

        const rawRisk =
          item.res.probabilita_fermo_linea_pct ??
          item.res.probabilita_fermo_pct ??
          item.res.congestione_percentuale ??
          item.res.tasso_scarto_stimato_pct;
        const fallbackRisk = item.livelloAllarme === 'CRITICO' ? 84 : item.livelloAllarme === 'ATTENZIONE' ? 45 : 12;
        const cleanedRisk = rawRisk !== undefined && rawRisk !== null ? String(rawRisk).replace('%', '').trim() : undefined;
        const risk = finiteOr(cleanedRisk, fallbackRisk);

        calcoli.push({
          calcId: item.calcId,
          calcNome: item.calcNome,
          sottoFunzione: item.res.sotto_funzione || `Algoritmo ${item.calcId}`,
          livelloAllarme: item.livelloAllarme,
          metricaValore: item.res.metrica_principale_valore ?? `${risk}%`,
          metricaEtichetta: item.res.metrica_principale_etichetta || 'Indice Rischio QPU',
          rischioPercent: risk
        });
      }
    } else {
      // Auto-compute baseline for remaining
      normali = 19;
      attenzione = 2;
      critici = 0;
    }

    const health = customMetrics?.indiceSalute ?? Math.max(30, Math.min(99, 100 - (critici * 20 + attenzione * 6)));
    const oeeVal = customMetrics?.oee ?? Math.round(health * 0.94);

    const bemaVibVal = finiteOr(customMetrics?.bemaVibrazione, 0.34);
    const bemaRpmVal = finiteOr(customMetrics?.bemaRpm, 48.5);
    const lgvSocVal = finiteOr(customMetrics?.lgvSoc, 78);
    const baieRitardoVal = finiteOr(customMetrics?.baieRitardo, 12);
    const throughputVal = Math.round(finiteOr(customMetrics?.throughputPalletOra, 75 + (health * 0.4)));
    const potenzaVal = Math.round(finiteOr(customMetrics?.potenzaKw, 88));

    const macchinari: Record<string, MachineTelemetrySnapshot> = {
      BEMA_FASCIATORE: {
        machineKey: 'BEMA_FASCIATORE',
        nome: 'Fasciatore Robotico Bema Silkworm 01',
        stato: bemaVibVal > INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: bemaVibVal,
        temperaturaC: 48,
        velocitaRpm: bemaRpmVal,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.85,
        cicliOra: 82,
        ritardoMinuti: 0
      },
      FLOTTA_LGV: {
        machineKey: 'FLOTTA_LGV',
        nome: 'Flotta Navette Laser LGV E80 (4 Unità)',
        stato: lgvSocVal < INDUSTRIAL_THRESHOLDS.LGV_SOC_CRIT_PCT ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: 0.18,
        temperaturaC: 38,
        velocitaRpm: 1200,
        batteriaSoC: lgvSocVal,
        pressioneVuotoBar: -0.85,
        cicliOra: 115,
        ritardoMinuti: 0
      },
      SMARTSTORE: {
        machineKey: 'SMARTSTORE',
        nome: 'Magazzino Intensivo SmartStore 3D',
        stato: 'IN_MARCIA',
        vibrazioneG: 0.12,
        temperaturaC: 24,
        velocitaRpm: 1800,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.88,
        cicliOra: 145,
        ritardoMinuti: 1
      },
      BAIE_INBOUND_OUTBOUND: {
        machineKey: 'BAIE_INBOUND_OUTBOUND',
        nome: 'Baie di Carico & Scarico WMS',
        stato: baieRitardoVal > INDUSTRIAL_THRESHOLDS.BUFFER_TEMPO_ATTESA_CRIT_MIN ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: 0.08,
        temperaturaC: 22,
        velocitaRpm: 0,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.80,
        cicliOra: 22,
        ritardoMinuti: baieRitardoVal
      },
      ISOLA_ROBOT: {
        machineKey: 'ISOLA_ROBOT',
        nome: 'Isola Robotica di Pallettizzazione',
        stato: 'IN_MARCIA',
        vibrazioneG: 0.22,
        temperaturaC: 44,
        velocitaRpm: 900,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.82,
        cicliOra: 88,
        ritardoMinuti: 0
      },
      WOODPECKER: {
        machineKey: 'WOODPECKER',
        nome: 'Stazione Ispezione Pallet Woodpecker',
        stato: 'IN_MARCIA',
        vibrazioneG: 0.15,
        temperaturaC: 26,
        velocitaRpm: 0,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.85,
        cicliOra: throughputVal,
        ritardoMinuti: 0
      },
      RAPTOR: {
        machineKey: 'RAPTOR',
        nome: 'Etichettatrice Robotizzata E80 Raptor',
        stato: 'IN_MARCIA',
        vibrazioneG: 0.10,
        temperaturaC: 36,
        velocitaRpm: 0,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.80,
        cicliOra: 90,
        ritardoMinuti: 0
      }
    };

    const newRecord: PlantTelemetryRecord = {
      id: `tel-rec-${epoch}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatted,
      timestampIso: now.toISOString(),
      timestampEpoch: epoch,
      stabilimentoId: tenant.id,
      stabilimentoNome: tenant.nome,
      azienda: tenant.azienda || 'Azienda',
      fonte,
      indiceSaluteGlobale: health,
      oee: oeeVal,
      criticiCount: critici,
      attenzioneCount: attenzione,
      normaliCount: normali,
      throughputPalletOra: throughputVal,
      potenzaAssorbitaKw: potenzaVal,
      macchinari,
      calcoli
    };

    all.push(newRecord);
    this.saveRecords(all);

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      fetch('/api/telemetry/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: newRecord })
      }).catch(() => {});
    }

    return newRecord;
  }

  /**
   * Filters records by company, plant, and time scope
   */
  static getFilteredHistory(options: {
    azienda?: string;
    stabilimentoId?: string;
    machineKey?: string;
    timeRange?: 'ALL' | '365D' | '30D' | '24H' | '7D' | 'SHIFT';
  }): PlantTelemetryRecord[] {
    const all = this.getHistoryRecords();
    const now = Date.now();

    let filtered = all;

    // Filter by Company (if specified and not 'TUTTE')
    if (options.azienda && options.azienda !== 'TUTTE' && options.azienda !== 'all') {
      filtered = filtered.filter(r => 
        r.azienda.toLowerCase().includes(options.azienda!.toLowerCase()) ||
        options.azienda!.toLowerCase().includes(r.azienda.toLowerCase())
      );
    }

    // Filter by specific plant (if specified and not 'all')
    if (options.stabilimentoId && options.stabilimentoId !== 'all') {
      filtered = filtered.filter(r => r.stabilimentoId === options.stabilimentoId);
    }

    // Filter by time range
    if (options.timeRange === 'SHIFT') {
      const eightHoursAgo = now - 8 * 3600 * 1000;
      filtered = filtered.filter(r => r.timestampEpoch >= eightHoursAgo);
    } else if (options.timeRange === '24H') {
      const dayAgo = now - 24 * 3600 * 1000;
      filtered = filtered.filter(r => r.timestampEpoch >= dayAgo);
    } else if (options.timeRange === '7D') {
      const weekAgo = now - 7 * 24 * 3600 * 1000;
      filtered = filtered.filter(r => r.timestampEpoch >= weekAgo);
    } else if (options.timeRange === '30D') {
      const monthAgo = now - 30 * 24 * 3600 * 1000;
      filtered = filtered.filter(r => r.timestampEpoch >= monthAgo);
    } else if (options.timeRange === '365D') {
      const yearAgo = now - 366 * 24 * 3600 * 1000;
      filtered = filtered.filter(r => r.timestampEpoch >= yearAgo);
    }

    return filtered;
  }

  /**
   * Generates realistic initial historical progression from the very first data ingestion
   * over the past 7 days across major plants (Barilla, Nestlé, Ferrero, Sant'Anna)
   */
  private static generateInitialSeedHistory(): PlantTelemetryRecord[] {
    const records: PlantTelemetryRecord[] = [];
    const now = Date.now();

    const plantsMeta = [
      { id: 'barilla', nome: 'Barilla - Stabilimento Pedrignano', azienda: 'Barilla G. e R. Fratelli' },
      { id: 'nestle', nome: 'Nestlé - Stabilimento Assago', azienda: 'Nestlé Italiana' },
      { id: 'santanna', nome: 'Acqua Sant\'Anna - Stabilimento Vinadio', azienda: 'Acqua Sant\'Anna' },
      { id: 'ferrero-alba', nome: 'Ferrero - Stabilimento Principale di Alba', azienda: 'Ferrero S.p.A.' }
    ];

    // Seed 14 chronological points over the past 7 days
    const timeOffsetsHours = [
      168, 144, 120, 96, 72, 48, 36, 24, 18, 12, 8, 4, 2, 0.5
    ];

    for (const plant of plantsMeta) {
      timeOffsetsHours.forEach((offsetH, idx) => {
        const pointTime = new Date(now - offsetH * 3600 * 1000);
        const epoch = pointTime.getTime();
        const formatted = pointTime.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' +
                          pointTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        // First point is the first data setup (e.g. initial CSV import or daemon handshake)
        const fonte: TelemetryDataSource = 
          idx === 0 
            ? 'UPLOAD_CSV_EVENTI' 
            : idx % 3 === 0 
              ? 'UPLOAD_CSV_TELEMETRIA' 
              : 'DAEMON_PYTHON_MTLS';

        // Health curve with realistic industrial fluctuations
        const baseHealth = 88 + Math.sin(idx * 0.7) * 7;
        const critici = (idx === 4 || idx === 10) ? 1 : 0;
        const attenzione = (idx === 2 || idx === 7 || idx === 11) ? 2 : (critici > 0 ? 1 : 0);
        const normali = 21 - critici - attenzione;
        const health = Math.round(Math.max(68, Math.min(99, baseHealth - critici * 15 - attenzione * 5)));
        const oee = Math.round(health * 0.93);

        const bemaVib = idx === 4
          ? 0.78
          : Number((0.30 + Math.sin(idx) * 0.08).toFixed(2));
        const lgvBat = idx === 11
          ? 42
          : Math.max(54, Math.round(88 - ((idx % 5) * 7)));
        const baieRit = idx === 10
          ? 42
          : Math.max(4, Math.round(14 + Math.sin(idx * 1.5) * 6));

        records.push({
          id: `seed-${plant.id}-${idx}`,
          timestamp: formatted,
          timestampIso: pointTime.toISOString(),
          timestampEpoch: epoch,
          stabilimentoId: plant.id,
          stabilimentoNome: plant.nome,
          azienda: plant.azienda,
          fonte,
          indiceSaluteGlobale: health,
          oee,
          criticiCount: critici,
          attenzioneCount: attenzione,
          normaliCount: normali,
          throughputPalletOra: Math.round(72 + (health * 0.35)),
          potenzaAssorbitaKw: Math.round(88 + Math.sin(idx) * 12),
          macchinari: {
            BEMA_FASCIATORE: {
              machineKey: 'BEMA_FASCIATORE',
              nome: 'Fasciatore Robotico Bema Silkworm 01',
              stato: bemaVib > INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G ? 'ALLARME' : 'IN_MARCIA',
              vibrazioneG: bemaVib,
              temperaturaC: Math.round(47 + idx * 0.5),
              velocitaRpm: Math.round(34 + Math.sin(idx) * 2),
              batteriaSoC: 100,
              pressioneVuotoBar: -0.85,
              cicliOra: Math.round(80 + Math.sin(idx) * 5),
              ritardoMinuti: 0
            },
            FLOTTA_LGV: {
              machineKey: 'FLOTTA_LGV',
              nome: 'Flotta Navette Laser LGV E80',
              stato: lgvBat < INDUSTRIAL_THRESHOLDS.LGV_SOC_CRIT_PCT ? 'ALLARME' : 'IN_MARCIA',
              vibrazioneG: 0.18,
              temperaturaC: 37,
              velocitaRpm: 1200,
              batteriaSoC: lgvBat,
              pressioneVuotoBar: -0.85,
              cicliOra: 115,
              ritardoMinuti: 0
            },
            SMARTSTORE: {
              machineKey: 'SMARTSTORE',
              nome: 'Magazzino Intensivo SmartStore 3D',
              stato: 'IN_MARCIA',
              vibrazioneG: 0.12,
              temperaturaC: 23,
              velocitaRpm: 1800,
              batteriaSoC: 100,
              pressioneVuotoBar: -0.88,
              cicliOra: Math.round(142 + Math.sin(idx) * 8),
              ritardoMinuti: 1
            },
            BAIE_INBOUND_OUTBOUND: {
              machineKey: 'BAIE_INBOUND_OUTBOUND',
              nome: 'Baie di Carico WMS',
              stato: baieRit > INDUSTRIAL_THRESHOLDS.BUFFER_TEMPO_ATTESA_CRIT_MIN ? 'ALLARME' : 'IN_MARCIA',
              vibrazioneG: 0.08,
              temperaturaC: 21,
              velocitaRpm: 0,
              batteriaSoC: 100,
              pressioneVuotoBar: -0.80,
              cicliOra: 24,
              ritardoMinuti: baieRit
            },
            ISOLA_ROBOT: {
              machineKey: 'ISOLA_ROBOT',
              nome: 'Isola Robotica di Pallettizzazione',
              stato: 'IN_MARCIA',
              vibrazioneG: 0.22,
              temperaturaC: 43,
              velocitaRpm: 900,
              batteriaSoC: 100,
              pressioneVuotoBar: -0.82,
              cicliOra: 86,
              ritardoMinuti: 0
            },
            WOODPECKER: {
              machineKey: 'WOODPECKER',
              nome: 'Stazione Ispezione Pallet Woodpecker',
              stato: 'IN_MARCIA',
              vibrazioneG: 0.14,
              temperaturaC: 25,
              velocitaRpm: 0,
              batteriaSoC: 100,
              pressioneVuotoBar: -0.85,
              cicliOra: 94,
              ritardoMinuti: 0
            },
            RAPTOR: {
              machineKey: 'RAPTOR',
              nome: 'Etichettatrice Robotizzata E80 Raptor',
              stato: 'IN_MARCIA',
              vibrazioneG: 0.11,
              temperaturaC: 37,
              velocitaRpm: 0,
              batteriaSoC: 100,
              pressioneVuotoBar: -0.80,
              cicliOra: 92,
              ritardoMinuti: 0
            }
          },
          calcoli: [
            {
              calcId: 1,
              calcNome: LEGACY_CALC_TITLES[1],
              sottoFunzione: 'Inbound Scheduler',
              livelloAllarme: baieRit > INDUSTRIAL_THRESHOLDS.BUFFER_TEMPO_ATTESA_CRIT_MIN ? 'ATTENZIONE' : 'NORMALE',
              metricaValore: `${Math.round(82 + Math.sin(idx) * 10)}%`,
              metricaEtichetta: 'Efficienza Baie',
              rischioPercent: Math.round(18 - Math.sin(idx) * 10)
            },
            {
              calcId: 14,
              calcNome: LEGACY_CALC_TITLES[14],
              sottoFunzione: 'Bema Wrapping Controller',
              livelloAllarme: bemaVib > INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G ? 'CRITICO' : 'NORMALE',
              metricaValore: `${bemaVib} g`,
              metricaEtichetta: 'Vibrazione Cuscinetti (g)',
              rischioPercent: bemaVib > INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G ? 88 : 12
            },
            {
              calcId: 16,
              calcNome: LEGACY_CALC_TITLES[16],
              sottoFunzione: 'Routing & Traffic Engine',
              livelloAllarme: 'NORMALE',
              metricaValore: '99.4%',
              metricaEtichetta: 'Fluidità Rotta LGV',
              rischioPercent: 8
            },
            {
              calcId: 17,
              calcNome: LEGACY_CALC_TITLES[17],
              sottoFunzione: 'Task Allocation Engine',
              livelloAllarme: lgvBat < INDUSTRIAL_THRESHOLDS.LGV_SOC_CRIT_PCT
                ? 'CRITICO'
                : lgvBat < INDUSTRIAL_THRESHOLDS.LGV_SOC_WARN_PCT
                  ? 'ATTENZIONE'
                  : 'NORMALE',
              metricaValore: `${lgvBat}%`,
              metricaEtichetta: 'Media SoC Flotta',
              rischioPercent: lgvBat < INDUSTRIAL_THRESHOLDS.LGV_SOC_CRIT_PCT ? 82 : lgvBat < INDUSTRIAL_THRESHOLDS.LGV_SOC_WARN_PCT ? 58 : 15
            }
          ]
        });
      });
    }

    return records.sort((a, b) => a.timestampEpoch - b.timestampEpoch);
  }
}
