import { QUANTUM_CALCULATIONS } from '../data/calculationsMeta';
import { QuantumEngine } from './quantumEngine';
import { QuantumExecutionResult, FactoryTenant } from '../types/quantum';

export interface RouteResolution {
  calcolo_id: number;
  sotto_funzione: string;
  entanglement: 'OBBLIGATORIO' | 'FACOLTATIVO';
  entanglementSymbol: '🔒' | '🔓';
  estratto_payload: Record<string, any>;
  introduzione: string;
  risultato: QuantumExecutionResult;
  azione_immediata: string;
  livello_allarme: 'NORMALE' | 'ATTENZIONE' | 'CRITICO';
}

export class QuantumRouterService {
  /**
   * Parse user query or structured payload, detect the calculation ID (1-17),
   * extract input variables, execute the simulated CUDA-Q circuit, and return the structured response.
   */
  static async routeAndSolve(userMessage: string, activeTenant?: FactoryTenant): Promise<RouteResolution> {
    const text = userMessage.toLowerCase().trim();

    // 1. Check if user explicitly provided a calculation ID (e.g. "Calcolo 1", "calcolo [14]", "id 6", "#17")
    const explicitIdMatch = text.match(/(?:calcolo|id|numero|num|calc)\s*\[?\s*(\d{1,2})\s*\]?/i);
    let targetId: number | null = null;
    if (explicitIdMatch) {
      const parsed = parseInt(explicitIdMatch[1], 10);
      if (parsed >= 1 && parsed <= 17) {
        targetId = parsed;
      }
    }

    // 2. Keyword and Semantic matching across the 17 calculations if not explicitly forced
    if (!targetId) {
      if (text.includes('boltzmann') || text.includes('qbm') || text.includes('stress-test inbound') || (text.includes('camion') && text.includes('wms')) || (text.includes('camion_attesa') && text.includes('saturazione_wms'))) {
        targetId = 1;
      } else if (text.includes('monte carlo') || text.includes('fermo linea') || text.includes('rischio turno') || text.includes('baie_libere') || (text.includes('ritardo') && text.includes('baia'))) {
        targetId = 2;
      } else if (text.includes('integer programming') || text.includes('schedulazione baie') || text.includes('bay scheduler') || text.includes('ore_lavoro') || text.includes('turni del personale')) {
        targetId = 3;
      } else if (text.includes('walk clustering') || text.includes('qualità lotti') || text.includes('umidità') || text.includes('umidita') || text.includes('spessore_micro') || text.includes('quarantena')) {
        targetId = 4;
      } else if (text.includes('hashing') || text.includes('post-quantum') && (text.includes('lotto') || text.includes('tracciabilit') || text.includes('fornitore')) || text.includes('sha-3') || text.includes('token_tracciabilita')) {
        targetId = 5;
      } else if (text.includes('digital twin') || text.includes('bin packing') || text.includes('slot 3d') || text.includes('put-away') || text.includes('celle_libere_3d') || text.includes('smartstore') || text.includes('classe_rotazione')) {
        targetId = 6;
      } else if (text.includes('hopfield') || text.includes('integrità scaffal') || text.includes('integrita scaffal') || text.includes('inclinazione') || text.includes('deformazione strutturale') || text.includes('vettore_pressione')) {
        targetId = 7;
      } else if (text.includes('tsp') || text.includes('sequenza picking') || text.includes('picking optimizer') || text.includes('prelievo veloce') || text.includes('coordinate_partenza')) {
        targetId = 8;
      } else if (text.includes('qgnn') || text.includes('graph neural network') || text.includes('batching ordini') || text.includes('raggruppamento ordini') || text.includes('accorpare ordine')) {
        targetId = 9;
      } else if (text.includes('vqe') || text.includes('hhl') || text.includes('incastro geometrico') || text.includes('volumetric loader') || text.includes('volume_disponibile_mc') || text.includes('cassone camion')) {
        targetId = 10;
      } else if (text.includes('e-cmr') || text.includes('ecmr') || text.includes('cifratura') || text.includes('carrier allocator') || text.includes('id_contratto_vettore')) {
        targetId = 11;
      } else if (text.includes('game theory') || text.includes('teoria dei giochi') || text.includes('equilibrio di nash') || text.includes('conflitti priorità baie') || text.includes('dock & slot') || (text.includes('pallet_pronti') && text.includes('piazzale'))) {
        targetId = 12;
      } else if (text.includes('k-means') || text.includes('kmeans') || text.includes('traffico piazzale') || text.includes('buffer opt') || text.includes('saturazione_buffer') || text.includes('area polmone')) {
        targetId = 13;
      } else if (text.includes('fourier') || text.includes('qft') || text.includes('micro-vibrazioni') || text.includes('vibrazioni') || text.includes('bema diagnostics') || text.includes('cuscinetto') || text.includes('giri_minuto') || text.includes('silkworm')) {
        targetId = 14;
      } else if (text.includes('qsvm') || text.includes('support vector') || text.includes('film') || text.includes('tensionamento') || text.includes('strappo') || text.includes('tensione_newton')) {
        targetId = 15;
      } else if (text.includes('qaoa') || text.includes('qrl') || text.includes('rotte flotta') || text.includes('agv') || text.includes('lgv') || text.includes('ingorghi') || text.includes('routing & traffic')) {
        targetId = 16;
      } else if (text.includes('bipartite matching') || text.includes('task allocation') || text.includes('accoppiamento task') || text.includes('telemetria_batterie') || text.includes('celle al litio') || text.includes('soc')) {
        targetId = 17;
      } else {
        // Default to Calcolo 1 if unable to match or general factory inquiry
        targetId = 1;
      }
    }

    const calcMeta = QUANTUM_CALCULATIONS.find(c => c.id === targetId)!;
    const inputs: Record<string, any> = { ...calcMeta.defaultInputs };

    // 3. Extract dynamic parameters from numbers or text patterns if present
    // Or if omitted in user text, dynamically infer from activeTenant.plantTopology if available!
    const topology = activeTenant?.plantTopology;

    if (targetId === 1) {
      const cMatch = text.match(/(\d+)\s*(?:camion|veicoli)/i);
      const rMatch = text.match(/(\d+)\s*(?:minuti|min|m)\s*(?:di)?\s*ritardo/i) || text.match(/ritardo\s*(?:di)?\s*(\d+)/i);
      const wMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:saturazione|wms|magazzino)?/i) || text.match(/saturazione\s*(?:wms|magazzino)?\s*(?:del|al)?\s*(\d+(?:\.\d+)?)/i);
      if (cMatch) inputs.camion_attesa = parseInt(cMatch[1], 10);
      else if (topology) inputs.camion_attesa = topology.baie.filter(b => b.stato === 'OCCUPATA').length + 3;
      if (rMatch) inputs.minuti_ritardo = parseInt(rMatch[1], 10);
      if (wMatch) inputs.saturazione_wms = parseFloat(wMatch[1]);
    } else if (targetId === 2) {
      const rMatch = text.match(/(\d+)\s*(?:minuti|min)/i) || text.match(/ritardo\s*(?:stimato)?\s*(?:di)?\s*(\d+)/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);
      if (rMatch) inputs.ritardo_stimato_minuti = parseInt(rMatch[1], 10);
      if (bMatch) inputs.baie_libere = parseInt(bMatch[1], 10);
      else if (topology) inputs.baie_libere = Math.max(1, topology.baie.filter(b => b.stato === 'LIBERA').length);
    } else if (targetId === 3) {
      const oMatch = text.match(/(\d+)\s*ore/i);
      const bMatch = text.match(/(\d+)\s*bai[ae]/i);
      if (oMatch) inputs.ore_lavoro_disponibili = parseInt(oMatch[1], 10);
      if (bMatch) inputs.baie_totali = parseInt(bMatch[1], 10);
      else if (topology) inputs.baie_totali = topology.baie.length;
    } else if (targetId === 4) {
      const uMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:umidit[aà])?/i) || text.match(/umidit[aà]\s*(?:del)?\s*(\d+(?:\.\d+)?)/i);
      const sMatch = text.match(/spessore\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:micro|micron)/i);
      if (uMatch) inputs.umidita_rilevata = parseFloat(uMatch[1]);
      if (sMatch) inputs.spessore_micro = parseFloat(sMatch[1]);
    } else if (targetId === 5) {
      const lottoMatch = text.match(/lotto\s*[:=]?\s*([A-Za-z0-9_-]+)/i);
      const fornMatch = text.match(/fornitore\s*[:=]?\s*([A-Za-z0-9_-]+)/i);
      if (lottoMatch) inputs.id_lotto_materiale = lottoMatch[1];
      if (fornMatch) inputs.codice_fornitore = fornMatch[1];
    } else if (targetId === 6) {
      const rotMatch = text.match(/\b(high|medium|low|alta|media|bassa)\b/i);
      const cMatch = text.match(/(\d+)\s*celle/i);
      if (rotMatch) {
        const val = rotMatch[1].toUpperCase();
        inputs.classe_rotazione = val === 'ALTA' ? 'HIGH' : val === 'BASSA' ? 'LOW' : val === 'MEDIA' ? 'MEDIUM' : val;
      }
      if (cMatch) inputs.celle_libere_3d = parseInt(cMatch[1], 10);
    } else if (targetId === 7) {
      const incMatch = text.match(/(\d+(?:\.\d+)?)\s*grad[io]/i) || text.match(/inclinazione\s*(?:di)?\s*(\d+(?:\.\d+)?)/i);
      if (incMatch) inputs.micro_inclinazione = parseFloat(incMatch[1]);
    } else if (targetId === 9) {
      const tMatch = text.match(/traffico\s*(?:del)?\s*(\d+(?:\.\d+)?)/i) || text.match(/coefficiente\s*(\d+(?:\.\d+)?)/i);
      if (tMatch) inputs.coefficiente_traffico = parseFloat(tMatch[1]);
    } else if (targetId === 10) {
      const vMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mc|metri cubi)/i);
      if (vMatch) inputs.volume_disponibile_mc = parseFloat(vMatch[1]);
    } else if (targetId === 12) {
      const cMatch = text.match(/(\d+)\s*camion/i);
      const pMatch = text.match(/(\d+)\s*pallet/i);
      if (cMatch) inputs.camion_in_piazzale = parseInt(cMatch[1], 10);
      if (pMatch) inputs.pallet_pronti_linea = parseInt(pMatch[1], 10);
    } else if (targetId === 13) {
      const cMatch = text.match(/(\d+)\s*camion/i);
      const sMatch = text.match(/(\d+(?:\.\d+)?)\s*%/i) || text.match(/saturazione\s*(?:del)?\s*(\d+(?:\.\d+)?)/i);
      if (cMatch) inputs.camion_in_attesa = parseInt(cMatch[1], 10);
      if (sMatch) inputs.codice_saturazione_buffer = parseFloat(sMatch[1]) > 1 ? parseFloat(sMatch[1]) / 100 : parseFloat(sMatch[1]);
    } else if (targetId === 14) {
      const gMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:giri|rpm)/i);
      if (gMatch) inputs.giri_minuto = parseFloat(gMatch[1]);
      else if (topology) {
        const bema = topology.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
        if (bema?.telemetria?.rpm) inputs.giri_minuto = bema.telemetria.rpm;
      }
    } else if (targetId === 15) {
      const tMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:newton|n\b)/i);
      const vMatch = text.match(/velocit[aà]\s*(\d+(?:\.\d+)?)/i);
      if (tMatch) inputs.tensione_newton = parseFloat(tMatch[1]);
      else if (topology) {
        const bema = topology.macchinari.find(m => m.tipo === 'BEMA_FASCIATORE');
        if (bema?.telemetria?.tensione_newton) inputs.tensione_newton = bema.telemetria.tensione_newton;
      }
      if (vMatch) inputs.velocita_svolgimento = parseFloat(vMatch[1]);
    } else if (targetId === 16) {
      // Dynamic AGV Fleet positions if available
      if (topology && topology.flottaAgv.length > 0) {
        const posMap: Record<string, string> = {};
        topology.flottaAgv.slice(0, 4).forEach(agv => {
          posMap[agv.id] = agv.posizione;
        });
        inputs.coordinate_agv_attivi = posMap;
      }
    } else if (targetId === 17) {
      // Dynamic AGV Battery Telemetries if available
      if (topology && topology.flottaAgv.length > 0) {
        const batteryMap: Record<string, { SoC: number; Temp: number }> = {};
        topology.flottaAgv.slice(0, 4).forEach(agv => {
          batteryMap[agv.id] = { SoC: agv.batteriaSoC, Temp: agv.temperatura };
        });
        inputs.telemetria_batterie_agv = batteryMap;
      }
    }

    // 4. Execute the calculation in the Quantum Engine
    const res: Record<string, any> = await QuantumEngine.executeCalculation(targetId, inputs);

    // 5. Determine level of alarm and immediate action
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
      immediateAction = `Firma e-CMR sigillata (${res.firma_post_quantum_esadecimale}). Documento validato contro minacce quantistiche.`;
      alarmLevel = 'NORMALE';
    } else if (res.ottimizzazione_finestra_baia) {
      immediateAction = `${res.ottimizzazione_finestra_baia}. Direttiva: ${res.istruzione_driver_piazzale}`;
      alarmLevel = res.codice_priorita_yms === 220 ? 'NORMALE' : 'ATTENZIONE';
    } else if (res.classificazione_traffico_piazzale) {
      immediateAction = `${res.classificazione_traffico_piazzale}. Direttiva: ${res.direttiva_operatore_barra}`;
      alarmLevel = res.codice_flusso_yms === 707 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.diagnostica_spettrale) {
      immediateAction = res.direttiva_manutenzione_predittiva;
      alarmLevel = res.codice_allarme_ecs === 414 ? 'CRITICO' : 'NORMALE';
    } else if (res.analisi_predittiva_film) {
      immediateAction = res.azione_correttiva_plc;
      alarmLevel = res.codice_stato_macchina === 100 ? 'CRITICO' : 'NORMALE';
    } else if (res.stato_fluidita_traffico) {
      immediateAction = res.direttiva_navigazione_flotta;
      alarmLevel = res.codice_instradamento_sdm === 303 ? 'ATTENZIONE' : 'NORMALE';
    } else if (res.matrice_assegnazione_task) {
      immediateAction = `Accoppiamento: ${JSON.stringify(res.matrice_assegnazione_task)}. ${res.bilanciamento_flotta_status}`;
      alarmLevel = res.codice_azione_sdm === 200 ? 'NORMALE' : 'ATTENZIONE';
    }

    // 6. Build the clear Italian introductory text
    const entanglementLabel = calcMeta.entanglement === 'OBBLIGATORIO' 
      ? '🔒 Entanglement Obbligatorio (applicato Gate CNOT inter-categoria)'
      : '🔓 Entanglement Facoltativo (ottimizzazione locale nello spazio degli stati)';

    const plantDetails = activeTenant ? `
- **Stabilimento Connesso:** ${activeTenant.nome} (${activeTenant.sito})
- **Gateway SM.I.LE80:** \`${activeTenant.endpoint}\` [${activeTenant.protocol || 'REST_HTTPS'} - ${activeTenant.connectionStatus || 'CONNESSO'}]
- **Topologia Impianto:** ${activeTenant.plantTopology?.macchinari.length || 6} Macchine | ${activeTenant.plantTopology?.flottaAgv.length || 6} LGV | ${activeTenant.plantTopology?.baie.length || 5} Baie
- **Dimensione Hamiltoniano QPU:** ${activeTenant.plantTopology?.qubitCapacity || 28} Qubit logici (${activeTenant.plantTopology?.qpuDimensioning.hamiltonianSize || 'N/A'})` : '';

    const introduzione = `**Identificazione ed Esecuzione Calcolo Quantistico:**${plantDetails}
- **Sotto-funzione Identificata:** ${calcMeta.subFunction} (${calcMeta.technicalModule})
- **ID Calcolo:** Calcolo [${calcMeta.id}] - ${calcMeta.name}
- **Topologia Entanglement:** ${entanglementLabel}
- **Simulatore Target:** ${calcMeta.hardwareTarget}
- **Input Elaborati:** ${Object.entries(inputs).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}

Il circuito CUDA-Q è stato simulato eseguendo 1000 iterazioni stocastiche con collasso dello stato intrecciato in base ai dati telemetrici dello stabilimento. Di seguito il payload JSON generato e l'azione industriale immediata predisposta per il modulo SM.I.LE80.`;

    return {
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
}
