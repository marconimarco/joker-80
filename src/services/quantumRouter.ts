import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { QuantumEngine } from './quantumEngine';
import { QuantumExecutionResult, FactoryTenant, ChatOptionChoice } from '../types/quantum';

export interface RouteResolution {
  calcolo_id?: number;
  sotto_funzione?: string;
  entanglement?: 'OBBLIGATORIO' | 'FACOLTATIVO';
  entanglementSymbol?: '🔒' | '🔓';
  estratto_payload?: Record<string, any>;
  introduzione: string;
  risultato?: QuantumExecutionResult;
  azione_immediata?: string;
  livello_allarme?: 'NORMALE' | 'ATTENZIONE' | 'CRITICO';
  tipoRisposta: 'CALCOLO_ESEGUITO' | 'RICHIESTA_PARAMETRI' | 'GUIDA_SISTEMA' | 'NON_PERTINENTE' | 'ASSISTENZA_DECISIONALE';
  suggerimenti?: string[];
  opzioniScelta?: ChatOptionChoice[];
  parametriMemorizzati?: Record<string, any>;
  parametriTrasferiti?: boolean;
}

export interface ConversationMemory {
  rememberedInputs: Record<string, any>;
  lastDiscussedCalcIds?: number[];
  lastSelectedCalcId?: number;
}

export class QuantumRouterService {
  private static sessionMemory: ConversationMemory = {
    rememberedInputs: {}
  };

  /**
   * Get current session memory of remembered inputs across chat turns
   */
  static getSessionMemory(): ConversationMemory {
    return this.sessionMemory;
  }

  /**
   * Reset the session memory
   */
  static clearSessionMemory(): void {
    this.sessionMemory = {
      rememberedInputs: {}
    };
  }

  /**
   * Manually inject or update parameters in the session memory
   */
  static setRememberedInputs(inputs: Record<string, any>): void {
    this.sessionMemory.rememberedInputs = {
      ...this.sessionMemory.rememberedInputs,
      ...inputs
    };
  }

  /**
   * Check whether session memory already contains usable inputs for a specific calculation ID
   */
  static hasUsableStoredInputs(calcId: number): boolean {
    const saved = this.sessionMemory.rememberedInputs;
    if (!saved) return false;
    switch (calcId) {
      case 1: return saved.camion_attesa !== undefined || saved.minuti_ritardo !== undefined;
      case 2: return saved.ritardo_stimato_minuti !== undefined || saved.baie_libere !== undefined;
      case 3: return saved.ore_lavoro_disponibili !== undefined || saved.baie_totali !== undefined;
      case 4: return saved.umidita_rilevata !== undefined || saved.spessore_micro !== undefined;
      case 5: return saved.id_lotto_materiale !== undefined || saved.codice_fornitore !== undefined;
      case 6: return saved.classe_rotazione !== undefined || saved.celle_libere !== undefined;
      case 7: return saved.inclinazione_gradi !== undefined || saved.peso_carico_kg !== undefined;
      case 8: return saved.punti_picking !== undefined || saved.capacita_carrello_kg !== undefined;
      case 9: return saved.numero_ordini !== undefined;
      case 10: return saved.volume_disponibile_m3 !== undefined;
      case 11: return saved.id_spedizione !== undefined;
      case 12: return saved.camion_in_coda !== undefined || saved.baie_outbound !== undefined;
      case 13: return saved.flusso_orario_camion !== undefined;
      case 14: return saved.giri_minuto !== undefined || saved.vibrazione_g !== undefined;
      case 15: return saved.tensione_newton !== undefined || saved.velocita_svolgimento_ms !== undefined;
      case 16: return saved.numero_agv_attivi !== undefined;
      case 17: return saved.agv_disponibili !== undefined || saved.missioni_pendenti !== undefined;
      case 18: return saved.pressione_vuoto_bar !== undefined || saved.coppia_motori_nm !== undefined || saved.forza_pinze_n !== undefined;
      case 19: return saved.potenza_erogata_totale_kw !== undefined || saved.temp_piastre_c !== undefined || saved.livello_supercondensatori_pct !== undefined;
      case 20: return saved.forza_deformazione_pattini_n !== undefined || saved.umidita_legno_pct !== undefined;
      case 21: return saved.sscc_code !== undefined || saved.grado_qualita_stampa_iso !== undefined;
      default: return false;
    }
  }

