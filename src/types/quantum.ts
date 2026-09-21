export type QuantumEntanglementType = 'OBBLIGATORIO' | 'FACOLTATIVO';

export type MacroCategory = 
  | '1. Inbound & Materie Prime'
  | '2. Magazzino & Stoccaggio'
  | '3. Outbound & Spedizioni'
  | '4. IoT & Controllo Macchine';

export type TechnicalModule = 'MIP' | 'WMS' | 'TPT' | 'TMS' | 'YMS' | 'ECS' | 'SDM';

export interface QuantumCalculationMeta {
  id: number;
  name: string;
  category: MacroCategory;
  technicalModule: TechnicalModule;
  subFunction: string;
  entanglement: QuantumEntanglementType;
  entanglementSymbol: '🔒' | '🔓';
  hardwareTarget: string;
  description: string;
  inputDescription: string;
  defaultInputs: Record<string, any>;
  isCrossCategory?: boolean;
  crossCategoryDetails?: {
    crossedWith: string;
    modules: string;
    parametersOrData: string;
  };
  parameterRules?: {
    modalita: 'SOLO' | 'COPPIA' | 'MULTI_ENTANGLED';
    regola: string;
    parametriAccoppiati?: string[];
    soglieAnomale?: string;
  };
}

export interface QuantumExecutionResult {
  calcolo_id: number;
  sotto_funzione: string;
  [key: string]: any;
}

export interface ChatOptionChoice {
  calcId: number;
  calcName: string;
  entanglementSymbol: '🔒' | '🔓';
  descrizione: string;
  percheSceglierlo?: string;
  parametriMemorizzati?: Record<string, any>;
  promptEsecuzione?: string;
  // Aliases for chat rendering and router
  calcolo_id?: number;
  titolo?: string;
  azionePrompt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'quantum-core';
  timestamp: string;
  text?: string;
  calcolo_id?: number;
  sotto_funzione?: string;
  entanglement?: QuantumEntanglementType;
  entanglementSymbol?: '🔒' | '🔓';
  payload?: QuantumExecutionResult;
  azione_immediata?: string;
  livello_allarme?: 'NORMALE' | 'ATTENZIONE' | 'CRITICO';
  execution_time_ms?: number;
  suggerimenti?: string[];
  tipoRisposta?: 'CALCOLO_ESEGUITO' | 'RICHIESTA_PARAMETRI' | 'GUIDA_SISTEMA' | 'NON_PERTINENTE' | 'ASSISTENZA_DECISIONALE';
  opzioniScelta?: ChatOptionChoice[];
  parametriMemorizzati?: Record<string, any>;
  parametriTrasferiti?: boolean;
}

// ============================================================================
// LIVELLO DEEP DATA - CATALOGO COMPLETO 7 NODI D'IMPIANTO
// ============================================================================

// 1. NODO NAVETTA LGV / AGV (CARRELLO AUTOMATICO)
export interface AgvDeepTelemetry {
  cinematiciSpaziali: {
    coordinateXYZ: { x: number; y: number; z: number }; // millimetriche
    angoliAssetto: { theta: number; phi: number; psi: number }; // orientamento/beccheggio/rollio
    velocitaLineareMs: number; // m/s
    accelerazioneVettorialeMs2: number; // m/s²
    raggioCurvaturaMm: number;
    direzioneRuoteSterzantiDeg: number;
  };
  fisiciStrutturali: {
    pesoForcheKg: number; // celle di carico integrate
    pressioneCircuitoIdraulicoBar: number;
    tempMotoreTrazioneC: number;
    tempMotoreSollevamentoC: number;
    vibrazioniAssiG: { x: number; y: number; z: number };
  };
  gestioneEnergetica: {
    statoCaricaSoC: number; // in %
    statoSaluteSoH: number; // in %
    correnteAssorbitaA: number;
    tensioneLineaV: number;
    energiaRigenerataFrenataWh: number;
    tempCelleBatteriaC: number;
    tempModuliBmsC: number;
  };
  sicurezzaMappaLogica: {
    distanzaOstacoloLaserMm: number;
    bitCampoProtetto: 'ALLARME_ARRESTO' | 'RALLENTAMENTO' | 'MUTING' | 'LIBERO';
    idMissione: string;
    idNodoSorgente: string;
    idNodoDestinazione: string;
    idNodoProssimo: string;
    rssiWifiDbm: number;
    pacchettiPersiPct: number;
  };
}

export interface AgvVehicle {
  id: string;
  modello: string;
  batteriaSoC: number;
  temperatura: number;
  posizione: string;
  stato: 'MISSIONE' | 'IN_CARICA' | 'IDLE';
  deepData?: AgvDeepTelemetry;
}

