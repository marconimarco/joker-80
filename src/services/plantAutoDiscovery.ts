import { FactoryTenant, PlantTopology, MachineAsset, AgvVehicle, BayAsset, PlantDepartment, UserAccount, IndustrialProtocol } from '../types/quantum';
import { AuthStorage } from './authStorage';

// Pre-built Topologies for the existing baseline tenants
export const TOPOLOGY_BARILLA: PlantTopology = {
  reparti: [
    {
      id: 'rep-bar-inbound',
      nome: 'Reparto 1: Ricevimento Grano & Materie Prime (MIP)',
      moduloTecnico: 'MIP',
      responsabileLinea: 'Ing. D. Baroni',
      statoOperativo: 'OTTIMALE',
      macchineCount: 4
    },
    {
      id: 'rep-bar-wms',
      nome: 'Reparto 2: Magazzino Automatico SmartStore (WMS)',
      moduloTecnico: 'WMS',
      responsabileLinea: 'Ing. G. Moretti',
      statoOperativo: 'OTTIMALE',
      macchineCount: 6
    },
    {
      id: 'rep-bar-ecs',
      nome: 'Reparto 3: Fasciatori Bema Silkworm & Fine Linea Pasta (ECS)',
      moduloTecnico: 'ECS',
      responsabileLinea: 'P. Barbieri',
      statoOperativo: 'OTTIMALE',
      macchineCount: 5
    },
    {
      id: 'rep-bar-yms',
      nome: 'Reparto 4: Baie Spedizione & Piazzale Intermodale (YMS/TMS)',
      moduloTecnico: 'YMS',
      responsabileLinea: 'M. Ferrari',
      statoOperativo: 'ATTENZIONE',
      macchineCount: 8
    }
  ],
  macchinari: [
    { id: 'M-BAR-BEMA-01', nome: 'Fasciatore Robot Bema Silkworm 01', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB104.DBW20_TENSIONE_FILM', stato: 'IN_MARCIA', telemetria: { rpm: 48.5, tensione_newton: 152.0, spessore_film: 23 } },
    { id: 'M-BAR-BEMA-02', nome: 'Fasciatore Robot Bema Silkworm 02', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB104.DBW22_TENSIONE_FILM', stato: 'IN_MARCIA', telemetria: { rpm: 46.0, tensione_newton: 148.0, spessore_film: 23 } },
    { id: 'M-BAR-ASRS-01', nome: 'Trasloelevatore SmartStore Corsia 1', tipo: 'TRASLOELEVATORE_SMARTSTORE', reparto: 'Reparto 2', plcTag: 'DB300.DBD10_POS_Z', stato: 'IN_MARCIA', telemetria: { velocita_ms: 3.2, saturazione_corsia: 91.5 } },
    { id: 'M-BAR-ASRS-02', nome: 'Trasloelevatore SmartStore Corsia 2', tipo: 'TRASLOELEVATORE_SMARTSTORE', reparto: 'Reparto 2', plcTag: 'DB300.DBD14_POS_Z', stato: 'IN_MARCIA', telemetria: { velocita_ms: 3.0, saturazione_corsia: 86.0 } },
    { id: 'M-BAR-PAL-01', nome: 'Pallettizzatore Robotizzato Linea Spaghetti', tipo: 'PALLETTIZZATORE', reparto: 'Reparto 3', plcTag: 'DB120.DBX0.5_IS_READY', stato: 'IN_MARCIA', telemetria: { pacchi_minuto: 110 } },
    { id: 'M-BAR-RULL-01', nome: 'Rulliera Inbound Evacuazione Silos Grano', tipo: 'RULLIERA_INBOUND', reparto: 'Reparto 1', plcTag: 'DB10.DBW04_FLUSSO_KG', stato: 'IN_MARCIA', telemetria: { carico_orario_ton: 45.2 } }
  ],
  flottaAgv: [
    { id: 'LGV_BAR_01', modello: 'E80 CB16 Counterbalanced (Forche Singole)', batteriaSoC: 92, temperatura: 32.5, posizione: 'Nodo N-14 (Svincolo Bema 1)', stato: 'MISSIONE' },
    { id: 'LGV_BAR_02', modello: 'E80 CB16 Counterbalanced (Forche Singole)', batteriaSoC: 78, temperatura: 35.1, posizione: 'Nodo N-08 (Corsia Magazzino 1)', stato: 'MISSIONE' },
    { id: 'LGV_BAR_03', modello: 'E80 Reach Truck (Doppia Profondità)', batteriaSoC: 45, temperatura: 39.0, posizione: 'Stazione Ricarica Fast Bat-02', stato: 'IN_CARICA' },
    { id: 'LGV_BAR_04', modello: 'E80 CB20 Heavy Duty (Doppio Pallet)', batteriaSoC: 84, temperatura: 31.8, posizione: 'Nodo N-22 (Baia Spedizione 3)', stato: 'MISSIONE' },
    { id: 'LGV_BAR_05', modello: 'E80 CB16 Counterbalanced', batteriaSoC: 95, temperatura: 29.4, posizione: 'Area Parcheggio Buffer P-01', stato: 'IDLE' },
    { id: 'LGV_BAR_06', modello: 'E80 CB16 Counterbalanced', batteriaSoC: 62, temperatura: 36.2, posizione: 'Nodo N-19 (Scarico Baia Inbound 2)', stato: 'MISSIONE' }
  ],
  baie: [
    { id: 'BAIA_BAR_01', nome: 'Baia 01 (Inbound Semola)', tipo: 'INBOUND', stato: 'OCCUPATA', camionAssegnato: 'CAMION-IT-942 (Barilla Logistics)' },
    { id: 'BAIA_BAR_02', nome: 'Baia 02 (Inbound Packaging)', tipo: 'INBOUND', stato: 'LIBERA' },
    { id: 'BAIA_BAR_03', nome: 'Baia 03 (Inbound Farine Speciali)', tipo: 'INBOUND', stato: 'PRENOTATA', camionAssegnato: 'CAMION-FR-301 (Grands Moulins)' },
    { id: 'BAIA_BAR_04', nome: 'Baia 04 (Outbound GDO Italia)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: 'BILICO-IT-554 (Conad/Coop)' },
    { id: 'BAIA_BAR_05', nome: 'Baia 05 (Outbound Export Europa)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: 'BILICO-DE-882 (Rewe Dortmund)' },
    { id: 'BAIA_BAR_06', nome: 'Baia 06 (Outbound Buffer)', tipo: 'OUTBOUND', stato: 'LIBERA' }
  ],
  qubitCapacity: 28,
  qpuDimensioning: {
    numQubits: 28,
    hamiltonianSize: 'Matrix 2^28 (268M States)',
    shotsDefault: 1000,
    simulatorBackend: 'NVIDIA CUDA-Q cuStateVec (Cluster H100 SXM5)'
  },
  lastSyncTimestamp: '2026-03-20T10:14:00Z'
};

export const TOPOLOGY_NESTLE: PlantTopology = {
  reparti: [
    {
      id: 'rep-nes-inbound',
      nome: 'Reparto 1: Baie Inbound Polveri di Caffè & Latte (MIP)',
      moduloTecnico: 'MIP',
      responsabileLinea: 'Ing. S. Colombo',
      statoOperativo: 'OTTIMALE',
      macchineCount: 3
    },
    {
      id: 'rep-nes-wms',
      nome: 'Reparto 2: Magazzino Verticale ASRS Nescafé (WMS)',
      moduloTecnico: 'WMS',
      responsabileLinea: 'A. De Luca',
      statoOperativo: 'OTTIMALE',
      macchineCount: 5
    },
    {
      id: 'rep-nes-ecs',
      nome: 'Reparto 3: Fasciatori Rotativi Bema & Confezionamento (ECS)',
      moduloTecnico: 'ECS',
      responsabileLinea: 'R. Villa',
      statoOperativo: 'OTTIMALE',
      macchineCount: 4
    },
    {
      id: 'rep-nes-yms',
      nome: 'Reparto 4: Baie Spedizioni Nazionali & Hub Logistico (YMS)',
      moduloTecnico: 'YMS',
      responsabileLinea: 'F. Riva',
      statoOperativo: 'OTTIMALE',
      macchineCount: 6
    }
  ],
  macchinari: [
    { id: 'M-NES-BEMA-01', nome: 'Bema Silkworm Assago Rullo 1', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB202.DBW12_SPEED', stato: 'IN_MARCIA', telemetria: { rpm: 47.2, tensione_newton: 142.0, spessore_film: 20 } },
    { id: 'M-NES-BEMA-02', nome: 'Bema Silkworm Assago Rullo 2', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB202.DBW14_SPEED', stato: 'IN_MARCIA', telemetria: { rpm: 45.8, tensione_newton: 144.5, spessore_film: 20 } },
    { id: 'M-NES-ASRS-01', nome: 'Trasloelevatore ASRS Nestlé Corsia Est', tipo: 'TRASLOELEVATORE_SMARTSTORE', reparto: 'Reparto 2', plcTag: 'DB410.DBD04_HEIGHT', stato: 'IN_MARCIA', telemetria: { velocita_ms: 3.5, saturazione_corsia: 83.2 } },
    { id: 'M-NES-PAL-01', nome: 'Pallettizzatore Robotizzato Astucci Nescafé', tipo: 'PALLETTIZZATORE', reparto: 'Reparto 3', plcTag: 'DB112.DBX1.0_READY', stato: 'IN_MARCIA', telemetria: { pacchi_minuto: 135 } }
  ],
  flottaAgv: [
    { id: 'LGV_NES_01', modello: 'E80 CB12 Compact Agile', batteriaSoC: 88, temperatura: 30.1, posizione: 'Nodo A-04 (Confezionamento)', stato: 'MISSIONE' },
    { id: 'LGV_NES_02', modello: 'E80 CB12 Compact Agile', batteriaSoC: 91, temperatura: 29.8, posizione: 'Nodo A-11 (Corsia WMS)', stato: 'MISSIONE' },
    { id: 'LGV_NES_03', modello: 'E80 CB16 Heavy Pallet', batteriaSoC: 38, temperatura: 41.2, posizione: 'Stazione Ricarica Fast B-01', stato: 'IN_CARICA' },
    { id: 'LGV_NES_04', modello: 'E80 CB16 Heavy Pallet', batteriaSoC: 74, temperatura: 33.0, posizione: 'Nodo B-06 (Baia Outbound 2)', stato: 'MISSIONE' }
  ],
  baie: [
    { id: 'BAIA_NES_01', nome: 'Baia Inbound 01 (Materie Prime)', tipo: 'INBOUND', stato: 'OCCUPATA', camionAssegnato: 'CAMION-CH-710 (Nestlé Supply)' },
    { id: 'BAIA_NES_02', nome: 'Baia Inbound 02 (Packaging & Film)', tipo: 'INBOUND', stato: 'LIBERA' },
    { id: 'BAIA_NES_03', nome: 'Baia Outbound 01 (Carico Espresso Nord)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: 'BILICO-IT-229 (Esselunga Hub)' },
    { id: 'BAIA_NES_04', nome: 'Baia Outbound 02 (Carico Centro-Sud)', tipo: 'OUTBOUND', stato: 'LIBERA' }
  ],
  qubitCapacity: 24,
  qpuDimensioning: {
    numQubits: 24,
    hamiltonianSize: 'Matrix 2^24 (16.7M States)',
    shotsDefault: 1000,
    simulatorBackend: 'NVIDIA CUDA-Q / QPU IonQ Forte'
  },
  lastSyncTimestamp: '2026-03-20T09:40:00Z'
};

export const TOPOLOGY_SANTANNA: PlantTopology = {
  reparti: [
    {
      id: 'rep-sta-inbound',
      nome: 'Reparto 1: Ricevimento Preforme PET & Tappi (MIP)',
      moduloTecnico: 'MIP',
      responsabileLinea: 'Ing. M. Rosso',
      statoOperativo: 'OTTIMALE',
      macchineCount: 3
    },
    {
      id: 'rep-sta-wms',
      nome: 'Reparto 2: Polmone Gravitazionale Pallet Acqua (WMS)',
      moduloTecnico: 'WMS',
      responsabileLinea: 'E. Bruno',
      statoOperativo: 'OTTIMALE',
      macchineCount: 8
    },
    {
      id: 'rep-sta-ecs',
      nome: 'Reparto 3: Fasciatori Bema Silkworm Ultra-High Speed (ECS)',
      moduloTecnico: 'ECS',
      responsabileLinea: 'G. Allione',
      statoOperativo: 'OTTIMALE',
      macchineCount: 6
    },
    {
      id: 'rep-sta-yms',
      nome: 'Reparto 4: Baie di Carico Rapido Fardelli Vinadio (YMS)',
      moduloTecnico: 'YMS',
      responsabileLinea: 'L. Viale',
      statoOperativo: 'ATTENZIONE',
      macchineCount: 10
    }
  ],
  macchinari: [
    { id: 'M-STA-BEMA-01', nome: 'Fasciatore Bema Vinadio Linea 1.5L', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB180.DBW02_TENS', stato: 'IN_MARCIA', telemetria: { rpm: 52.0, tensione_newton: 165.0, spessore_film: 25 } },
    { id: 'M-STA-BEMA-02', nome: 'Fasciatore Bema Vinadio Linea 0.5L', tipo: 'BEMA_FASCIATORE', reparto: 'Reparto 3', plcTag: 'DB180.DBW04_TENS', stato: 'IN_MARCIA', telemetria: { rpm: 54.5, tensione_newton: 162.0, spessore_film: 25 } },
    { id: 'M-STA-ASRS-01', nome: 'Navetta Gravitazionale Buffer Vinadio', tipo: 'TRASLOELEVATORE_SMARTSTORE', reparto: 'Reparto 2', plcTag: 'DB50.DBD20_SHUTTLE_X', stato: 'IN_MARCIA', telemetria: { velocita_ms: 4.2, saturazione_corsia: 89.0 } },
    { id: 'M-STA-PAL-01', nome: 'Fardellatrice + Pallettizzatore Linea Rebella', tipo: 'PALLETTIZZATORE', reparto: 'Reparto 3', plcTag: 'DB60.DBX4.1_OK', stato: 'IN_MARCIA', telemetria: { fardelli_ora: 4200 } }
  ],
  flottaAgv: [
    { id: 'LGV_STA_01', modello: 'E80 CB20 Double Pallet High Velocity', batteriaSoC: 96, temperatura: 28.5, posizione: 'Tunnel Navette Linea Sorgente', stato: 'MISSIONE' },
    { id: 'LGV_STA_02', modello: 'E80 CB20 Double Pallet High Velocity', batteriaSoC: 85, temperatura: 31.0, posizione: 'Baia Carico 04', stato: 'MISSIONE' },
    { id: 'LGV_STA_03', modello: 'E80 CB20 Double Pallet High Velocity', batteriaSoC: 72, temperatura: 33.4, posizione: 'Corsia Buffer 2', stato: 'MISSIONE' },
    { id: 'LGV_STA_04', modello: 'E80 CB20 Double Pallet High Velocity', batteriaSoC: 40, temperatura: 38.0, posizione: 'Stazione Fast Charge 01', stato: 'IN_CARICA' },
    { id: 'LGV_STA_05', modello: 'E80 CB16 Forche Singole', batteriaSoC: 89, temperatura: 29.2, posizione: 'Scarico Preforme', stato: 'MISSIONE' }
  ],
  baie: [
    { id: 'BAIA_STA_01', nome: 'Baia Inbound 01 (Preforme & Tappi)', tipo: 'INBOUND', stato: 'LIBERA' },
    { id: 'BAIA_STA_02', nome: 'Baia Inbound 02 (Materiali Ausiliari)', tipo: 'INBOUND', stato: 'OCCUPATA', camionAssegnato: 'CAMION-IT-004 (Packaging Vinadio)' },
    { id: 'BAIA_STA_03', nome: 'Baia Outbound 01 (Treno Carico Bilici GDO)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: 'BILICO-IT-911 (ItalTrans)' },
    { id: 'BAIA_STA_04', nome: 'Baia Outbound 02 (Treno Carico Bilici GDO)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: 'BILICO-IT-812 (Lapi Logistica)' },
    { id: 'BAIA_STA_05', nome: 'Baia Outbound 03 (Export Francia & Spagna)', tipo: 'OUTBOUND', stato: 'PRENOTATA', camionAssegnato: 'BILICO-FR-450 (Geodis)' }
  ],
  qubitCapacity: 30,
  qpuDimensioning: {
    numQubits: 30,
    hamiltonianSize: 'Matrix 2^30 (1.07B States)',
    shotsDefault: 1000,
    simulatorBackend: 'D-Wave Advantage 5000+ / Hybrid QAOA'
  },
  lastSyncTimestamp: '2026-03-20T10:05:00Z'
};

// Preset Templates that Admin can choose from to quickly populate the form
export interface PlantTemplatePreset {
  id: string;
  brand: string;
  nome: string;
  sito: string;
  endpoint: string;
  protocol: IndustrialProtocol;
  plcIp: string;
  color: string;
  qpuTarget: string;
  descrizione: string;
}

export const PLANT_TEMPLATES: PlantTemplatePreset[] = [
  {
    id: 'ferrero_alba',
    brand: 'Ferrero',
    nome: 'Ferrero (Stabilimento Principale di Alba)',
    sito: 'Alba, Cuneo (CN)',
    endpoint: 'https://ferrero-alba.smile80.net/api/v1',
    protocol: 'REST_HTTPS',
    plcIp: '10.50.100.10:502',
    color: '#d97706',
    qpuTarget: 'Simulatore GPU CUDA-Q (cuStateVec - H100)',
    descrizione: 'Linea Nutella & Rocher con 14 veicoli LGV E80 e 4 fasciatori Bema Silkworm.'
  },
  {
    id: 'lavazza_torino',
    brand: 'Lavazza',
    nome: 'Lavazza (Hub Logistico & Tostatura Torino)',
    sito: 'Settimo Torinese, Torino (TO)',
    endpoint: 'https://lavazza-hub.smile80.net/opcua',
    protocol: 'OPC_UA',
    plcIp: '192.168.44.20:4840',
    color: '#9333ea',
    qpuTarget: 'QPU Gate-Based Rigetti / IonQ',
    descrizione: 'Magazzino SmartStore a 36 metri con navette ASRS e carrelli trilaterali LGV.'
  },
  {
    id: 'campari_novi',
    brand: 'Campari Group',
    nome: 'Campari (Stabilimento di Novi Ligure)',
    sito: 'Novi Ligure, Alessandria (AL)',
    endpoint: 'https://campari-novi.smile80.net/mqtt',
    protocol: 'MQTT',
    plcIp: '172.16.80.1:1883',
    color: '#e11d48',
    qpuTarget: 'Quantum Annealer D-Wave Advantage',
    descrizione: 'Linee di imbottigliamento ad alta cadenza Aperol/Campari e 10 baie di carico.'
  },
  {
    id: 'granarolo_bologna',
    brand: 'Granarolo',
    nome: 'Granarolo (Polo Produttivo & Fresh Hub)',
    sito: 'Bologna, Emilia-Romagna (BO)',
    endpoint: 'https://granarolo-fresh.smile80.net/api/v1',
    protocol: 'REST_HTTPS',
    plcIp: '10.30.12.5:502',
    color: '#059669',
    qpuTarget: 'Edge AI Quantistico Silkworm',
    descrizione: 'Catena del freddo 0-4°C con gestione priorità scadenze latte e formaggi.'
  }
];

export interface AutoDiscoveryResult {
  tenant: FactoryTenant;
  createdOperators: UserAccount[];
  isReconnection?: boolean;
  newDiscoveredItems?: string[];
  summary: {
    macchinariCount: number;
    agvCount: number;
    baieCount: number;
    repartiCount: number;
    qubitsAllocated: number;
    handshakeLatencyMs: number;
    newMachinesDiscoveredCount?: number;
  };
}

export const PlantAutoDiscoveryService = {
  /**
   * Performs real/simulated Handshake with SM.I.LE80, scans plant hierarchy,
   * generates/updates topology with machines/AGVs/bays, and automatically generates
   * operators for the lines discovered.
   */
  async discoverAndConnectPlant(params: {
    nome: string;
    sito: string;
    endpoint: string;
    protocol: IndustrialProtocol;
    plcIp?: string;
    logoColor?: string;
    qpuTarget?: string;
    wmsApiKey?: string;
    existingTenantId?: string;
  }): Promise<AutoDiscoveryResult> {
    // 1. Simulate handshake latency with E80 Gateway
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 800));
    const latency = Math.round(15 + Math.random() * 25);

    // Check if we are reconnecting to an existing tenant
    const allTenants = AuthStorage.getTenants();
    const existingTenant = params.existingTenantId
      ? allTenants.find(t => t.id === params.existingTenantId)
      : allTenants.find(t => t.nome.toLowerCase() === params.nome.trim().toLowerCase());

    // Extract slug for IDs and usernames
    const rawBrand = params.nome.split('(')[0].trim();
    const cleanBrand = rawBrand.toLowerCase().replace(/[^a-z0-9]/g, '');
    const prefix = cleanBrand.slice(0, 8) || 'plant';

    // IF RECONNECTING TO AN EXISTING TENANT:
    if (existingTenant) {
      let baseTopology = existingTenant.plantTopology;
      if (!baseTopology) {
        if (existingTenant.id === 'barilla') baseTopology = TOPOLOGY_BARILLA;
        else if (existingTenant.id === 'nestle') baseTopology = TOPOLOGY_NESTLE;
        else if (existingTenant.id === 'santanna') baseTopology = TOPOLOGY_SANTANNA;
        else baseTopology = TOPOLOGY_BARILLA;
      }

      // 1. Refresh telemetry of existing machinery
      const updatedMacchinari = baseTopology.macchinari.map(m => {
        if (m.tipo === 'BEMA_FASCIATORE') {
          const newRpm = +(46 + Math.random() * 4).toFixed(1);
          const newTensione = +(145 + Math.random() * 10).toFixed(1);
          return {
            ...m,
            stato: 'IN_MARCIA' as const,
            telemetria: { ...m.telemetria, rpm: newRpm, tensione_newton: newTensione }
          };
        }
        if (m.tipo === 'TRASLOELEVATORE_SMARTSTORE') {
          const newSat = +(78 + Math.random() * 18).toFixed(1);
          return {
            ...m,
            stato: 'IN_MARCIA' as const,
            telemetria: { ...m.telemetria, saturazione_corsia: newSat }
          };
        }
        return m;
      });

      // 2. Discover new machinery if not yet added!
      const newDiscoveredItems: string[] = [
        `Handshake mTLS completato con Gateway ${params.endpoint} (${latency} ms)`,
        `Telemetria aggiornata in tempo reale per ${updatedMacchinari.length} macchine attive`
      ];
      let newMachinesAdded = 0;

      const hasNewMachine = updatedMacchinari.some(m => m.id.includes('NEW-BEMA') || m.id.includes('FAST'));
      if (!hasNewMachine) {
        const newAsset: MachineAsset = {
          id: `M-${prefix.toUpperCase()}-NEW-BEMA-03`,
          nome: `Nuovo Fasciatore Robot BEMA Silkworm Ultra-Fast 03 (${rawBrand})`,
          tipo: 'BEMA_FASCIATORE',
          reparto: baseTopology.reparti[2]?.nome || 'Reparto 3: Fasciatori BEMA',
          plcTag: 'DB104.DBW30_NEW_SILKWORM_RPM',
          stato: 'IN_MARCIA',
          telemetria: { rpm: 52.0, tensione_newton: 155.0, spessore_film: 23, nuovo_installato: true }
        };
        updatedMacchinari.push(newAsset);
        newMachinesAdded++;
        newDiscoveredItems.push(`Rilevato 1 Nuovo Macchinario integrato nel PLC: "${newAsset.nome}" (Tag: ${newAsset.plcTag})`);
      }

      // 3. Update AGVs
      const updatedAgv = baseTopology.flottaAgv.map(agv => {
        const delta = agv.stato === 'IN_CARICA' ? 4 : -2;
        const newSoC = Math.min(100, Math.max(18, agv.batteriaSoC + delta));
        return {
          ...agv,
          batteriaSoC: newSoC,
          temperatura: +(30 + Math.random() * 6).toFixed(1)
        };
      });

      const hasNewAgv = updatedAgv.some(a => a.id.includes('NEW'));
      if (!hasNewAgv) {
        const newAgv: AgvVehicle = {
          id: `LGV_${prefix.toUpperCase()}_NEW_09`,
          modello: 'E80 CB20 Heavy Duty (Doppia Forca Silkworm)',
          batteriaSoC: 98,
          temperatura: 28.5,
          posizione: 'Nodo N-30 (Uscita Nuovo Fasciatore BEMA 03)',
          stato: 'MISSIONE'
        };
        updatedAgv.push(newAgv);
        newDiscoveredItems.push(`Rilevato 1 Nuovo Carrello Laser Guided Vehicle: "${newAgv.modello}" (${newAgv.id})`);
      }

      // 4. Update bays
      const updatedBaie = baseTopology.baie.map((b, idx) => ({
        ...b,
        stato: (idx % 2 === 0 ? 'OCCUPATA' : 'LIBERA') as any
      }));

      // 5. Dynamic QPU allocation
      const totalNodes = updatedMacchinari.length + updatedAgv.length + updatedBaie.length;
      const qubitsAllocated = Math.min(36, Math.max(22, totalNodes));

      const updatedTopology: PlantTopology = {
        ...baseTopology,
        macchinari: updatedMacchinari,
        flottaAgv: updatedAgv,
        baie: updatedBaie,
        qubitCapacity: qubitsAllocated,
        qpuDimensioning: {
          numQubits: qubitsAllocated,
          hamiltonianSize: `Matrix 2^${qubitsAllocated} (${(Math.pow(2, qubitsAllocated) / 1000000).toFixed(1)}M States)`,
          shotsDefault: 1000,
          simulatorBackend: params.qpuTarget || 'NVIDIA CUDA-Q cuStateVec (Cluster H100 SXM5)'
        },
        lastSyncTimestamp: new Date().toISOString()
      };

      // 6. Update Tenant in AuthStorage
      const updatedTenant: FactoryTenant = {
        ...existingTenant,
        nome: params.nome.trim(),
        sito: params.sito.trim(),
        endpoint: params.endpoint.trim(),
        protocol: params.protocol,
        plcIp: params.plcIp?.trim() || existingTenant.plcIp,
        logoColor: params.logoColor || existingTenant.logoColor,
        connectionStatus: 'CONNESSO',
        plantTopology: updatedTopology
      };

      AuthStorage.updateTenant(updatedTenant);

      // Verify or generate operator accounts for this tenant
      const existingOperators = AuthStorage.getUsers().filter(u => u.tenantId === updatedTenant.id);
      const defaultPassword = `${prefix}2026`;
      const operatorBlueprints = [
        {
          username: `op_${prefix}_inbound`,
          nomeCompleto: `Marco Bianchi (Op. Inbound - ${rawBrand})`,
          lineaAssegnata: `Linea 1: Ricevimento & Baie Inbound (${params.sito})`,
          password: defaultPassword
        },
        {
          username: `op_${prefix}_magazzino`,
          nomeCompleto: `Giulia Rossi (Op. WMS & SmartStore - ${rawBrand})`,
          lineaAssegnata: `Linea 2: Magazzino SmartStore & ASRS (${params.sito})`,
          password: defaultPassword
        },
        {
          username: `op_${prefix}_finelinea`,
          nomeCompleto: `Davide Conti (Op. Fasciatori BEMA & AGV - ${rawBrand})`,
          lineaAssegnata: `Linea 3: Fasciatori BEMA & Flotta LGV (${params.sito})`,
          password: defaultPassword
        },
        {
          username: `op_${prefix}`,
          nomeCompleto: `Operatore Generale (${rawBrand})`,
          lineaAssegnata: `Tutte le Linee di Produzione (${params.sito})`,
          password: prefix
        }
      ];

      const allOps = [...existingOperators];
      for (const ob of operatorBlueprints) {
        if (!allOps.some(u => u.username.toLowerCase() === ob.username.toLowerCase())) {
          const created = AuthStorage.addUser({
            username: ob.username,
            nomeCompleto: ob.nomeCompleto,
            ruolo: 'Operatore di Linea',
            password: ob.password,
            lineaAssegnata: ob.lineaAssegnata,
            tenantId: updatedTenant.id,
            attivo: true
          });
          allOps.push(created);
        }
      }

      return {
        tenant: updatedTenant,
        createdOperators: allOps,
        isReconnection: true,
        newDiscoveredItems,
        summary: {
          macchinariCount: updatedMacchinari.length,
          agvCount: updatedAgv.length,
          baieCount: updatedBaie.length,
          repartiCount: updatedTopology.reparti.length,
          qubitsAllocated,
          handshakeLatencyMs: latency,
          newMachinesDiscoveredCount: newMachinesAdded
        }
      };
    }

    // IF CONNECTING A BRAND NEW TENANT:
    // 2. Build discovered departments
    const reparti: PlantDepartment[] = [
      {
        id: `rep-${prefix}-inbound`,
        nome: `Reparto 1: Inbound & Ricevimento Materie Prime (${rawBrand})`,
        moduloTecnico: 'MIP',
        responsabileLinea: `Capoturno Inbound ${rawBrand}`,
        statoOperativo: 'OTTIMALE',
        macchineCount: 4
      },
      {
        id: `rep-${prefix}-wms`,
        nome: `Reparto 2: Magazzino Automatico SmartStore & ASRS (${rawBrand})`,
        moduloTecnico: 'WMS',
        responsabileLinea: `Resp. Magazzino ${rawBrand}`,
        statoOperativo: 'OTTIMALE',
        macchineCount: 6
      },
      {
        id: `rep-${prefix}-ecs`,
        nome: `Reparto 3: Fasciatori Robot BEMA Silkworm & Fine Linea (${rawBrand})`,
        moduloTecnico: 'ECS',
        responsabileLinea: `Tecnico Fine Linea ${rawBrand}`,
        statoOperativo: 'OTTIMALE',
        macchineCount: 5
      },
      {
        id: `rep-${prefix}-yms`,
        nome: `Reparto 4: Baie di Carico & Spedizioni Piazzale (${rawBrand})`,
        moduloTecnico: 'YMS',
        responsabileLinea: `Resp. Spedizioni ${rawBrand}`,
        statoOperativo: 'OTTIMALE',
        macchineCount: 6
      }
    ];

    // 3. Build discovered machinery
    const macchinari: MachineAsset[] = [
      {
        id: `M-${prefix.toUpperCase()}-BEMA-01`,
        nome: `Fasciatore BEMA Silkworm 01 (${rawBrand})`,
        tipo: 'BEMA_FASCIATORE',
        reparto: reparti[2].nome,
        plcTag: 'DB104.DBW10_VELOCITA_ROBOT',
        stato: 'IN_MARCIA',
        telemetria: { rpm: 48.0, tensione_newton: 150.0, spessore_film: 23 }
      },
      {
        id: `M-${prefix.toUpperCase()}-BEMA-02`,
        nome: `Fasciatore BEMA Silkworm 02 (${rawBrand})`,
        tipo: 'BEMA_FASCIATORE',
        reparto: reparti[2].nome,
        plcTag: 'DB104.DBW12_TENSIONE',
        stato: 'IN_MARCIA',
        telemetria: { rpm: 47.5, tensione_newton: 146.0, spessore_film: 23 }
      },
      {
        id: `M-${prefix.toUpperCase()}-ASRS-01`,
        nome: `Trasloelevatore SmartStore Corsia A (${rawBrand})`,
        tipo: 'TRASLOELEVATORE_SMARTSTORE',
        reparto: reparti[1].nome,
        plcTag: 'DB210.DBD04_COORD_Z',
        stato: 'IN_MARCIA',
        telemetria: { velocita_ms: 3.4, saturazione_corsia: 87.5 }
      },
      {
        id: `M-${prefix.toUpperCase()}-ASRS-02`,
        nome: `Trasloelevatore SmartStore Corsia B (${rawBrand})`,
        tipo: 'TRASLOELEVATORE_SMARTSTORE',
        reparto: reparti[1].nome,
        plcTag: 'DB210.DBD08_COORD_Z',
        stato: 'IN_MARCIA',
        telemetria: { velocita_ms: 3.2, saturazione_corsia: 82.0 }
      },
      {
        id: `M-${prefix.toUpperCase()}-PAL-01`,
        nome: `Pallettizzatore Robotizzato di Testa (${rawBrand})`,
        tipo: 'PALLETTIZZATORE',
        reparto: reparti[2].nome,
        plcTag: 'DB110.DBX0.2_READY',
        stato: 'IN_MARCIA',
        telemetria: { cadenza_pallet_ora: 48 }
      },
      {
        id: `M-${prefix.toUpperCase()}-RULL-01`,
        nome: `Rulliera di Ricevimento Materie Prime (${rawBrand})`,
        tipo: 'RULLIERA_INBOUND',
        reparto: reparti[0].nome,
        plcTag: 'DB12.DBW06_FOTOCELLULA',
        stato: 'IN_MARCIA',
        telemetria: { colli_minuto: 35 }
      }
    ];

    // 4. Build discovered LGV Fleet (6 vehicles)
    const flottaAgv: AgvVehicle[] = [
      { id: `LGV_${prefix.toUpperCase()}_01`, modello: 'E80 CB16 Counterbalanced (Forche Singole)', batteriaSoC: 94, temperatura: 31.0, posizione: 'Nodo N-01 (Scarico Bema 1)', stato: 'MISSIONE' },
      { id: `LGV_${prefix.toUpperCase()}_02`, modello: 'E80 CB16 Counterbalanced (Forche Singole)', batteriaSoC: 86, temperatura: 33.2, posizione: 'Nodo N-07 (Ingresso Magazzino)', stato: 'MISSIONE' },
      { id: `LGV_${prefix.toUpperCase()}_03`, modello: 'E80 Reach Truck (Doppia Profondità)', batteriaSoC: 79, temperatura: 34.0, posizione: 'Nodo N-12 (Picking ASRS)', stato: 'MISSIONE' },
      { id: `LGV_${prefix.toUpperCase()}_04`, modello: 'E80 CB20 Heavy Duty (Doppio Pallet)', batteriaSoC: 42, temperatura: 40.5, posizione: 'Stazione Ricarica Fast Bat-01', stato: 'IN_CARICA' },
      { id: `LGV_${prefix.toUpperCase()}_05`, modello: 'E80 CB16 Counterbalanced', batteriaSoC: 98, temperatura: 28.0, posizione: 'Area Parcheggio Buffer', stato: 'IDLE' },
      { id: `LGV_${prefix.toUpperCase()}_06`, modello: 'E80 CB20 Heavy Duty', batteriaSoC: 68, temperatura: 36.4, posizione: 'Nodo N-18 (Baia Carico 02)', stato: 'MISSIONE' }
    ];

    // 5. Build discovered Loading Bays
    const baie: BayAsset[] = [
      { id: `BAIA_${prefix.toUpperCase()}_01`, nome: 'Baia Inbound 01 (Materie Prime)', tipo: 'INBOUND', stato: 'OCCUPATA', camionAssegnato: `BILICO-IT-${Math.floor(100 + Math.random() * 899)} (Logistica ${rawBrand})` },
      { id: `BAIA_${prefix.toUpperCase()}_02`, nome: 'Baia Inbound 02 (Packaging & Film)', tipo: 'INBOUND', stato: 'LIBERA' },
      { id: `BAIA_${prefix.toUpperCase()}_03`, nome: 'Baia Outbound 01 (Carico Primario)', tipo: 'OUTBOUND', stato: 'OCCUPATA', camionAssegnato: `BILICO-EU-${Math.floor(100 + Math.random() * 899)}` },
      { id: `BAIA_${prefix.toUpperCase()}_04`, nome: 'Baia Outbound 02 (Spedizioni GDO)', tipo: 'OUTBOUND', stato: 'LIBERA' },
      { id: `BAIA_${prefix.toUpperCase()}_05`, nome: 'Baia Outbound 03 (Buffer di Scorta)', tipo: 'OUTBOUND', stato: 'PRENOTATA', camionAssegnato: `BILICO-IT-${Math.floor(100 + Math.random() * 899)}` }
    ];

    // 6. Dynamic QPU Dimensioning
    const totalNodes = macchinari.length + flottaAgv.length + baie.length;
    const qubitsAllocated = Math.min(36, Math.max(20, totalNodes));

    const plantTopology: PlantTopology = {
      reparti,
      macchinari,
      flottaAgv,
      baie,
      qubitCapacity: qubitsAllocated,
      qpuDimensioning: {
        numQubits: qubitsAllocated,
        hamiltonianSize: `Matrix 2^${qubitsAllocated} (${(Math.pow(2, qubitsAllocated) / 1000000).toFixed(1)}M States)`,
        shotsDefault: 1000,
        simulatorBackend: params.qpuTarget || 'NVIDIA CUDA-Q cuStateVec (Cluster H100 SXM5)'
      },
      lastSyncTimestamp: new Date().toISOString()
    };

    // 7. Create and persist the new FactoryTenant
    const createdTenant = AuthStorage.addTenant({
      nome: params.nome.trim(),
      sito: params.sito.trim(),
      endpoint: params.endpoint.trim(),
      protocol: params.protocol,
      connectionStatus: 'CONNESSO',
      plcIp: params.plcIp?.trim() || `${params.endpoint.replace(/^https?:\/\//, '').split('/')[0]}:502`,
      qpuTarget: params.qpuTarget || 'Simulatore GPU CUDA-Q (cuStateVec)',
      logoColor: params.logoColor || '#3b82f6',
      plantTopology
    });

    // 8. AUTOMATICALLY GENERATE OPERATOR ACCOUNTS for this new plant
    const defaultPassword = `${prefix}2026`;
    const operatorBlueprints = [
      {
        username: `op_${prefix}_inbound`,
        nomeCompleto: `Marco Bianchi (Op. Inbound - ${rawBrand})`,
        lineaAssegnata: `Linea 1: Ricevimento & Baie Inbound (${params.sito})`,
        password: defaultPassword
      },
      {
        username: `op_${prefix}_magazzino`,
        nomeCompleto: `Giulia Rossi (Op. WMS & SmartStore - ${rawBrand})`,
        lineaAssegnata: `Linea 2: Magazzino SmartStore & ASRS (${params.sito})`,
        password: defaultPassword
      },
      {
        username: `op_${prefix}_finelinea`,
        nomeCompleto: `Davide Conti (Op. Fasciatori BEMA & AGV - ${rawBrand})`,
        lineaAssegnata: `Linea 3: Fasciatori BEMA & Flotta LGV (${params.sito})`,
        password: defaultPassword
      },
      {
        username: `op_${prefix}`,
        nomeCompleto: `Operatore Generale (${rawBrand})`,
        lineaAssegnata: `Tutte le Linee di Produzione (${params.sito})`,
        password: prefix
      }
    ];

    const createdOperators: UserAccount[] = [];
    for (const ob of operatorBlueprints) {
      // Check if not already existing
      const existing = AuthStorage.getUsers().find(u => u.username.toLowerCase() === ob.username.toLowerCase());
      if (!existing) {
        const op = AuthStorage.addUser({
          username: ob.username,
          nomeCompleto: ob.nomeCompleto,
          ruolo: 'Operatore di Linea',
          password: ob.password,
          lineaAssegnata: ob.lineaAssegnata,
          tenantId: createdTenant.id,
          attivo: true
        });
        createdOperators.push(op);
      } else {
        createdOperators.push(existing);
      }
    }

    return {
      tenant: createdTenant,
      createdOperators,
      isReconnection: false,
      newDiscoveredItems: [
        `Nuovo Stabilimento SM.I.LE80 registrato con successo`,
        `Rilevati ${macchinari.length} macchinari e ${flottaAgv.length} LGV in topologia`,
        `QPU dimensionata a ${qubitsAllocated} Qubit (Simulatore CUDA-Q)`
      ],
      summary: {
        macchinariCount: macchinari.length,
        agvCount: flottaAgv.length,
        baieCount: baie.length,
        repartiCount: reparti.length,
        qubitsAllocated,
        handshakeLatencyMs: latency,
        newMachinesDiscoveredCount: macchinari.length
      }
    };
  },

  /**
   * Re-sync an existing tenant with SM.I.LE80 to refresh telemetry, battery levels, and machine statuses
   */
  async resyncTenant(tenant: FactoryTenant): Promise<FactoryTenant> {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Update existing topology or generate default if missing
    let currentTopology = tenant.plantTopology;
    if (!currentTopology) {
      if (tenant.id === 'barilla') currentTopology = TOPOLOGY_BARILLA;
      else if (tenant.id === 'nestle') currentTopology = TOPOLOGY_NESTLE;
      else if (tenant.id === 'santanna') currentTopology = TOPOLOGY_SANTANNA;
      else currentTopology = TOPOLOGY_BARILLA;
    }

    // Refresh telemetry with slight realistic jitter
    const updatedMacchinari = currentTopology.macchinari.map(m => {
      if (m.tipo === 'BEMA_FASCIATORE') {
        const baseRpm = m.telemetria?.rpm || 48.0;
        const newRpm = +(baseRpm + (Math.random() * 2 - 1)).toFixed(1);
        const newTensione = +(148 + (Math.random() * 8 - 4)).toFixed(1);
        return { ...m, telemetria: { ...m.telemetria, rpm: newRpm, tensione_newton: newTensione } };
      }
      return m;
    });

    const updatedAgv = currentTopology.flottaAgv.map(agv => {
      const batteryDelta = agv.stato === 'IN_CARICA' ? +3 : -1;
      const newSoC = Math.min(100, Math.max(15, agv.batteriaSoC + batteryDelta));
      return { ...agv, batteriaSoC: newSoC };
    });

    const updatedTopology: PlantTopology = {
      ...currentTopology,
      macchinari: updatedMacchinari,
      flottaAgv: updatedAgv,
      lastSyncTimestamp: new Date().toISOString()
    };

    const updatedTenant: FactoryTenant = {
      ...tenant,
      connectionStatus: 'CONNESSO',
      plantTopology: updatedTopology
    };

    // Persist in tenants
    const all = AuthStorage.getTenants().map(t => t.id === tenant.id ? updatedTenant : t);
    AuthStorage.saveTenants(all);

    return updatedTenant;
  }
};
