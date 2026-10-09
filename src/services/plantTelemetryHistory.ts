import { FactoryTenant, QuantumExecutionResult } from '../types/quantum';
import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';

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
          return parsed.sort((a, b) => a.timestampEpoch - b.timestampEpoch);
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
   * Save records to localStorage
   */
  private static saveRecords(records: PlantTelemetryRecord[]) {
    try {
      // Keep up to 300 points for memory safety
      const trimmed = records.slice(-300);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save telemetry records', e);
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
      lgvSoc?: number;
      baieRitardo?: number;
    }
  ): PlantTelemetryRecord {
    const all = this.getHistoryRecords();
    const now = new Date();
    const epoch = now.getTime();
    const formatted = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) + ' ' +
                      now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let critici = 0;
    let attenzione = 0;
    let normali = 0;

    const calcoli: CalculationTelemetrySnapshot[] = [];
    if (calcoliResults && calcoliResults.length > 0) {
      for (const item of calcoliResults) {
        if (item.livelloAllarme === 'CRITICO') critici++;
        else if (item.livelloAllarme === 'ATTENZIONE') attenzione++;
        else normali++;

        const risk = item.res.probabilita_fermo_pct 
          ? Number(String(item.res.probabilita_fermo_pct).replace('%', '')) 
          : (item.livelloAllarme === 'CRITICO' ? 84 : item.livelloAllarme === 'ATTENZIONE' ? 45 : 12);

        calcoli.push({
          calcId: item.calcId,
          calcNome: item.calcNome,
          sottoFunzione: item.res.sotto_funzione || `Algoritmo ${item.calcId}`,
          livelloAllarme: item.livelloAllarme,
          metricaValore: item.res.metrica_principale_valore || `${risk}%`,
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

    const macchinari: Record<string, MachineTelemetrySnapshot> = {
      BEMA_FASCIATORE: {
        machineKey: 'BEMA_FASCIATORE',
        nome: 'Fasciatore Robotico Bema Silkworm 01',
        stato: (customMetrics?.bemaVibrazione || 0.4) > 1.2 ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: customMetrics?.bemaVibrazione ?? Number((0.35 + Math.random() * 0.2).toFixed(2)),
        temperaturaC: Math.round(48 + Math.random() * 6),
        velocitaRpm: Math.round(33 + Math.random() * 4),
        batteriaSoC: 100,
        pressioneVuotoBar: -0.85,
        cicliOra: Math.round(78 + Math.random() * 8),
        ritardoMinuti: 0
      },
      FLOTTA_LGV: {
        machineKey: 'FLOTTA_LGV',
        nome: 'Flotta Navette Laser LGV E80 (4 Unità)',
        stato: (customMetrics?.lgvSoc || 85) < 30 ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: 0.18,
        temperaturaC: 38,
        velocitaRpm: 1200,
        batteriaSoC: customMetrics?.lgvSoc ?? Math.round(75 + Math.random() * 20),
        pressioneVuotoBar: -0.85,
        cicliOra: Math.round(110 + Math.random() * 15),
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
        cicliOra: Math.round(140 + Math.random() * 20),
        ritardoMinuti: 1
      },
      BAIE_INBOUND_OUTBOUND: {
        machineKey: 'BAIE_INBOUND_OUTBOUND',
        nome: 'Baie di Carico & Scarico WMS',
        stato: (customMetrics?.baieRitardo || 0) > 35 ? 'ALLARME' : 'IN_MARCIA',
        vibrazioneG: 0.08,
        temperaturaC: 22,
        velocitaRpm: 0,
        batteriaSoC: 100,
        pressioneVuotoBar: -0.80,
        cicliOra: 22,
        ritardoMinuti: customMetrics?.baieRitardo ?? Math.round(8 + Math.random() * 14)
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
        cicliOra: Math.round(85 + Math.random() * 10),
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
        cicliOra: 95,
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
      throughputPalletOra: Math.round(75 + (health * 0.4)),
      potenzaAssorbitaKw: Math.round(85 + Math.random() * 25),
      macchinari,
      calcoli
    };

    all.push(newRecord);
    this.saveRecords(all);
    return newRecord;
  }

  /**
   * Filters records by company, plant, and time scope
   */
  static getFilteredHistory(options: {
    azienda?: string;
    stabilimentoId?: string;
    machineKey?: string;
    timeRange?: 'ALL' | '24H' | '7D' | 'SHIFT';
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

        const bemaVib = Number((0.32 + (idx === 4 ? 0.95 : 0) + (Math.sin(idx) * 0.1)).toFixed(2));
        const lgvBat = Math.max(38, Math.round(86 - ((idx % 5) * 11)));
        const baieRit = Math.max(4, Math.round(14 + (idx === 10 ? 38 : Math.sin(idx * 1.5) * 8)));

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
              stato: bemaVib > 1.0 ? 'ALLARME' : 'IN_MARCIA',
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
              stato: lgvBat < 45 ? 'ALLARME' : 'IN_MARCIA',
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
              stato: baieRit > 30 ? 'ALLARME' : 'IN_MARCIA',
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
              calcNome: 'Ottimizzazione Dinamica Piazzale e Assegnazione Baie',
              sottoFunzione: 'Dock Scheduler',
              livelloAllarme: baieRit > 30 ? 'ATTENZIONE' : 'NORMALE',
              metricaValore: `${Math.round(82 + Math.sin(idx) * 10)}%`,
              metricaEtichetta: 'Efficienza Baie',
              rischioPercent: Math.round(18 - Math.sin(idx) * 10)
            },
            {
              calcId: 14,
              calcNome: 'Risonanza Dinamica Braccio Rotante BEMA Silkworm',
              sottoFunzione: 'Vibration & Bearing FFT',
              livelloAllarme: bemaVib > 0.8 ? 'CRITICO' : 'NORMALE',
              metricaValore: `${bemaVib} mm/s`,
              metricaEtichetta: 'RMS Vibrazione Cuscinetti',
              rischioPercent: bemaVib > 0.8 ? 88 : 12
            },
            {
              calcId: 16,
              calcNome: 'Routing Dinamico Flotta Navette LGV Anti-Deadlock',
              sottoFunzione: 'LGV Conflict-Free Routing',
              livelloAllarme: 'NORMALE',
              metricaValore: '99.4%',
              metricaEtichetta: 'QPU Routing Fidelity',
              rischioPercent: 8
            },
            {
              calcId: 17,
              calcNome: 'Gestione Stocastica Stato di Carica BMS Batterie Flotta AGV',
              sottoFunzione: 'Li-Ion BMS Stochastic Optimization',
              livelloAllarme: lgvBat < 45 ? 'ATTENZIONE' : 'NORMALE',
              metricaValore: `${lgvBat}%`,
              metricaEtichetta: 'Media SoC Flotta',
              rischioPercent: lgvBat < 45 ? 58 : 15
            }
          ]
        });
      });
    }

    return records.sort((a, b) => a.timestampEpoch - b.timestampEpoch);
  }
}
