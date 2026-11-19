/**
 * Suite automatica di verifica parità e regressioni per tutti i 21 calcoli JOKER 80.
 * Verifica motore quantistico, soglie centralizzate, snippet Python, parser input e cronologia telemetria.
 */
import { QUANTUM_CALCULATIONS } from '../src/data/calculationsMeta';
import { QUANTUM_PYTHON_CODES } from '../src/data/quantumPythonCalculations';
import { ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION } from '../src/data/quantumLogicDocumentation';
import { QuantumEngine } from '../src/services/quantumEngine';
import {
  INDUSTRIAL_THRESHOLDS,
  evaluateCalculationStatus,
  extractDiagnosticSummary
} from '../src/data/industrialThresholds';
import { PlantTelemetryHistoryService } from '../src/services/plantTelemetryHistory';
import { finiteOr, parseBooleanInput, parseFlexibleInput } from '../src/utils/inputParser';
import { parsePlantCsvContent } from '../src/utils/csvTelemetryParser';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function setupLocalStorageShim() {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    }
  };
  (globalThis as Record<string, unknown>).localStorage = shim;
}

async function runTests() {
  setupLocalStorageShim();
  let passed = 0;
  const pass = (label: string) => {
    passed++;
    console.log(`✓ ${label}`);
  };

  // 1. Completezza metadati, documentazione logica e snippet Python (1..21)
  assert(QUANTUM_CALCULATIONS.length === 21, `Attesi 21 calcoli, trovati ${QUANTUM_CALCULATIONS.length}`);
  for (let id = 1; id <= 21; id++) {
    const meta = QUANTUM_CALCULATIONS.find(c => c.id === id);
    assert(Boolean(meta), `Manca il calcolo #${id} in calculationsMeta`);
    assert(
      ALL_21_CALCULATIONS_LOGIC_DOCUMENTATION.includes(`### CALCOLO ${id}:`),
      `Manca la sezione documentazione logica per CALCOLO ${id}`
    );
    const py = QUANTUM_PYTHON_CODES[id];
    assert(Boolean(py && py.pythonCode && py.pythonCode.trim().length > 50), `Manca codice Python per calcolo #${id}`);
  }
  pass('Completezza 21 calcoli (metadati, documentazione logica e script Python)');

  // 2. Esecuzione end-to-end dei 21 calcoli con defaultInputs + valutazione soglie + riepilogo diagnostico
  for (const calc of QUANTUM_CALCULATIONS) {
    const res = await QuantumEngine.executeCalculation(calc.id, calc.defaultInputs);
    assert(res.calcolo_id === calc.id, `Calcolo #${calc.id}: calcolo_id mismatch (${res.calcolo_id})`);
    assert(res.stato_calcolo === 'SUCCESSO_COMPLETO', `Calcolo #${calc.id}: stato inatteso ${res.stato_calcolo}`);

    const status = evaluateCalculationStatus(calc.id, res, calc.defaultInputs, calc.subFunction);
    assert(
      status.livelloAllarme === 'NORMALE' ||
        status.livelloAllarme === 'ATTENZIONE' ||
        status.livelloAllarme === 'CRITICO',
      `Calcolo #${calc.id}: livelloAllarme non valido (${status.livelloAllarme})`
    );
    assert(status.titolo.trim().length > 0, `Calcolo #${calc.id}: titolo diagnostico vuoto`);
    assert(
      status.dettaglio.trim().length > 0 && !status.dettaglio.includes('NaN'),
      `Calcolo #${calc.id}: dettaglio non valido (${status.dettaglio})`
    );

    const summary = extractDiagnosticSummary(res);
    assert(
      Boolean(summary && summary.trim().length > 0 && !summary.includes('undefined') && !summary.includes('NaN')),
      `Calcolo #${calc.id}: summary diagnostico invalido (${summary})`
    );
  }
  pass('Esecuzione end-to-end 21/21 con valutazione soglie e assenza di NaN/undefined');

  // 3. Verifica parser centralizzato (SSCC 17-18 cifre, zeri iniziali, celle vuote, booleani, zero numerico)
  assert(
    parseFlexibleInput('80332190000458130', 'sscc_code') === '80332190000458130',
    'SSCC a 17 cifre deve restare stringa esatta'
  );
  assert(
    parseFlexibleInput('080332190000458129', 'sscc_code') === '080332190000458129',
    'SSCC a 18 cifre con zero iniziale deve restare stringa esatta'
  );
  assert(parseFlexibleInput('001234', 'codice') === '001234', 'Codici con zero iniziale devono restare stringa');
  assert(parseFlexibleInput('', 'soc_medio_flotta_pct') === undefined, 'Cella numerica vuota deve tornare undefined, non 0');
  assert(parseFlexibleInput('0', 'camion_attesa') === 0, 'Zero esplicito deve restare 0');
  assert(parseFlexibleInput('false', 'carico_pattini_integri') === false, '"false" deve diventare false booleano');
  assert(parseBooleanInput('false', true) === false, 'parseBooleanInput("false", true) deve tornare false');
  assert(parseBooleanInput('0', true) === false, 'parseBooleanInput("0", true) deve tornare false');
  assert(parseBooleanInput('no', true) === false, 'parseBooleanInput("no", true) deve tornare false');
  assert(finiteOr(0, 85) === 0, 'finiteOr(0, 85) non deve perdere lo zero');
  assert(finiteOr('', 85) === 85, 'finiteOr("", 85) deve usare fallback 85');
  assert(finiteOr(NaN, 85) === 85, 'finiteOr(NaN, 85) deve usare fallback 85');
  pass('Parser centralizzato (SSCC 17-18 cifre, zeri iniziali, booleani, 0 numerico)');

  // 4. Regressione Calcolo 4 (spessore_micro > 10 e soglie umidità ATTENZIONE vs CRITICO)
  const res4Warn = await QuantumEngine.executeCalculation(4, {
    umidita_rilevata: 16.8,
    spessore_micro: 320
  });
  const eval4Warn = evaluateCalculationStatus(4, res4Warn, { umidita_rilevata: 16.8, spessore_micro: 320 });
  assert(eval4Warn.livelloAllarme === 'ATTENZIONE', `Calcolo 4 umidità 16.8% atteso ATTENZIONE, trovato ${eval4Warn.livelloAllarme}`);
  assert(
    Math.abs(Number(res4Warn.dati_elaborati?.spessore_interfalda_mm) - 3.2) < 0.05,
    `Calcolo 4 spessore_micro=320 deve convertire a 3.2 mm, trovato ${res4Warn.dati_elaborati?.spessore_interfalda_mm}`
  );
  const res4Crit = await QuantumEngine.executeCalculation(4, {
    umidita_rilevata: 21.0,
    spessore_interfalda_mm: 3.0
  });
  const eval4Crit = evaluateCalculationStatus(4, res4Crit, { umidita_rilevata: 21.0, spessore_interfalda_mm: 3.0 });
  assert(eval4Crit.livelloAllarme === 'CRITICO', `Calcolo 4 umidità 21% atteso CRITICO, trovato ${eval4Crit.livelloAllarme}`);
  pass('Regressione Calcolo 4 (conversione spessore_micro e allarme umidità)');

  // 5. Regressione Calcolo 5 (gradi ISO senza prefisso e SSCC a 18 cifre con zero iniziale)
  const res5GradeC = await QuantumEngine.executeCalculation(5, {
    sscc_code: '080332190000458129',
    qualita_stampa_iso: 'C'
  });
  assert(res5GradeC.sscc_code === '080332190000458129', 'Calcolo 5 ha alterato lo SSCC a 18 cifre');
  assert(res5GradeC.qualita_stampa_iso === 'CLASSE_C', `Calcolo 5 "C" atteso CLASSE_C, trovato ${res5GradeC.qualita_stampa_iso}`);
  const eval5GradeC = evaluateCalculationStatus(5, res5GradeC, { qualita_stampa_iso: 'C' });
  assert(eval5GradeC.livelloAllarme === 'ATTENZIONE', `Calcolo 5 grado "C" atteso ATTENZIONE, trovato ${eval5GradeC.livelloAllarme}`);

  const res5GradeF = await QuantumEngine.executeCalculation(5, {
    sscc_code: '80332190000458130',
    qualita_stampa_iso: 'f'
  });
  const eval5GradeF = evaluateCalculationStatus(5, res5GradeF, { qualita_stampa_iso: 'f' });
  assert(eval5GradeF.livelloAllarme === 'CRITICO', `Calcolo 5 grado "f" atteso CRITICO, trovato ${eval5GradeF.livelloAllarme}`);
  pass('Regressione Calcolo 5 (normalizzazione grado ISO bare A/B/C/F e integrità SSCC)');

  // 6. Regressione Calcolo 6 (celle_libere_3d = 0 e booleano sagoma_fuori_asse come stringa)
  const res6Ok = await QuantumEngine.executeCalculation(6, {
    celle_libere_3d: 45,
    peso_bilancia_kg: 720,
    sagoma_fuori_asse: 'false'
  });
  const eval6Ok = evaluateCalculationStatus(6, res6Ok, { celle_libere_3d: 45, sagoma_fuori_asse: 'false' });
  assert(eval6Ok.livelloAllarme === 'NORMALE', `Calcolo 6 sagoma "false" atteso NORMALE, trovato ${eval6Ok.livelloAllarme}`);

  const res6Sat = await QuantumEngine.executeCalculation(6, {
    celle_libere_3d: 0,
    peso_bilancia_kg: 720,
    sagoma_fuori_asse: false
  });
  const eval6Sat = evaluateCalculationStatus(6, res6Sat, { celle_libere_3d: 0 });
  assert(eval6Sat.livelloAllarme === 'CRITICO', `Calcolo 6 celle_libere_3d=0 atteso CRITICO, trovato ${eval6Sat.livelloAllarme}`);
  pass('Regressione Calcolo 6 (0 celle libere critico e stringa booleana "false")');

  // 7. Regressione Calcolo 7 (precedenza pressione operatore e pattini rotti stringa "false")
  const res7P = await QuantumEngine.executeCalculation(7, {
    pressione_pattini_bar: 28,
    vettore_pressione_bar: [12, 13, 14, 12],
    carico_pattini_integri: 'false'
  });
  const eval7P = evaluateCalculationStatus(7, res7P, { pressione_pattini_bar: 28, carico_pattini_integri: 'false' });
  assert(eval7P.livelloAllarme === 'CRITICO', `Calcolo 7 pressione 28 bar / pattini rotti atteso CRITICO, trovato ${eval7P.livelloAllarme}`);
  pass('Regressione Calcolo 7 (precedenza pressione esplicita e pattini integri "false")');

  // 8. Regressione Calcolo 13 (motivo allarme coerente e distinzione stato normale vs saturo)
  const res13Norm = await QuantumEngine.executeCalculation(13, { camion_attesa: 2, saturazione_buffer: 0.4 });
  const eval13Norm = evaluateCalculationStatus(13, res13Norm, { camion_attesa: 2, saturazione_buffer: 0.4 });
  assert(eval13Norm.livelloAllarme === 'NORMALE', `Calcolo 13 basso carico atteso NORMALE, trovato ${eval13Norm.livelloAllarme}`);

  const res13Edge = await QuantumEngine.executeCalculation(13, { camion_attesa: 11, saturazione_buffer: 0.74 });
  assert(
    typeof res13Edge.motivo_allarme === 'string' && !res13Edge.motivo_allarme.includes('Nessuna criticità'),
    `Calcolo 13 con tempo attesa > 30 min deve riportare motivo allarme reale (trovato: ${res13Edge.motivo_allarme})`
  );

  const res13Crit = await QuantumEngine.executeCalculation(13, { camion_attesa: 14, saturazione_buffer: 0.92 });
  const eval13Crit = evaluateCalculationStatus(13, res13Crit, { camion_attesa: 14, saturazione_buffer: 0.92 });
  assert(eval13Crit.livelloAllarme === 'CRITICO', `Calcolo 13 saturo atteso CRITICO, trovato ${eval13Crit.livelloAllarme}`);
  pass('Regressione Calcolo 13 (stati normale vs critico e coerenza motivo allarme)');

  // 9. Regressione Calcoli 14 & 15 (alias CSV Tipo 2 e soglia vibrazione 0.50 g / tensione 180 N)
  const res14CsvNorm = await QuantumEngine.executeCalculation(14, { giri_minuto_rpm: 52.0, accelerazione_g: 0.22 });
  const eval14CsvNorm = evaluateCalculationStatus(14, res14CsvNorm, { giri_minuto_rpm: 52.0, accelerazione_g: 0.22 });
  assert(eval14CsvNorm.livelloAllarme === 'NORMALE', `Calcolo 14 CSV 0.22g atteso NORMALE, trovato ${eval14CsvNorm.livelloAllarme}`);

  const res14CsvCrit = await QuantumEngine.executeCalculation(14, { giri_minuto_rpm: 59.0, accelerazione_g: 0.82 });
  const eval14CsvCrit = evaluateCalculationStatus(14, res14CsvCrit, { giri_minuto_rpm: 59.0, accelerazione_g: 0.82 });
  assert(eval14CsvCrit.livelloAllarme === 'CRITICO', `Calcolo 14 CSV 0.82g/59RPM atteso CRITICO, trovato ${eval14CsvCrit.livelloAllarme}`);

  const res15CsvCrit = await QuantumEngine.executeCalculation(15, { tensione_film_n: 185 });
  const eval15CsvCrit = evaluateCalculationStatus(15, res15CsvCrit, { tensione_film_n: 185 });
  assert(eval15CsvCrit.livelloAllarme === 'CRITICO', `Calcolo 15 tensione_film_n=185 atteso CRITICO, trovato ${eval15CsvCrit.livelloAllarme}`);
  pass('Regressione Calcoli 14 & 15 (alias CSV Tipo 2 e soglie Bema in g / N)');

  // 10. Regressione Calcoli 17, 18, 20 e 21 (batteria 0%, vuoto robot, pallet legno, testina calda Raptor)
  const res17Zero = await QuantumEngine.executeCalculation(17, { soc_medio_flotta_pct: 0, temperatura_batterie_c: 32 });
  const eval17Zero = evaluateCalculationStatus(17, res17Zero, { soc_medio_flotta_pct: 0 });
  assert(eval17Zero.livelloAllarme === 'CRITICO', `Calcolo 17 SoC=0% atteso CRITICO, trovato ${eval17Zero.livelloAllarme}`);

  const res18Leak = await QuantumEngine.executeCalculation(18, { pressione_vuoto_bar: -0.55 });
  const eval18Leak = evaluateCalculationStatus(18, res18Leak, { pressione_vuoto_bar: -0.55 });
  assert(eval18Leak.livelloAllarme === 'CRITICO', `Calcolo 18 vuoto=-0.55 atteso CRITICO, trovato ${eval18Leak.livelloAllarme}`);

  const res20Crit = await QuantumEngine.executeCalculation(20, { forza_deformazione_pattini_n: 2350 });
  const eval20Crit = evaluateCalculationStatus(20, res20Crit, { forza_deformazione_pattini_n: 2350 });
  assert(eval20Crit.livelloAllarme === 'CRITICO', `Calcolo 20 pattini 2350N atteso CRITICO, trovato ${eval20Crit.livelloAllarme}`);

  const res21Hot = await QuantumEngine.executeCalculation(21, {
    grado_qualita_stampa_iso: 'CLASSE_B',
    temp_testina_termica_c: 84.5
  });
  const eval21Hot = evaluateCalculationStatus(21, res21Hot, {
    grado_qualita_stampa_iso: 'CLASSE_B',
    temp_testina_termica_c: 84.5
  });
  assert(
    eval21Hot.livelloAllarme === 'ATTENZIONE' && eval21Hot.parametro === 'temp_testina_termica_c',
    `Calcolo 21 testina 84.5°C deve segnalare ATTENZIONE temp_testina_termica_c (trovato: ${eval21Hot.livelloAllarme} / ${eval21Hot.parametro})`
  );
  pass('Regressione Calcoli 17, 18, 20 e 21 (SoC 0%, vuoto robot, legno, testina Raptor)');

  // 11. Allineamento snippet Python critici (soglie + clamp Calcolo 6)
  assert(QUANTUM_PYTHON_CODES[6].pythonCode.includes('max(0, int(celle_libere_3d))'), 'Python Calcolo 6 deve contenere clamp >= 0');
  assert(QUANTUM_PYTHON_CODES[6].pythonCode.includes('max(10.0, float(peso_bilancia_kg))'), 'Python Calcolo 6 deve contenere clamp peso >= 10');
  assert(QUANTUM_PYTHON_CODES[14].pythonCode.includes('0.50'), 'Python Calcolo 14 deve contenere soglia 0.50 g');
  assert(QUANTUM_PYTHON_CODES[15].pythonCode.includes('180.0'), 'Python Calcolo 15 deve contenere soglia 180.0 N');
  pass('Parità snippet Python con soglie industriali');

  // 12. Cronologia Telemetria & auto-bonifica dati legacy (mm/s -> g, nomi obsoleti, lgvSoc=0)
  localStorage.setItem(
    'joker80_telemetry_history_records_v2',
    JSON.stringify([
      {
        id: 'legacy-1',
        timestamp: '01/01 08:00:00',
        timestampIso: new Date().toISOString(),
        timestampEpoch: Date.now() - 60_000,
        stabilimentoId: 'barilla',
        stabilimentoNome: 'Barilla Test',
        azienda: 'Barilla',
        fonte: 'UPLOAD_CSV_TELEMETRIA',
        indiceSaluteGlobale: 92,
        oee: 86,
        criticiCount: 0,
        attenzioneCount: 0,
        normaliCount: 21,
        throughputPalletOra: 112,
        potenzaAssorbitaKw: 95,
        macchinari: {},
        calcoli: [
          {
            calcId: 1,
            calcNome: 'Ottimizzazione Dinamica Piazzale',
            sottoFunzione: 'Inbound Scheduler',
            livelloAllarme: 'NORMALE',
            metricaEtichetta: 'Congestione',
            metricaValore: '40%',
            rischioPercent: 40
          },
          {
            calcId: 14,
            calcNome: 'Risonanza Dinamica Macchine',
            sottoFunzione: 'Analisi Vibrazionale',
            livelloAllarme: 'NORMALE',
            metricaEtichetta: 'Vibrazione',
            metricaValore: '0.32 mm/s',
            rischioPercent: 12
          },
          {
            calcId: 16,
            calcNome: 'Routing LGV/AGV Anti-Collisione',
            sottoFunzione: 'AGV Fleet Routing',
            livelloAllarme: 'NORMALE',
            metricaEtichetta: 'QPU Routing Fidelity',
            metricaValore: '96.5%',
            rischioPercent: 10
          }
        ]
      }
    ])
  );

  const sanitized = PlantTelemetryHistoryService.getHistoryRecords();
  assert(sanitized.length === 1, 'Bonifica cronologia non ha restituito il record');
  const snap1 = sanitized[0].calcoli.find(s => s.calcId === 1);
  const snap14 = sanitized[0].calcoli.find(s => s.calcId === 14);
  const snap16 = sanitized[0].calcoli.find(s => s.calcId === 16);
  assert(
    Boolean(snap14 && typeof snap14.metricaValore === 'string' && !snap14.metricaValore.includes('mm/s') && snap14.metricaValore.includes('g')),
    `Cronologia deve bonificare mm/s -> g (trovato ${snap14?.metricaValore})`
  );
  assert(
    Boolean(snap16 && snap16.metricaEtichetta === 'Fluidità Rotta LGV'),
    `Cronologia deve bonificare QPU Routing Fidelity (trovato ${snap16?.metricaEtichetta})`
  );
  assert(
    Boolean(snap1 && snap1.calcNome === QUANTUM_CALCULATIONS.find(c => c.id === 1)?.name),
    `Cronologia deve aggiornare nomi calcolo obsoleti (trovato ${snap1?.calcNome})`
  );

  // Verifica recordNewSnapshot con lgvSoc = 0 e soglia critica vibrazione INDUSTRIAL_THRESHOLDS
  const tenantMock: any = { id: 'barilla', nome: 'Barilla Test', azienda: 'Barilla' };
  const recZero = PlantTelemetryHistoryService.recordNewSnapshot(tenantMock, 'DAEMON_PYTHON_MTLS', undefined, {
    bemaVibrazione: INDUSTRIAL_THRESHOLDS.BEMA_VIBRAZIONE_CRIT_G + 0.05,
    lgvSoc: 0,
    baieRitardo: 0
  });
  assert(
    recZero.macchinari.FLOTTA_LGV.batteriaSoC === 0,
    `lgvSoc=0 non deve essere sovrascritto da fallback (trovato ${recZero.macchinari.FLOTTA_LGV.batteriaSoC})`
  );
  assert(
    recZero.macchinari.BAIE_INBOUND_OUTBOUND.ritardoMinuti === 0,
    `baieRitardo=0 non deve essere sovrascritto da fallback (trovato ${recZero.macchinari.BAIE_INBOUND_OUTBOUND.ritardoMinuti})`
  );
  assert(
    recZero.macchinari.BEMA_FASCIATORE.stato === 'ALLARME',
    `Vibrazione > soglia critica deve segnare ALLARME sul macchinario BEMA_FASCIATORE`
  );
  pass('Cronologia telemetria (auto-bonifica record storici, unità g e preserva zeri)');

  // 13. Test completi Ingestione CSV (Tipologia 1 Eventi, Tipologia 2 Alta Velocità, Verticale ;)
  const sampleMachines = [
    { id: 'BEMA_01', nome: 'Fasciatore Bema Silkworm 01', categoria: 'Macchinario / Linea' },
    { id: 'BAIA_01', nome: 'Baia Inbound 01', categoria: 'Baia di Carico' },
    { id: 'AGV_01', nome: 'Flotta LGV / AGV 01', categoria: 'Flotta LGV / AGV' },
    { id: 'NODO_SMARTSTORE', nome: 'Magazzino Automatico WMS SmartStore', categoria: 'Magazzino Verticale' },
    { id: 'NODO_WOODPECKER', nome: 'Ispezione Qualità Pallet Woodpecker', categoria: 'Controllo Qualità' },
    { id: 'ROBOT_01', nome: 'Robot Pallettizzatore Linea 1', categoria: 'Macchinario / Linea' }
  ];

  // CSV Tipologia 1 (identico a "Scarica Esempio 1")
  const csvType1 = `timestamp,macchina_o_nodo,stato_operativo,evento_o_allarme,pezzi_prodotti,ricetta_attiva,operatore,temperatura_media_c,note
2026-10-08 08:00:00,Fasciatore Bema 01,IN_MARCIA,CICLO_AVVIATO,142,RICETTA_PALLET_EURO_A,Mario Rossi,36.5,Inizio turno ordinario
2026-10-08 08:15:22,Baia Inbound 01,ATTESA,CAMION_ARRIVATO,0,SCARICO_MATERIE_PRIME,Luigi Bianchi,21.0,Camion con 52m ritardo
2026-10-08 08:24:10,WMS SmartStore,ALLARME,SATURAZIONE_ALTA,1250,STOCCAGGIO_INTENSIVO,Sistema Automatico,19.2,Saturazione oltre 91%
2026-10-08 08:35:00,Flotta AGV 01,IN_MARCIA,MISSIONE_TRASPORTO,88,ROUTING_LINEA_1_A_WMS,Agv Fleet Mgr,34.0,SoC batteria 74%
2026-10-08 08:45:15,Ispezione Woodpecker,IN_MARCIA,PALLET_CONFORME,310,CONTROLLO_INTEGRITA,Operatore 3,22.4,Umidita legno 14.8%
2026-10-08 09:00:00,Robot Pallettizzatore,STOP,PAUSA_PROGRAMMATA,540,PALLETTIZZAZIONE_CARTONI,Mario Rossi,41.2,Fine lotto produzione`;

  const parsedCsv1 = parsePlantCsvContent(csvType1, sampleMachines);
  assert(parsedCsv1.rows.length === 6, `CSV Tipologia 1: attese 6 righe, trovate ${parsedCsv1.rows.length}`);
  assert(parsedCsv1.detectedNodes.unknown.length === 0, `CSV Tipologia 1: tutti i 6 nodi devono essere riconosciuti nello stabilimento`);
  assert(parsedCsv1.extractedInputs.minuti_ritardo === 52, `CSV1 minuti_ritardo atteso 52, trovato ${parsedCsv1.extractedInputs.minuti_ritardo}`);
  assert(parsedCsv1.extractedInputs.saturazione_wms === 91, `CSV1 saturazione_wms atteso 91, trovato ${parsedCsv1.extractedInputs.saturazione_wms}`);
  assert(parsedCsv1.extractedInputs.soc_medio_flotta_pct === 74, `CSV1 soc_medio_flotta_pct atteso 74, trovato ${parsedCsv1.extractedInputs.soc_medio_flotta_pct}`);
  assert(parsedCsv1.extractedInputs.temperatura_batterie_c === 34, `CSV1 temp batterie AGV deve restare 34°C e non 41.2°C (trovato ${parsedCsv1.extractedInputs.temperatura_batterie_c})`);
  assert(parsedCsv1.extractedInputs.umidita_legno_pct === 14.8, `CSV1 umidità legno atteso 14.8, trovato ${parsedCsv1.extractedInputs.umidita_legno_pct}`);
  assert(parsedCsv1.extractedInputs.throughput_pallet_ora === 310, `CSV1 throughput Woodpecker atteso 310, trovato ${parsedCsv1.extractedInputs.throughput_pallet_ora}`);

  const csv1Calc1 = await QuantumEngine.executeCalculation(1, parsedCsv1.extractedInputs);
  assert(csv1Calc1.dati_elaborati.minuti_ritardo === 52 && csv1Calc1.dati_elaborati.saturazione_wms === 91, 'CSV1 -> Calcolo 1 deve usare ritardo 52 e WMS 91%');

  // CSV Tipologia 2 (identico a "Scarica Esempio 2")
  const csvType2 = `timestamp_ms,macchina_o_nodo,giri_minuto_rpm,vibrazioni_rms_mms,accelerazione_g,frequenza_hz,corrente_inverter_a,pressione_bar,tensione_film_n
1728374400000,Fasciatore Bema 01,52.0,1.85,0.22,48.5,14.2,6.2,162.5
1728374400050,Fasciatore Bema 01,52.0,1.85,0.22,48.5,14.2,6.2,162.4`;

  const parsedCsv2 = parsePlantCsvContent(csvType2, sampleMachines);
  assert(parsedCsv2.isHighSpeed === true, 'CSV2 deve essere classificato alta velocità');
  const csv2Calc14 = await QuantumEngine.executeCalculation(14, parsedCsv2.extractedInputs);
  const evalCsv2Calc14 = evaluateCalculationStatus(14, csv2Calc14, parsedCsv2.extractedInputs);
  assert(csv2Calc14.vibrazione_cuscinetti_g === 0.22 && evalCsv2Calc14.livelloAllarme === 'NORMALE', `CSV2 Calcolo 14 deve usare 0.22 g (NORMALE), trovato ${csv2Calc14.vibrazione_cuscinetti_g} (${evalCsv2Calc14.livelloAllarme})`);
  const csv2Calc15 = await QuantumEngine.executeCalculation(15, parsedCsv2.extractedInputs);
  assert(csv2Calc15.tensione_newton === 162.4, `CSV2 Calcolo 15 deve leggere 162.4 N, trovato ${csv2Calc15.tensione_newton}`);

  // CSV Verticale con separatore ; virgolette RFC-4180, SSCC 18 cifre e booleano false
  const csvVertical = `macchina_o_nodo;parametro;valore;note
Raptor 01;sscc_code;080332190000458129;"Etichetta GS1-128, linea 1"
SmartStore 01;pressione_pattini_bar;24.5;"Picco rilevato; corsia 3"
SmartStore 01;carico_pattini_integri;false;"Verifica pattino"`;

  const parsedCsvVert = parsePlantCsvContent(csvVertical, sampleMachines);
  assert(parsedCsvVert.extractedInputs.sscc_code === '080332190000458129', 'CSV Verticale deve preservare SSCC 18 cifre con zero iniziale');
  assert(parsedCsvVert.extractedInputs.pressione_pattini_bar === 24.5, 'CSV Verticale deve leggere 24.5 bar');
  assert(parsedCsvVert.extractedInputs.carico_pattini_integri === false, 'CSV Verticale deve leggere false booleano');
  const csvVertCalc7 = await QuantumEngine.executeCalculation(7, parsedCsvVert.extractedInputs);
  assert(evaluateCalculationStatus(7, csvVertCalc7, parsedCsvVert.extractedInputs).livelloAllarme === 'CRITICO', 'CSV Verticale Calcolo 7 (24.5 bar / pattini false) deve risultare CRITICO');

  // CSV esterno con intestazioni diverse (inglese / sigle PLC) + override manuale Wizard
  const csvExternalPlc = `timestamp_ms,Asset,Speed_RPM,Acc_G,Film_Tension_N,DB_CUSTOM_POWER
1728374400000,Bema Line 2,58.5,0.68,185.0,132.0`;
  const parsedExternal = parsePlantCsvContent(csvExternalPlc, sampleMachines, 'AUTO_DETECT', {
    DB_CUSTOM_POWER: 'potenza_erogata_totale_kw'
  });
  assert(parsedExternal.detectedFormat === 'single_machine', 'CSV esterno veloce deve essere riconosciuto come Tipologia 2');
  assert(parsedExternal.extractedInputs.rpm_tavola_bema === 58.5, 'Speed_RPM deve mappare a rpm_tavola_bema');
  assert(parsedExternal.extractedInputs.vibrazione_cuscinetti_g === 0.68, 'Acc_G deve mappare a vibrazione_cuscinetti_g');
  assert(parsedExternal.extractedInputs.tensione_newton === 185.0, 'Film_Tension_N deve mappare a tensione_newton');
  assert(parsedExternal.extractedInputs.potenza_erogata_totale_kw === 132.0, 'Override manuale Wizard deve mappare DB_CUSTOM_POWER');
  const extCalc14 = await QuantumEngine.executeCalculation(14, parsedExternal.extractedInputs);
  assert(evaluateCalculationStatus(14, extCalc14, parsedExternal.extractedInputs).livelloAllarme === 'CRITICO', 'CSV esterno Calcolo 14 (0.68g / 58.5RPM) deve risultare CRITICO');
  const extCalc19 = await QuantumEngine.executeCalculation(19, parsedExternal.extractedInputs);
  assert(evaluateCalculationStatus(19, extCalc19, parsedExternal.extractedInputs).livelloAllarme === 'CRITICO', 'CSV esterno override Calcolo 19 (132 kW) deve risultare CRITICO');
  pass('Ingestione end-to-end CSV (Tipologia 1, Tipologia 2, Verticale e Riconoscimento PLC Esterni)');

  console.log(`\nTUTTE LE VERIFICHE SUPERATE CON SUCCESSO (${passed} suite di test OK).`);
}

runTests().catch(err => {
  console.error(err);
  throw err;
});
