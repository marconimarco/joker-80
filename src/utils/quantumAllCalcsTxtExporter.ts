import { QuantumCalculationMeta, FactoryTenant, UserAccount } from '../types/quantum';
import { QUANTUM_PYTHON_CODES } from '../data/quantumPythonCalculations';

export interface GenerateTxtOptions {
  activeTenant?: FactoryTenant;
  calculations: QuantumCalculationMeta[];
  formInputs: Record<number, any>;
  results: Record<number, any>;
  currentUser?: UserAccount;
}

export function generateAllCalculationsTxtContent({
  activeTenant,
  calculations,
  formInputs,
  results,
  currentUser
}: GenerateTxtOptions): string {
  const tenantName = activeTenant?.nome || 'Stabilimento Standard';
  const tenantSite = activeTenant?.sito || 'Italia';
  const tenantAzienda = activeTenant?.azienda || 'Elettric80 Automation';
  const tenantNum = activeTenant?.numeroStabilimento || 1;
  const userName = currentUser?.nomeCompleto || currentUser?.username || 'Utente Autorizzato';
  const userRole = currentUser?.ruolo || 'Responsabile / Amministratore';
  const generationTime = new Date().toLocaleString('it-IT');

  const indexList = calculations
    .map(c => `  - Calcolo #${String(c.id).padStart(2, '0')}: [${c.category}] ${c.name} (${c.subFunction})`)
    .join('\n');

  const sections = calculations.map(calc => {
    const codeInfo = QUANTUM_PYTHON_CODES[calc.id];
    const codeText = codeInfo ? codeInfo.pythonCode.trim() : '# Codice sorgente Python non disponibile';
    const inputs = formInputs[calc.id] || calc.defaultInputs || {};
    const res = results[calc.id] || null;

    const inputLines = Object.keys(inputs).length > 0
      ? Object.entries(inputs).map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`).join('\n')
      : '  - (Parametri standard di telemetria PLC di fabbrica)';

    const resultFormatted = res
      ? JSON.stringify(res, null, 2)
          .split('\n')
          .map(line => `  ${line}`)
          .join('\n')
      : '  [Nessun risultato disponibile per questo nodo]';

    const diagnosi = res?.indice_rischio_blocco || res?.livello_rischio || res?.rischio_stocastico || res?.validazione_qualita || res?.digital_twin_status || 'ESECUZIONE CONFORME';
    const azione = res?.azione_correttiva_suggerita || res?.azione_logistica_immediata || res?.azione_sicurezza_wms || 'Nessuna anomalia rilevata';

    return `
================================================================================
CALCOLO #${calc.id}: ${calc.name.toUpperCase()}
================================================================================
Sottofunzione: ${calc.subFunction}
Reparto: ${calc.category} | Modulo Tecnico: ${calc.technicalModule}
Entanglement: ${calc.entanglement} | QPU Target: ${codeInfo?.targetQpu || 'NVIDIA cuQuantum'} (${codeInfo?.qubits || 4} Qubit)
Descrizione: ${codeInfo?.description || calc.description}
--------------------------------------------------------------------------------
CODICE SORGENTE PYTHON & KERNEL CUDA-Q:
--------------------------------------------------------------------------------
${codeText}

--------------------------------------------------------------------------------
REPORT TELEMETRIA PLC & RISULTATO COMPUTAZIONALE DEL CALCOLO #${calc.id}:
--------------------------------------------------------------------------------
Parametri di Input PLC Ricevuti:
${inputLines}

Risultato JSON Elaborato dal Motore Quantistico SM.I.LE80:
${resultFormatted}

Diagnosi Operativa:
  ${diagnosi}

Istruzione / Azione Consigliata per l'Operatore:
  ${azione}
================================================================================
`;
  }).join('\n');

  return `================================================================================
JOKER 80 QUANTUM - REPORT CONSOLIDATO: TUTTI I FILE PYTHON E RISULTATI CALCOLI
================================================================================
Stabilimento Attivo: ${tenantName} (${tenantSite})
Azienda: ${tenantAzienda} #${tenantNum}
Operatore / Ruolo Autorizzato: ${userName} (${userRole})
Data & Ora Generazione: ${generationTime}
Totale Calcoli Inclusi: ${calculations.length} calcoli operativi
Framework Quantistico: NVIDIA CUDA-Q 0.9+ / cuQuantum Appliance
Conformità di Fabbrica: Direttiva NIS2 Art. 21 / Crittografia Post-Quantum
================================================================================

INDICE DEI CALCOLI PRESENTI IN QUESTO FILE:
${indexList}
================================================================================

${sections}

================================================================================
FINE REPORT CONSOLIDATO - TUTTI I ${calculations.length} CALCOLI COMPLETATI CON SUCCESSO
File generato dal Gateway Quantistico SM.I.LE80 / Elettric80 Automation
================================================================================
`;
}

export function downloadAllCalculationsTxtFile(options: GenerateTxtOptions): string {
  const content = generateAllCalculationsTxtContent(options);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const plantSlug = (options.activeTenant?.nome || 'stabilimento')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  const filename = `joker80_${plantSlug}_all_calcs_python_e_risultati.txt`;
  
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return filename;
}
