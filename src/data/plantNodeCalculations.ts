import { FactoryTenant } from '../types/quantum';

export interface PlantNodeRequirement {
  calcId: number;
  nodeName: string;
  nodeCategory: 'Inbound & Materie Prime' | 'Magazzino & Stoccaggio' | 'Outbound & Spedizioni' | 'IoT & Macchine';
  hardwareDescription: string;
  checkAvailability: (tenant?: FactoryTenant) => boolean;
}

export const PLANT_NODE_REQUIREMENTS: Record<number, PlantNodeRequirement> = {
  1: {
    calcId: 1,
    nodeName: 'Baie Inbound & Piazzale Scarico',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Sensori baie di scarico WMS, telemetria camion in piazzale',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.baie?.some(b => b.tipo === 'INBOUND') ||
        topo.macchinari?.some(m => m.tipo === 'BAIA_CARICO' || m.tipo === 'RULLIERA_INBOUND') ||
        topo.reparti?.some(r => r.moduloTecnico === 'MIP' || r.moduloTecnico === 'YMS') ||
        false
      );
    }
  },
  2: {
    calcId: 2,
    nodeName: 'Baie Inbound & Linea Ricevimento',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Monitoraggio disponibilità baie e ritardi stimati fornitori',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.baie?.some(b => b.tipo === 'INBOUND') ||
        topo.reparti?.some(r => r.moduloTecnico === 'MIP') ||
        false
      );
    }
  },
  3: {
    calcId: 3,
    nodeName: 'Baie Totali & Turni Reparto Inbound',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Pianificazione risorse umane e saturazione baie 24h',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return (t.plantTopology.baie?.length || 0) > 0 || (t.plantTopology.reparti?.length || 0) > 0;
    }
  },
  4: {
    calcId: 4,
    nodeName: 'Controllo Qualità Lotti & Laboratorio',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Sensori igrometrici, spessimetro laser film e bobine',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.reparti?.some(r => r.moduloTecnico === 'MIP' || r.nome.toLowerCase().includes('materie') || r.nome.toLowerCase().includes('qualit')) ||
        topo.macchinari?.some(m => m.tipo === 'RULLIERA_INBOUND') ||
        Boolean(topo.deepDataNodes?.fasciatoriSilkworm?.length || topo.fasciatoriSilkworm?.length) ||
        false
      );
    }
  },
  5: {
    calcId: 5,
    nodeName: 'Modulo Tracciabilità Materiali & WMS',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Gateway crittografico lotti materie prime, protocolli fornitore',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return t.plantTopology.reparti?.some(r => r.moduloTecnico === 'MIP' || r.moduloTecnico === 'WMS') || false;
    }
  },
  6: {
    calcId: 6,
    nodeName: 'Magazzino Intensivo SmartStore 3D',
    nodeCategory: 'Magazzino & Stoccaggio',
    hardwareDescription: 'Trasloelevatori ASRS, navette multilivello e scaffalature 3D',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'TRASLOELEVATORE_SMARTSTORE') ||
        Boolean(topo.deepDataNodes?.magazzinoSmartStore || topo.magazzinoSmartStore || topo.magazziniSmartStore?.length) ||
        topo.reparti?.some(r => r.moduloTecnico === 'WMS') ||
        false
      );
    }
  },
  7: {
    calcId: 7,
    nodeName: 'Scaffalature & Shuttle SmartStore',
    nodeCategory: 'Magazzino & Stoccaggio',
    hardwareDescription: 'Sensori inclinometrici scaffali, estensimetri pattini e shuttle',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'TRASLOELEVATORE_SMARTSTORE') ||
        Boolean(topo.deepDataNodes?.magazzinoSmartStore || topo.magazzinoSmartStore) ||
        false
      );
    }
  },
  8: {
    calcId: 8,
    nodeName: 'Corsie Picking & Navette SmartStore',
    nodeCategory: 'Magazzino & Stoccaggio',
    hardwareDescription: 'Nodi percorso carrelli di prelievo, posizionamento laser WMS',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'TRASLOELEVATORE_SMARTSTORE') ||
        (topo.flottaAgv && topo.flottaAgv.length > 0) ||
        topo.reparti?.some(r => r.moduloTecnico === 'WMS') ||
        false
      );
    }
  },
  9: {
    calcId: 9,
    nodeName: 'Batching Ordini & Server WMS',
    nodeCategory: 'Magazzino & Stoccaggio',
    hardwareDescription: 'Algoritmo raggruppamento missioni simultanee flotta e baie',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return t.plantTopology.reparti?.some(r => r.moduloTecnico === 'WMS') || false;
    }
  },
  10: {
    calcId: 10,
    nodeName: 'Baie Outbound & Spedizioni Camion',
    nodeCategory: 'Outbound & Spedizioni',
    hardwareDescription: 'Pesa a ponte, baie di carico bilici e tolleranza carico assi',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.baie?.some(b => b.tipo === 'OUTBOUND') ||
        topo.reparti?.some(r => r.moduloTecnico === 'YMS' || r.moduloTecnico === 'TMS') ||
        false
      );
    }
  },
  11: {
    calcId: 11,
    nodeName: 'Gateway e-CMR & Dogana Digitale',
    nodeCategory: 'Outbound & Spedizioni',
    hardwareDescription: 'Smart contract Post-Quantum, firma digitale trasportatori',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return t.plantTopology.baie?.some(b => b.tipo === 'OUTBOUND') || false;
    }
  },
  12: {
    calcId: 12,
    nodeName: 'Baie di Carico Outbound (Asta Conflitti)',
    nodeCategory: 'Outbound & Spedizioni',
    hardwareDescription: 'Sensori occupazione baie e priorità autisti in sosta',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return (t.plantTopology.baie?.filter(b => b.tipo === 'OUTBOUND').length || 0) >= 2;
    }
  },
  13: {
    calcId: 13,
    nodeName: 'Piazzale & Aree Buffer Rimorchi',
    nodeCategory: 'Outbound & Spedizioni',
    hardwareDescription: 'Clustering spazi polmone e gestione code autisti in piazzale',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return (
        t.plantTopology.reparti?.some(r => r.moduloTecnico === 'YMS') ||
        (t.plantTopology.baie && t.plantTopology.baie.length >= 2) ||
        false
      );
    }
  },
  14: {
    calcId: 14,
    nodeName: 'Fasciatore Bema Silkworm (Braccio Rotante)',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'Accelerometri piezoelettrici cuscinetti e encoder rotazione RPM',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'BEMA_FASCIATORE') ||
        Boolean(topo.deepDataNodes?.fasciatoriSilkworm?.length || topo.fasciatoriSilkworm?.length) ||
        false
      );
    }
  },
  15: {
    calcId: 15,
    nodeName: 'Fasciatore Bema Silkworm (Trazione Film)',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'Celle di carico tensione film e rulli di prestiro elettronico',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'BEMA_FASCIATORE') ||
        Boolean(topo.deepDataNodes?.fasciatoriSilkworm?.length || topo.fasciatoriSilkworm?.length) ||
        false
      );
    }
  },
  16: {
    calcId: 16,
    nodeName: 'Flotta Navette Laser Elettric80 LGV/AGV',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'Scanner laser di navigazione, router anticollisione e nodi corsia',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        (topo.flottaAgv && topo.flottaAgv.length > 0) ||
        Boolean(topo.deepDataNodes?.infrastrutturaTraffico || topo.infrastrutturaTraffico) ||
        false
      );
    }
  },
  17: {
    calcId: 17,
    nodeName: 'Batterie al Litio & Telemetria LGV/AGV',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'BMS di bordo navetta, stato di carica SoC e salute termica SoH',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      return (t.plantTopology.flottaAgv && t.plantTopology.flottaAgv.length > 0) || false;
    }
  },
  18: {
    calcId: 18,
    nodeName: 'Isola Robotica di Pallettizzazione',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'Robot antropomorfo 6 assi, vacuostati ventose presa e torce',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        topo.macchinari?.some(m => m.tipo === 'PALLETTIZZATORE' || m.tipo === 'ISOLA_ROBOT') ||
        Boolean(topo.deepDataNodes?.isolePallettizzazione?.length || topo.isolePallettizzazione?.length) ||
        false
      );
    }
  },
  19: {
    calcId: 19,
    nodeName: 'Stazioni Ricarica Rapida Fast-Charge',
    nodeCategory: 'IoT & Macchine',
    hardwareDescription: 'Piastre a induzione a pavimento, supercondensatori e gestione picchi',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      const hasStations = Boolean(topo.deepDataNodes?.infrastrutturaTraffico?.stazioniRicarica?.length || topo.infrastrutturaTraffico?.stazioniRicarica?.length);
      const hasAgv = (topo.flottaAgv && topo.flottaAgv.length > 0);
      return hasStations || hasAgv || false;
    }
  },
  20: {
    calcId: 20,
    nodeName: 'Stazione Ispezione Pallet Woodpecker',
    nodeCategory: 'Inbound & Materie Prime',
    hardwareDescription: 'Sensori pneumatici spinta pattini, sonde umidità e telecamere 3D',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        Boolean(topo.deepDataNodes?.controlloWoodpecker || (topo as any).controlloWoodpecker || (topo as any).ispezioneWoodpecker?.length || (topo as any).stazioniIspezioneWoodpecker?.length) ||
        topo.macchinari?.some(m => m.nome.toLowerCase().includes('woodpecker') || m.id.toLowerCase().includes('wood')) ||
        false
      );
    }
  },
  21: {
    calcId: 21,
    nodeName: 'Etichettatrice Robotizzata E80 Raptor',
    nodeCategory: 'Outbound & Spedizioni',
    hardwareDescription: 'Validatore ottico GS1 SSCC, testina termica e braccio applicatore',
    checkAvailability: (t) => {
      if (!t?.plantTopology) return true;
      const topo = t.plantTopology;
      return (
        Boolean(topo.deepDataNodes?.etichettatriciRaptor?.length || topo.etichettatriciRaptor?.length) ||
        topo.macchinari?.some(m => m.nome.toLowerCase().includes('raptor') || m.id.toLowerCase().includes('raptor')) ||
        false
      );
    }
  }
};

