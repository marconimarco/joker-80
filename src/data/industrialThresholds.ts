/**
 * Modulo Centralizzato Soglie Industriali e Valutazione Allarmi JOKER 80 / SM.I.LE80.
 * Unica fonte di verità condivisa tra Engine, Catalogo Quantistico, Scanner e Chat Router
 * per prevenire discrepanze tra semafori UI, tabelle diagnostiche e notifiche automatiche.
 */

export type AlarmLevel = 'NORMALE' | 'ATTENZIONE' | 'CRITICO';

export interface UnifiedAlarmEvaluation {
  livelloAllarme: AlarmLevel;
  titolo: string;
  dettaglio: string;
  parametro: string;
  valore: string | number;
  azione: string;
}

export function extractDiagnosticSummary(res: Record<string, any> | undefined | null): string | undefined {
  if (!res) return undefined;
  return (
    res.indice_rischio_blocco ||
    res.livello_rischio ||
    res.rischio_stocastico ||
    res.efficienza_schedulazione ||
    res.validazione_qualita ||
    res.stato_sicurezza ||
    res.digital_twin_status ||
    res.diagnostica_integrita ||
    res.conformita_asrs ||
    res.stato_ottimizzazione_rotta ||
    res.validazione_logica_lotto ||
    res.efficienza_volumetrica ||
    res.efficienza_piazzale ||
    res.stato_polmone_buffer ||
    res.diagnostica_spettrale ||
    res.analisi_predittiva_film ||
    res.valutazione_traffico ||
    res.stato_flotta_bms ||
    res.diagnostica_pallettizzatore ||
    res.stato_ricarica ||
    res.diagnosi_integrita ||
    res.esito_collaudo ||
    res.validazione_zkp ||
    res.diagnosi ||
    undefined
  );
}

export const INDUSTRIAL_THRESHOLDS = {
  CAMION_ATTESA_WARN: 6,
  CAMION_ATTESA_CRIT: 10,
  WMS_SATURAZIONE_WARN: 80.0,
  WMS_SATURAZIONE_CRIT: 85.0,
  CONGESTIONE_INBOUND_CRIT: 85.0,
  MONTECARLO_RITARDO_CRIT: 60,
  MONTECARLO_VAR_CRIT: 5000.0,
  TURNO_ORE_MIN_WARN: 4,
  UMIDITA_MATERIE_WARN: 14.5,
  CONFORMITA_QUALITA_MIN: 90.0,
  SMARTSTORE_CELLE_MIN_WARN: 25,
  SMARTSTORE_CELLE_MIN_CRIT: 10,
  SCAFFALI_INCLINAZIONE_CRIT: 0.40,
  SCAFFALI_PRESSIONE_MAX_BAR: 18.0,
  SCAFFALI_FATTORE_SICUREZZA_MIN: 1.5,
  PICKING_NODI_MAX_WARN: 30,
  QGNN_TRAFFICO_WARN: 0.75,
  CARICO_PESO_WARN_KG: 28000,
  CARICO_PESO_CRIT_KG: 44000,
  BUFFER_PIAzzALE_WARN: 0.75,
  BUFFER_TEMPO_ATTESA_CRIT_MIN: 30.0,
  BEMA_RPM_WARN: 55.0,
  BEMA_VIBRAZIONE_CRIT_G: 0.50,
  BEMA_TENSIONE_WARN_N: 165.0,
  BEMA_TENSIONE_CRIT_N: 180.0,
  BEMA_SFORZO_CRIT_MPA: 18.0,
  BEMA_BARRA_TEMP_CRIT_C: 155.0,
  LGV_FLUIDITA_MIN_WARN: 60.0,
  LGV_FLUIDITA_MIN_CRIT: 45.0,
  LGV_LASER_OSTACOLO_MIN_MM: 1500,
  LGV_SOC_WARN_PCT: 50.0,
  LGV_SOC_CRIT_PCT: 20.0,
  LGV_TEMP_BATTERIA_WARN_C: 45.0,
  ROBOT_VUOTO_MAX_BAR: -0.65,
  ROBOT_COPPIA_MAX_NM: 400.0,
  ROBOT_PINZE_MIN_N: 300.0,
  MICROGRID_POTENZA_WARN_KW: 110.0,
  MICROGRID_POTENZA_CRIT_KW: 120.0,
  MICROGRID_TEMP_WARN_C: 45.0,
  MICROGRID_TEMP_CRIT_C: 65.0,
  WOODPECKER_FORZA_MIN_N: 2600.0,
  WOODPECKER_UMIDITA_MAX_PCT: 17.5,
  RAPTOR_AFFIDABILITA_MIN_PCT: 80.0,
  RAPTOR_TEMP_TESTINA_WARN_C: 65.0,
} as const;