// 2. NODO ISOLA DI PALLETTIZZAZIONE ROBOTIZZATA
export interface RobotPalletizingNode {
  id: string;
  nome: string;
  linea: string;
  processoOutput: {
    conteggioPezziMinuto: number; // fardelli/scatole al minuto
    contatorePalletCompletati: number;
    tempoCicloStratoMs: number;
    activeRecipeId: string; // matrice tridimensionale schema
    numeroStratiCorrenti: number;
  };
  elettromeccanicaRobot: {
    correnteJointA: [number, number, number, number, number, number]; // Joint 1..6
    coppiaMotoriNm: [number, number, number, number, number, number];
    tempMotoriduttoriC: number;
    tempAzionamentiC: number;
  };
  sensoriPresaAria: {
    pressionePneumaticaVuotoBar: number;
    portataAriaAspirataM3h: number; // micro-perdite/usura ventose
    forzaSerraggioPinzeN: number;
    flagPresenzaInterfalda: boolean;
    spessoreInterfaldaMm: number;
  };
  statoDiagnostica: {
    statoPlc: 'RUN' | 'STOP' | 'PAUSE' | 'MUTING_BARRIERE';
    indiceOeeLocalePct: number;
    storicoMicrofermiCiclo: number;
  };
}

// 3. NODO FASCIATORE AUTOMATICO (SILKWORM)
export interface SilkwormWrapperNode {
  id: string;
  nome: string;
  dinamicaAvvolgimento: {
    velocitaRotazioneRpm: number;
    forzaSerraggioCaricoN: number;
    rapportoPrestiroRealePct: number;
    velocitaCarrelloBobinaMs: number;
  };
  consumiDiagnosticaMateriale: {
    pesoFilmApplicatoGrammi: number; // grammi per singolo pallet
    metriLineariFilmErogati: number;
    tensioneFilmSpigoliN: number; // controllo dinamico spigoli
    percentualeFilmResiduoBobinaPct: number;
  };
  variabiliMacchinaAllarmi: {
    tempBarraSaldanteC: number;
    bitRotturaFilm: boolean;
    flagFineBobina: boolean;
    anomalieMotoriTraino: boolean;
  };
}

// 4. NODO ETICHETTATRICE ROBOTIZZATA (RAPTOR)
export interface RaptorLabelerNode {
  id: string;
  nome: string;
  stampaTracciabilita: {
    ssccCode: string; // Serial Shipping Container Code
    etichettaGs1: string;
    lotto: string;
    dataScadenza: string;
    skuProdotto: string;
    timestampApplicazioneMs: number;
    posizioneApplicazione: 'LATO_FRONTE' | 'LATO_RETRO' | 'LATO_LATERALE';
  };
  controlloQualitaVisione: {
    gradoQualitaStampaIso: 'CLASSE_A' | 'CLASSE_B' | 'CLASSE_C' | 'CLASSE_D' | 'CLASSE_F';
    stringaRitornoValidatoreOttico: string;
  };
  hardwareConsumabili: {
    tempTestinaTermicaC: number;
    pressioneAriaApplicatoreBar: number;
    metriResiduiRibbon: number;
    metriResiduiRotoloEtichette: number;
    contatoreEtichetteScartate: number;
  };
}

// 5. NODO MAGAZZINO AUTOMATICO (SMARTSTORE / CRANESTORE)
export interface SmartStoreWarehouseNode {
  id: string;
  nome: string;
  strutturaSpazio: {
    matrice3dOccupazione: {
      totaleCelle: number;
      occupate: number;
      vuote: number;
      prenotateIngresso: number;
      prenotateUscita: number;
    };
    idCellaSpecifico: {
      scaffale: string;
      campata: number;
      piano: number;
      profondita: number;
    };
    timestampStoccaggio: string; // FIFO / FEFO
  };
  controlloAccettazioneIngresso: {
    pesoRealeBilanciaKg: number;
    sensoriSagoma: {
      altezzaMm: number;
      larghezzaMm: number;
      lunghezzaMm: number;
      fuoriAsse: boolean;
    };
    controlloFondoPalletIntegritaPattini: boolean;
  };
  sistemiMovimentazioneInterna: {
    posizioneEncoderAssoluto: number;
    livelloSupercondensatoriShuttlePct: number;
    livelloBatteriaShuttlePct: number;
    correnteAssorbitaMotoriA: number;
    tempAmbientaleCorsieC: number;
  };
}

// 6. NODO CONTROLLO PALLET VUOTI (WOODPECKER)
export interface WoodpeckerPalletCheckNode {
  id: string;
  nome: string;
  metricheIspezione: {
    throughputPalletOra: number;
    forzaDeformazionePattiniN: number;
    umiditaLegnoPct: number;
  };
  datiScarto: {
    esitoIspezione: 'APPROVATO_LINEE' | 'SCARTATO_MANUTENZIONE';
    mascheraDifetti: {
      asseSpaccata: boolean;
      chiodoSporgente: boolean;
      blocchettoMancante: boolean;
      fuoriTolleranzaGeometrica: boolean;
    };
    idFornitoreLottoLegno: string;
  };
}

