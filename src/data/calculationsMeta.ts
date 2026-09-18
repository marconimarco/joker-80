import { QuantumCalculationMeta, FactoryTenant } from '../types/quantum';

export const QUANTUM_CALCULATIONS: QuantumCalculationMeta[] = [
  {
    id: 1,
    name: 'Quantum Boltzmann Machines (QBM)',
    category: '1. Inbound & Materie Prime',
    technicalModule: 'MIP',
    subFunction: 'Inbound Scheduler',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Simulatori GPU / QPU Gate-Based',
    description: 'Stress-test Inbound. Crea uno stato di entanglement profondo tra le variabili del traffico camion nel piazzale e la saturazione degli scaffali nel magazzino.',
    inputDescription: 'camion_attesa, minuti_ritardo, saturazione_wms',
    defaultInputs: {
      camion_attesa: 12,
      minuti_ritardo: 45,
      saturazione_wms: 88.5
    }
  },
  {
    id: 2,
    name: 'Quantum Monte Carlo Risk Analysis',
    category: '1. Inbound & Materie Prime',
    technicalModule: 'MIP',
    subFunction: 'Inbound Scheduler',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'QPU Gate-Based / Simulatori GPU',
    description: 'Rischio turno futuro. Intreccia i qubit legati all\'entità dei ritardi accumulati dai camion con lo stato delle linee di produzione per calcolare il rischio futuro.',
    inputDescription: 'ritardo_stimato_minuti, baie_libere',
    defaultInputs: {
      ritardo_stimato_minuti: 75,
      baie_libere: 1
    }
  },
  {
    id: 3,
    name: 'Quantum Integer Programming',
    category: '1. Inbound & Materie Prime',
    technicalModule: 'MIP',
    subFunction: 'Inbound Scheduler',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Quantum Annealer / Simulatori GPU',
    description: 'Schedulazione baie 24h. Esplora lo spazio degli stati discreti per trovare la migliore griglia oraria di assegnazione delle risorse (baie e addetti) minimizzando i sovrapprezzi.',
    inputDescription: 'ore_lavoro_disponibili, baie_totali',
    defaultInputs: {
      ore_lavoro_disponibili: 8,
      baie_totali: 4
    }
  },
  {
    id: 4,
    name: 'Quantum Walk-based Clustering',
    category: '1. Inbound & Materie Prime',
    technicalModule: 'MIP',
    subFunction: 'Material Inventory & Quality',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'QPU Fotonica / Ioni Intrappolati / Simulatori GPU',
    description: 'Qualità lotti. Sfrutta l\'evoluzione quantistica nello spazio degli stati per eseguire il campionamento delle somiglianze fisiche tra i lotti e intercettare anomalie strutturali.',
    inputDescription: 'umidita_rilevata, spessore_micro',
    defaultInputs: {
      umidita_rilevata: 13.2,
      spessore_micro: 45.2
    }
  },
  {
    id: 5,
    name: 'Post-Quantum Cryptographic Hashing',
    category: '1. Inbound & Materie Prime',
    technicalModule: 'MIP',
    subFunction: 'Material Inventory & Quality',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Moduli Hardware di Sicurezza (HSM) Post-Quantum / QPU',
    description: 'Tracciabilità lotti blindata. Generazione di entropia crittografica quantistica pura usata come salt per hashing post-quantum conforme a standard NIST.',
    inputDescription: 'id_lotto_materiale, codice_fornitore',
    defaultInputs: {
      id_lotto_materiale: 'BOBINA_BEMA_2026_A',
      codice_fornitore: 'PLAST_REGGIO_01'
    }
  },
  {
    id: 6,
    name: 'Quantum Digital Twin Alignment & Bin Packing',
    category: '2. Magazzino & Stoccaggio',
    technicalModule: 'WMS',
    subFunction: 'Put-Away Logic',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Quantum Annealer / D-Wave / Simulatori GPU',
    description: 'Slot 3D. Crea uno stato di entanglement per allineare il Gemello Digitale del magazzino: lega le celle libere alla posizione dinamica degli LGV.',
    inputDescription: 'id_pallet, classe_rotazione, celle_libere_3d',
    defaultInputs: {
      id_pallet: 'PALLET_BEMA_099',
      classe_rotazione: 'HIGH',
      celle_libere_3d: 124
    }
  },
  {
    id: 7,
    name: 'Quantum Hopfield Networks',
    category: '2. Magazzino & Stoccaggio',
    technicalModule: 'WMS',
    subFunction: 'Put-Away Logic',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'QPU Gate-Based / Simulatori GPU',
    description: 'Integrità scaffali. Mappa profili di carico e vettori di sollecitazione dei sensori fisici esplorando attrattori energetici per riconoscere pattern di usura/deformazione.',
    inputDescription: 'vettore_pressione_bar, micro_inclinazione',
    defaultInputs: {
      vettore_pressione_bar: [12.4, 14.1, 11.9, 15.0],
      micro_inclinazione: 0.4
    }
  },
  {
    id: 8,
    name: 'Quantum Walk Route Exploration (TSP)',
    category: '2. Magazzino & Stoccaggio',
    technicalModule: 'WMS',
    subFunction: 'Picking & Batching',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'QPU Gate-Based / Superconduttori / Simulatori GPU',
    description: 'Sequenza picking. Propagazione dello stato quantistico per valutare tutte le permutazioni dei nodi (incroci delle corsie) e minimizzare i metri percorsi.',
    inputDescription: 'lista_id_pallet, coordinate_partenza',
    defaultInputs: {
      lista_id_pallet: ['PLT_A', 'PLT_B', 'PLT_C'],
      coordinate_partenza: 'X:00/Y:00'
    }
  },
  {
    id: 9,
    name: 'Quantum Graph Neural Networks (QGNN)',
    category: '2. Magazzino & Stoccaggio',
    technicalModule: 'WMS',
    subFunction: 'Picking & Batching',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Simulatori GPU / QPU Gate-Based',
    description: 'Batching ordini. L\'entanglement lega la composizione dei lotti di picking alle finestre di congestione del routing centrale per evitare colli di bottiglia.',
    inputDescription: 'lista_ordini_camion, coefficiente_traffico',
    defaultInputs: {
      lista_ordini_camion: ['ORD_01', 'ORD_02'],
      coefficiente_traffico: 0.45
    }
  },
  {
    id: 10,
    name: 'Algoritmi Quantistici VQE / HHL',
    category: '3. Outbound & Spedizioni',
    technicalModule: 'TPT',
    subFunction: '3D Volumetric Loader',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Simulatori GPU / QPU Gate-Based',
    description: 'Incastro geometrico camion. Mappa lo spazio geometrico del container/camion e la disposizione dei pallet a minima energia per saturare lo spazio e bilanciare gli assi.',
    inputDescription: 'volume_disponibile_mc, lista_pesi_pallet',
    defaultInputs: {
      volume_disponibile_mc: 80.0,
      lista_pesi_pallet: [800, 750, 900, 600]
    }
  },
  {
    id: 11,
    name: 'Post-Quantum Cryptography Integration',
    category: '3. Outbound & Spedizioni',
    technicalModule: 'TMS',
    subFunction: 'Carrier Allocator',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Moduli Hardware di Sicurezza (HSM) Post-Quantum',
    description: 'Cifratura e-CMR. Sfrutta l\'indeterminazione e la sovrapposizione quantistica pura per generare salt ed eseguire firme crittografiche resistenti a Shor e Grover.',
    inputDescription: 'id_contratto_vettore, dati_ecmr',
    defaultInputs: {
      id_contratto_vettore: 'CONT_VETT_2026_XYZ',
      dati_ecmr: 'DESTINAZIONE: GERMANIA - 33 PALLET ACQUA MINERALE'
    }
  },
  {
    id: 12,
    name: 'Quantum Game Theory Algorithms',
    category: '3. Outbound & Spedizioni',
    technicalModule: 'YMS',
    subFunction: 'Dock & Slot Scheduler',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'QPU Gate-Based / Simulatori GPU',
    description: 'Conflitti priorità baie. Lega con CNOT le strategie dei vettori esterni allo stato dei flussi interni SDM per determinare l\'Equilibrio di Nash Quantistico a zero attese.',
    inputDescription: 'camion_in_piazzale, pallet_pronti_linea',
    defaultInputs: {
      camion_in_piazzale: 8,
      pallet_pronti_linea: 24
    }
  },
  {
    id: 13,
    name: 'Quantum K-Means per Logistica Piazzale',
    category: '3. Outbound & Spedizioni',
    technicalModule: 'YMS',
    subFunction: 'Yard Traffic & Buffer Opt.',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Quantum Annealer / Simulatori GPU',
    description: 'Traffico piazzale buffer. Calcola distanze quantistiche tra vettori in attesa e coda di evacuazione pallet per creare cluster prioritari e smistare pre-baia.',
    inputDescription: 'camion_in_attesa, codice_saturazione_buffer',
    defaultInputs: {
      camion_in_attesa: 14,
      codice_saturazione_buffer: 0.75
    }
  },
  {
    id: 14,
    name: 'Quantum Fourier Transform (QFT)',
    category: '4. IoT & Controllo Macchine',
    technicalModule: 'ECS',
    subFunction: 'Bema Wrapping Controller',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Edge AI Quantistico / Simulatori GPU',
    description: 'Micro-vibrazioni Bema. Mappa segnali accelerometrici nello spazio delle frequenze ed esegue rotazioni di fase controllate per individuare picchi armonici anomali.',
    inputDescription: 'vettore_accelerometro, giri_minuto',
    defaultInputs: {
      vettore_accelerometro: [0.12, 0.85, 0.94, 0.02],
      giri_minuto: 48.0
    }
  },
  {
    id: 15,
    name: 'Quantum Support Vector Machine (QSVM)',
    category: '4. IoT & Controllo Macchine',
    technicalModule: 'ECS',
    subFunction: 'Bema Wrapping Controller',
    entanglement: 'FACOLTATIVO',
    entanglementSymbol: '🔓',
    hardwareTarget: 'Simulatori GPU / QPU Gate-Based',
    description: 'Tensionamento film Bema. Mappa tensione, forza e velocità nello spazio di Hilbert (Quantum Feature Map) per predire il rischio strappo e regolare i rulli.',
    inputDescription: 'tensione_newton, velocita_svolgimento, spessore_film_micron',
    defaultInputs: {
      tensione_newton: 148.5,
      velocita_svolgimento: 12.4,
      spessore_film_micron: 23
    }
  },
  {
    id: 16,
    name: 'Dynamic Graph QAOA & QRL',
    category: '4. IoT & Controllo Macchine',
    technicalModule: 'SDM',
    subFunction: 'Routing & Traffic Engine',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Quantum Annealer / D-Wave / Alta Connettività',
    description: 'Rotte flotta >100 LGV. Lega tramite CNOT le coordinate spaziali dei veicoli allo stato occupazionale dei nodi stradali, risolvendo ingorghi in tempo reale.',
    inputDescription: 'coordinate_agv_attivi, mappa_ingorghi_nodi',
    defaultInputs: {
      coordinate_agv_attivi: {
        AGV_01: 'X:12/Y:04',
        AGV_02: 'X:15/Y:08',
        AGV_03: 'X:02/Y:22'
      },
      mappa_ingorghi_nodi: ['NODO_03_BLOCCATO']
    }
  },
  {
    id: 17,
    name: 'Quantum Bipartite Matching',
    category: '4. IoT & Controllo Macchine',
    technicalModule: 'SDM',
    subFunction: 'Task Allocation Engine',
    entanglement: 'OBBLIGATORIO',
    entanglementSymbol: '🔒',
    hardwareTarget: 'Quantum Annealer / D-Wave / QPU Superconduttori',
    description: 'Accoppiamento task-veicolo. Intreccia con CNOT le code di urgenza delle missioni WMS con lo stato termico e di carica delle batterie ECS per massimizzare la vita utile.',
    inputDescription: 'elenco_missioni_urgenti, telemetria_batterie_agv',
    defaultInputs: {
      elenco_missioni_urgenti: ['MISSIONE_942', 'MISSIONE_943'],
      telemetria_batterie_agv: {
        AGV_04: { SoC: 78, Temp: 42.5 },
        AGV_11: { SoC: 92, Temp: 31.0 }
      }
    }
  }
];

export const CLIENT_TENANTS: FactoryTenant[] = [
  {
    id: 'local',
    nome: 'Ambiente di Simulazione Locale (Viano)',
    sito: 'Hub Sperimentale Viano (RE)',
    endpoint: 'http://localhost:8080/api',
    logoColor: '#06b6d4'
  },
  {
    id: 'barilla',
    nome: 'Barilla (Sito di Parma)',
    sito: 'Pedrignano, Parma (PR)',
    endpoint: 'http://192.168.10',
    logoColor: '#3b82f6'
  },
  {
    id: 'nestle',
    nome: 'Nestlé (Sito di Milano)',
    sito: 'Assago, Milano (MI)',
    endpoint: 'http://10.0.1',
    logoColor: '#ef4444'
  },
  {
    id: 'santanna',
    nome: 'Acqua Sant\'Anna (Sito di Cuneo)',
    sito: 'Vinadio, Cuneo (CN)',
    endpoint: 'http://172.16.5',
    logoColor: '#10b981'
  }
];
