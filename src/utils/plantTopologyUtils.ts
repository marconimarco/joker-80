import { 
  FactoryTenant, 
  PlantTopology, 
  MachineAsset, 
  AgvVehicle, 
  BayAsset, 
  PlantDepartment,
  PlantNodeType
} from '../types/quantum';
import { PLANT_MACHINERY_NODES, isCalculationSupportedByPlant } from '../data/plantNodeCalculations';
import { buildDeepDataForPlant, buildAgvDeepData } from '../services/plantAutoDiscovery';

/**
 * Returns which of the 8 macro-nodes are active for a given tenant.
 */
export function getPlantActiveNodeKeys(plant?: FactoryTenant): string[] {
  if (!plant || !plant.plantTopology) return [];
  const activeKeys: string[] = [];

  for (const node of PLANT_MACHINERY_NODES) {
    // Check if first calc is supported or if any machine matches
    const isSupported = isCalculationSupportedByPlant(node.calcIds[0], plant);
    const hasMachine = plant.plantTopology.macchinari?.some(m => {
      if (node.key === 'BEMA_FASCIATORE') return m.tipo === 'BEMA_FASCIATORE' || m.nome.toLowerCase().includes('bema') || m.nome.toLowerCase().includes('silkworm');
      if (node.key === 'FLOTTA_LGV') return plant.plantTopology?.flottaAgv && plant.plantTopology.flottaAgv.length > 0;
      if (node.key === 'SMARTSTORE') return m.tipo === 'TRASLOELEVATORE_SMARTSTORE' || m.nome.toLowerCase().includes('smartstore');
      if (node.key === 'BAIE_INBOUND_OUTBOUND') return m.tipo === 'BAIA_CARICO' || (plant.plantTopology?.baie && plant.plantTopology.baie.length > 0);
      if (node.key === 'ISOLA_ROBOT') return m.tipo === 'PALLETTIZZATORE' || m.tipo === 'ISOLA_ROBOT' || m.nome.toLowerCase().includes('robot');
      if (node.key === 'WOODPECKER') return m.nome.toLowerCase().includes('woodpecker') || m.id.toLowerCase().includes('wood');
      if (node.key === 'RAPTOR') return m.nome.toLowerCase().includes('raptor') || m.id.toLowerCase().includes('raptor');
      if (node.key === 'QUALITA_TRACCIABILITA') return m.tipo === 'RULLIERA_INBOUND' || m.nome.toLowerCase().includes('qualit') || m.nome.toLowerCase().includes('tracciabilit');
      return false;
    });

    if (isSupported || hasMachine) {
      activeKeys.push(node.key);
    }
  }

  return activeKeys;
}

/**
 * Builds a default MachineAsset for a specific standard node key.
 */
