import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Database,
  ArrowRight,
  Cpu,
  Layers,
  HelpCircle,
  PlusCircle,
  Settings2
} from 'lucide-react';
import { FactoryTenant, MachineAsset } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { PlantTelemetryHistoryService } from '../services/plantTelemetryHistory';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: FactoryTenant;
  onTenantUpdated?: (updated: FactoryTenant) => void;
  onApplyInputsToCatalog?: (inputsMap: Record<string, any>) => void;
}

export type CsvFormatType = 'multi_node' | 'single_machine';

export const PlantCsvUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTenant,
  onTenantUpdated,
  onApplyInputsToCatalog
}) => {
  const [formatType, setFormatType] = useState<CsvFormatType>('multi_node');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('AUTO_DETECT');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [detectedNodes, setDetectedNodes] = useState<{ existing: string[]; unknown: string[] }>({ existing: [], unknown: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista macchinari e nodi esistenti dello stabilimento attivo
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

    // Nodi deep standard E80 se presenti
    list.push({ id: 'NODO_SMARTSTORE', nome: 'Magazzino Automatico WMS SmartStore', categoria: 'Magazzino Verticale' });
    list.push({ id: 'NODO_WOODPECKER', nome: 'Ispezione Qualità Pallet Woodpecker', categoria: 'Controllo Qualità' });
    list.push({ id: 'NODO_RAPTOR', nome: 'Etichettatrice Raptor E80', categoria: 'Fine Linea' });

    return list;
  }, [activeTenant]);

  if (!isOpen) return null;

  // Download Modello Tipologia 1: Log Eventi e Stati (Cosa sta facendo la macchina / OEE / Ricette / Allarmi)
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

  // Download Modello Tipologia 2: Log Telematico / Alta Velocità (Frequenze vibrazioni, correnti, giri, pressioni)
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

  // Elaborazione del file CSV con supporto per ordine sparso di righe e colonne
  const processCsvFile = (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('Il file CSV deve contenere almeno una riga di intestazione e almeno una riga di dati.');
      }

      // Riconoscimento automatico del separatore (, oppure ;)
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      // Normalizzazione intestazioni colonne (case-insensitive, rimozione spazi e virgolette)
      const rawHeaderCols = firstLine.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));
      setColumns(rawHeaderCols);

      const headerLower = rawHeaderCols.map(c => c.toLowerCase());

      // Mappatura semantica colonne indipendentemente dall'ordine in cui si trovano:
      // 1. Colonna del nodo/macchinario
      const nodeColIdx = headerLower.findIndex(c => 
        c.includes('macchina') || c.includes('nodo') || c.includes('asset') || c.includes('device') || c.includes('linea')
      );
      // 2. Colonna del parametro/chiave
      const paramColIdx = headerLower.findIndex(c => 
        c.includes('parametro') || c.includes('chiave') || c.includes('key') || c.includes('tag') || c.includes('variabile')
      );
      // 3. Colonna del valore
      const valColIdx = headerLower.findIndex(c => 
        c === 'valore' || c === 'val' || c === 'value' || c.includes('valore') || c === 'lettura' || c === 'misura'
      );

      const rows: Array<Record<string, string>> = [];
      const extractedInputs: Record<string, any> = {};
      const foundNodesSet = new Set<string>();

      // Se non c'è una colonna esplicita "parametro" e "valore", ma è un CSV a matrice orizzontale
      // dove OGNI colonna è il nome di un parametro:
      const isWideMatrix = paramColIdx === -1 && valColIdx === -1 && rawHeaderCols.length >= 2;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        rawHeaderCols.forEach((col, cIdx) => {
          rowObj[col] = vals[cIdx] || '';
        });
        rows.push(rowObj);

        if (isWideMatrix) {
          // Matrice orizzontale: ogni intestazione è la chiave del parametro
          rawHeaderCols.forEach((colName, cIdx) => {
            const rawVal = vals[cIdx];
            if (rawVal !== undefined && rawVal !== '') {
              const num = Number(rawVal);
              extractedInputs[colName] = !isNaN(num) ? num : rawVal;
            }
          });
        } else {
          // Tabella per righe (verticale)
          const nodeName = nodeColIdx !== -1 ? vals[nodeColIdx] : '';
          const paramKey = paramColIdx !== -1 ? vals[paramColIdx] : (rawHeaderCols[0] ? vals[0] : '');
          const valRaw = valColIdx !== -1 ? vals[valColIdx] : (rawHeaderCols[1] ? vals[1] : '');

          if (nodeName) {
            foundNodesSet.add(nodeName);
          }

          if (paramKey && valRaw !== undefined && valRaw !== '') {
            const num = Number(valRaw);
            extractedInputs[paramKey] = !isNaN(num) ? num : valRaw;
          }
        }
      }

      // Analisi nodi esistenti vs nodi non esistenti (sconosciuti / ausiliari)
      const existingNames: string[] = [];
      const unknownNames: string[] = [];

      foundNodesSet.forEach(nodeName => {
        const lowerNode = nodeName.toLowerCase();
        const match = plantMachines.some(m => 
          m.nome.toLowerCase().includes(lowerNode) || 
          m.id.toLowerCase().includes(lowerNode) ||
          lowerNode.includes(m.nome.toLowerCase()) ||
          lowerNode.includes(m.id.toLowerCase())
        );

        if (match) {
          existingNames.push(nodeName);
        } else {
          unknownNames.push(nodeName);
        }
      });

      setDetectedNodes({ existing: existingNames, unknown: unknownNames });
      setParsedRows(rows);
      setErrorMessage(null);
      return { rows, extractedInputs };
    } catch (err: any) {
      setErrorMessage(err.message || 'Formato CSV non valido.');
      setParsedRows([]);
      setColumns([]);
      setDetectedNodes({ existing: [], unknown: [] });
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvFile(text);
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCsvFile(text);
      };
      reader.readAsText(dropped);
    }
  };

  const handleApplyToPlant = () => {
    if (!file || parsedRows.length === 0) return;
    setIsProcessing(true);

    try {
      const extractedInputs: Record<string, any> = {};
      const newCustomMachines: MachineAsset[] = [];

      // Mappatura parametri
      parsedRows.forEach(row => {
        // Cerca la chiave del parametro
        const key = row['parametro_tecnico'] || 
                    row['parametro'] || 
                    row['chiave'] || 
                    row['tag'] || 
                    Object.values(row)[1] || 
                    Object.values(row)[0];
                    
        // Cerca il valore
        const val = row['valore'] || 
                    row['val'] || 
                    row['value'] || 
                    row['misura'] || 
                    Object.values(row)[2] || 
                    Object.values(row)[1];

        if (key && val !== undefined) {
          const num = Number(val);
          extractedInputs[key] = !isNaN(num) && String(val).trim() !== '' ? num : val;
        }
      });

      // Se ci sono nodi non esistenti rilevati, li registriamo dinamicamente nella topologia dell'impianto
      if (detectedNodes.unknown.length > 0) {
        detectedNodes.unknown.forEach((unknownName, idx) => {
          newCustomMachines.push({
            id: `CUSTOM_${Date.now()}_${idx}`,
            nome: `${unknownName} (Nuovo Nodo Rilevato da CSV)`,
            stato: 'ATTIVO',
            tagPlc: `DB_CSV_${unknownName.toUpperCase().replace(/\s+/g, '_')}`,
            descrizione: 'Macchinario ausiliario rilevato tramite file CSV telemetria'
          });
        });
      }

      // Aggiorna lo stabilimento in AuthStorage
      const currentMachines = activeTenant.plantTopology?.macchinari || [];
      const updatedTenant: FactoryTenant = {
        ...activeTenant,
        plantTopology: {
          ...activeTenant.plantTopology,
          macchinari: [...currentMachines, ...newCustomMachines],
          lastSyncTimestamp: new Date().toISOString()
        } as any
      };

      // Salva la telemetria custom specifica per questo stabilimento in localStorage per persistenza
      localStorage.setItem(`joker_custom_telemetry_${activeTenant.id}`, JSON.stringify(extractedInputs));
      AuthStorage.updateTenant(updatedTenant);

      onTenantUpdated?.(updatedTenant);
      onApplyInputsToCatalog?.(extractedInputs);

      // Registra snapshot nella cronologia temporale dell'impianto
      try {
        PlantTelemetryHistoryService.recordNewSnapshot(
          updatedTenant,
          selectedFormat === 'TYPE_1_EVENTS_OEE' ? 'UPLOAD_CSV_EVENTI' : 'UPLOAD_CSV_TELEMETRIA',
          undefined,
          {
            bemaVibrazione: extractedInputs.vibrazione_cuscinetti_bema_g,
            lgvSoc: extractedInputs.stato_carica_medio_soc,
            baieRitardo: extractedInputs.ritardo_stimato_minuti
          }
        );
      } catch {}

      const unknownMsg = detectedNodes.unknown.length > 0 
        ? ` (${detectedNodes.unknown.length} nuovi nodi ausiliari censiti con successo)` 
        : '';
        
      setUploadSuccess(`Telemetria CSV caricata con successo! ${Object.keys(extractedInputs).length} parametri importati per lo stabilimento "${activeTenant.nome}"${unknownMsg}.`);
      
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (e: any) {
      setErrorMessage(`Errore durante l'applicazione dei dati: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

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
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                  Caricamento File CSV Telemetria Stabilimento
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  SM.I.LE80 Gateway
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 font-mono text-xs">
          
          {/* Selettore Tipologia CSV: 2 Formati Disponibili */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                Seleziona Tipologia di File CSV:
              </label>
              <span className="text-[11px] text-cyan-400 font-sans">
                (Puoi caricare una delle 2 tipologie supportate)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opzione 1 */}
              <div 
                onClick={() => setFormatType('multi_node')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formatType === 'multi_node'
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      1. Log "Eventi e Stati"
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                      Cosa fa la macchina (Leggero)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Traccia cambi di stato, ricette attive, pezzi prodotti, stop, allarmi, baie e WMS. File a frequenza lenta/a eventi, ideale per OEE e bilanciamento.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Eventi & Produzione</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownloadSampleType1(); }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                    title="Scarica file di esempio Log Eventi e Stati"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>Scarica Esempio</span>
                  </button>
                </div>
              </div>

              {/* Opzione 2 */}
              <div 
                onClick={() => setFormatType('single_machine')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  formatType === 'single_machine'
                    ? 'border-emerald-500 bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      2. Log "Telematico / Alta Velocità"
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      Fisica & Vibrazioni (Real-time)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Monitoraggio tecnico ad alta frequenza (ms): vibrazioni assi in Hz/mm/s, RPM inverter, picchi di pressione idraulica e correnti motori.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Serie Temporale / Hz</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownloadSampleType2(); }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                    title="Scarica file di esempio Log Telematico Alta Velocità"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Scarica Esempio</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selettore Macchinario di Destinazione */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Macchinario o Nodo di Riferimento:
              </label>
              <p className="text-[11px] text-slate-400 font-sans">
                {formatType === 'multi_node'
                  ? 'In Tipologia 1 il nodo viene rilevato automaticamente da ogni riga del file CSV.'
                  : 'In Tipologia 2 puoi associare i parametri a un macchinario specifico presente nello stabilimento.'}
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
              >
                <option value="AUTO_DETECT">
                  ✨ Rilevamento automatico dal file (Tutti i nodi)
                </option>
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

          {/* Banner di Spiegazione su Ordine Righe/Colonne e Nodi non Esistenti */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-slate-300">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] font-sans leading-relaxed">
              <strong className="text-cyan-300 block font-mono">
                Regole di Ingestione Intelligente dei Dati CSV:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>
                  <strong className="text-slate-100">Colonne e righe in ordine sparso:</strong> SÌ, puoi disporre colonne e righe nell'ordine che preferisci. Il parser riconosce le colonne dai nomi di intestazione normalizzati e legge ogni riga in modo indipendente.
                </li>
                <li>
                  <strong className="text-slate-100">Macchinario o nodo non esistente nel CSV:</strong> L'applicazione non si blocca e non genera errori! Se rileva un nodo sconosciuto (es. <em>Fasciatore 99</em>), lo registra come <strong>Nodo Ausiliario Esterno</strong> e associa tutti i parametri numerici ai calcoli quantistici dell'impianto.
                </li>
                <li>
                  <strong className="text-slate-100">Separatori supportati:</strong> Virgola (<code>,</code>) o Punto e Virgola (<code>;</code>) con o senza virgolette sui testi.
                </li>
              </ul>
            </div>
          </div>

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 sm:p-7 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
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
            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {file ? file.name : 'Trascina qui il file CSV o fai clic per selezionarlo'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Formati supportati: .CSV o .TXT con separatori virgola (,) o punto e virgola (;)
              </p>
            </div>
            {file && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                File caricato: {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} righe rilevate
              </span>
            )}
          </div>

          {/* Rilevamento Nodi: Esistenti vs Non Esistenti */}
          {parsedRows.length > 0 && (detectedNodes.existing.length > 0 || detectedNodes.unknown.length > 0) && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Riconoscimento Nodi & Macchinari nel File:
              </span>

              <div className="flex flex-wrap gap-2 pt-1">
                {/* Nodi Esistenti */}
                {detectedNodes.existing.map((nodeName, idx) => (
                  <span 
                    key={`exist_${idx}`} 
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] flex items-center gap-1.5"
                    title="Macchinario già censito nella topologia dell'impianto"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <strong>{nodeName}</strong>
                    <span className="text-[9px] text-emerald-400/80">(Censito)</span>
                  </span>
                ))}

                {/* Nodi Sconosciuti / Non Esistenti */}
                {detectedNodes.unknown.map((nodeName, idx) => (
                  <span 
                    key={`unknown_${idx}`} 
                    className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[11px] flex items-center gap-1.5"
                    title="Nuovo macchinario non presente nella topologia standard: verrà aggiunto automaticamente come nodo ausiliario"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{nodeName}</strong>
                    <span className="text-[9px] text-amber-400/80">(Nuovo Nodo Ausiliario)</span>
                  </span>
                ))}
              </div>

              {detectedNodes.unknown.length > 0 && (
                <p className="text-[10px] text-amber-400 font-sans pt-1">
                  ⚠️ <strong>Nota:</strong> {detectedNodes.unknown.length} macchinario/i non risultano nella topologia di default dello stabilimento. Verranno censiti come <em>Nodi Ausiliari</em> e i parametri saranno impiegati nei calcoli correlati.
                </p>
              )}
            </div>
          )}

          {/* Anteprima Tabellare Dati Rilevati */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Anteprima Dati Rilevati ({parsedRows.length} record):
                </span>
                <span className="text-[10px] text-slate-500">
                  Primi 6 record mostrati
                </span>
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

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleApplyToPlant}
            disabled={!file || parsedRows.length === 0 || isProcessing}
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
        </div>
      </div>
    </div>
  );
};