/**
 * Returns whether a calculation is supported by the plant's hardware nodes.
 */
export function isCalculationSupportedByPlant(calcId: number, tenant?: FactoryTenant): boolean {
  const req = PLANT_NODE_REQUIREMENTS[calcId];
  if (!req) return true;
  return req.checkAvailability(tenant);
}

/**
 * Returns all calculations supported by the active plant.
 */
export function getSupportedCalculationsForPlant(tenant?: FactoryTenant): number[] {
  const supported: number[] = [];
  for (let id = 1; id <= 21; id++) {
    if (isCalculationSupportedByPlant(id, tenant)) {
      supported.push(id);
    }
  }
  return supported;
}

export interface MachineryNodeDefinition {
  key: string;
  label: string;
  desc: string;
  calcIds: number[];
  hardwareTags: string[];
}

export const PLANT_MACHINERY_NODES: MachineryNodeDefinition[] = [
  {
    key: 'BEMA_FASCIATORE',
    label: 'Fasciatori Bema Silkworm (Braccio Rotante & Tensione Film)',
    desc: 'Avvolgimento pallet, monitoraggio vibrazioni cuscinetti e trazione elastica film',
    calcIds: [14, 15],
    hardwareTags: ['Fasciatore Bema', 'Silkworm', 'Prestiro']
  },
  {
    key: 'FLOTTA_LGV',
    label: 'Flotta Navette a Guida Laser Elettric80 LGV/AGV',
    desc: 'Navigazione laser, routing anticollisione e batterie BMS al litio',
    calcIds: [16, 17, 19],
    hardwareTags: ['LGV', 'AGV', 'Laser Guiding', 'Fast-Charge']
  },
  {
    key: 'SMARTSTORE',
    label: 'Magazzino Intensivo SmartStore 3D & ASRS',
    desc: 'Trasloelevatori multilivello, shuttle di stoccaggio e corsie di picking',
    calcIds: [6, 7, 8, 9],
    hardwareTags: ['SmartStore', 'Trasloelevatore', 'Shuttle 3D', 'Picking']
  },
  {
    key: 'BAIE_INBOUND_OUTBOUND',
    label: 'Baie di Carico / Scarico & Gestione Piazzale (YMS/TMS)',
    desc: 'Saturazione baie, ritardi fornitori, pesa a ponte e allocazione rimorchi',
    calcIds: [1, 2, 3, 10, 12, 13],
    hardwareTags: ['Baia 1', 'Baia Inbound', 'Baia Outbound', 'Piazzale']
  },
  {
    key: 'ISOLA_ROBOT',
    label: 'Isola Robotica di Pallettizzazione Antropomorfa',
    desc: 'Robot 6 assi, vacuostati di presa sottovuoto e cinematica colli',
    calcIds: [18],
    hardwareTags: ['Robot Pallet', 'Antropomorfo', 'Ventose']
  },
  {
    key: 'WOODPECKER',
    label: 'Stazione Ispezione Pallet E80 Woodpecker',
    desc: 'Controllo conformità pianale, deformazione pattini e umidità legno',
    calcIds: [20],
    hardwareTags: ['Woodpecker', 'Ispezione Pallet']
  },
  {
    key: 'RAPTOR',
    label: 'Etichettatrice Robotizzata E80 Raptor GS1/SSCC',
    desc: 'Applicatore etichette, verifica ottica codice a barre e testina termica',
    calcIds: [21],
    hardwareTags: ['Raptor', 'Etichettatrice', 'GS1-128']
  },
  {
    key: 'QUALITA_TRACCIABILITA',
    label: 'Controllo Qualità & Tracciabilità Materiali (MIP / e-CMR)',
    desc: 'Laboratorio campionamento, blockchain lotti e tracciabilità materie prime',
    calcIds: [4, 5, 11],
    hardwareTags: ['Qualità Lotti', 'WMS Tracciabilità', 'e-CMR']
  }
];