// 7. NODO MAPPA / TRAFFICO (INFRASTRUTTURA FISSA DI STABILIMENTO)
export interface PlantTrafficInfrastructureNode {
  id: string;
  topologiaRete: {
    matriceAdiacenzaTratte: Array<{
      sorgente: string;
      destinazione: string;
      lunghezzaMm: number;
      pesoTratta: number;
    }>;
    statoSegmentiCorsia: Record<string, 'LIBERO' | 'OCCUPATO'>;
    lgvInCodaBuffer: Record<string, number>;
  };
  stazioniRicarica: Array<{
    id: string;
    statoInverter: 'STANDBY' | 'CARICA_IN_CORSO' | 'ALLARME';
    potenzaErogataKw: number;
    tempPiastraTerraC: number;
    tempPiastraBordoVeicoloC: number;
    tempoResiduoCaricaMin: number;
    navettaOccupante?: string;
  }>;
}

export interface MachineAsset {
  id: string;
  nome: string;
  tipo: 'BEMA_FASCIATORE' | 'PALLETTIZZATORE' | 'TRASLOELEVATORE_SMARTSTORE' | 'BAIA_CARICO' | 'RULLIERA_INBOUND' | 'ISOLA_ROBOT' | 'ALTRO';
  reparto: string;
  plcTag: string;
  stato: 'IN_MARCIA' | 'STANDBY' | 'ALLARME';
  telemetria?: Record<string, any>;
}

export interface BayAsset {
  id: string;
  nome: string;
  tipo: 'INBOUND' | 'OUTBOUND';
  stato: 'LIBERA' | 'OCCUPATA' | 'PRENOTATA';
  camionAssegnato?: string;
}

export interface PlantDepartment {
  id: string;
  nome: string;
  moduloTecnico: TechnicalModule;
  responsabileLinea: string;
  statoOperativo: 'OTTIMALE' | 'ATTENZIONE' | 'CRITICO';
  macchineCount: number;
}

export interface PlantTopology {
  reparti: PlantDepartment[];
  macchinari: MachineAsset[];
  flottaAgv: AgvVehicle[];
  baie: BayAsset[];
  qubitCapacity: number;
  qpuDimensioning: {
    numQubits: number;
    hamiltonianSize: string;
    shotsDefault: number;
    simulatorBackend: string;
  };
  lastSyncTimestamp: string;
  // Livello Deep Data dei 7 nodi industriali
  deepDataNodes?: {
    isolePallettizzazione?: RobotPalletizingNode[];
    fasciatoriSilkworm?: SilkwormWrapperNode[];
    etichettatriciRaptor?: RaptorLabelerNode[];
    magazzinoSmartStore?: SmartStoreWarehouseNode;
    controlloWoodpecker?: WoodpeckerPalletCheckNode;
    infrastrutturaTraffico?: PlantTrafficInfrastructureNode;
  };
  // Accesso diretto ai 7 nodi industriali
  isolePallettizzazione?: RobotPalletizingNode[];
  isoleRobotPallettizzazione?: RobotPalletizingNode[];
  fasciatoriSilkworm?: SilkwormWrapperNode[];
  fasciatoriBema?: any[];
  etichettatriciRaptor?: RaptorLabelerNode[];
  magazziniSmartStore?: SmartStoreWarehouseNode[];
  magazzinoSmartStore?: SmartStoreWarehouseNode;
  ispezioneWoodpecker?: WoodpeckerPalletCheckNode[];
  stazioniIspezioneWoodpecker?: WoodpeckerPalletCheckNode[];
  infrastrutturaTraffico?: PlantTrafficInfrastructureNode;
  microgridFastCharge?: any;
}

export type IndustrialProtocol = 'REST_HTTPS' | 'OPC_UA' | 'MQTT' | 'SIEMENS_S7';

export interface FactoryTenant {
  id: string;
  nome: string;
  sito: string;
  endpoint: string;
  logoColor: string;
  plcIp?: string;
  qpuTarget?: string;
  wmsApiKey?: string;
  createdAt?: string;
  protocol?: IndustrialProtocol;
  connectionStatus?: 'CONNESSO' | 'IN_ATTESA' | 'OFFLINE';
  plantTopology?: PlantTopology;
}

export type UserRole = 'Amministratore' | 'Operatore di Linea';

export interface UserAccount {
  id: string;
  username: string;
  nomeCompleto: string;
  ruolo: UserRole;
  password?: string;
  lineaAssegnata?: string;
  tenantId?: string;
  attivo: boolean;
  createdAt: string;
}
