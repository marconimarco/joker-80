import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Cpu, 
  Building2, 
  Database,
  ArrowRight
} from 'lucide-react';
import { FactoryTenant } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: FactoryTenant;
  onTenantUpdated?: (updated: FactoryTenant) => void;
  onApplyInputsToCatalog?: (inputsMap: Record<string, any>) => void;
}

export const PlantCsvUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTenant,
  onTenantUpdated,
  onApplyInputsToCatalog
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSampleCsv = () => {
    const csvContent = 
`macchina_o_nodo,parametro_tecnico,valore,unita_misura,stato_allarme
Fasciatore Bema 01,giri_minuto,49.5,RPM,NORMALE
Fasciatore Bema 01,tensione_newton,155.2,N,ATTENZIONE
Fasciatore Bema 01,spessore_film_micron,22.5,micron,NORMALE
Baia Inbound 01,camion_attesa,14,unita,ATTENZIONE
Baia Inbound 01,minuti_ritardo,52,min,ATTENZIONE
WMS SmartStore,saturazione_wms,91.4,%,CRITICO
WMS SmartStore,celle_libere_3d,108,unita,NORMALE
Flotta AGV 01,batteriaSoC,74.5,%,NORMALE
Flotta AGV 01,temperatura,34.2,C,NORMALE
Robot Pallettizzatore,pressione_vuoto_bar,-0.82,bar,NORMALE
Robot Pallettizzatore,forza_pinze_n,490,N,NORMALE
Stazione Fast Charge,potenza_erogata_totale_kw,95.0,kW,NORMALE
Ispezione Woodpecker,umidita_legno_pct,14.8,%,NORMALE
Ispezione Woodpecker,forza_deformazione_pattini_n,3250,N,NORMALE
Etichettatrice Raptor,sscc_code,080332190000458129,code,NORMALE
Etichettatrice Raptor,grado_qualita_stampa_iso,CLASSE_A,grade,NORMALE
`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `telemetria_${activeTenant.id}_modello.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processCsvFile = (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        throw new Error('Il file CSV deve contenere almeno una riga di intestazione e una riga di dati.');
      }

      // Detect separator: comma or semicolon
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      const headerCols = firstLine.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));
      setColumns(headerCols);

      const rows: Array<Record<string, string>> = [];
      const extractedInputs: Record<string, any> = {};

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const vals = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
        const rowObj: Record<string, string> = {};
        headerCols.forEach((col, cIdx) => {
          rowObj[col] = vals[cIdx] || '';
        });
        rows.push(rowObj);

        // Auto-extract telemetry parameters
        const paramKey = rowObj['parametro_tecnico'] || rowObj['parametro'] || rowObj['chiave'] || headerCols[1];
        const valRaw = rowObj['valore'] || rowObj['val'] || headerCols[2];
        if (paramKey && valRaw) {
          const num = Number(valRaw);
          extractedInputs[paramKey] = !isNaN(num) && valRaw.trim() !== '' ? num : valRaw;
        }
      }

      setParsedRows(rows);
      setErrorMessage(null);
      return { rows, extractedInputs };
    } catch (err: any) {
      setErrorMessage(err.message || 'Formato CSV non valido.');
      setParsedRows([]);
      setColumns([]);
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
      parsedRows.forEach(row => {
        const key = row['parametro_tecnico'] || row['parametro'] || Object.values(row)[1];
        const val = row['valore'] || Object.values(row)[2];
        if (key && val !== undefined) {
          const num = Number(val);
          extractedInputs[key] = !isNaN(num) && String(val).trim() !== '' ? num : val;
        }
      });

      // Update plant in AuthStorage
      const updatedTenant: FactoryTenant = {
        ...activeTenant,
        plantTopology: {
          ...activeTenant.plantTopology,
          lastSyncTimestamp: new Date().toISOString()
        } as any
      };

      // Save custom telemetry to localStorage for persistence
      localStorage.setItem(`joker_custom_telemetry_${activeTenant.id}`, JSON.stringify(extractedInputs));
      AuthStorage.updateTenant(updatedTenant);

      onTenantUpdated?.(updatedTenant);
      onApplyInputsToCatalog?.(extractedInputs);

      setUploadSuccess(`Telemetria CSV caricata con successo! ${parsedRows.length} parametri importati per lo stabilimento "${activeTenant.nome}".`);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e: any) {
      setErrorMessage(`Errore durante l'applicazione dei dati: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
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
                  SM.I.LE80 Import
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Stabilimento attivo: <strong className="text-cyan-300">{activeTenant.nome}</strong> ({activeTenant.azienda || 'Azienda'})
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
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-start justify-between gap-3 text-cyan-200">
            <div className="space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-xs text-cyan-300">
                <Database className="w-4 h-4 text-cyan-400" />
                Aggiornamento Manuale Dati e Sensori di Stabilimento
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Invece di utilizzare le letture simulate di default, puoi caricare un file <strong>.CSV</strong> contenente i valori reali dei sensori di campo dello stabilimento. I dati aggiorneranno istantaneamente i parametri nel Catalogo e nei calcoli CUDA-Q.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              title="Scarica un file CSV di esempio già formattato"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Scarica Modello CSV</span>
            </button>
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
            className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
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
                Formati supportati: .CSV (separatori virgola o punto e virgola)
              </p>
            </div>
            {file && (
              <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                File selezionato: {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} righe rilevate
              </span>
            )}
          </div>

          {/* Preview of Parsed CSV Data */}
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
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
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
                <span>Applicazione telemetria...</span>
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