/**
 * Returns the permitted calculation IDs for a specific user and tenant.
 * - Amministratore: can access all calculations supported by the plant
 * - Operatore di Linea: restricted to their explicitly permitted machinery nodes or calculations
 */
export function getUserPermittedCalculations(
  user: { ruolo: string; allowedCalcIds?: number[]; allowedMachineIds?: string[]; lineaAssegnata?: string } | null,
  tenant?: FactoryTenant
): number[] {
  const plantSupported = getSupportedCalculationsForPlant(tenant);

  if (!user || user.ruolo === 'Amministratore') {
    return plantSupported;
  }

  // If specific calculation IDs are set
  if (user.allowedCalcIds && user.allowedCalcIds.length > 0) {
    const set = new Set(user.allowedCalcIds);
    return plantSupported.filter(id => set.has(id));
  }

  // If specific machinery/node keys are assigned
  if (user.allowedMachineIds && user.allowedMachineIds.length > 0) {
    const allowedSet = new Set<number>();
    for (const machineKey of user.allowedMachineIds) {
      const nodeDef = PLANT_MACHINERY_NODES.find(n => n.key === machineKey);
      if (nodeDef) {
        nodeDef.calcIds.forEach(cid => allowedSet.add(cid));
      }
    }
    if (allowedSet.size > 0) {
      return plantSupported.filter(id => allowedSet.has(id));
    }
  }

  // Infer from lineaAssegnata if specified
  if (user.lineaAssegnata) {
    const linea = user.lineaAssegnata.toLowerCase();
    const inferred = new Set<number>();

    if (linea.includes('bema') || linea.includes('fasciator')) {
      inferred.add(14);
      inferred.add(15);
    }
    if (linea.includes('lgv') || linea.includes('agv') || linea.includes('navett')) {
      inferred.add(16);
      inferred.add(17);
      inferred.add(19);
    }
    if (linea.includes('smartstore') || linea.includes('magazzino')) {
      inferred.add(6);
      inferred.add(7);
      inferred.add(8);
      inferred.add(9);
    }
    if (linea.includes('inbound') || linea.includes('ricevimento') || linea.includes('baie')) {
      inferred.add(1);
      inferred.add(2);
      inferred.add(3);
      inferred.add(20);
    }
    if (linea.includes('robot') || linea.includes('pallett')) {
      inferred.add(18);
    }
    if (inferred.size > 0) {
      return plantSupported.filter(id => inferred.has(id));
    }
  }

  // Fallback: default to plant supported
  return plantSupported;
}
