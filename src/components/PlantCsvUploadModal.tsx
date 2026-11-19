import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Layers,
  PlusCircle,
  Settings2,
  Sparkles,
  Check,
  Wand2
} from 'lucide-react';
import { FactoryTenant, MachineAsset } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { PlantTelemetryHistoryService } from '../services/plantTelemetryHistory';
import { parseFlexibleInput } from '../utils/inputParser';
import {
  parsePlantCsvContent,
  CANONICAL_CSV_TARGETS,
  CsvColumnAnalysis
} from '../utils/csvTelemetryParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: FactoryTenant;
  onTenantUpdated?: (updated: FactoryTenant) => void;
  onApplyInputsToCatalog?: (inputsMap: Record<string, any>) => void;
}

export type CsvFormatType = 'multi_node' | 'single_machine';

const SAMPLE_TYPE1_PREVIEW = [
  { col1: '2026-10-08 08:15:22', col2: 'Baia Inbound 01', col3: 'ATTESA', col4: 'Camion con 52m ritardo' },
  { col1: '2026-10-08 08:24:10', col2: 'WMS SmartStore', col3: 'ALLARME', col4: 'Saturazione oltre 91%' },
  { col1: '2026-10-08 08:35:00', col2: 'Flotta AGV 01', col3: 'IN_MARCIA', col4: 'SoC batteria 74%' }
];

const SAMPLE_TYPE2_PREVIEW = [
  { col1: '1728374400000', col2: 'Fasciatore Bema 01', col3: '52.0', col4: '0.22', col5: '162.5' },
  { col1: '1728374400010', col2: 'Fasciatore Bema 01', col3: '52.1', col4: '0.24', col5: '163.0' },
  { col1: '1728374400020', col2: 'Fasciatore Bema 01', col3: '52.2', col4: '0.28', col5: '164.2' }
];

