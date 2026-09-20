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
  tipoRisposta?: 'CALCOLO_ESEGUITO' | 'RICHIESTA_PARAMETRI' | 'GUIDA_SISTEMA' | 'NON_PERTINENTE';
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

export interface AgvVehicle {
  id: string;
  modello: string;
  batteriaSoC: number;
  temperatura: number;
  posizione: string;
  stato: 'MISSIONE' | 'IN_CARICA' | 'IDLE';
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
