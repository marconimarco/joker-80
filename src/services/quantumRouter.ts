import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { QuantumEngine } from './quantumEngine';
import { QuantumExecutionResult, FactoryTenant } from '../types/quantum';

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
  tipoRisposta: 'CALCOLO_ESEGUITO' | 'RICHIESTA_PARAMETRI' | 'GUIDA_SISTEMA' | 'NON_PERTINENTE';
  suggerimenti?: string[];
}

export class QuantumRouterService {
  /**
   * Parse user query, understand intent (greeting, help, out-of-scope, factory topic),
   * extract real input parameters without injecting fake defaults,
   * execute the simulated CUDA-Q circuit when parameters are present,
   * or guide the operator with exact requirements when parameters are missing.
   */
  static async routeAndSolve(userMessage: string, activeTenant?: FactoryTenant): Promise<RouteResolution> {
    const raw = userMessage.trim();
    const text = raw.toLowerCase();

    // 1. GREETING / ASSISTANT INFO / HELP INTENT
    const isGreetingOrHelp = /^(ciao|salve|buongiorno|buonasera|buond[iì]|hey|hello|chi sei|come funzion[ia]|cosa (fai|puoi fare|sai fare)|aiuto|help|istruzioni|manuale|info)\b/i.test(text);
    if (isGreetingOrHelp && !text.includes('calcolo') && !text.includes('baia') && !text.includes('bema') && !text.includes('agv') && !text.includes('camion')) {
      return {
        tipoRisposta: 'GUIDA_SISTEMA',
        introduzione: `👋 **Assistente di Controllo e Routing Quantistico JOKER 80 (SM.I.LE80)**

Sono il copilota intelligente integrato con il nucleo computazionale quantistico CUDA-Q.
Monitoro e ottimizzo i processi industriali dello stabilimento attivo attraverso **17 calcoli quantistici**:

1. **Inbound & Materie Prime**:
   - Stress-test congestione camion piazzale (QBM)
   - Rischio fermo linea su turni futuri (Monte Carlo)
   - Schedulazione turni personale e baie di carico
   - Controllo qualità lotti (umidità, spessore) e tracciabilità Post-Quantum Hash
2. **Magazzino & Stoccaggio**:
   - Allocazione pallet 3D SmartStore (Bin Packing)
   - Monitoraggio integrità strutturale e deformazioni scaffalature (Hopfield)
   - Ottimizzazione percorsi carrelli e prelievo rapido (TSP Walk)
   - Batching e accorpamento ordini di spedizione (QGNN)
3. **Outbound & Spedizioni**:
   - Incastro volumetrico cassone camion (Knapsack VQE)
   - Sigillo e firma Post-Quantum e-CMR per vettori
   - Risoluzione conflitti priorità baie e piazzale (Game Theory & K-Means)
4. **IoT, Macchine Bema & Flotta AGV**:
   - Diagnostica micro-vibrazioni braccio rotante Bema Silkworm (QFT)
   - Predizione tensione e strappo film estensibile (QSVM)
   - Decongestione traffico e incroci flotta AGV/LGV (QAOA)
   - Bipartite matching missioni e bilanciamento batterie al litio

Puoi scrivermi liberamente la situazione di linea con i tuoi numeri reali (es. *"Ho 4 baie e 8 ore di lavoro"*), oppure chiedere un'analisi indicando l'argomento (es. *"orario turni"*, *"vibrazioni bema"*).`,
        suggerimenti: [
          "Ho 4 baie e 8 ore di lavoro disponibili",
          "Allarme Bema: 52 rpm con forti vibrazioni",
          "Traffico AGV critico con 3 veicoli attivi",
          "Ho 12 camion nel piazzale e 45 min di ritardo"
        ]
      };
    }

    // 2. CHECK EXPLICIT CALCULATION ID (e.g. "Calcolo 3", "calcolo [14]", "id 6", "#17")
    const explicitIdMatch = text.match(/(?:calcolo|id|numero|num|calc)\s*\[?\s*(\d{1,2})\s*\]?/i);
    let targetId: number | null = null;
    if (explicitIdMatch) {
      const parsed = parseInt(explicitIdMatch[1], 10);
      if (parsed >= 1 && parsed <= 17) {
        targetId = parsed;
      }
    }

    // 3. SEMANTIC INTENT MAPPING (Identify which of the 17 calculations matches the query)
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
        text.includes('vqe') || text.includes('hhl') || text.includes('knapsack') || text.includes('cassone') ||
        text.includes('carico camion') || text.includes('volumetrico') || text.includes('metri cubi')
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
        text.includes('qsvm') || text.includes('film') || text.includes('estensibile') || text.includes('tensione') ||
        text.includes('strappo') || text.includes('newton')
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
Il middleware è dedicato esclusivamente al controllo, monitoraggio e ottimizzazione dei **17 moduli quantistici di fabbrica** (inbound baie, magazzino SmartStore, spedizioni outbound, macchine Bema e flotta LGV).`
          : `🔍 **Nessun Calcolo Quantistico Corrispondente Trovato**

Non è stato possibile associare la richiesta ad alcuna delle 17 sotto-funzioni del sistema SM.I.LE80.
Verifica la terminologia utilizzata oppure specifica il reparto/macchinario di interesse:
- **Inbound**: Camion in attesa, ritardi fornitori, turni baie, controllo qualità lotti
- **Magazzino**: Celle SmartStore, deformazione scaffalature, percorsi picking, batching ordini
- **Outbound**: Carico volumetrico cassoni, documenti e-CMR, gestione piazzale
- **Macchine & AGV**: Fasciatore Bema (vibrazioni o tensione film), traffico e batterie flotta LGV`,
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

    // If no numbers were given and the user didn't ask for plant telemetry, RETURN PARAMETER GUIDANCE!
    // Do NOT inject fake default numbers like 12 trucks when the user only wrote "orario" or "bema"!
    if (!hasNumbers && !wantsPlantTelemetry) {
      return this.buildParameterGuidance(calcMeta, activeTenant);
    }

    // 6. EXTRACT REAL PARAMETERS GIVEN BY OPERATOR (or read from active plant telemetry)
    const inputs: Record<string, any> = {};
    const extractedSource: Record<string, 'OPERATORE' | 'TELEMETRIA_IMPIANTO' | 'VALORE_BASE'> = {};

    if (targetId === 1) {
      const cMatch = text.match(/(\d+)\s*(?:camion|veicoli)/i) || (hasNumbers ? text.match(/(\d+)/) : null);
      const rMatch = text.match(/(\d+)\s*(?:minuti|min|m)\s*(?:di)?\s*ritardo/i) || text.match(/ritardo\s*(?:di)?\s*(\d+)/i);
      const wMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:saturazione|wms|magazzino)?/i) || text.match(/saturazione\s*(?:wms|magazzino)?\s*(?:del|al)?\s*(\d+(?:\.\d+)?)/i);

      if (cMatch) { inputs.camion_attesa = parseInt(cMatch[1], 10); extractedSource.camion_attesa = 'OPERATORE'; }
      else if (topology) { inputs.camion_attesa = topology.baie.filter(b => b.stato === 'OCCUPATA').length + 2; extractedSource.camion_attesa = 'TELEMETRIA_IMPIANTO'; }
      else { inputs.camion_attesa = 8; extractedSource.camion_attesa = 'VALORE_BASE'; }

      if (rMatch) { inputs.minuti_ritardo = parseInt(rMatch[1], 10); extractedSource.minuti_ritardo = 'OPERATORE'; }
      else { inputs.minuti_ritardo = 25; extractedSource.minuti_ritardo = 'VALORE_BASE'; }

      if (wMatch) { inputs.saturazione_wms = parseFloat(wMatch[1]); extractedSource.saturazione_wms = 'OPERATORE'; }
      else { inputs.saturazione_wms = 78.0; extractedSource.saturazione_wms = 'VALORE_BASE'; }

    } else if (targetId === 2) {
      const rMatch = text.match(/(\d+)\s*(?:minuti|min)/i) || text.match(/ritardo\s*(?:stimato)?\s*(?:di)?\s*(\d+)/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);

      if (rMatch) { inputs.ritardo_stimato_minuti = parseInt(rMatch[1], 10); extractedSource.ritardo_stimato_minuti = 'OPERATORE'; }
      else { inputs.ritardo_stimato_minuti = 45; extractedSource.ritardo_stimato_minuti = 'VALORE_BASE'; }

      if (bMatch) { inputs.baie_libere = parseInt(bMatch[1], 10); extractedSource.baie_libere = 'OPERATORE'; }
      else if (topology) { inputs.baie_libere = Math.max(1, topology.baie.filter(b => b.stato === 'LIBERA').length); extractedSource.baie_libere = 'TELEMETRIA_IMPIANTO'; }
      else { inputs.baie_libere = 2; extractedSource.baie_libere = 'VALORE_BASE'; }

    } else if (targetId === 3) {
      // Calcolo 3: Schedulazione turni di lavoro e baie
      const oMatch = text.match(/(\d+)\s*(?:ore|h)/i) || text.match(/turno\s*(?:di|da)?\s*(\d+)/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);

      if (oMatch) { inputs.ore_lavoro_disponibili = parseInt(oMatch[1], 10); extractedSource.ore_lavoro_disponibili = 'OPERATORE'; }
      else { inputs.ore_lavoro_disponibili = 8; extractedSource.ore_lavoro_disponibili = 'VALORE_BASE'; }

      if (bMatch) { inputs.baie_totali = parseInt(bMatch[1], 10); extractedSource.baie_totali = 'OPERATORE'; }
      else if (topology) { inputs.baie_totali = topology.baie.length; extractedSource.baie_totali = 'TELEMETRIA_IMPIANTO'; }
      else { inputs.baie_totali = 4; extractedSource.baie_totali = 'VALORE_BASE'; }

    } else if (targetId === 4) {
      const uMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:umidit[aà])?/i) || text.match(/umidit[aà]\s*(?:del)?\s*(\d+(?:\.\d+)?)/i);
      const sMatch = text.match(/spessore\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:micro|micron)/i);

      if (uMatch) { inputs.umidita_rilevata = parseFloat(uMatch[1]); extractedSource.umidita_rilevata = 'OPERATORE'; }
      else { inputs.umidita_rilevata = 12.0; extractedSource.umidita_rilevata = 'VALORE_BASE'; }

      if (sMatch) { inputs.spessore_micro = parseFloat(sMatch[1]); extractedSource.spessore_micro = 'OPERATORE'; }
      else { inputs.spessore_micro = 45.0; extractedSource.spessore_micro = 'VALORE_BASE'; }

    } else if (targetId === 5) {
      const lottoMatch = text.match(/lotto\s*[:=]?\s*([A-Za-z0-9_-]+)/i);
      const fornMatch = text.match(/fornitore\s*[:=]?\s*([A-Za-z0-9_-]+)/i);

      inputs.id_lotto_materiale = lottoMatch ? lottoMatch[1] : 'LOTTO_EL80_LIVE';
      inputs.codice_fornitore = fornMatch ? fornMatch[1] : 'FORNITORE_CERTIFICATO';
      extractedSource.id_lotto_materiale = lottoMatch ? 'OPERATORE' : 'VALORE_BASE';
      extractedSource.codice_fornitore = fornMatch ? 'OPERATORE' : 'VALORE_BASE';

    } else if (targetId === 6) {
      const rotMatch = text.match(/\b(high|medium|low|alta|media|bassa)\b/i);
      const cMatch = text.match(/(\d+)\s*celle/i);

      if (rotMatch) {
        const val = rotMatch[1].toUpperCase();
        inputs.classe_rotazione = val === 'ALTA' ? 'HIGH' : val === 'BASSA' ? 'LOW' : val === 'MEDIA' ? 'MEDIUM' : val;
        extractedSource.classe_rotazione = 'OPERATORE';
      } else {
        inputs.classe_rotazione = 'HIGH';
        extractedSource.classe_rotazione = 'VALORE_BASE';
      }

      if (cMatch) { inputs.celle_libere_3d = parseInt(cMatch[1], 10); extractedSource.celle_libere_3d = 'OPERATORE'; }
      else { inputs.celle_libere_3d = 96; extractedSource.celle_libere_3d = 'VALORE_BASE'; }

    } else if (targetId === 7) {
      const incMatch = text.match(/(\d+(?:\.\d+)?)\s*grad[io]/i) || text.match(/inclinazione\s*(?:di)?\s*(\d+(?:\.\d+)?)/i);
      if (incMatch) { inputs.micro_inclinazione = parseFloat(incMatch[1]); extractedSource.micro_inclinazione = 'OPERATORE'; }
      else { inputs.micro_inclinazione = 0.45; extractedSource.micro_inclinazione = 'VALORE_BASE'; }

    } else if (targetId === 8) {
      inputs.coordinate_partenza = [0, 0];
      inputs.nodi_prelievo = 5;
      extractedSource.nodi_prelievo = 'VALORE_BASE';

    } else if (targetId === 9) {
      const tMatch = text.match(/traffico\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/coefficiente\s*(\d+(?:\.\d+)?)/i);
      if (tMatch) { inputs.coefficiente_traffico = parseFloat(tMatch[1]); extractedSource.coefficiente_traffico = 'OPERATORE'; }
      else { inputs.coefficiente_traffico = 0.72; extractedSource.coefficiente_traffico = 'VALORE_BASE'; }
      inputs.ordini_in_coda = 8;

    } else if (targetId === 10) {
      const vMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mc|metri cubi)/i);
      if (vMatch) { inputs.volume_disponibile_mc = parseFloat(vMatch[1]); extractedSource.volume_disponibile_mc = 'OPERATORE'; }
      else { inputs.volume_disponibile_mc = 68.0; extractedSource.volume_disponibile_mc = 'VALORE_BASE'; }

    } else if (targetId === 11) {
      inputs.id_contratto_vettore = 'VETTORE_SM80_ACTIVE';
      extractedSource.id_contratto_vettore = 'VALORE_BASE';

    } else if (targetId === 12) {
      const cMatch = text.match(/(\d+)\s*camion/i);
      const pMatch = text.match(/(\d+)\s*pallet/i);
      inputs.camion_in_piazzale = cMatch ? parseInt(cMatch[1], 10) : 6;
      inputs.pallet_pronti_linea = pMatch ? parseInt(pMatch[1], 10) : 48;
      extractedSource.camion_in_piazzale = cMatch ? 'OPERATORE' : 'VALORE_BASE';
      extractedSource.pallet_pronti_linea = pMatch ? 'OPERATORE' : 'VALORE_BASE';

    } else if (targetId === 13) {
      const cMatch = text.match(/(\d+)\s*camion/i);
      inputs.camion_in_attesa = cMatch ? parseInt(cMatch[1], 10) : 7;
      inputs.codice_saturazione_buffer = 0.65;
      extractedSource.camion_in_attesa = cMatch ? 'OPERATORE' : 'VALORE_BASE';

    } else if (targetId === 14) {
      // Calcolo 14: Vibrazioni Bema
      const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:giri|rpm)/i) || (hasNumbers ? text.match(/(\d+(?:\.\d+)?)/) : null);
      if (gMatch) {
        inputs.giri_minuto = parseFloat(gMatch[1]);
        extractedSource.giri_minuto = 'OPERATORE';
      } else if (topology) {
        const bema = topology.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
        inputs.giri_minuto = bema?.telemetria?.rpm || 42.0;
        extractedSource.giri_minuto = 'TELEMETRIA_IMPIANTO';
      } else {
        inputs.giri_minuto = 45.0;
        extractedSource.giri_minuto = 'VALORE_BASE';
      }

    } else if (targetId === 15) {
      // Calcolo 15: Tensione Film Bema
      const tMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:newton|n\b)/i);
      const vMatch = text.match(/velocit[aà]\s*(\d+(?:\.\d+)?)/i);

      if (tMatch) {
        inputs.tensione_newton = parseFloat(tMatch[1]);
        extractedSource.tensione_newton = 'OPERATORE';
      } else if (topology) {
        const bema = topology.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
        inputs.tensione_newton = bema?.telemetria?.tensione_newton || 135.0;
        extractedSource.tensione_newton = 'TELEMETRIA_IMPIANTO';
      } else {
        inputs.tensione_newton = 130.0;
        extractedSource.tensione_newton = 'VALORE_BASE';
      }

      if (vMatch) {
        inputs.velocita_svolgimento = parseFloat(vMatch[1]);
        extractedSource.velocita_svolgimento = 'OPERATORE';
      } else {
        inputs.velocita_svolgimento = 10.5;
        extractedSource.velocita_svolgimento = 'VALORE_BASE';
      }

    } else if (targetId === 16) {
      if (topology && topology.flottaAgv.length > 0) {
        const posMap: Record<string, string> = {};
        topology.flottaAgv.slice(0, 4).forEach(agv => {
          posMap[agv.id] = agv.posizione;
        });
        inputs.coordinate_agv_attivi = posMap;
        extractedSource.coordinate_agv_attivi = 'TELEMETRIA_IMPIANTO';
      } else {
        inputs.coordinate_agv_attivi = { "AGV_01": "CORRIDOIO_A1", "AGV_02": "INBOUND_BAY_02", "AGV_03": "NODO_03_BLOCCATO" };
        extractedSource.coordinate_agv_attivi = 'VALORE_BASE';
      }

    } else if (targetId === 17) {
      if (topology && topology.flottaAgv.length > 0) {
        const batteryMap: Record<string, { SoC: number; Temp: number }> = {};
        topology.flottaAgv.slice(0, 4).forEach(agv => {
          batteryMap[agv.id] = { SoC: agv.batteriaSoC, Temp: agv.temperatura };
        });
        inputs.telemetria_batterie_agv = batteryMap;
        extractedSource.telemetria_batterie_agv = 'TELEMETRIA_IMPIANTO';
      } else {
        inputs.telemetria_batterie_agv = { "AGV_04": { "SoC": 78, "Temp": 42.5 }, "AGV_11": { "SoC": 92, "Temp": 31.0 } };
        extractedSource.telemetria_batterie_agv = 'VALORE_BASE';
      }
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
    }

    // 9. BUILD INTRODUCTORY EXPLANATION WITH TRANSPARENT INPUT ORIGINS
    const entanglementLabel = calcMeta.entanglement === 'OBBLIGATORIO' 
      ? '🔒 Entanglement Obbligatorio (porta CNOT attiva)'
      : '🔓 Entanglement Facoltativo (ottimizzazione locale)';

    const inputsList = Object.entries(inputs)
      .map(([k, v]) => {
        const src = extractedSource[k] === 'OPERATORE' 
          ? '✏️ Fornito da te' 
          : extractedSource[k] === 'TELEMETRIA_IMPIANTO' 
          ? '📡 Letto da Gateway Impianto' 
          : '⚙️ Parametro base';
        return `- **${k}**: \`${JSON.stringify(v)}\` _(${src})_`;
      })
      .join('\n');

    const introduzione = `**Identificazione ed Esecuzione Calcolo Quantistico:**
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
      livello_allarme: alarmLevel
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
