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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '2. Magazzino & Stoccaggio',
      modules: 'MIP ⟷ WMS',
      parametersOrData: 'Traffico camion/ritardo piazzale (MIP) ⟷ Saturazione volumetrica scaffali (WMS)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati obbligatoriamente: camion_attesa e saturazione_wms devono essere valutati congiuntamente per rilevare lo stallo cross-reparto.',
      parametriAccoppiati: ['camion_attesa', 'saturazione_wms'],
      soglieAnomale: 'IRREGOLARE se camion_attesa > 10 e saturazione_wms > 85.0% contemporaneamente (allerta blocco baie)'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '4. IoT & Controllo Macchine',
      modules: 'MIP ⟷ SDM / Linee Produzione',
      parametersOrData: 'Ritardi accumulati camion/baie libere (MIP) ⟷ Rischio fermo linee produttive a valle (SDM)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati in CNOT: ritardo_stimato_minuti interagisce inversamente con baie_libere.',
      parametriAccoppiati: ['ritardo_stimato_minuti', 'baie_libere'],
      soglieAnomale: 'IRREGOLARE se ritardo_stimato_minuti > 60 min con baie_libere ≤ 1 (rischio fermo linea imminente)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'MIP isolato',
      parametersOrData: 'Solo dati interni modulo Inbound (ore turno, baie disponibili)'
    },
    parameterRules: {
      modalita: 'SOLO',
      regola: 'Parametro singolo o locale: ore_lavoro_disponibili e baie_totali non richiedono accoppiamento esterno.',
      soglieAnomale: 'IRREGOLARE se ore_lavoro_disponibili < 4 o baie_totali < 1'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'MIP Qualità isolato',
      parametersOrData: 'Solo parametri fisici interni del lotto (umidità, micro-spessore)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati fisici: umidita_rilevata e spessore_micro del film plastico vanno analizzati congiuntamente.',
      parametriAccoppiati: ['umidita_rilevata', 'spessore_micro'],
      soglieAnomale: 'IRREGOLARE se umidita_rilevata > 18.0% o spessore_micro < 30.0 µm (rischio rottura pellicola su fasciatore)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'MIP Sicurezza isolato',
      parametersOrData: 'Solo ID lotto e codice fornitore per generazione salt NIST'
    },
    parameterRules: {
      modalita: 'SOLO',
      regola: 'Parametri discreti di tracciabilità: validazione crittografica locale univoca senza vincolo di accoppiamento dinamico.',
      soglieAnomale: 'IRREGOLARE se stringa codice_fornitore vuota o ID lotto non conforme al formato UTF-8'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '4. IoT & Controllo Macchine',
      modules: 'WMS ⟷ SDM (Flotta LGV)',
      parametersOrData: 'Celle 3D libere SmartStore (WMS) ⟷ Posizione cinematica carrelli LGV (SDM)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati: classe_rotazione (frequenza prelievo) accoppiata a celle_libere_3d nelle campate basse.',
      parametriAccoppiati: ['classe_rotazione', 'celle_libere_3d'],
      soglieAnomale: 'IRREGOLARE se classe_rotazione = HIGH e celle_libere_3d < 15 nelle baie di terra (sovraccarico trasloelevatore)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'WMS Struttura isolato',
      parametersOrData: 'Solo sensori fisici montante scaffalatura (pressione bar, inclinazione)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati strutturali: il vettore pressione interagisce con la micro_inclinazione angolare.',
      parametriAccoppiati: ['vettore_pressione_bar', 'micro_inclinazione'],
      soglieAnomale: 'IRREGOLARE se max(vettore_pressione_bar) > 18.0 bar o micro_inclinazione > 1.2 gradi (rischio collasso campata)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'WMS Picking isolato',
      parametersOrData: 'Solo coordinate corsie e lista pallet da prelevare internamente'
    },
    parameterRules: {
      modalita: 'SOLO',
      regola: 'Parametro combinatorio a lista chiusa: risolto come grafo TSP singolo senza dipendenza da moduli esterni.',
      soglieAnomale: 'IRREGOLARE se numero nodi lista_id_pallet > 30 per singolo ciclo picker'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '4. IoT & Controllo Macchine',
      modules: 'WMS ⟷ SDM (Routing Centrale)',
      parametersOrData: 'Ordini prelievo WMS ⟷ Coefficiente di congestione traffico corridoi SDM'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati: volume ordini pallet accoppiato al coefficiente_traffico del corridoio centrale.',
      parametriAccoppiati: ['lista_ordini_camion', 'coefficiente_traffico'],
      soglieAnomale: 'IRREGOLARE se coefficiente_traffico > 0.80 e lista_ordini > 5 missioni contemporanee (ingorgo crocevia)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'TPT Carico isolato',
      parametersOrData: 'Solo volume e pesi pallet interni al singolo pianale camion'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati meccanici: volume_disponibile_mc e bilanciamento asse (lista_pesi_pallet).',
      parametriAccoppiati: ['volume_disponibile_mc', 'lista_pesi_pallet'],
      soglieAnomale: 'IRREGOLARE se carico totale > 28000 kg o sbilanciamento tra asse anteriore e posteriore > 25%'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'TMS Documentale isolato',
      parametersOrData: 'Solo contratto e metadati e-CMR per firma digitale Ed25519'
    },
    parameterRules: {
      modalita: 'SOLO',
      regola: 'Parametro documentale singolo: protocollo di cifratura deterministico post-quantum stand-alone.',
      soglieAnomale: 'IRREGOLARE se payload dati_ecmr non validato da certificato X.509'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '4. IoT & Controllo Macchine',
      modules: 'YMS ⟷ SDM (Evacuazione Linea)',
      parametersOrData: 'Camion in piazzale esterno (YMS) ⟷ Pallet pronti a fine linea/LGV (SDM)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati in teoria dei giochi quantistica: camion_in_piazzale deve essere sincronizzato con pallet_pronti_linea.',
      parametriAccoppiati: ['camion_in_piazzale', 'pallet_pronti_linea'],
      soglieAnomale: 'IRREGOLARE se camion_in_piazzale > 12 e pallet_pronti_linea < 10 (discrepanza offerta/domanda con costo sosta)'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '4. IoT & Controllo Macchine',
      modules: 'YMS ⟷ SDM / Buffer Fine Linea',
      parametersOrData: 'Camion in sosta piazzale (YMS) ⟷ Coda di evacuazione e saturazione buffer fabbrica (SDM)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati di clustering: camion_in_attesa vincolati a codice_saturazione_buffer per formare cluster di pre-baia.',
      parametriAccoppiati: ['camion_in_attesa', 'codice_saturazione_buffer'],
      soglieAnomale: 'IRREGOLARE se codice_saturazione_buffer > 0.90 con camion_in_attesa > 10 (rischio blocco cancello piazzale)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'ECS Macchina Bema isolato',
      parametersOrData: 'Solo frequenze e RPM accelerometro del braccio rotante'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati rotazionali: la serie temporale vettore_accelerometro dipende dai giri_minuto (RPM).',
      parametriAccoppiati: ['vettore_accelerometro', 'giri_minuto'],
      soglieAnomale: 'IRREGOLARE se giri_minuto > 55 RPM con ampiezza armonica accelerometro > 1.2 g (usura cuscinetto braccio)'
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
    },
    isCrossCategory: false,
    crossCategoryDetails: {
      crossedWith: 'Nessuna (Elaborazione Locale)',
      modules: 'ECS Fasciatore isolato',
      parametersOrData: 'Solo parametri sensore rulli (tensione Newton, velocità m/s, micron)'
    },
    parameterRules: {
      modalita: 'COPPIA',
      regola: 'Parametri accoppiati di processo: tensione_newton e velocita_svolgimento sono inversamente legati allo spessore_film_micron.',
      parametriAccoppiati: ['tensione_newton', 'velocita_svolgimento'],
      soglieAnomale: 'IRREGOLARE se tensione_newton > 180 N con spessore < 20 µm o velocita_svolgimento > 18 m/s (rottura film imminente)'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: 'Tutte le Aree di Stabilimento (Cross-Sistema)',
      modules: 'SDM (Flotta LGV) ⟷ Mappa Globale Impianto',
      parametersOrData: 'Coordinate spaziali flotta LGV ⟷ Topologia nodi/ingorghi di tutte le aree di fabbrica'
    },
    parameterRules: {
      modalita: 'MULTI_ENTANGLED',
      regola: 'Parametri multi-entangled: coordinate di tutti gli LGV accoppiate in grafo continuo con i nodi bloccati.',
      parametriAccoppiati: ['coordinate_agv_attivi', 'mappa_ingorghi_nodi'],
      soglieAnomale: 'IRREGOLARE se oltre 3 nodi centrali bloccati contemporaneamente con > 25 veicoli in circolazione (deadlock di fabbrica)'
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
    },
    isCrossCategory: true,
    crossCategoryDetails: {
      crossedWith: '2. Magazzino & Stoccaggio',
      modules: 'SDM (Veicoli) ⟷ WMS (Missioni) ⟷ ECS (Batterie)',
      parametersOrData: 'Code urgenza missioni (WMS) ⟷ Telemetria termica e SoC celle batterie veicoli (ECS)'
    },
    parameterRules: {
      modalita: 'MULTI_ENTANGLED',
      regola: 'Parametri multi-accoppiati: urgenza missione WMS accoppiata allo stato termico (Temp °C) e carica (SoC %) batterie LGV.',
      parametriAccoppiati: ['elenco_missioni_urgenti', 'telemetria_batterie_agv'],
      soglieAnomale: 'IRREGOLARE se temperatura batteria LGV > 50 °C o SoC < 20% assegnato a missione lunga distanza (degrado cella litio)'
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