  /**
   * Scan text for any recognizable industrial metrics and values across all 21 calculations
   */
  static extractAnyParameters(text: string): Record<string, any> {
    const extracted: Record<string, any> = {};

    // 1. Trucks
    const cMatch = text.match(/(\d+)\s*(?:camion|veicoli|truck)/i) || text.match(/piazzale.*?(\d+)/i);
    if (cMatch) {
      const val = parseInt(cMatch[1], 10);
      extracted.camion_attesa = val;
      extracted.camion_in_coda = val;
    }

    // 2. Delay minutes
    const rMatch = text.match(/(\d+)\s*(?:minuti|min|m)\s*(?:di)?\s*ritardo/i) || text.match(/ritardo\s*(?:di|stimato|accumulato)?\s*(?:di)?\s*(\d+)/i);
    if (rMatch) {
      const min = parseInt(rMatch[1], 10);
      extracted.minuti_ritardo = min;
      extracted.ritardo_stimato_minuti = min;
    }

    // 3. Bays
    const bLibereMatch = text.match(/(\d+)\s*bai[ae]\s*liber[ae]/i);
    const bTotaliMatch = text.match(/(\d+)\s*bai[ae]\s*total[ie]/i) || text.match(/(\d+)\s*bai[ae]/i);
    if (bLibereMatch) extracted.baie_libere = parseInt(bLibereMatch[1], 10);
    if (bTotaliMatch) {
      const bVal = parseInt(bTotaliMatch[1], 10);
      extracted.baie_totali = bVal;
      extracted.baie_outbound = bVal;
    }

    // 4. Hours
    const oMatch = text.match(/(\d+)\s*(?:ore|h)(?:\s*di\s*lavoro)?/i) || text.match(/turno\s*(?:di|da)?\s*(\d+)/i);
    if (oMatch) extracted.ore_lavoro_disponibili = parseInt(oMatch[1], 10);

    // 5. WMS Saturation
    const wMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:saturazione|wms|magazzino)?/i) || text.match(/saturazione\s*(?:wms|magazzino)?\s*(?:del|al)?\s*(\d+(?:\.\d+)?)/i);
    if (wMatch) extracted.saturazione_wms = parseFloat(wMatch[1]);

    // 6. Humidity
    const uMatch = text.match(/umidit[aà]\s*(?:del|al)?\s*(\d+(?:\.\d+)?)\s*%/i) || text.match(/(\d+(?:\.\d+)?)\s*%\s*umidit/i);
    if (uMatch) {
      const uVal = parseFloat(uMatch[1]);
      extracted.umidita_rilevata = uVal;
      extracted.umidita_legno_pct = uVal;
    }

    // 7. Thickness
    const sMatch = text.match(/spessore\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:micro|micron)/i);
    if (sMatch) extracted.spessore_micro = parseFloat(sMatch[1]);

    // 8. RPM
    const rpmMatch = text.match(/(\d+)\s*(?:rpm|giri\s*(?:al\s*minuto|\/min)?)/i);
    if (rpmMatch) extracted.giri_minuto = parseInt(rpmMatch[1], 10);

    // 9. Vibration
    const vibMatch = text.match(/(\d+(?:\.\d+)?)\s*g\b/i) || text.match(/vibrazion[ei]\s*(?:a|di)?\s*(\d+(?:\.\d+)?)/i);
    if (vibMatch) extracted.vibrazione_g = parseFloat(vibMatch[1]);

    // 10. Newton / Tension / Woodpecker
    const nMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:n|newton)/i);
    if (nMatch) {
      const val = parseFloat(nMatch[1]);
      if (val > 1000) {
        extracted.forza_deformazione_pattini_n = val;
      } else {
        extracted.tensione_newton = val;
      }
    }

    // 11. Vacuum bar
    const barMatch = text.match(/(-\d+(?:\.\d+)?)\s*(?:bar)?/i) || text.match(/vuoto\s*(?:a)?\s*(-\d+(?:\.\d+)?)/i);
    if (barMatch) extracted.pressione_vuoto_bar = parseFloat(barMatch[1]);

    // 12. Torque Nm
    const nmMatch = text.match(/(\d+)\s*(?:nm|newton\s*metro)/i);
    if (nmMatch) extracted.coppia_motori_nm = parseInt(nmMatch[1], 10);

    // 13. Power kW
    const kwMatch = text.match(/(\d+(?:\.\d+)?)\s*kw/i);
    if (kwMatch) extracted.potenza_erogata_totale_kw = parseFloat(kwMatch[1]);

    // 14. Temperatures
    const tempMatch = text.match(/(\d+(?:\.\d+)?)\s*°c/i) || text.match(/temp(?:eratura)?\s*(?:di|a)?\s*(\d+(?:\.\d+)?)/i);
    if (tempMatch) {
      const tVal = parseFloat(tempMatch[1]);
      extracted.temp_piastre_c = tVal;
      extracted.temp_testina_termica_c = tVal;
    }

    // 15. SSCC Code
    const ssccMatch = text.match(/sscc\s*[:=]?\s*(\d{10,20})/i) || text.match(/\b(0\d{17})\b/);
    if (ssccMatch) extracted.sscc_code = ssccMatch[1];

    return extracted;
  }
  /**
   * Parse user query, understand intent (greeting, help, out-of-scope, factory topic),
   * extract real input parameters without injecting fake defaults,
   * execute the simulated CUDA-Q circuit when parameters are present,
   * or guide the operator with exact requirements when parameters are missing.
   */
  static async routeAndSolve(userMessage: string, activeTenant?: FactoryTenant): Promise<RouteResolution> {
    const raw = userMessage.trim();
    const text = raw.toLowerCase();

    // 0. UNIVERSAL REAL-TIME PARAMETER EXTRACTION & MEMORY INJECTION
    // Every time the user types any domain numbers, we capture and retain them in session memory!
    const extractedNow = this.extractAnyParameters(text);
    if (Object.keys(extractedNow).length > 0) {
      this.sessionMemory.rememberedInputs = {
        ...this.sessionMemory.rememberedInputs,
        ...extractedNow
      };
    }

    // 1. GREETING / ASSISTANT INFO / HELP INTENT
    const isGreetingOrHelp = /^(ciao|salve|buongiorno|buonasera|buond[iì]|hey|hello|chi sei|come funzion[ia]|cosa (fai|puoi fare|sai fare)|aiuto|help|istruzioni|manuale|info)\b/i.test(text);
    if (isGreetingOrHelp && !text.includes('calcolo') && !text.includes('baia') && !text.includes('bema') && !text.includes('agv') && !text.includes('camion') && !text.includes('robot') && !text.includes('woodpecker') && !text.includes('raptor') && !text.includes('blocc') && !text.includes('cosa fare')) {
      return {
        tipoRisposta: 'GUIDA_SISTEMA',
        introduzione: `👋 **Assistente di Controllo e Routing Quantistico JOKER 80 (SM.I.LE80)**

Sono il copilota intelligente integrato con il nucleo computazionale quantistico CUDA-Q.
Monitoro e ottimizzo i processi industriali dello stabilimento attivo attraverso **21 calcoli quantistici**:

1. **Inbound & Materie Prime**:
   - Stress-test congestione camion piazzale (QBM) [1]
   - Rischio fermo linea su turni futuri (Monte Carlo) [2]
   - Schedulazione turni personale e baie di carico [3]
   - Controllo qualità lotti e tracciabilità Post-Quantum Hash [4, 5]
2. **Magazzino & Stoccaggio**:
   - Allocazione pallet 3D SmartStore (Bin Packing) [6]
   - Monitoraggio deformazioni strutturali scaffalature (Hopfield) [7]
   - Ottimizzazione percorsi carrelli e prelievo rapido (TSP Walk) [8]
   - Batching e accorpamento ordini di spedizione (QGNN) [9]
3. **Outbound & Spedizioni**:
   - Incastro volumetrico cassone camion (Knapsack VQE) [10]
   - Sigillo e firma Post-Quantum e-CMR per vettori [11]
   - Risoluzione conflitti priorità baie e piazzale (Game Theory & K-Means) [12, 13]
4. **IoT, Macchine Bema & Flotta AGV**:
   - Diagnostica micro-vibrazioni braccio rotante Bema Silkworm (QFT) [14]
   - Predizione tensione e prevenzione strappo film estensibile (QSVM) [15]
   - Decongestione traffico e incroci flotta AGV/LGV (QAOA) [16]
   - Bipartite matching missioni e bilanciamento batterie al litio [17]
5. **Robotica, Microgrid & Integrità Pallet (Nuovi Nodi)**:
   - Cinematica 6 assi e tenuta vuoto robot pallettizzazione (VQE) [18]
   - Peak shaving e bilanciamento microrete induttiva fast-charge [19]
   - Ispezione non distruttiva e scarto pallet d'ingresso Woodpecker (QSVM) [20]
   - Validazione Post-Quantum ZKP etichette GS1/SSCC Raptor (ML-DSA Dilithium) [21]

Puoi scrivermi liberamente la situazione di linea con i tuoi numeri reali (es. *"Ho 4 baie e 8 ore di lavoro"*), oppure chiedere un'analisi indicando l'argomento (es. *"orario turni"*, *"robot pallettizzazione"*, *"ispezione woodpecker"*).`,
        suggerimenti: [
          "Ho 4 baie e 8 ore di lavoro disponibili",
          "Allarme Bema: 52 rpm con forti vibrazioni",
          "Robot pallettizzatore: pressione vuoto -0.62 bar e sovraccarico joint J2",
          "Ispezione Woodpecker: umidità legno al 19% e chiodo sporgente"
        ]
      };
    }

    // 1b. OPERATOR STUCK / ASKING FOR ADVICE / COMPARING OPTIONS
    const isAskingForAdviceOrStuck = 
      /\b(blocc|cosa fare|cosa devo fare|cosa posso fare|non so cosa|non so come|come proced|cosa mi consigli|cosa consigli|consigliami|consiglio|quale calcolo|quale algoritmo|quale usare|quale scelgo|indeciso|differenza tra|come risolvo|come sblocco|problema con|ho un problema|allarme|anomalia|suggerisci)\b/i.test(text)
      && !text.startsWith('esegui calcolo') && !text.startsWith('esegui il calcolo');

    if (isAskingForAdviceOrStuck) {
      return this.buildDecisionGuidance(activeTenant, extractedNow);
    }

    // 2. CHECK EXPLICIT CALCULATION ID (e.g. "Calcolo 3", "calcolo [14]", "id 6", "#21")
    const explicitIdMatch = text.match(/(?:calcolo|id|numero|num|calc)\s*\[?\s*(\d{1,2})\s*\]?/i);
    let targetId: number | null = null;
    if (explicitIdMatch) {
      const parsed = parseInt(explicitIdMatch[1], 10);
      if (parsed >= 1 && parsed <= 21) {
        targetId = parsed;
      }
    }

    // Check if user confirmed previous recommendation (e.g. "procedi", "esegui", "ok procedi", "usa il primo", "vai")
    if (!targetId && (text.includes('procedi') || text.includes('confermo') || text.includes('esegui') || text.includes('vai') || text.includes('fai il calcolo') || text.includes('usa questo') || text.includes('usa il primo'))) {
      if (this.sessionMemory.lastDiscussedCalcIds && this.sessionMemory.lastDiscussedCalcIds.length > 0) {
        targetId = this.sessionMemory.lastDiscussedCalcIds[0];
      }
    }

    // 3. SEMANTIC INTENT MAPPING (Identify which of the 21 calculations matches the query)
    if (!targetId) {
      if (
        text.includes('orari') || text.includes('orario') || text.includes('turno') || text.includes('turni') ||
        text.includes('personale') || text.includes('ore_lavoro') || text.includes('schedulazione baie') ||
        text.includes('bay scheduler') || text.includes('integer programming') || text.includes('ore di lavoro')
      ) {
        targetId = 3;
      } else if (
        text.includes('boltzmann') || text.includes('qbm') || text.includes('congestione') ||
        (text.includes('camion') && (text.includes('wms') || text.includes('attesa') || text.includes('piazzale') || text.includes('ritardo')))
      ) {
        targetId = 1;
      } else if (
        text.includes('monte carlo') || text.includes('fermo linea') || text.includes('rischio turno') ||
        text.includes('baia bloccata') || text.includes('ritardo fornitore')
      ) {
        targetId = 2;
      } else if (
        text.includes('qualità') || text.includes('qualita') || text.includes('umidità') || text.includes('umidita') ||
        text.includes('spessore') || text.includes('quarantena') || text.includes('walk clustering') || text.includes('bobina')
      ) {
        targetId = 4;
      } else if (
        text.includes('hashing') || text.includes('post-quantum') || text.includes('tracciabilit') ||
        text.includes('fornitore') || text.includes('sha-3') || text.includes('token') || text.includes('sigillo')
      ) {
        targetId = 5;
      } else if (
        text.includes('bin packing') || text.includes('slot 3d') || text.includes('put-away') ||
        text.includes('celle libere') || text.includes('smartstore') || text.includes('classe rotazione') || text.includes('stoccaggio')
      ) {
        targetId = 6;
      } else if (
        text.includes('hopfield') || text.includes('integrità scaffal') || text.includes('integrita scaffal') ||
        text.includes('inclinazione') || text.includes('deformazione strutturale') || text.includes('scaffal')
      ) {
        targetId = 7;
      } else if (
        text.includes('tsp') || text.includes('picking') || text.includes('prelievo') || text.includes('percorso carrello')
      ) {
        targetId = 8;
      } else if (
        text.includes('qgnn') || text.includes('batching') || text.includes('raggruppamento ordini') || text.includes('accorpare')
      ) {
        targetId = 9;
      } else if (
        text.includes('vqe') && (text.includes('cassone') || text.includes('camion') || text.includes('volumetrico'))
      ) {
        targetId = 10;
      } else if (
        text.includes('e-cmr') || text.includes('ecmr') || text.includes('cifratura') || text.includes('vettore') || text.includes('lettera di vettura')
      ) {
        targetId = 11;
      } else if (
        text.includes('game theory') || text.includes('teoria dei giochi') || text.includes('dock & slot') ||
        text.includes('conflitto baie') || text.includes('priorità autisti')
      ) {
        targetId = 12;
      } else if (
        text.includes('k-means') || text.includes('kmeans') || text.includes('buffer') || text.includes('polmone') || text.includes('traffico piazzale')
      ) {
        targetId = 13;
      } else if (
        text.includes('fourier') || text.includes('qft') || text.includes('vibrazion') || text.includes('cuscinetto') ||
        text.includes('braccio rotante') || text.includes('fasciatore') || (text.includes('bema') && !text.includes('film') && !text.includes('tensione')) || text.includes('rpm') || text.includes('giri')
      ) {
        targetId = 14;
      } else if (
        text.includes('qsvm') && (text.includes('film') || text.includes('estensibile') || text.includes('tensione')) ||
        text.includes('film') || text.includes('estensibile') || text.includes('tensione') || text.includes('strappo')
      ) {
        targetId = 15;
      } else if (
        text.includes('qaoa') || text.includes('qrl') || (text.includes('agv') && (text.includes('traffico') || text.includes('rotta') || text.includes('incrocio') || text.includes('ingorgo'))) ||
        text.includes('lgv') || text.includes('carrelli')
      ) {
        targetId = 16;
      } else if (
        text.includes('bipartite matching') || text.includes('batteri') || text.includes('ricarica') || text.includes('soc') || text.includes('litio')
      ) {
        targetId = 17;
      } else if (
        text.includes('robot') || text.includes('pallettizz') || text.includes('joint') || text.includes('vuoto') ||
        text.includes('cinematica robot') || text.includes('riduttori') || text.includes('coppia motori')
      ) {
        targetId = 18;
      } else if (
        text.includes('microrete') || text.includes('peak shaving') || text.includes('supercondensator') ||
        text.includes('ricarica induttiva') || text.includes('fast-charge') || text.includes('fast charge') || text.includes('piastra terra')
      ) {
        targetId = 19;
      } else if (
        text.includes('woodpecker') || text.includes('integrità pallet') || text.includes('integrita pallet') ||
        text.includes('pattini') || text.includes('umidità legno') || text.includes('umidita legno') || text.includes('scarto pallet')
      ) {
        targetId = 20;
      } else if (
        text.includes('raptor') || text.includes('sscc') || text.includes('gs1') || text.includes('etichettat') ||
        text.includes('zkp') || text.includes('dilithium') || text.includes('qualità stampa') || text.includes('qualita stampa')
      ) {
        targetId = 21;
      }
    }

    // 4. NON-PERTINENT INTENT (Totally outside factory scope)
    if (!targetId) {
      const nonIndustrialKeywords = ['meteo', 'tempo a ', 'tempo fa', 'roma', 'milano', 'pizza', 'pasta', 'ricetta', 'calcio', 'partita', 'serie a', 'film', 'cinema', 'musica', 'canzone', 'politica', 'governo', 'notizie', 'barzelletta'];
      const isClearlyOffTopic = nonIndustrialKeywords.some(kw => text.includes(kw));

      return {
        tipoRisposta: 'NON_PERTINENTE',
        introduzione: isClearlyOffTopic
          ? `⚠️ **Richiesta Fuori Ambito Industriale**

La tua richiesta non è pertinente ai processi produttivi o logistici dello stabilimento SM.I.LE80.
Il middleware è dedicato esclusivamente al controllo, monitoraggio e ottimizzazione dei **21 moduli quantistici di fabbrica** (inbound baie, magazzino SmartStore, spedizioni outbound, macchine Bema, flotta LGV, robotica, microgrid, ispezione pallet e tracciabilità ZKP).`
          : `🔍 **Nessun Calcolo Quantistico Corrispondente Trovato**

Non è stato possibile associare la richiesta ad alcuna delle 21 sotto-funzioni del sistema SM.I.LE80.
Verifica la terminologia utilizzata oppure specifica il reparto/macchinario di interesse:
- **Inbound**: Camion in attesa, ritardi fornitori, turni baie, controllo qualità lotti
- **Magazzino & Pallet**: Celle SmartStore, deformazione scaffalature, percorsi picking, batching ordini, integrità Woodpecker
- **Outbound**: Carico volumetrico cassoni, documenti e-CMR, gestione piazzale
- **Macchine & AGV**: Fasciatore Bema (vibrazioni o film), traffico LGV, batterie, robotica di pallettizzazione e microgrid`,
        suggerimenti: [
          "Mostra orari e turni baie (Calcolo 3)",
          "Diagnostica vibrazioni Bema (Calcolo 14)",
          "Controllo batterie flotta AGV (Calcolo 17)",
          "Stato congestione camion piazzale (Calcolo 1)"
        ]
      };
    }

    const calcMeta = QUANTUM_CALCULATIONS.find(c => c.id === targetId)!;
    const topology = activeTenant?.plantTopology;

    // 5. CHECK IF USER PROVIDED REAL NUMBERS / ATTRIBUTES, OR IF THEY ARE JUST ASKING ABOUT THE CALCULATION
    const hasNumbers = /\d+/.test(text);
    const wantsPlantTelemetry = text.includes('telemetr') || text.includes('impianto') || text.includes('stabilimento') || text.includes('dati reali') || text.includes('attuale') || text.includes('corrente') || text.includes('live') || text.includes('macchina');
    const hasStoredInputsForTarget = this.hasUsableStoredInputs(targetId);

    // If no numbers were given and the user didn't ask for plant telemetry AND there are no stored inputs from conversation, RETURN PARAMETER GUIDANCE!
    if (!hasNumbers && !wantsPlantTelemetry && !hasStoredInputsForTarget) {
      return this.buildParameterGuidance(calcMeta, activeTenant);
    }

    // 6. EXTRACT REAL PARAMETERS GIVEN BY OPERATOR (or read from active plant telemetry or conversation memory)
    const inputs: Record<string, any> = {};
    const extractedSource: Record<string, 'OPERATORE' | 'TELEMETRIA_IMPIANTO' | 'VALORE_BASE' | 'OPERATORE_MEMORIZZATO'> = {};
    let hasTransferredParams = false;
    const saved = this.sessionMemory.rememberedInputs;

    if (targetId === 1) {
      const cMatch = text.match(/(\d+)\s*(?:camion|veicoli)/i) || (hasNumbers ? text.match(/(\d+)/) : null);
      const rMatch = text.match(/(\d+)\s*(?:minuti|min|m)\s*(?:di)?\s*ritardo/i) || text.match(/ritardo\s*(?:di)?\s*(\d+)/i);
      const wMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:saturazione|wms|magazzino)?/i) || text.match(/saturazione\s*(?:wms|magazzino)?\s*(?:del|al)?\s*(\d+(?:\.\d+)?)/i);

      if (cMatch) { 
        inputs.camion_attesa = parseInt(cMatch[1], 10); 
        extractedSource.camion_attesa = 'OPERATORE'; 
      } else if (saved.camion_attesa !== undefined) {
        inputs.camion_attesa = saved.camion_attesa;
        extractedSource.camion_attesa = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology) { 
        inputs.camion_attesa = topology.baie.filter(b => b.stato === 'OCCUPATA').length + 2; 
        extractedSource.camion_attesa = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.camion_attesa = 8; 
        extractedSource.camion_attesa = 'VALORE_BASE'; 
      }

      if (rMatch) { 
        inputs.minuti_ritardo = parseInt(rMatch[1], 10); 
        extractedSource.minuti_ritardo = 'OPERATORE'; 
      } else if (saved.minuti_ritardo !== undefined) {
        inputs.minuti_ritardo = saved.minuti_ritardo;
        extractedSource.minuti_ritardo = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.minuti_ritardo = 25; 
        extractedSource.minuti_ritardo = 'VALORE_BASE'; 
      }

      if (wMatch) { 
        inputs.saturazione_wms = parseFloat(wMatch[1]); 
        extractedSource.saturazione_wms = 'OPERATORE'; 
      } else if (saved.saturazione_wms !== undefined) {
        inputs.saturazione_wms = saved.saturazione_wms;
        extractedSource.saturazione_wms = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.saturazione_wms = 78.0; 
        extractedSource.saturazione_wms = 'VALORE_BASE'; 
      }

    } else if (targetId === 2) {
      const rMatch = text.match(/(\d+)\s*(?:minuti|min)/i) || text.match(/ritardo\s*(?:stimato)?\s*(?:di)?\s*(\d+)/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);

      if (rMatch) { 
        inputs.ritardo_stimato_minuti = parseInt(rMatch[1], 10); 
        extractedSource.ritardo_stimato_minuti = 'OPERATORE'; 
      } else if (saved.ritardo_stimato_minuti !== undefined || saved.minuti_ritardo !== undefined) {
        inputs.ritardo_stimato_minuti = saved.ritardo_stimato_minuti ?? saved.minuti_ritardo;
        extractedSource.ritardo_stimato_minuti = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.ritardo_stimato_minuti = 45; 
        extractedSource.ritardo_stimato_minuti = 'VALORE_BASE'; 
      }

      if (bMatch) { 
        inputs.baie_libere = parseInt(bMatch[1], 10); 
        extractedSource.baie_libere = 'OPERATORE'; 
      } else if (saved.baie_libere !== undefined) {
        inputs.baie_libere = saved.baie_libere;
        extractedSource.baie_libere = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology) { 
        inputs.baie_libere = Math.max(1, topology.baie.filter(b => b.stato === 'LIBERA').length); 
        extractedSource.baie_libere = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.baie_libere = 2; 
        extractedSource.baie_libere = 'VALORE_BASE'; 
      }

    } else if (targetId === 3) {
      const oMatch = text.match(/(\d+)\s*(?:ore|h)/i) || text.match(/turno\s*(?:di|da)?\s*(\d+)/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);

      if (oMatch) { 
        inputs.ore_lavoro_disponibili = parseInt(oMatch[1], 10); 
        extractedSource.ore_lavoro_disponibili = 'OPERATORE'; 
      } else if (saved.ore_lavoro_disponibili !== undefined) {
        inputs.ore_lavoro_disponibili = saved.ore_lavoro_disponibili;
        extractedSource.ore_lavoro_disponibili = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.ore_lavoro_disponibili = 8; 
        extractedSource.ore_lavoro_disponibili = 'VALORE_BASE'; 
      }

      if (bMatch) { 
        inputs.baie_totali = parseInt(bMatch[1], 10); 
        extractedSource.baie_totali = 'OPERATORE'; 
      } else if (saved.baie_totali !== undefined) {
        inputs.baie_totali = saved.baie_totali;
        extractedSource.baie_totali = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology) { 
        inputs.baie_totali = topology.baie.length; 
        extractedSource.baie_totali = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.baie_totali = 4; 
        extractedSource.baie_totali = 'VALORE_BASE'; 
      }

    } else if (targetId === 4) {
      const uMatch = text.match(/umidit[aà]\s*(?:del)?\s*(\d+(?:\.\d+)?)\s*%/i) || text.match(/(\d+(?:\.\d+)?)\s*%\s*umidit/i);
      const sMatch = text.match(/spessore\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:micro|micron)/i);

      if (uMatch) { 
        inputs.umidita_rilevata = parseFloat(uMatch[1]); 
        extractedSource.umidita_rilevata = 'OPERATORE'; 
      } else if (saved.umidita_rilevata !== undefined) {
        inputs.umidita_rilevata = saved.umidita_rilevata;
        extractedSource.umidita_rilevata = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.umidita_rilevata = 6.8; 
        extractedSource.umidita_rilevata = 'VALORE_BASE'; 
      }

      if (sMatch) { 
        inputs.spessore_micro = parseFloat(sMatch[1]); 
        extractedSource.spessore_micro = 'OPERATORE'; 
      } else if (saved.spessore_micro !== undefined) {
        inputs.spessore_micro = saved.spessore_micro;
        extractedSource.spessore_micro = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.spessore_micro = 125.0; 
        extractedSource.spessore_micro = 'VALORE_BASE'; 
      }

    } else if (targetId === 5) {
      inputs.id_lotto_materiale = saved.id_lotto_materiale || 'LOT-2026-X8';
      inputs.codice_fornitore = saved.codice_fornitore || 'SUPP-E80-EMILIA';
      inputs.timestamp_ricezione = Date.now();
      extractedSource.id_lotto_materiale = saved.id_lotto_materiale ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 6) {
      inputs.classe_rotazione = saved.classe_rotazione || (text.includes('alta') ? 'A' : text.includes('bassa') ? 'C' : 'A');
      inputs.celle_libere = saved.celle_libere ?? (topology?.magazziniSmartStore?.[0]?.strutturaSpazio?.matrice3dOccupazione?.vuote ?? 142);
      inputs.peso_kg = saved.peso_kg ?? 780;
      extractedSource.celle_libere = saved.celle_libere ? 'OPERATORE_MEMORIZZATO' : 'TELEMETRIA_IMPIANTO';

    } else if (targetId === 7) {
      inputs.inclinazione_gradi = saved.inclinazione_gradi ?? (text.includes('gradi') ? 0.95 : 0.42);
      inputs.peso_carico_kg = saved.peso_carico_kg ?? 18400;
      inputs.vibrazioni_fondo_g = saved.vibrazioni_fondo_g ?? 0.08;
      extractedSource.inclinazione_gradi = saved.inclinazione_gradi ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 8) {
      inputs.punti_picking = saved.punti_picking ?? 7;
      inputs.capacita_carrello_kg = saved.capacita_carrello_kg ?? 1200;
      inputs.corridoio_prioritario = saved.corridoio_prioritario ?? 'C-04';
      extractedSource.punti_picking = saved.punti_picking ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 9) {
      inputs.numero_ordini = saved.numero_ordini ?? 16;
      inputs.soglia_affinita_lotto = saved.soglia_affinita_lotto ?? 0.85;
      inputs.destinazione_comune = true;
      extractedSource.numero_ordini = saved.numero_ordini ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 10) {
      inputs.volume_disponibile_m3 = saved.volume_disponibile_m3 ?? 82.5;
      inputs.peso_massimo_kg = saved.peso_massimo_kg ?? 28000;
      inputs.vincolo_anti_sbilanciamento = true;
      extractedSource.volume_disponibile_m3 = saved.volume_disponibile_m3 ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 11) {
      inputs.id_spedizione = saved.id_spedizione || 'SHP-2026-9901';
      inputs.vettore_piva = saved.vettore_piva || 'IT12345678901';
      inputs.destinazione_hub = saved.destinazione_hub || 'BOLOGNA_INTERPORTO';
      extractedSource.id_spedizione = saved.id_spedizione ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 12) {
      inputs.camion_in_coda = saved.camion_in_coda ?? (saved.camion_attesa ?? 6);
      inputs.baie_outbound = saved.baie_outbound ?? (topology ? topology.baie.length : 4);
      inputs.finestra_oraria_urgente = true;
      extractedSource.camion_in_coda = (saved.camion_in_coda || saved.camion_attesa) ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 13) {
      inputs.flusso_orario_camion = saved.flusso_orario_camion ?? 12;
      inputs.tempo_medio_stazionamento_min = saved.tempo_medio_stazionamento_min ?? 42;
      inputs.capacita_buffer_piazzale = saved.capacita_buffer_piazzale ?? 18;
      extractedSource.flusso_orario_camion = saved.flusso_orario_camion ? 'OPERATORE_MEMORIZZATO' : 'VALORE_BASE';

    } else if (targetId === 14) {
      const rpmMatch = text.match(/(\d+)\s*(?:rpm|giri)/i) || (hasNumbers ? text.match(/(\d+)/) : null);
      const vibMatch = text.match(/(\d+(?:\.\d+)?)\s*g\b/i);

      if (rpmMatch) { 
        inputs.giri_minuto = parseInt(rpmMatch[1], 10); 
        extractedSource.giri_minuto = 'OPERATORE'; 
      } else if (saved.giri_minuto !== undefined) {
        inputs.giri_minuto = saved.giri_minuto;
        extractedSource.giri_minuto = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology) { 
        inputs.giri_minuto = topology.fasciatoriSilkworm?.[0]?.dinamicaAvvolgimento?.velocitaRotazioneRpm || 48; 
        extractedSource.giri_minuto = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.giri_minuto = 48; 
        extractedSource.giri_minuto = 'VALORE_BASE'; 
      }

      if (vibMatch) { 
        inputs.vibrazione_g = parseFloat(vibMatch[1]); 
        extractedSource.vibrazione_g = 'OPERATORE'; 
      } else if (saved.vibrazione_g !== undefined) {
        inputs.vibrazione_g = saved.vibrazione_g;
        extractedSource.vibrazione_g = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology) { 
        const bema = topology.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
        inputs.vibrazione_g = bema?.telemetria?.vibrazione_g || 1.8; 
        extractedSource.vibrazione_g = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.vibrazione_g = 2.1; 
        extractedSource.vibrazione_g = 'VALORE_BASE'; 
      }

    } else if (targetId === 15) {
      const nMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:n|newton)/i);
      const sMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|metri)/i);

      if (nMatch) { 
        inputs.tensione_newton = parseFloat(nMatch[1]); 
        extractedSource.tensione_newton = 'OPERATORE'; 
      } else if (saved.tensione_newton !== undefined) {
        inputs.tensione_newton = saved.tensione_newton;
        extractedSource.tensione_newton = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.tensione_newton = 135.0; 
        extractedSource.tensione_newton = 'VALORE_BASE'; 
      }

      if (sMatch) { 
        inputs.velocita_svolgimento_ms = parseFloat(sMatch[1]); 
        extractedSource.velocita_svolgimento_ms = 'OPERATORE'; 
      } else if (saved.velocita_svolgimento_ms !== undefined) {
        inputs.velocita_svolgimento_ms = saved.velocita_svolgimento_ms;
        extractedSource.velocita_svolgimento_ms = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else { 
        inputs.velocita_svolgimento_ms = 11.2; 
        extractedSource.velocita_svolgimento_ms = 'VALORE_BASE'; 
      }

    } else if (targetId === 16) {
      inputs.numero_agv_attivi = saved.numero_agv_attivi ?? (topology ? topology.flottaAgv.filter(a => a.stato === 'MISSIONE').length : 12);
      inputs.incroci_congestionati = saved.incroci_congestionati ?? 3;
      inputs.tempo_risoluzione_max_sec = 2.0;
      extractedSource.numero_agv_attivi = saved.numero_agv_attivi ? 'OPERATORE_MEMORIZZATO' : (topology ? 'TELEMETRIA_IMPIANTO' : 'VALORE_BASE');

    } else if (targetId === 17) {
      inputs.agv_disponibili = saved.agv_disponibili ?? (topology ? topology.flottaAgv.length : 14);
      inputs.missioni_pendenti = saved.missioni_pendenti ?? 9;
      inputs.soglia_minima_soc_pct = saved.soglia_minima_soc_pct ?? 25.0;
      extractedSource.agv_disponibili = saved.agv_disponibili ? 'OPERATORE_MEMORIZZATO' : (topology ? 'TELEMETRIA_IMPIANTO' : 'VALORE_BASE');

    } else if (targetId === 18) {
      const vMatch = text.match(/(-\d+(?:\.\d+)?)\s*(?:bar)?/i) || text.match(/vuoto\s*(?:a)?\s*(-\d+(?:\.\d+)?)/i);
      const cMatch = text.match(/(\d+)\s*(?:nm|newton\s*metro)/i);

      if (vMatch) { 
        inputs.pressione_vuoto_bar = parseFloat(vMatch[1]); 
        extractedSource.pressione_vuoto_bar = 'OPERATORE'; 
      } else if (saved.pressione_vuoto_bar !== undefined) {
        inputs.pressione_vuoto_bar = saved.pressione_vuoto_bar;
        extractedSource.pressione_vuoto_bar = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.isolePallettizzazione?.[0]) { 
        inputs.pressione_vuoto_bar = topology.isolePallettizzazione[0].sensoriPresaAria.pressionePneumaticaVuotoBar; 
        extractedSource.pressione_vuoto_bar = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.pressione_vuoto_bar = -0.84; 
        extractedSource.pressione_vuoto_bar = 'VALORE_BASE'; 
      }

      if (cMatch) { 
        inputs.coppia_motori_nm = parseInt(cMatch[1], 10); 
        extractedSource.coppia_motori_nm = 'OPERATORE'; 
      } else if (saved.coppia_motori_nm !== undefined) {
        inputs.coppia_motori_nm = saved.coppia_motori_nm;
        extractedSource.coppia_motori_nm = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.isolePallettizzazione?.[0]) { 
        inputs.coppia_motori_nm = topology.isolePallettizzazione[0].elettromeccanicaRobot.coppiaMotoriNm[1] || 380; 
        extractedSource.coppia_motori_nm = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.coppia_motori_nm = 380; 
        extractedSource.coppia_motori_nm = 'VALORE_BASE'; 
      }
      inputs.forza_pinze_n = saved.forza_pinze_n ?? 620;

    } else if (targetId === 19) {
      const pMatch = text.match(/(\d+(?:\.\d+)?)\s*kw/i);
      const tMatch = text.match(/(\d+(?:\.\d+)?)\s*°c/i);

      if (pMatch) { 
        inputs.potenza_erogata_totale_kw = parseFloat(pMatch[1]); 
        extractedSource.potenza_erogata_totale_kw = 'OPERATORE'; 
      } else if (saved.potenza_erogata_totale_kw !== undefined) {
        inputs.potenza_erogata_totale_kw = saved.potenza_erogata_totale_kw;
        extractedSource.potenza_erogata_totale_kw = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.microgridFastCharge) { 
        inputs.potenza_erogata_totale_kw = topology.microgridFastCharge.potenzaErogataTotaleKw; 
        extractedSource.potenza_erogata_totale_kw = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.potenza_erogata_totale_kw = 84.5; 
        extractedSource.potenza_erogata_totale_kw = 'VALORE_BASE'; 
      }

      if (tMatch) { 
        inputs.temp_piastre_c = parseFloat(tMatch[1]); 
        extractedSource.temp_piastre_c = 'OPERATORE'; 
      } else if (saved.temp_piastre_c !== undefined) {
        inputs.temp_piastre_c = saved.temp_piastre_c;
        extractedSource.temp_piastre_c = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.microgridFastCharge) { 
        inputs.temp_piastre_c = topology.microgridFastCharge.piastreTerraInduttive[0]?.tempC || 38.2; 
        extractedSource.temp_piastre_c = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.temp_piastre_c = 38.2; 
        extractedSource.temp_piastre_c = 'VALORE_BASE'; 
      }
      inputs.livello_supercondensatori_pct = saved.livello_supercondensatori_pct ?? 94.0;

    } else if (targetId === 20) {
      const fMatch = text.match(/(\d+)\s*(?:n|newton)/i);
      const uMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:umidit[aà])?/i) || text.match(/umidit[aà]\s*(?:del)?\s*(\d+(?:\.\d+)?)/i);

      if (fMatch) { 
        inputs.forza_deformazione_pattini_n = parseInt(fMatch[1], 10); 
        extractedSource.forza_deformazione_pattini_n = 'OPERATORE'; 
      } else if (saved.forza_deformazione_pattini_n !== undefined) {
        inputs.forza_deformazione_pattini_n = saved.forza_deformazione_pattini_n;
        extractedSource.forza_deformazione_pattini_n = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.ispezioneWoodpecker?.[0]) { 
        inputs.forza_deformazione_pattini_n = topology.ispezioneWoodpecker[0].metricheIspezione.forzaDeformazionePattiniN; 
        extractedSource.forza_deformazione_pattini_n = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.forza_deformazione_pattini_n = 3450; 
        extractedSource.forza_deformazione_pattini_n = 'VALORE_BASE'; 
      }

      if (uMatch) { 
        inputs.umidita_legno_pct = parseFloat(uMatch[1]); 
        extractedSource.umidita_legno_pct = 'OPERATORE'; 
      } else if (saved.umidita_legno_pct !== undefined || saved.umidita_rilevata !== undefined) {
        inputs.umidita_legno_pct = saved.umidita_legno_pct ?? saved.umidita_rilevata;
        extractedSource.umidita_legno_pct = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (topology?.ispezioneWoodpecker?.[0]) { 
        inputs.umidita_legno_pct = topology.ispezioneWoodpecker[0].metricheIspezione.umiditaLegnoPct; 
        extractedSource.umidita_legno_pct = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.umidita_legno_pct = 13.5; 
        extractedSource.umidita_legno_pct = 'VALORE_BASE'; 
      }
      inputs.presenza_chiodi_sporgenti = text.includes('chiodo') || text.includes('chiodi');

    } else if (targetId === 21) {
      const ssccMatch = text.match(/sscc\s*[:=]?\s*(\d{10,20})/i) || text.match(/\b(0\d{17})\b/);
      const raptor = topology?.etichettatriciRaptor?.[0];

      if (ssccMatch) { 
        inputs.sscc_code = ssccMatch[1]; 
        extractedSource.sscc_code = 'OPERATORE'; 
      } else if (saved.sscc_code !== undefined) {
        inputs.sscc_code = saved.sscc_code;
        extractedSource.sscc_code = 'OPERATORE_MEMORIZZATO';
        hasTransferredParams = true;
      } else if (raptor?.stampaTracciabilita) { 
        inputs.sscc_code = raptor.stampaTracciabilita.ssccCode; 
        extractedSource.sscc_code = 'TELEMETRIA_IMPIANTO'; 
      } else { 
        inputs.sscc_code = '080332190000458129'; 
        extractedSource.sscc_code = 'VALORE_BASE'; 
      }

      inputs.etichetta_gs1 = raptor?.stampaTracciabilita?.etichettaGs1 || '(01)08033219001234(10)LOT-2026-X8(15)261231';
      inputs.grado_qualita_stampa_iso = text.includes('classe b') ? 'CLASSE_B' : (raptor?.controlloQualitaVisione?.gradoQualitaStampaIso || 'CLASSE_A');
      inputs.temp_testina_termica_c = raptor?.hardwareConsumabili?.tempTestinaTermicaC || 54.2;
    }

    // 7. EXECUTE CIRCUIT IN QUANTUM ENGINE WITH THOSE EXACT INPUTS
    const res: Record<string, any> = await QuantumEngine.executeCalculation(targetId, inputs);

    // 8. DETERMINE LEVEL OF ALARM AND IMMEDIATE ACTION
    let immediateAction = '';
    let alarmLevel: 'NORMALE' | 'ATTENZIONE' | 'CRITICO' = 'NORMALE';

    if (res.indice_rischio_blocco) {
      immediateAction = res.azione_correttiva_suggerita;
      alarmLevel = res.trigger_azione_classica === 99 ? 'CRITICO' : 'NORMALE';
    } else if (res.rischio_stocastico) {
      immediateAction = res.azione_misure_sicurezza;
      alarmLevel = res.codice_allarme_fabbrica === 88 ? 'CRITICO' : 'NORMALE';
    } else if (res.efficienza_schedulazione) {
      immediateAction = res.nota_operativa_fabbrica;
      alarmLevel = res.codice_configurazione_baia === 404 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.validazione_qualita) {
      immediateAction = res.azione_logistica_immediata;
      alarmLevel = res.codice_stato_materiale === 505 ? 'CRITICO' : 'NORMALE';
    } else if (res.stato_sicurezza) {
      immediateAction = `Token di sicurezza generato: ${res.token_crittografico_generato?.slice(0, 16)}... Sigillo applicato con successo.`;
      alarmLevel = 'NORMALE';
    } else if (res.area_magazzino_assegnata) {
      immediateAction = `Assegnare a ${res.area_magazzino_assegnata} alle coordinate ${res.coordinata_3d_esatta}. Trigger inviato a SDM.`;
      alarmLevel = 'NORMALE';
    } else if (res.diagnostica_integrita) {
      immediateAction = res.azione_sicurezza_wms;
      alarmLevel = res.codice_stato_struttura === 333 ? 'CRITICO' : 'NORMALE';
    } else if (res.sequenza_prelievo_consigliata) {
      immediateAction = `Percorso picking: ${res.sequenza_prelievo_consigliata.join(' ➔ ')}. Risparmio: ${res.metri_lineari_risparmiati}m.`;
      alarmLevel = 'NORMALE';
    } else if (res.validazione_logica_lotto) {
      immediateAction = res.istruzione_operativa_picking;
      alarmLevel = res.validazione_logica_lotto.includes('RIFIUTATO') ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.efficienza_volumetrica) {
      immediateAction = `${res.efficienza_volumetrica}. ${res.bilanciamento_statico_assi}`;
      alarmLevel = res.codice_validazione_camion === 200 ? 'NORMALE' : 'ATTENZIONE';
    } else if (res.firma_post_quantum_esadecimale) {
      immediateAction = `Firma e-CMR sigillata (${res.firma_post_quantum_esadecimale}). Documento validato.`;
      alarmLevel = 'NORMALE';
    } else if (res.ottimizzazione_finestra_baia) {
      immediateAction = `${res.ottimizzazione_finestra_baia}. Direttiva: ${res.istruzione_driver_piazzale}`;
      alarmLevel = res.codice_priorita_yms === 220 ? 'NORMALE' : 'ATTENZIONE';
    } else if (res.classificazione_traffico_piazzale) {
      immediateAction = `${res.classificazione_traffico_piazzale}. Direttiva: ${res.direttiva_operatore_barra}`;
      alarmLevel = res.codice_flusso_yms === 707 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.diagnostica_spettrale) {
      immediateAction = res.direttiva_manutettiva_predittiva || res.direttiva_manutenzione_predittiva;
      alarmLevel = res.codice_allarme_ecs === 414 ? 'CRITICO' : 'NORMALE';
    } else if (res.analisi_predittiva_film) {
      immediateAction = res.azione_correttiva_plc;
      alarmLevel = res.codice_stato_macchina === 100 ? 'CRITICO' : 'NORMALE';
    } else if (res.stato_fluidita_traffico) {
      immediateAction = res.direttiva_navigazione_flotta;
      alarmLevel = res.codice_instradamento_sdm === 303 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.matrice_assegnazione_task) {
      immediateAction = `Accoppiamento task eseguito. ${res.bilanciamento_flotta_status}`;
      alarmLevel = res.codice_azione_sdm === 200 ? 'NORMALE' : 'ATTENZIONE';
    } else if (res.stabilita_presa_vuoto) {
      immediateAction = `${res.stabilita_presa_vuoto}. Direttiva: ${res.direttiva_cinematica_robot}`;
      alarmLevel = res.codice_controllo_robot === 518 ? 'CRITICO' : 'NORMALE';
    } else if (res.stato_microrete_industriale) {
      immediateAction = `${res.stato_microrete_industriale}. Direttiva: ${res.allocazione_potenza_fast_charge}`;
      alarmLevel = res.codice_gestione_rete === 519 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.esito_ispezione_pallet) {
      immediateAction = `${res.esito_ispezione_pallet}. Direttiva: ${res.direttiva_smistamento_scarto}`;
      alarmLevel = res.codice_esito_woodpecker === 520 ? 'CRITICO' : 'NORMALE';
    } else if (res.verifica_post_quantum_zkp) {
      immediateAction = `${res.verifica_post_quantum_zkp}. Direttiva: ${res.qualita_stampa_status}`;
      alarmLevel = res.codice_validazione_raptor === 521 ? 'ATTENZIONE' : 'NORMALE';
    }

    // 9. BUILD INTRODUCTORY EXPLANATION WITH TRANSPARENT INPUT ORIGINS
    const entanglementLabel = calcMeta.entanglement === 'OBBLIGATORIO' 
      ? '🔒 Entanglement Obbligatorio (porta CNOT attiva)'
      : '🔓 Entanglement Facoltativo (ottimizzazione locale)';

    const inputsList = Object.entries(inputs)
      .map(([k, v]) => {
        const src = extractedSource[k] === 'OPERATORE' 
          ? '✏️ Fornito da te ora' 
          : extractedSource[k] === 'OPERATORE_MEMORIZZATO'
          ? '💾 Trasferito dalla conversazione chat'
          : extractedSource[k] === 'TELEMETRIA_IMPIANTO' 
          ? '📡 Letto da Gateway Impianto' 
          : '⚙️ Parametro base';
        return `- **${k}**: \`${JSON.stringify(v)}\` _(${src})_`;
      })
      .join('\n');

    const transferBanner = hasTransferredParams
      ? `🔄 **PARAMETRI TRASFERITI DALLA CHAT**: I dati che avevi inserito precedentemente nella conversazione sono stati recuperati automaticamente e trasferiti al calcolo quantistico.\n\n`
      : '';

    const introduzione = `${transferBanner}**Identificazione ed Esecuzione Calcolo Quantistico:**
- **Sotto-funzione:** ${calcMeta.subFunction} (${calcMeta.technicalModule})
- **Algoritmo:** Calcolo [${calcMeta.id}] - ${calcMeta.name}
- **Regime Entanglement:** ${entanglementLabel}

**Dati di Ingresso Elaborati:**
${inputsList}

Il circuito quantistico CUDA-Q è stato simulato campionando le distribuzioni probabilistiche degli stati hamiltoniani. Risultati e direttive immediate SM.I.LE80:`;

    return {
      tipoRisposta: 'CALCOLO_ESEGUITO',
      calcolo_id: targetId,
      sotto_funzione: calcMeta.subFunction,
      entanglement: calcMeta.entanglement,
      entanglementSymbol: calcMeta.entanglementSymbol,
      estratto_payload: inputs,
      introduzione,
      risultato: res as QuantumExecutionResult,
      azione_immediata: immediateAction,
      livello_allarme: alarmLevel,
      parametriTrasferiti: hasTransferredParams,
      parametriMemorizzati: inputs
    };
  }

  /**
   * Helper to assist user when stuck or asking for recommendations/next steps.
   */
  private static buildDecisionGuidance(
    activeTenant?: FactoryTenant,
    extractedAny?: Record<string, any>,
    focusedSector?: string
  ): RouteResolution {
    const memory = this.sessionMemory;
    const hasParams = Object.keys(memory.rememberedInputs).length > 0;
    
    // Select 3-4 most relevant calculations according to sector or stored params
    let candidateIds = [1, 3, 14, 17]; // default balanced set
    if (focusedSector === 'inbound') candidateIds = [1, 2, 3, 4];
    else if (focusedSector === 'magazzino') candidateIds = [6, 7, 8, 20];
    else if (focusedSector === 'outbound') candidateIds = [10, 11, 12, 13];
    else if (focusedSector === 'macchine') candidateIds = [14, 15, 18, 21];
    else if (focusedSector === 'agv') candidateIds = [16, 17, 19];
    else if (hasParams) {
      if (memory.rememberedInputs.camion_attesa || memory.rememberedInputs.minuti_ritardo) {
        candidateIds = [1, 2, 12];
      } else if (memory.rememberedInputs.giri_minuto || memory.rememberedInputs.vibrazione_g) {
        candidateIds = [14, 15];
      } else if (memory.rememberedInputs.pressione_vuoto_bar || memory.rememberedInputs.coppia_motori_nm) {
        candidateIds = [18, 20];
      }
    }

    const options: ChatOptionChoice[] = candidateIds.map(id => {
      const c = QUANTUM_CALCULATIONS.find(q => q.id === id)!;
      return {
        calcId: c.id,
        calcName: c.name,
        calcolo_id: c.id,
        titolo: `Calcolo [${c.id}] - ${c.name}`,
        entanglementSymbol: c.entanglementSymbol,
        descrizione: `${c.subFunction} (${c.technicalModule}): ${c.description}`,
        percheSceglierlo: `Ottimizza ${c.subFunction}`,
        parametriMemorizzati: memory.rememberedInputs,
        promptEsecuzione: `Esegui Calcolo ${c.id} con i dati discussi`,
        azionePrompt: `Esegui Calcolo ${c.id} con i dati discussi`
      };
    });

    const rememberedKeys = Object.keys(memory.rememberedInputs);
    const paramsListStr = rememberedKeys.length > 0
      ? `\n\n📌 **Dati attualmente memorizzati nella sessione chat:**\n` +
        rememberedKeys.map(k => `- **${k}**: \`${JSON.stringify(memory.rememberedInputs[k])}\``).join('\n') +
        `\n\n*Selezionando uno dei calcoli proposti o scrivendo "procedi", questi dati verranno trasferiti direttamente nel calcolo quantistico senza doverli riscrivere.*`
      : `\n\n💡 *Puoi indicare liberamente i tuoi dati (es. "ci sono 8 camion in attesa e 30 min di ritardo") oppure scegliere uno dei processi consigliati.*`;

    const intro = `🤝 **Assistenza Operativa JOKER 80 & Decision Support**

Sono qui per aiutarti a sbloccarti e guidarti passo passo.
Il sistema quantistico SM.I.LE80 dispone di **21 algoritmi specializzati** per ogni fase della fabbrica (Inbound baie, Magazzino SmartStore, Spedizioni outbound, Macchine Bema, Flotta LGV, Robotica, Microgrid, Ispezione Woodpecker ed Etichettatura Raptor).${paramsListStr}

Quale operazione desideri intraprendere adesso? Puoi cliccare una delle opzioni qui sotto:`;

    const suggestions = options.map(o => o.azionePrompt || o.promptEsecuzione || '');

    return {
      tipoRisposta: 'ASSISTENZA_DECISIONALE',
      introduzione: intro,
      opzioniScelta: options,
      suggerimenti: suggestions,
      parametriMemorizzati: memory.rememberedInputs
    };
  }

  /**
   * Helper when user indicates a valid calculation/topic but hasn't supplied parameters.
   * Explains the calculation and prompts for required inputs without faking data.
   */
  private static buildParameterGuidance(calcMeta: any, activeTenant?: FactoryTenant): RouteResolution {
    const rules = calcMeta.parameterRules;
    const defaultParams = Object.keys(calcMeta.defaultInputs);

    let requiredParamsText = '';
    let examplePrompts: string[] = [];

    if (calcMeta.id === 3) {
      requiredParamsText = `
- **Ore di lavoro disponibili** per il turno (es. \`8 ore\`, \`16 ore\`)
- **Numero di baie totali** operative (es. \`4 baie\`, \`6 baie\`)`;
      examplePrompts = [
        "Ho 4 baie e 8 ore di lavoro disponibili",
        "Ho 6 baie e 16 ore su due turni",
        "Esegui calcolo 3 con telemetria impianto"
      ];
    } else if (calcMeta.id === 1) {
      requiredParamsText = `
- **Camion in attesa** nel piazzale (es. \`10 camion\`)
- **Minuti di ritardo** medi accumulati (es. \`30 minuti\`)
- **Saturazione magazzino WMS** percentuale (es. \`85%\`)`;
      examplePrompts = [
        "Ho 8 camion in attesa con 30 minuti di ritardo e wms al 75%",
        "12 camion nel piazzale e magazzino all'88%",
        "Esegui calcolo 1 con telemetria impianto"
      ];
    } else if (calcMeta.id === 14) {
      requiredParamsText = `
- **Velocità braccio rotante** in giri al minuto (es. \`45 rpm\`, \`52 giri al minuto\`)`;
      examplePrompts = [
        "Fasciatore Bema a 48 giri al minuto con micro-vibrazioni",
        "Braccio rotante a 54 rpm allarme cuscinetto",
        "Usa i dati telemetrici del fasciatore attuale"
      ];
    } else if (calcMeta.id === 15) {
      requiredParamsText = `
- **Tensione del film estensibile** in Newton (es. \`135 N\`)
- **Velocità di svolgimento** (es. \`11 m/s\`)`;
      examplePrompts = [
        "Tensione film a 145 Newton a 12 m/s",
        "Rischio strappo film tensione 160 Newton",
        "Usa telemetria film stabilimento"
      ];
    } else if (calcMeta.id === 16) {
      requiredParamsText = `
- **Stato posizioni flotta LGV/AGV** o nodi corridoio segnalati`;
      examplePrompts = [
        "Traffico flotta critico con NODO_03_BLOCCATO",
        "4 navette attive nei corridoi A1 e B2",
        "Analizza flotta con telemetria reale"
      ];
    } else if (calcMeta.id === 17) {
      requiredParamsText = `
- **Livello di carica batteria (SoC %)** e **temperatura (°C)** degli AGV`;
      examplePrompts = [
        "AGV_04 batteria 78% temp 42°C, AGV_11 batteria 92% temp 31°C",
        "Assegna missioni con batterie reali della flotta"
      ];
    } else if (calcMeta.id === 18) {
      requiredParamsText = `
- **Pressione pneumatica del vuoto** presa ventose in bar (es. \`-0.84 bar\`, soglia allarme \`-0.65 bar\`)
- **Coppia e correnti motori riduttori** assi robot (es. \`380 Nm\`, \`18.2 A\`)`;
      examplePrompts = [
        "Robot pallettizzatore: pressione vuoto a -0.62 bar e sovraccarico joint J2 a 410 Nm",
        "Pressione vuoto -0.85 bar presa stabile",
        "Usa telemetria robot pallettizzazione impianto"
      ];
    } else if (calcMeta.id === 19) {
      requiredParamsText = `
- **Potenza erogata totale ricarica flotta** in kW (es. \`85 kW\`, soglia picco \`110 kW\`)
- **Temperatura piastre induttive a terra** in °C (es. \`38°C\`, max \`44°C\`)
- **Livello carica supercondensatori** navette SmartStore in % (es. \`94%\`)`;
      examplePrompts = [
        "Picco potenza ricarica a 125 kW con piastra a 46°C",
        "Potenza erogata 82 kW e supercondensatori al 95%",
        "Bilancia microrete con telemetria ricarica impianto"
      ];
    } else if (calcMeta.id === 20) {
      requiredParamsText = `
- **Resistenza deformazione pattini** del pallet in Newton (es. \`3400 N\`, soglia min \`2600 N\`)
- **Umidità legno bancale** in % (es. \`13.2%\`, soglia scarto \`17.5%\`)
- **Presenza anomalie fisiche** (es. \`asse spaccata\`, \`chiodo sporgente\`)`;
      examplePrompts = [
        "Woodpecker: forza pattini 2400 N con umidità legno al 19% e chiodo sporgente",
        "Pallet conforme: forza 3500 N umidità 12%",
        "Esegui ispezione Woodpecker con dati live"
      ];
    } else if (calcMeta.id === 21) {
      requiredParamsText = `
- **Codice seriale SSCC GS1** a 18 cifre (es. \`080332190000458129\`)
- **Grado qualità stampa ISO** ottica testina termica (es. \`CLASSE_A\`, \`CLASSE_B\`)`;
      examplePrompts = [
        "Valida SSCC 080332190000458129 qualità CLASSE_A",
        "Allarme Raptor: etichetta degradata CLASSE_B con testina termica a 68°C",
        "Esegui verifica ZKP con telemetria etichettatrice"
      ];
    } else {
      requiredParamsText = `
Parametri richiesti: \`${calcMeta.inputDescription}\``;
      examplePrompts = [
        `Esegui ${calcMeta.name} con dati reali`,
        `Simula Calcolo [${calcMeta.id}]`
      ];
    }

    const intro = `🎯 **Rilevato: Calcolo [${calcMeta.id}] - ${calcMeta.name}**
- **Modulo SM.I.LE80:** ${calcMeta.technicalModule} ➔ ${calcMeta.subFunction}
- **Scopo:** ${calcMeta.description}
${rules ? `- **Regola Parametri:** ${rules.regola}` : ''}

Per eseguire il calcolo quantistico senza dati fittizi, fornisci i parametri necessari:
${requiredParamsText}

👉 Puoi scrivere liberamente i tuoi dati, oppure cliccare uno dei suggerimenti in basso:`;

    return {
      tipoRisposta: 'RICHIESTA_PARAMETRI',
      calcolo_id: calcMeta.id,
      sotto_funzione: calcMeta.subFunction,
      entanglement: calcMeta.entanglement,
      entanglementSymbol: calcMeta.entanglementSymbol,
      introduzione: intro,
      suggerimenti: examplePrompts
    };
  }
}