export const PlantCsvUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTenant,
  onTenantUpdated,
  onApplyInputsToCatalog
}) => {
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [formatType, setFormatType] = useState<CsvFormatType>('multi_node');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('AUTO_DETECT');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([]);
  const [parsedInputs, setParsedInputs] = useState<Record<string, any>>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [columnAnalysis, setColumnAnalysis] = useState<CsvColumnAnalysis[]>([]);
  const [columnOverrides, setColumnOverrides] = useState<Record<string, string>>({});
  const [detectedFormat, setDetectedFormat] = useState<'multi_node' | 'single_machine' | 'vertical_kv' | null>(null);
  const [detectedNodes, setDetectedNodes] = useState<{ existing: string[]; unknown: string[] }>({ existing: [], unknown: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset wizard state cleanly when modal opens
  useEffect(() => {
    if (isOpen) {
      setWizardStep(1);
      setUploadSuccess(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const plantMachines = useMemo(() => {
    const list: Array<{ id: string; nome: string; categoria: string }> = [];
    const topo = activeTenant.plantTopology;
    if (!topo) return list;

    if (topo.macchinari && topo.macchinari.length > 0) {
      topo.macchinari.forEach(m => {
        list.push({ id: m.id, nome: m.nome, categoria: 'Macchinario / Linea' });
      });
    }

    if (topo.flottaAgv && topo.flottaAgv.length > 0) {
      topo.flottaAgv.forEach(a => {
        list.push({ id: a.id, nome: `Navetta ${a.id} (${a.modello})`, categoria: 'Flotta LGV / AGV' });
      });
    }

    if (topo.baie && topo.baie.length > 0) {
      topo.baie.forEach(b => {
        list.push({ id: b.id, nome: `${b.nome} (${b.tipo})`, categoria: 'Baia di Carico' });
      });
    }

    list.push({ id: 'NODO_SMARTSTORE', nome: 'Magazzino Automatico WMS SmartStore', categoria: 'Magazzino Verticale' });
    list.push({ id: 'NODO_WOODPECKER', nome: 'Ispezione Qualità Pallet Woodpecker', categoria: 'Controllo Qualità' });
    list.push({ id: 'NODO_RAPTOR', nome: 'Etichettatrice Raptor E80', categoria: 'Fine Linea' });

    return list;
  }, [activeTenant]);

  if (!isOpen) return null;

  const handleDownloadSampleType1 = () => {
    const csvContent =
`timestamp,macchina_o_nodo,stato_operativo,evento_o_allarme,pezzi_prodotti,ricetta_attiva,operatore,temperatura_media_c,note
2026-10-08 08:00:00,Fasciatore Bema 01,IN_MARCIA,CICLO_AVVIATO,142,RICETTA_PALLET_EURO_A,Mario Rossi,36.5,Inizio turno ordinario
2026-10-08 08:15:22,Baia Inbound 01,ATTESA,CAMION_ARRIVATO,0,SCARICO_MATERIE_PRIME,Luigi Bianchi,21.0,Camion con 52m ritardo
2026-10-08 08:24:10,WMS SmartStore,ALLARME,SATURAZIONE_ALTA,1250,STOCCAGGIO_INTENSIVO,Sistema Automatico,19.2,Saturazione oltre 91%
2026-10-08 08:35:00,Flotta AGV 01,IN_MARCIA,MISSIONE_TRASPORTO,88,ROUTING_LINEA_1_A_WMS,Agv Fleet Mgr,34.0,SoC batteria 74%
2026-10-08 08:45:15,Ispezione Woodpecker,IN_MARCIA,PALLET_CONFORME,310,CONTROLLO_INTEGRITA,Operatore 3,22.4,Umidita legno 14.8%
2026-10-08 09:00:00,Robot Pallettizzatore,STOP,PAUSA_PROGRAMMATA,540,PALLETTIZZAZIONE_CARTONI,Mario Rossi,41.2,Fine lotto produzione
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `log_eventi_stati_${activeTenant.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleType2 = () => {
    const csvContent =
`timestamp_ms,macchina_o_nodo,giri_minuto_rpm,vibrazioni_rms_mms,accelerazione_g,frequenza_hz,corrente_inverter_a,pressione_bar,tensione_film_n
1728374400000,Fasciatore Bema 01,52.0,1.85,0.22,48.5,14.2,6.2,162.5
1728374400010,Fasciatore Bema 01,52.1,1.88,0.24,48.5,14.4,6.2,163.0
1728374400020,Fasciatore Bema 01,52.2,1.92,0.28,49.0,14.7,6.1,164.2
1728374400030,Fasciatore Bema 01,52.0,1.86,0.23,48.8,14.3,6.2,163.1
1728374400040,Fasciatore Bema 01,51.9,1.84,0.21,48.6,14.1,6.2,162.0
1728374400050,Fasciatore Bema 01,52.0,1.85,0.22,48.5,14.2,6.2,162.4
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `log_telematico_alta_velocita_${activeTenant.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processCsvFile = (
    csvText: string,
    overrideMachineId?: string,
    nextOverrides?: Record<string, string>
  ) => {
    try {
      setRawCsvText(csvText);
      const parsed = parsePlantCsvContent(
        csvText,
        plantMachines,
        overrideMachineId ?? selectedMachineId,
        nextOverrides ?? columnOverrides
      );
      setColumns(parsed.columns);
      setDetectedNodes(parsed.detectedNodes);
      setParsedRows(parsed.rows);
      setParsedInputs(parsed.extractedInputs);
      setColumnAnalysis(parsed.columnAnalysis);
      setDetectedFormat(parsed.detectedFormat);
      setErrorMessage(null);
      return { rows: parsed.rows, extractedInputs: parsed.extractedInputs };
    } catch (err: any) {
      setErrorMessage(err.message || 'Formato CSV non valido.');
      setParsedRows([]);
      setParsedInputs({});
      setColumns([]);
      setColumnAnalysis([]);
      setDetectedFormat(null);
      setDetectedNodes({ existing: [], unknown: [] });
      return null;
    }
  };

  const handleColumnOverrideChange = (sourceColumn: string, targetKey: string) => {
    const updated = { ...columnOverrides, [sourceColumn]: targetKey };
    setColumnOverrides(updated);
    if (rawCsvText) {
      processCsvFile(rawCsvText, selectedMachineId, updated);
    }
  };

  const handleFileLoaded = (selectedFile: File, text: string) => {
    setFile(selectedFile);
    setColumnOverrides({});
    processCsvFile(text, selectedMachineId, {});
    setWizardStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleFileLoaded(selected, text);
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleFileLoaded(dropped, text);
      };
      reader.readAsText(dropped);
    }
  };

  const handleApplyToPlant = () => {
    if (!file || parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const extractedInputs: Record<string, any> = { ...parsedInputs };
      const newCustomMachines: MachineAsset[] = [];

      if (Object.keys(extractedInputs).length === 0) {
        parsedRows.forEach(row => {
          const key =
            row['parametro_tecnico'] ||
            row['parametro'] ||
            row['chiave'] ||
            row['tag'] ||
            Object.values(row)[1] ||
            Object.values(row)[0];

          const val =
            row['valore'] ||
            row['val'] ||
            row['value'] ||
            row['misura'] ||
            Object.values(row)[2] ||
            Object.values(row)[1];

          if (key && val !== undefined && String(val).trim() !== '') {
            const parsed = parseFlexibleInput(val, key);
            if (parsed !== undefined) {
              extractedInputs[key] = parsed;
            }
          }
        });
      }

      if (detectedNodes.unknown.length > 0) {
        detectedNodes.unknown.forEach((unknownName, idx) => {
          newCustomMachines.push({
            id: `CUSTOM_${Date.now()}_${idx}`,
            nome: `${unknownName} (Nuovo Nodo Rilevato da CSV)`,
            tipo: 'ALTRO',
            reparto: 'Linee Ausiliarie Telemetria',
            plcTag: `DB_CSV_${unknownName.toUpperCase().replace(/\s+/g, '_')}`,
            stato: 'IN_MARCIA'
          });
        });
      }

      const currentMachines = activeTenant.plantTopology?.macchinari || [];
      const updatedTenant: FactoryTenant = {
        ...activeTenant,
        plantTopology: {
          ...activeTenant.plantTopology,
          macchinari: [...currentMachines, ...newCustomMachines],
          lastSyncTimestamp: new Date().toISOString()
        } as any
      };

      localStorage.setItem(`joker_custom_telemetry_${activeTenant.id}`, JSON.stringify(extractedInputs));
      AuthStorage.updateTenant(updatedTenant);

      onTenantUpdated?.(updatedTenant);
      onApplyInputsToCatalog?.(extractedInputs);

      const isHighSpeed = columns.some(c => {
        const lc = c.toLowerCase();
        return lc.includes('hz') || lc.includes('vibraz') || lc.includes('accelerazion') || lc.includes('rpm') || lc.includes('timestamp_ms');
      });
      try {
        PlantTelemetryHistoryService.recordNewSnapshot(
          updatedTenant,
          isHighSpeed ? 'UPLOAD_CSV_TELEMETRIA' : 'UPLOAD_CSV_EVENTI',
          undefined,
          {
            bemaVibrazione:
              extractedInputs.vibrazione_cuscinetti_g ??
              extractedInputs.vibrazione_g ??
              extractedInputs.accelerazione_g ??
              extractedInputs.vibrazione_cuscinetti_bema_g,
            lgvSoc:
              extractedInputs.soc_medio_flotta_pct ??
              extractedInputs.stato_carica_medio_soc ??
              extractedInputs.batteria_soc,
            baieRitardo: extractedInputs.ritardo_stimato_minuti ?? extractedInputs.minuti_ritardo
          }
        );
      } catch {}

      const unknownMsg =
        detectedNodes.unknown.length > 0
          ? ` (${detectedNodes.unknown.length} nuovi nodi ausiliari censiti con successo)`
          : '';

      setUploadSuccess(
        `Telemetria CSV caricata con successo! ${Object.keys(extractedInputs).length} parametri importati per lo stabilimento "${activeTenant.nome}"${unknownMsg}.`
      );

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(`Errore durante l'applicazione dei dati: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizedCount = columnAnalysis.filter(
    c => c.confidence === 'exact' || c.confidence === 'inferred' || c.confidence === 'manual'
  ).length;
  const unmappedCount = columnAnalysis.filter(c => c.confidence === 'unmapped').length;

  const formatMismatch =
    detectedFormat &&
    detectedFormat !== 'vertical_kv' &&
    detectedFormat !== formatType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                  Procedura Guidata CSV Telemetria (2 Tipologie Standard)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Riconoscimento Automatico Colonne
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Stabilimento di destinazione: <strong className="text-cyan-300">{activeTenant.nome}</strong> ({activeTenant.azienda || 'Azienda'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Chiudi finestra"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Stepper */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between gap-2 text-xs font-mono shrink-0 overflow-x-auto">
          {[
            { num: 1 as const, label: '1. Scegli Tipo di File (2 Modelli)' },
            { num: 2 as const, label: '2. Carica CSV & Mappatura Smart' },
            { num: 3 as const, label: '3. Verifica & Applica' }
          ].map((s, idx) => {
            const isActive = wizardStep === s.num;
            const isDone = wizardStep > s.num || (s.num === 2 && parsedRows.length > 0 && wizardStep === 3);
            const canClick = s.num === 1 || (s.num === 2) || (s.num === 3 && parsedRows.length > 0);
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  disabled={!canClick}
                  onClick={() => canClick && setWizardStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : isDone
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                  } ${canClick ? 'cursor-pointer hover:border-cyan-500/60' : 'opacity-45 cursor-not-allowed'}`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950'
                        : isDone
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < 2 && <div className="h-px flex-1 bg-slate-800 min-w-[16px]" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 font-mono text-xs flex-1">
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PASSO 1: GUIDA VISIVA ALLE 2 TIPOLOGIE DI FILE */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-500/30 font-sans text-xs text-slate-200 leading-relaxed">
                <strong className="text-cyan-300 font-mono block mb-1">
                  Come devono essere caricati i dati dei macchinari (solo 2 tipologie standard):
                </strong>
                Dai macchinari e dai sistemi di fabbrica si usano soltanto queste <strong>2 categorie di file CSV</strong>. Scegli quella che stai per caricare (puoi anche scaricare subito il modello di esempio già pronto):
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipologia 1 */}
                <div
                  onClick={() => setFormatType('multi_node')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    formatType === 'multi_node'
                      ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-cyan-400" />
                        1. Log "Eventi e Stati"
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                        MES / SCADA / WMS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Registra cambi di stato, allarmi, ritardi alle baie, saturazione magazzino, carica batterie AGV/LGV e umidità pallet. Ogni riga è un evento di reparto.
                    </p>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/90 overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-cyan-300/90 bg-slate-900/80">
                            <th className="p-1.5">timestamp</th>
                            <th className="p-1.5">macchina_o_nodo</th>
                            <th className="p-1.5">stato</th>
                            <th className="p-1.5">note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {SAMPLE_TYPE1_PREVIEW.map((r, i) => (
                            <tr key={i}>
                              <td className="p-1.5 whitespace-nowrap">{r.col1.slice(11)}</td>
                              <td className="p-1.5 whitespace-nowrap">{r.col2}</td>
                              <td className="p-1.5 whitespace-nowrap">{r.col3}</td>
                              <td className="p-1.5 whitespace-nowrap text-emerald-300">{r.col4}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-sans">
                      {formatType === 'multi_node' ? '✓ Tipologia selezionata' : 'Clicca per scegliere'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSampleType1();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Scarica Esempio 1</span>
                    </button>
                  </div>
                </div>

                {/* Tipologia 2 */}
                <div
                  onClick={() => setFormatType('single_machine')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    formatType === 'single_machine'
                      ? 'border-emerald-400 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        2. Log "Telematico / Alta Velocità"
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                        PLC / Sensori (ms)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Registra misure veloci dai sensori macchina ogni millisecondo: giri al minuto (RPM), accelerazione/vibrazioni in <strong>g</strong>, frequenza in Hz, pressioni e tensione film in N.
                    </p>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/90 overflow-x-auto">
                      <table className="w-full text-[10px] text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-emerald-300/90 bg-slate-900/80">
                            <th className="p-1.5">timestamp_ms</th>
                            <th className="p-1.5">macchina</th>
                            <th className="p-1.5">rpm</th>
                            <th className="p-1.5">acc (g)</th>
                            <th className="p-1.5">film (N)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {SAMPLE_TYPE2_PREVIEW.map((r, i) => (
                            <tr key={i}>
                              <td className="p-1.5 whitespace-nowrap">...{r.col1.slice(-5)}</td>
                              <td className="p-1.5 whitespace-nowrap">{r.col2}</td>
                              <td className="p-1.5 whitespace-nowrap">{r.col3}</td>
                              <td className="p-1.5 whitespace-nowrap text-emerald-300">{r.col4}</td>
                              <td className="p-1.5 whitespace-nowrap">{r.col5}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-sans">
                      {formatType === 'single_machine' ? '✓ Tipologia selezionata' : 'Clicca per scegliere'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSampleType2();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scarica Esempio 2</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-sans text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>E se il file viene da un altro fornitore con nomi diversi (es. in inglese o sigle PLC)?</strong> Nel passaggio successivo la piattaforma legge automaticamente l'intestazione e abbina le colonne ai parametri giusti, permettendoti anche di correggere qualsiasi colonna con un clic.
                </span>
              </div>
            </div>
          )}

          {/* PASSO 2: CARICA FILE & RICONOSCIMENTO INTELLIGENTE COLONNE */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2.5 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-700/80 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-11 h-11 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {file ? file.name : 'Trascina qui il tuo file CSV o clicca per selezionarlo'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-sans">
                    Supportati file .CSV o .TXT con separatore virgola (,) o punto e virgola (;) e colonne in qualsiasi ordine.
                  </p>
                </div>
                {file && (
                  <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                    Caricato: {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} righe • {columns.length} colonne
                  </span>
                )}
              </div>

              {/* Macchinario di riferimento */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-cyan-400" />
                    Macchinario o Nodo di Riferimento:
                  </label>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Se il CSV non ha la colonna del nome macchina, scegli qui a quale impianto appartengono i dati.
                  </p>
                </div>

                <div className="shrink-0 w-full sm:w-auto">
                  <select
                    value={selectedMachineId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSelectedMachineId(nextId);
                      if (rawCsvText) {
                        processCsvFile(rawCsvText, nextId);
                      }
                    }}
                    className="w-full sm:w-72 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="AUTO_DETECT">Rilevamento automatico dal file (Tutti i nodi)</option>
                    <optgroup label="Macchinari Censiti nello Stabilimento">
                      {plantMachines.map(mac => (
                        <option key={mac.id} value={mac.id}>
                          {mac.nome} [{mac.categoria}]
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Avviso cambio automatico se il file caricato appartiene all'altra tipologia */}
              {formatMismatch && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-sans">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Il file caricato ha la struttura di{' '}
                      <strong>
                        {detectedFormat === 'single_machine'
                          ? 'Tipologia 2 (Log Telematico Alta Velocità)'
                          : 'Tipologia 1 (Log Eventi e Stati)'}
                      </strong>
                      , diversa da quella selezionata al Passo 1.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormatType(detectedFormat === 'single_machine' ? 'single_machine' : 'multi_node')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-100 font-mono font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Adatta automaticamente
                  </button>
                </div>
              )}

              {/* Analisi Automatica delle Colonne del CSV */}
              {columnAnalysis.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Riconoscimento Automatico Colonne ({recognizedCount} collegate, {unmappedCount} da verificare):
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                          <th className="p-2.5 font-bold">Colonna nel CSV</th>
                          <th className="p-2.5 font-bold">Valore Esempio</th>
                          <th className="p-2.5 font-bold">Stato</th>
                          <th className="p-2.5 font-bold">Parametro Destinazione nei Calcoli</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {columnAnalysis.map((col) => (
                          <tr key={col.sourceColumn} className="hover:bg-slate-900/50">
                            <td className="p-2.5 font-mono font-bold text-white whitespace-nowrap">
                              {col.sourceColumn}
                            </td>
                            <td className="p-2.5 font-mono text-cyan-300 whitespace-nowrap max-w-[180px] truncate">
                              {col.sampleValue || '—'}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              {col.confidence === 'exact' && (
                                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px]">
                                  Riconosciuta
                                </span>
                              )}
                              {col.confidence === 'inferred' && (
                                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px]">
                                  Abbinata auto
                                </span>
                              )}
                              {col.confidence === 'manual' && (
                                <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px]">
                                  Scelta utente
                                </span>
                              )}
                              {col.confidence === 'metadata' && (
                                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                                  Contesto / Nota
                                </span>
                              )}
                              {col.confidence === 'unmapped' && (
                                <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px]">
                                  Non collegata
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {col.confidence === 'metadata' ? (
                                <span className="text-[11px] font-sans text-slate-400">{col.note}</span>
                              ) : (
                                <div className="space-y-1">
                                  <select
                                    value={columnOverrides[col.sourceColumn] ?? col.mappedTarget}
                                    onChange={(e) => handleColumnOverrideChange(col.sourceColumn, e.target.value)}
                                    className="w-full min-w-[230px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-[11px] font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
                                  >
                                    <option value="">-- Ignora colonna (non usare nei calcoli) --</option>
                                    {CANONICAL_CSV_TARGETS.map((target) => (
                                      <option key={target.key} value={target.key}>
                                        {target.label} [{target.unit}] ({target.calcs})
                                      </option>
                                    ))}
                                  </select>
                                  <div className="text-[10px] font-sans text-slate-400">{col.note}</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 3: VERIFICA FINALE & APPLICA */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              {/* Nodi rilevati */}
              {parsedRows.length > 0 && (detectedNodes.existing.length > 0 || detectedNodes.unknown.length > 0) && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Macchinari e Nodi Rilevati nel File:
                  </span>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {detectedNodes.existing.map((nodeName, idx) => (
                      <span
                        key={`exist_${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <strong>{nodeName}</strong>
                        <span className="text-[9px] text-emerald-400/80">(Censito)</span>
                      </span>
                    ))}

                    {detectedNodes.unknown.map((nodeName, idx) => (
                      <span
                        key={`unknown_${idx}`}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] flex items-center gap-1.5"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                        <strong>{nodeName}</strong>
                        <span className="text-[9px] text-amber-400/80">(Nuovo Nodo Ausiliario)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Riepilogo parametri pronti per i calcoli */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Valori pronti per aggiornare i 21 calcoli ({Object.keys(parsedInputs).length} parametri):
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(parsedInputs).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200"
                    >
                      <span className="text-slate-400">{k}:</span>{' '}
                      <strong className="text-cyan-300">{String(v)}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Anteprima tabellare prime 6 righe */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      Anteprima Righe Importate ({parsedRows.length} record totali):
                    </span>
                    <span className="text-[10px] text-slate-500">Prime 6 righe mostrate</span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-48 bg-slate-950">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400">
                          {columns.map((col, idx) => (
                            <th key={idx} className="p-2 font-bold whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {parsedRows.slice(0, 6).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/50">
                            {columns.map((col, cIdx) => (
                              <td key={cIdx} className="p-2 font-mono whitespace-nowrap">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigazione Wizard */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Annulla
            </button>
            {wizardStep > 1 && (
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep === 3 ? 2 : 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Indietro</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {wizardStep === 1 && (
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <span>Avanti: Carica il File</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {wizardStep === 2 && (
              <button
                type="button"
                disabled={!file || parsedRows.length === 0}
                onClick={() => setWizardStep(3)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                <span>Avanti: Anteprima Finale</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {wizardStep === 3 && (
              <button
                type="button"
                disabled={!file || parsedRows.length === 0 || isProcessing}
                onClick={handleApplyToPlant}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Applicazione telemetria in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Applica Dati CSV allo Stabilimento</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