/**
 * Valuta in modo deterministico e coerente lo stato operativo (NORMALE / ATTENZIONE / CRITICO)
 * leggendo esclusivamente le proprietà reali restituite da QuantumEngine e gli input attuali.
 */
export function evaluateCalculationStatus(
  calcId: number,
  res: Record<string, any> | undefined | null,
  inputs: Record<string, any> = {},
  subFunction: string = 'Operazione'
): UnifiedAlarmEvaluation {
  if (!res || res.error) {
    return {
      livelloAllarme: res?.error ? 'CRITICO' : 'NORMALE',
      titolo: res?.error ? 'Errore Esecuzione Calcolo' : `In attesa di esecuzione (${subFunction})`,
      dettaglio: res?.error ? String(res.error) : 'Nessun risultato disponibile al momento.',
      parametro: 'Stato',
      valore: res?.error ? 'ERRORE' : 'N/D',
      azione: res?.error ? 'Verificare i parametri di ingresso.' : 'Avviare il calcolo per ottenere la diagnosi.'
    };
  }

  const textBag = [
    res.indice_rischio_blocco,
    res.livello_rischio,
    res.rischio_stocastico,
    res.classificazione_rischio,
    res.conformita_asrs,
    res.esito_sagoma,
    res.esito_cooperativo,
    res.stato_congestione,
    res.diagnosi_vibrazionale,
    res.stato_fasciatura,
    res.valutazione_traffico,
    res.tenuta_vuoto_pinza,
    res.stato_manutenzione,
    res.stato_termico,
    res.esito_collaudo,
    res.esito_lettura,
    res.validazione_logica_lotto,
    res.digital_twin_status,
    res.stato_sicurezza,
    res.efficienza_schedulazione,
    res.diagnostica_integrita,
    res.stato_ottimizzazione_rotta,
    res.efficienza_volumetrica,
    res.efficienza_piazzale,
    res.stato_polmone_buffer,
    res.diagnostica_spettrale,
    res.analisi_predittiva_film,
    res.stato_flotta_bms,
    res.diagnostica_pallettizzatore,
    res.stato_ricarica,
    res.diagnosi_integrita,
    res.validazione_zkp
  ]
    .filter(Boolean)
    .map(v => String(v).toUpperCase())
    .join(' | ');

  switch (calcId) {
    case 1: {
      const cong = Number(res.congestione_percentuale ?? 0);
      if (res.allarme_blocco_imminente || cong >= INDUSTRIAL_THRESHOLDS.CONGESTIONE_INBOUND_CRIT) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Collasso Inbound Imminente: Blocco Piazzale & Magazzino',
          dettaglio: res.motivo_allarme || `Indice di congestione al ${cong}% (soglia critica ${INDUSTRIAL_THRESHOLDS.CONGESTIONE_INBOUND_CRIT}%).`,
          parametro: 'congestione_percentuale',
          valore: `${cong}%`,
          azione: res.azione_correttiva_suggerita || 'Deviare bilici su polmone B3 e aprire varchi ausiliari.'
        };
      }
      if (cong >= 65) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Pressione Inbound Elevata',
          dettaglio: `Indice di congestione al ${cong}% in avvicinamento alla soglia critica.`,
          parametro: 'congestione_percentuale',
          valore: `${cong}%`,
          azione: 'Monitorare code in piazzale e preparare baia di sfogo.'
        };
      }
      break;
    }

    case 2: {
      const varEur = Number(res.costo_var_95_eur ?? 0);
      const prob = Number(res.probabilita_fermo_linea_pct ?? res.probabilita_fermo_pct ?? 0);
      if (res.rischio_critico || varEur >= INDUSTRIAL_THRESHOLDS.MONTECARLO_VAR_CRIT || prob > 70) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Rischio Fermo Linea a Valle (Monte Carlo)',
          dettaglio: `Probabilità fermo ${prob}% | Costo VaR 95%: €${varEur}.`,
          parametro: 'probabilita_fermo_linea_pct',
          valore: `${prob}%`,
          azione: res.azione_correttiva_suggerita || 'Attivare baia ausiliaria e buffer polmone B3.'
        };
      }
      if (prob > 35) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Rischio Ritardi Moderato in Banchina',
          dettaglio: `Probabilità fermo stimata al ${prob}% con VaR €${varEur}.`,
          parametro: 'probabilita_fermo_linea_pct',
          valore: `${prob}%`,
          azione: res.azione_correttiva_suggerita || 'Mantenere monitoraggio finestre di scarico.'
        };
      }
      break;
    }

    case 3: {
      const ore = Number(res.dati_elaborati?.ore_lavoro_disponibili ?? inputs.ore_lavoro_disponibili ?? 8);
      const eff = Number(res.efficienza_oraria_pct ?? 90);
      if (ore < INDUSTRIAL_THRESHOLDS.TURNO_ORE_MIN_WARN || eff < 82.0) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Saturazione Turno / Copertura Baie Ridotta',
          dettaglio: `Efficienza schedulazione al ${eff}% con ${ore}h disponibili.`,
          parametro: 'efficienza_oraria_pct',
          valore: `${eff}%`,
          azione: res.azione_correttiva_suggerita || 'Ribilanciare turni operatori sulle baie attive.'
        };
      }
      break;
    }

    case 4: {
      const conf = Number(res.indice_conformita_lotto_pct ?? 100);
      const umid = Number(res.umidita_rilevata_pct ?? inputs.umidita_rilevata ?? 12);
      if (conf < 80.0) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Lotto Materiale Fuori Specifica',
          dettaglio: `Conformità ${conf}% (umidità ${umid}%). ${res.esito_collaudo || ''}`,
          parametro: 'indice_conformita_lotto_pct',
          valore: `${conf}%`,
          azione: res.azione_correttiva_suggerita || 'Isolare lotto in quarantena.'
        };
      }
      if (conf < INDUSTRIAL_THRESHOLDS.CONFORMITA_QUALITA_MIN || umid > INDUSTRIAL_THRESHOLDS.UMIDITA_MATERIE_WARN) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Umidità / Tolleranza Materiale ai Limiti',
          dettaglio: `Conformità ${conf}% | Umidità rilevata ${umid}%.`,
          parametro: 'umidita_rilevata',
          valore: `${umid}%`,
          azione: res.azione_correttiva_suggerita || 'Attivare ricircolo deumidificatore e verificare interfalde.'
        };
      }
      break;
    }

    case 5: {
      if (res.integrita_verificata === false || textBag.includes('ANOMAL') || textBag.includes('NON CONFORME')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Anomalia Dati Tracciabilità Lotto SHA3',
          dettaglio: res.stato_sicurezza || 'Dati lotto o fornitore incompleti per sigillo NIST.',
          parametro: 'id_lotto',
          valore: String(res.id_lotto || 'N/D'),
          azione: res.azione_correttiva_suggerita || 'Verificare codice fornitore e formato SSCC GS1.'
        };
      }
      break;
    }

    case 6: {
      const sagoma = Boolean(res.sagoma_fuori_asse ?? inputs.sagoma_fuori_asse);
      const celle = Number(res.celle_libere_3d ?? inputs.celle_libere_3d ?? 100);
      if (sagoma || celle < INDUSTRIAL_THRESHOLDS.SMARTSTORE_CELLE_MIN_CRIT || textBag.includes('ALLARME')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: sagoma ? 'Allarme Sagoma Pallet Fuori Asse SmartStore' : 'Saturazione Critica Celle SmartStore 3D',
          dettaglio: `Celle libere: ${celle} | Sagoma fuori asse: ${sagoma ? 'SÌ' : 'NO'}.`,
          parametro: sagoma ? 'sagoma_fuori_asse' : 'celle_libere_3d',
          valore: sagoma ? 'FUORI ASSE' : `${celle} celle`,
          azione: res.azione_correttiva_suggerita || 'Bloccare ingresso shuttle e inviare pallet a stazione riallineamento.'
        };
      }
      if (celle < INDUSTRIAL_THRESHOLDS.SMARTSTORE_CELLE_MIN_WARN) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Celle Ad Alta Rotazione in Esaurimento',
          dettaglio: `Rimangono ${celle} celle 3D disponibili nello SmartStore.`,
          parametro: 'celle_libere_3d',
          valore: `${celle} celle`,
          azione: res.azione_correttiva_suggerita || 'Avviare compattazione e riallocazione corsie.'
        };
      }
      break;
    }

    case 7: {
      const fs = Number(res.fattore_sicurezza ?? 2.0);
      const incl = Number(res.micro_inclinazione ?? inputs.micro_inclinazione ?? 0);
      const press = Number(res.pressione_pattini_bar ?? inputs.pressione_pattini_bar ?? 15);
      if (
        fs < INDUSTRIAL_THRESHOLDS.SCAFFALI_FATTORE_SICUREZZA_MIN ||
        incl > INDUSTRIAL_THRESHOLDS.SCAFFALI_INCLINAZIONE_CRIT ||
        press > INDUSTRIAL_THRESHOLDS.SCAFFALI_PRESSIONE_MAX_BAR ||
        textBag.includes('ALLARME') ||
        res.carico_pattini_integri === false
      ) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Deformazione Strutturale Scaffalatura SmartStore',
          dettaglio: res.motivo_allarme || `Fattore sicurezza ${fs}x (min 1.5x) | Pressione ${press} bar | Inclinazione ${incl}°.`,
          parametro: press > INDUSTRIAL_THRESHOLDS.SCAFFALI_PRESSIONE_MAX_BAR ? 'pressione_pattini_bar' : 'fattore_sicurezza',
          valore: press > INDUSTRIAL_THRESHOLDS.SCAFFALI_PRESSIONE_MAX_BAR ? `${press} bar` : `${fs}x`,
          azione: res.azione_correttiva_suggerita || 'Bloccare trasloelevatore corsia per ispezione EN 15635.'
        };
      }
      break;
    }

    case 8: {
      const nodi = Number(res.nodi_prelievo_count ?? inputs.nodi_prelievo_count ?? 4);
      if (nodi > INDUSTRIAL_THRESHOLDS.PICKING_NODI_MAX_WARN) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Missione Picking Multi-Nodo Complessa',
          dettaglio: `${nodi} tappe in singolo ciclo picker (soglia consigliata <= ${INDUSTRIAL_THRESHOLDS.PICKING_NODI_MAX_WARN}).`,
          parametro: 'nodi_prelievo_count',
          valore: `${nodi} nodi`,
          azione: 'Suddividere la lista di prelievo in due sotto-missioni LGV.'
        };
      }
      break;
    }

    case 9: {
      const traffic = Number(res.coefficiente_traffico ?? inputs.coefficiente_traffico ?? 0.45);
      if (traffic >= INDUSTRIAL_THRESHOLDS.QGNN_TRAFFICO_WARN || textBag.includes('ALLERTA') || textBag.includes('RIFIUTATO')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Congestione Traffico Flotta Navette LGV',
          dettaglio: `Coefficiente traffico al ${Math.round(traffic * 100)}% (soglia ${Math.round(INDUSTRIAL_THRESHOLDS.QGNN_TRAFFICO_WARN * 100)}%).`,
          parametro: 'coefficiente_traffico',
          valore: `${Math.round(traffic * 100)}%`,
          azione: res.azione_correttiva_suggerita || 'Ribilanciare batching e nodi di transito.'
        };
      }
      break;
    }

    case 10: {
      const peso = Number(res.peso_totale_kg ?? inputs.peso_totale_kg ?? 24500);
      const sat = Number(res.saturazione_volumetrica_pct ?? 90);
      if (peso > INDUSTRIAL_THRESHOLDS.CARICO_PESO_CRIT_KG) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Superamento Limite Portata Stradale (44 t)',
          dettaglio: `Peso complessivo ${peso} kg oltre il limite legale di 44.000 kg.`,
          parametro: 'peso_totale_kg',
          valore: `${peso} kg`,
          azione: res.azione_correttiva_suggerita || 'Rimuovere pallet in eccesso prima della partenza.'
        };
      }
      if (textBag.includes('CRITICO') || textBag.includes('ECCEDENZA')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Eccedenza Volume Cassone Camion',
          dettaglio: res.motivo_allarme || `Capacità volumetrica cassone superata (${res.colli_allocati ?? ''} colli su ${res.volume_cassone_m3 ?? ''} m³).`,
          parametro: 'saturazione_volumetrica_pct',
          valore: `${sat}%`,
          azione: res.azione_correttiva_suggerita || 'Ridurre numero colli o suddividere su secondo bilico.'
        };
      }
      if (peso > INDUSTRIAL_THRESHOLDS.CARICO_PESO_WARN_KG || sat < 65) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: peso > INDUSTRIAL_THRESHOLDS.CARICO_PESO_WARN_KG ? 'Carico Pesante (>28 t)' : 'Saturazione Cassone Sub-Ottimale',
          dettaglio: `Peso: ${peso} kg | Saturazione volumetrica: ${sat}%.`,
          parametro: 'peso_totale_kg',
          valore: `${peso} kg`,
          azione: res.azione_correttiva_suggerita || 'Verificare ripartizione assi.'
        };
      }
      break;
    }

    case 11: {
      if (textBag.includes('ANOMAL') || textBag.includes('ERRORE')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Verifica Firma Post-Quantum e-CMR Richiesta',
          dettaglio: res.stato_sicurezza || 'Payload e-CMR incompleto.',
          parametro: 'id_spedizione',
          valore: String(res.id_spedizione || 'N/D'),
          azione: res.azione_correttiva_suggerita || 'Controllare dati vettore prima del sigillo.'
        };
      }
      break;
    }

    case 12: {
      if (textBag.includes('CRITICO')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Sbilanciamento Critico Piazzale / Baie Outbound',
          dettaglio: res.efficienza_piazzale || 'Coda camion elevata rispetto alle baie disponibili.',
          parametro: 'esito_cooperativo',
          valore: String(res.esito_cooperativo || 'CRITICO'),
          azione: res.azione_correttiva_suggerita || 'Aprire baie supplementari.'
        };
      }
      if (textBag.includes('SUB-OTTIMALE')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Equilibrio Baie Sub-Ottimale (Attesa Vettori)',
          dettaglio: res.efficienza_piazzale || 'Slot piazzale non ancora Pareto-ottimali.',
          parametro: 'esito_cooperativo',
          valore: String(res.esito_cooperativo || 'SUB-OTTIMALE'),
          azione: res.azione_correttiva_suggerita || 'Riallocare finestre di carico.'
        };
      }
      break;
    }

    case 13: {
      const waitMin = Number(res.tempo_medio_attesa_min ?? 0);
      const bufPct = Number(res.saturazione_buffer_pct ?? 0);
      if (waitMin > INDUSTRIAL_THRESHOLDS.BUFFER_TEMPO_ATTESA_CRIT_MIN || bufPct >= 85 || textBag.includes('ROSSO')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Congestione Yard & Buffer Polmone Critica',
          dettaglio: `Tempo attesa ${waitMin} min | Buffer al ${bufPct}%.`,
          parametro: 'tempo_medio_attesa_min',
          valore: `${waitMin} min`,
          azione: res.azione_correttiva_suggerita || 'Accelerare scarico baie e liberare polmone.'
        };
      }
      if (waitMin > 20 || bufPct >= INDUSTRIAL_THRESHOLDS.BUFFER_PIAzzALE_WARN * 100 || textBag.includes('GIALLO')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Saturazione Yard & Buffer in Aumento',
          dettaglio: `Tempo attesa ${waitMin} min | Buffer al ${bufPct}%.`,
          parametro: 'tempo_medio_attesa_min',
          valore: `${waitMin} min`,
          azione: res.azione_correttiva_suggerita || 'Monitorare deflusso piazzale e pre-baie.'
        };
      }
      break;
    }

    case 14: {
      const vib = Number(res.vibrazione_cuscinetti_g ?? 0);
      const rpm = Number(res.rpm_tavola_bema ?? 0);
      if (vib > INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G || rpm > INDUSTRIAL_THRESHOLDS.BEMA_RPM_WARN || textBag.includes('ALLARME')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Allarme Spettro / Cuscinetto Bema Silkworm',
          dettaglio: `Vibrazione ${vib} g | Velocità ${rpm} RPM.`,
          parametro: 'vibrazione_cuscinetti_g',
          valore: `${vib} g (${rpm} RPM)`,
          azione: res.azione_correttiva_suggerita || 'Rallentare fasciatore e programmare controllo cuscinetti.'
        };
      }
      break;
    }

    case 15: {
      const sforzo = Number(res.sforzo_unitario_mpa ?? 0);
      const tens = Number(res.tensione_newton ?? 0);
      if (sforzo > INDUSTRIAL_THRESHOLDS.BEMA_SFORZO_CRIT_MPA || tens > INDUSTRIAL_THRESHOLDS.BEMA_TENSIONE_CRIT_N || textBag.includes('ALLARME')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Allarme Rottura Film Estensibile Bema',
          dettaglio: res.motivo_allarme || `Sforzo ${sforzo} MPa | Tensione ${tens} N.`,
          parametro: 'sforzo_unitario_mpa',
          valore: `${sforzo} MPa`,
          azione: res.azione_correttiva_suggerita || 'Ridurre tiro carrello Bema.'
        };
      }
      if (tens > INDUSTRIAL_THRESHOLDS.BEMA_TENSIONE_WARN_N) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Tensione Film Elevata (Pre-Allarme)',
          dettaglio: `Tensione a ${tens} N in avvicinamento al limite di rottura.`,
          parametro: 'tensione_newton',
          valore: `${tens} N`,
          azione: 'Monitorare pre-stiro sul carrello.'
        };
      }
      break;
    }

    case 16: {
      const fl = Number(res.indice_fluidita_flotta_pct ?? 100);
      if (fl < INDUSTRIAL_THRESHOLDS.LGV_FLUIDITA_MIN_CRIT || res.conflitto_rilevato) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Deadlock / Conflitto Incrocio Flotta LGV',
          dettaglio: `Fluidità flotta al ${fl}% con ${res.nodi_critici ?? 0} nodi bloccati.`,
          parametro: 'indice_fluidita_flotta_pct',
          valore: `${fl}%`,
          azione: res.azione_correttiva_suggerita || 'Deviare navette su corsie di by-pass.'
        };
      }
      if (fl < INDUSTRIAL_THRESHOLDS.LGV_FLUIDITA_MIN_WARN || textBag.includes('INTERFERENZA')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Rallentamento Corridoi Navette LGV',
          dettaglio: `Fluidità flotta al ${fl}% (${res.nodi_critici ?? 0} nodi critici).`,
          parametro: 'indice_fluidita_flotta_pct',
          valore: `${fl}%`,
          azione: res.azione_correttiva_suggerita || 'Ribilanciare priorità incroci.'
        };
      }
      break;
    }

    case 17: {
      const matchEff = Number(res.efficienza_accoppiamento_pct ?? 100);
      const minSoc = Number(res.soc_min_rilevato_pct ?? res.soc_medio_flotta_pct ?? 100);
      const maxTemp = Number(res.temperatura_batterie_c ?? 30);
      if (minSoc < INDUSTRIAL_THRESHOLDS.LGV_SOC_CRIT_PCT || matchEff < 55) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Batteria LGV Critica / Accoppiamento Missioni Bloccato',
          dettaglio: `SoC minimo ${minSoc}% | Efficienza BMS ${matchEff}%.`,
          parametro: 'soc_medio_flotta_pct',
          valore: `${minSoc}%`,
          azione: res.azione_correttiva_suggerita || 'Inviare immediatamente i veicoli scarichi alla carica rapida.'
        };
      }
      if (minSoc < INDUSTRIAL_THRESHOLDS.LGV_SOC_WARN_PCT || maxTemp > INDUSTRIAL_THRESHOLDS.LGV_TEMP_BATTERIA_WARN_C || matchEff < 65) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Batteria Flotta LGV Sotto Soglia di Attenzione',
          dettaglio: `SoC ${minSoc}% | Temperatura max ${maxTemp}°C.`,
          parametro: 'soc_medio_flotta_pct',
          valore: `${minSoc}%`,
          azione: 'Pianificare sosta di ricarica induttiva al termine della missione.'
        };
      }
      break;
    }

    case 18: {
      const pBar = Number(res.pressione_vuoto_bar ?? -0.8);
      const coppia = Number(res.coppia_motori_nm ?? 200);
      const pinze = Number(res.forza_pinze_n ?? inputs.forza_pinze_n ?? 480);
      if (
        pBar > INDUSTRIAL_THRESHOLDS.ROBOT_VUOTO_MAX_BAR ||
        coppia > INDUSTRIAL_THRESHOLDS.ROBOT_COPPIA_MAX_NM ||
        pinze < INDUSTRIAL_THRESHOLDS.ROBOT_PINZE_MIN_N ||
        textBag.includes('ALLARME') ||
        textBag.includes('ISPEZIONE')
      ) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Allarme Presa Vuoto / Sovraccarico Robot 6-Assi',
          dettaglio: res.motivo_allarme || `Vuoto: ${pBar} bar | Coppia max: ${coppia} Nm | Pinze: ${pinze} N.`,
          parametro: pinze < INDUSTRIAL_THRESHOLDS.ROBOT_PINZE_MIN_N ? 'forza_pinze_n' : 'pressione_vuoto_bar',
          valore: `${pBar} bar | ${coppia} Nm`,
          azione: res.azione_correttiva_suggerita || 'Verificare circuito ventose, pinze e riduttori assi robot.'
        };
      }
      break;
    }

    case 19: {
      const temp = Number(res.temp_piastre_c ?? 35);
      const kw = Number(res.potenza_erogata_totale_kw ?? 80);
      if (temp > INDUSTRIAL_THRESHOLDS.MICROGRID_TEMP_CRIT_C || kw > INDUSTRIAL_THRESHOLDS.MICROGRID_POTENZA_CRIT_KW || textBag.includes('ALLARME')) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Sovraccarico Rete / Surriscaldamento Piastre Induttive',
          dettaglio: res.motivo_allarme || `Potenza ${kw} kW | Temp piastre ${temp}°C.`,
          parametro: 'potenza_erogata_totale_kw',
          valore: `${kw} kW | ${temp}°C`,
          azione: res.azione_correttiva_suggerita || 'Attivare modulazione knapsack e raffreddamento piastre.'
        };
      }
      if (temp > INDUSTRIAL_THRESHOLDS.MICROGRID_TEMP_WARN_C || kw > INDUSTRIAL_THRESHOLDS.MICROGRID_POTENZA_WARN_KW) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Picco Assorbimento Fast-Charge / Temp Piastre Elevata',
          dettaglio: res.motivo_allarme || `Potenza ${kw} kW | Temp piastre ${temp}°C.`,
          parametro: 'temp_piastre_c',
          valore: `${temp}°C | ${kw} kW`,
          azione: res.azione_correttiva_suggerita || 'Modulare potenza stazioni fast-charge a 25 kW.'
        };
      }
      break;
    }

    case 20: {
      if (textBag.includes('SCARTATO') || res.esito_conforme === false) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Pallet Difettoso Scartato all\'Ingresso (Woodpecker)',
          dettaglio: res.motivo_allarme || `Tasso scarto stimato ${res.tasso_scarto_stimato_pct}%.`,
          parametro: 'forza_deformazione_pattini_n',
          valore: `${res.forza_deformazione_pattini_n ?? ''} N | ${res.umidita_legno_pct ?? ''}%`,
          azione: res.azione_correttiva_suggerita || 'Espellere pallet su rulliera scarti.'
        };
      }
      if (Number(res.tasso_scarto_stimato_pct ?? 0) > 6.0) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Incremento Tasso Scarto Pallet Rilevato',
          dettaglio: `Tasso scarto stimato al ${res.tasso_scarto_stimato_pct}%.`,
          parametro: 'tasso_scarto_stimato_pct',
          valore: `${res.tasso_scarto_stimato_pct}%`,
          azione: 'Monitorare lotto pallet in ingresso.'
        };
      }
      break;
    }

    case 21: {
      const aff = Number(res.affidabilita_ricostruzione_barcode_pct ?? 95);
      const tempHead = Number(res.temp_testina_termica_c ?? 54);
      const grado = String(res.grado_qualita_stampa_iso ?? 'CLASSE_A').toUpperCase();
      if (grado.includes('_F') || aff < 65) {
        return {
          livelloAllarme: 'CRITICO',
          titolo: 'Scarto Stampa / Barcode Illeggibile Raptor (CLASSE_F)',
          dettaglio: `Affidabilità ${aff}% | Grado ${grado} | Temp testina ${tempHead}°C.`,
          parametro: 'grado_qualita_stampa_iso',
          valore: `${grado} (${aff}%)`,
          azione: res.azione_correttiva_suggerita || 'Fermare linea etichettatura, pulire ottica e sostituire testina/nastro.'
        };
      }
      if (aff < INDUSTRIAL_THRESHOLDS.RAPTOR_AFFIDABILITA_MIN_PCT || grado.includes('_C') || textBag.includes('ANOMAL')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Degrado Qualità Stampa / Lettura GS1 Raptor',
          dettaglio: `Affidabilità ${aff}% | Grado ${grado} | Temp testina ${tempHead}°C.`,
          parametro: 'grado_qualita_stampa_iso',
          valore: `${grado} (${aff}%)`,
          azione: res.azione_correttiva_suggerita || 'Pulire ottica scanner e testina termica Raptor.'
        };
      }
      if (tempHead > INDUSTRIAL_THRESHOLDS.RAPTOR_TEMP_TESTINA_WARN_C || grado.includes('_B')) {
        return {
          livelloAllarme: 'ATTENZIONE',
          titolo: 'Attenzione Testina Termica / Grado Stampa Non Ottimale',
          dettaglio: `Grado ${grado} | Temp testina termica ${tempHead}°C.`,
          parametro: 'temp_testina_termica_c',
          valore: `${tempHead}°C`,
          azione: 'Verificare raffreddamento testina e calibrare contrasto nastro.'
        };
      }
      break;
    }
  }

  // Fallback testuale di sicurezza
  if (textBag.includes('CRITICO') || textBag.includes('ALLARME SOVRACCARICO') || textBag.includes('ROTTURA') || textBag.includes('SCARTATO')) {
    return {
      livelloAllarme: 'CRITICO',
      titolo: `Anomalia Critica (${subFunction})`,
      dettaglio: String(res.motivo_allarme || res.indice_rischio_blocco || res.diagnosi_integrita || 'Rilevata condizione critica.'),
      parametro: String(res.metrica_principale_etichetta || 'Stato'),
      valore: String(res.metrica_principale_valore || 'CRITICO'),
      azione: String(res.azione_correttiva_suggerita || 'Intervento operatore richiesto.')
    };
  }

  if (textBag.includes('ATTENZIONE') || textBag.includes('SUB-OTTIMALE') || textBag.includes('ALLERTA')) {
    return {
      livelloAllarme: 'ATTENZIONE',
      titolo: `Attenzione Parametri (${subFunction})`,
      dettaglio: String(res.motivo_allarme || res.livello_rischio || 'Parametri vicini alla soglia di guardia.'),
      parametro: String(res.metrica_principale_etichetta || 'Stato'),
      valore: String(res.metrica_principale_valore || 'ATTENZIONE'),
      azione: String(res.azione_correttiva_suggerita || 'Monitorare andamento sul turno.')
    };
  }

  return {
    livelloAllarme: 'NORMALE',
    titolo: `Processo Regolare (${subFunction})`,
    dettaglio: 'Tutti i parametri quantistici rientrano nelle tolleranze di processo ammesse dal circuito CUDA-Q.',
    parametro: String(res.metrica_principale_etichetta || 'Stato Globale'),
    valore: String(res.metrica_principale_valore || 'A NORMA'),
    azione: String(res.azione_correttiva_suggerita || 'Nessuna azione correttiva richiesta al momento.')
  };
}
