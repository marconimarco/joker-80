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
}

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