export function buildDefaultMachineForNode(
  nodeKey: string, 
  prefix: string, 
  index = 1
): MachineAsset {
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'E80';
  const idxStr = String(index).padStart(2, '0');

  switch (nodeKey) {
    case 'BEMA_FASCIATORE':
      return {
        id: `M-${p}-BEMA-${idxStr}`,
        nome: `Fasciatore Robotico Bema Silkworm ${idxStr}`,
        tipo: 'BEMA_FASCIATORE',
        reparto: 'Fine Linea Confezionamento (ECS)',
        plcTag: `DB104.BEMA_${idxStr}_TENSIONE_FILM`,
        stato: 'IN_MARCIA',
        telemetria: {
          rpm: +(47 + Math.random() * 4).toFixed(1),
          tensione_newton: +(148 + Math.random() * 10).toFixed(1),
          spessore_film_micron: 23,
          temperatura_motore_c: +(48 + Math.random() * 6).toFixed(1)
        }
      };

    case 'FLOTTA_LGV':
      return {
        id: `M-${p}-LGV-HUB-${idxStr}`,
        nome: `Stazione di Guida Laser & Gestione Flotta LGV ${idxStr}`,
        tipo: 'ALTRO',
        reparto: 'Logistica di Fabbrica & Movimentazione',
        plcTag: `DB250.LGV_FLEET_CONTROLLER_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          veicoli_in_missione: 4,
          soc_medio_flotta_pct: 88.5,
          tempo_ciclo_medio_sec: 142
        }
      };

    case 'SMARTSTORE':
      return {
        id: `M-${p}-ASRS-${idxStr}`,
        nome: `Trasloelevatore Multilivello SmartStore Corsia ${index}`,
        tipo: 'TRASLOELEVATORE_SMARTSTORE',
        reparto: 'Magazzino Intensivo Automatico (WMS)',
        plcTag: `DB300.SMARTSTORE_CRANE_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          velocita_traslazione_ms: 3.2,
          saturazione_corsia_pct: +(82 + Math.random() * 14).toFixed(1),
          missioni_ora: 64
        }
      };

    case 'BAIE_INBOUND_OUTBOUND':
      return {
        id: `M-${p}-BAIA-${idxStr}`,
        nome: `Baia di Carico / Scarico Automatico Baia ${index}`,
        tipo: 'BAIA_CARICO',
        reparto: 'Piazzale Spedizioni & Banchina (YMS/TMS)',
        plcTag: `DB50.DOCK_BAY_${idxStr}_PLC`,
        stato: 'IN_MARCIA',
        telemetria: {
          tempo_sosta_minuti: 28,
          saturazione_baia_pct: +(75 + Math.random() * 20).toFixed(1),
          camion_gestiti_turno: 14
        }
      };

    case 'ISOLA_ROBOT':
      return {
        id: `M-${p}-ROBOT-${idxStr}`,
        nome: `Isola Robotizzata di Pallettizzazione Antropomorfa ${idxStr}`,
        tipo: 'ISOLA_ROBOT',
        reparto: 'Pallettizzazione & Packaging Secondario',
        plcTag: `DB120.ROBOT_PALLETIZER_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          colli_minuto: 130,
          pressione_vuoto_bar: -0.84,
          indice_oee_pct: 94.2
        }
      };

    case 'WOODPECKER':
      return {
        id: `M-${p}-WOODPECKER-${idxStr}`,
        nome: `Stazione di Ispezione Pallet Woodpecker ${idxStr}`,
        tipo: 'ALTRO',
        reparto: 'Controllo Qualità Pallet Inbound',
        plcTag: `DB200.WOODPECKER_INSPECTION_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          throughput_pallet_ora: 275,
          umidita_legno_pct: 13.4,
          tasso_scarto_pct: 1.8
        }
      };

    case 'RAPTOR':
      return {
        id: `M-${p}-RAPTOR-${idxStr}`,
        nome: `Etichettatrice Robotizzata E80 Raptor GS1 ${idxStr}`,
        tipo: 'ALTRO',
        reparto: 'Fine Linea & Tracciabilità Spedizioni',
        plcTag: `DB150.RAPTOR_LABELER_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          qualita_stampa_iso: 'CLASSE_A',
          temperatura_testina_c: 54.0,
          metri_ribbon_residui: 450
        }
      };

    case 'QUALITA_TRACCIABILITA':
    default:
      return {
        id: `M-${p}-MIP-${idxStr}`,
        nome: `Rulliera Inbound Tracciabilità Materie Prime (MIP) ${idxStr}`,
        tipo: 'RULLIERA_INBOUND',
        reparto: 'Ricevimento Merci & Laboratorio Qualità',
        plcTag: `DB10.MIP_TRACEABILITY_${idxStr}`,
        stato: 'IN_MARCIA',
        telemetria: {
          lotti_scansionati_ora: 48,
          tempo_campionamento_sec: 18,
          conformita_lotto_pct: 99.8
        }
      };
  }
}

/**
 * Generates an initial list of default machines from a list of node keys.
 */
export function generateMachinesForNodes(nodeKeys: string[], prefix: string): MachineAsset[] {
  const machines: MachineAsset[] = [];
  nodeKeys.forEach((key, idx) => {
    machines.push(buildDefaultMachineForNode(key, prefix, idx + 1));
  });
  return machines;
}

/**
 * Builds a complete PlantTopology based on active node keys and individual machines.
 */
export function buildTopologyWithNodes(
  nodeKeys: string[],
  machines: MachineAsset[],
  prefix: string,
  baseTopology?: PlantTopology
): PlantTopology {
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'E80';

  // Deep data nodes based on active node keys
  const deepData = buildDeepDataForPlant(p, 48.5, 152.0, {
    includeSilkworm: nodeKeys.includes('BEMA_FASCIATORE'),
    includeSmartStore: nodeKeys.includes('SMARTSTORE'),
    includeRobotPalletizing: nodeKeys.includes('ISOLA_ROBOT'),
    includeWoodpecker: nodeKeys.includes('WOODPECKER'),
    includeRaptor: nodeKeys.includes('RAPTOR'),
    includeTrafficInfra: nodeKeys.includes('FLOTTA_LGV')
  });

  // LGV fleet
  const flottaAgv: AgvVehicle[] = nodeKeys.includes('FLOTTA_LGV')
    ? (baseTopology?.flottaAgv && baseTopology.flottaAgv.length > 0)
      ? baseTopology.flottaAgv
      : [
          {
            id: `LGV_${p}_01`,
            modello: 'E80 CB16 Counterbalanced (Forche Singole)',
            batteriaSoC: 92,
            temperatura: 32.5,
            posizione: 'Nodo N-14 (Svincolo Bema 1)',
            stato: 'MISSIONE',
            deepData: buildAgvDeepData(`LGV_${p}_01`, 92, 32.5)
          },
          {
            id: `LGV_${p}_02`,
            modello: 'E80 CB16 Counterbalanced (Forche Singole)',
            batteriaSoC: 78,
            temperatura: 35.1,
            posizione: 'Nodo N-08 (Corsia Magazzino 1)',
            stato: 'MISSIONE',
            deepData: buildAgvDeepData(`LGV_${p}_02`, 78, 35.1)
          }
        ]
    : [];

  // Baie
  const baie: BayAsset[] = nodeKeys.includes('BAIE_INBOUND_OUTBOUND')
    ? (baseTopology?.baie && baseTopology.baie.length > 0)
      ? baseTopology.baie
      : [
          { id: `BAY-${p}-01`, nome: 'Baia Inbound 01 (Scarico Materie Prime)', tipo: 'INBOUND', stato: 'OCCUPATA', camionAssegnato: 'TIR-VR-442-AZ' },
          { id: `BAY-${p}-02`, nome: 'Baia Outbound 02 (Carico Pallet Finiti)', tipo: 'OUTBOUND', stato: 'LIBERA' }
        ]
    : [];

  // Reparti
  const reparti: PlantDepartment[] = [
    {
      id: `rep-${p}-inbound`,
      nome: 'Reparto 1: Ricevimento & Materie Prime (MIP)',
      moduloTecnico: 'MIP',
      responsabileLinea: 'Responsabile Inbound',
      statoOperativo: 'OTTIMALE',
      macchineCount: machines.filter(m => m.reparto.toLowerCase().includes('inbound') || m.reparto.toLowerCase().includes('ricevimento')).length || 2
    },
    {
      id: `rep-${p}-wms`,
      nome: 'Reparto 2: Magazzino & Logistica Interna (WMS/ASRS)',
      moduloTecnico: 'WMS',
      responsabileLinea: 'Responsabile Magazzino',
      statoOperativo: 'OTTIMALE',
      macchineCount: machines.filter(m => m.reparto.toLowerCase().includes('magazzino') || m.tipo === 'TRASLOELEVATORE_SMARTSTORE').length || 2
    },
    {
      id: `rep-${p}-ecs`,
      nome: 'Reparto 3: Fine Linea & Fasciatori Bema (ECS)',
      moduloTecnico: 'ECS',
      responsabileLinea: 'Responsabile Packaging',
      statoOperativo: 'OTTIMALE',
      macchineCount: machines.filter(m => m.tipo === 'BEMA_FASCIATORE' || m.tipo === 'ISOLA_ROBOT').length || 2
    },
    {
      id: `rep-${p}-yms`,
      nome: 'Reparto 4: Baie Spedizioni & Piazzale Intermodale (YMS)',
      moduloTecnico: 'YMS',
      responsabileLinea: 'Responsabile Piazzale',
      statoOperativo: 'OTTIMALE',
      macchineCount: baie.length || 2
    }
  ];

  return {
    reparti,
    macchinari: machines,
    flottaAgv,
    baie,
    qubitCapacity: Math.max(16, Math.min(64, machines.length * 6 + flottaAgv.length * 4)),
    qpuDimensioning: baseTopology?.qpuDimensioning || {
      numQubits: Math.max(16, machines.length * 6),
      hamiltonianSize: `${Math.pow(2, Math.min(24, Math.max(16, machines.length * 6)))} States`,
      shotsDefault: 2048,
      simulatorBackend: 'Simulatore GPU CUDA-Q (cuStateVec - H100)'
    },
    lastSyncTimestamp: new Date().toISOString(),
    deepDataNodes: deepData,
    isolePallettizzazione: deepData.isolePallettizzazione,
    fasciatoriSilkworm: deepData.fasciatoriSilkworm,
    etichettatriciRaptor: deepData.etichettatriciRaptor,
    magazzinoSmartStore: deepData.magazzinoSmartStore,
    controlloWoodpecker: deepData.controlloWoodpecker,
    infrastrutturaTraffico: deepData.infrastrutturaTraffico
  };
}

/**
 * Adds a macro-node to a tenant.
 */
export function addNodeToPlant(plant: FactoryTenant, nodeKey: string): FactoryTenant {
  const currentNodes = getPlantActiveNodeKeys(plant);
  if (currentNodes.includes(nodeKey)) return plant;

  const newNodes = [...currentNodes, nodeKey];
  const newMachine = buildDefaultMachineForNode(nodeKey, plant.id || plant.nome, (plant.plantTopology?.macchinari.length || 0) + 1);
  const updatedMachines = [...(plant.plantTopology?.macchinari || []), newMachine];

  const updatedTopology = buildTopologyWithNodes(newNodes, updatedMachines, plant.id || plant.nome, plant.plantTopology);
  return {
    ...plant,
    plantTopology: updatedTopology
  };
}

/**
 * Removes a macro-node from a tenant.
 */
export function removeNodeFromPlant(plant: FactoryTenant, nodeKey: string): FactoryTenant {
  const currentNodes = getPlantActiveNodeKeys(plant);
  const newNodes = currentNodes.filter(k => k !== nodeKey);

  // Filter out machinery corresponding to this node
  const updatedMachines = (plant.plantTopology?.macchinari || []).filter(m => {
    if (nodeKey === 'BEMA_FASCIATORE') return m.tipo !== 'BEMA_FASCIATORE' && !m.nome.toLowerCase().includes('bema') && !m.nome.toLowerCase().includes('silkworm');
    if (nodeKey === 'SMARTSTORE') return m.tipo !== 'TRASLOELEVATORE_SMARTSTORE' && !m.nome.toLowerCase().includes('smartstore');
    if (nodeKey === 'BAIE_INBOUND_OUTBOUND') return m.tipo !== 'BAIA_CARICO';
    if (nodeKey === 'ISOLA_ROBOT') return m.tipo !== 'PALLETTIZZATORE' && m.tipo !== 'ISOLA_ROBOT' && !m.nome.toLowerCase().includes('robot');
    if (nodeKey === 'WOODPECKER') return !m.nome.toLowerCase().includes('woodpecker') && !m.id.toLowerCase().includes('wood');
    if (nodeKey === 'RAPTOR') return !m.nome.toLowerCase().includes('raptor') && !m.id.toLowerCase().includes('raptor');
    if (nodeKey === 'QUALITA_TRACCIABILITA') return m.tipo !== 'RULLIERA_INBOUND' && !m.nome.toLowerCase().includes('qualit');
    if (nodeKey === 'FLOTTA_LGV') return !m.nome.toLowerCase().includes('lgv');
    return true;
  });

  const updatedTopology = buildTopologyWithNodes(newNodes, updatedMachines, plant.id || plant.nome, {
    ...plant.plantTopology,
    flottaAgv: nodeKey === 'FLOTTA_LGV' ? [] : plant.plantTopology?.flottaAgv || [],
    baie: nodeKey === 'BAIE_INBOUND_OUTBOUND' ? [] : plant.plantTopology?.baie || []
  } as PlantTopology);

  return {
    ...plant,
    plantTopology: updatedTopology
  };
}

/**
 * Adds an individual MachineAsset to a tenant.
 */
export function addMachineToPlant(plant: FactoryTenant, machine: MachineAsset): FactoryTenant {
  const updatedMachines = [...(plant.plantTopology?.macchinari || []), machine];
  const activeNodes = getPlantActiveNodeKeys({
    ...plant,
    plantTopology: {
      ...(plant.plantTopology || ({} as PlantTopology)),
      macchinari: updatedMachines
    }
  });

  const updatedTopology = buildTopologyWithNodes(activeNodes, updatedMachines, plant.id || plant.nome, plant.plantTopology);
  return {
    ...plant,
    plantTopology: updatedTopology
  };
}

/**
 * Removes an individual MachineAsset by id from a tenant.
 */
export function removeMachineFromPlant(plant: FactoryTenant, machineId: string): FactoryTenant {
  const updatedMachines = (plant.plantTopology?.macchinari || []).filter(m => m.id !== machineId);
  const activeNodes = getPlantActiveNodeKeys({
    ...plant,
    plantTopology: {
      ...(plant.plantTopology || ({} as PlantTopology)),
      macchinari: updatedMachines
    }
  });

  const updatedTopology = buildTopologyWithNodes(activeNodes, updatedMachines, plant.id || plant.nome, plant.plantTopology);
  return {
    ...plant,
    plantTopology: updatedTopology
  };
}
