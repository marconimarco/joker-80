# Regole Architetturali del Progetto: JOKER 80 Quantum Control Panel

Questo file definisce le direttive permanenti per lo sviluppo del middleware quantistico SM.I.LE80.

## 1. Gestione della Chat Terminal e Routing dei 17 Calcoli
- **Nessun Fallback Forzato con Dati Fittizi**: Se l'utente scrive un messaggio generico (es. "orario", "buongiorno", "chi sei"), l'assistente NON deve MAI forzare l'esecuzione di un calcolo non correlato (come il Calcolo 1 sui camion) precompilandolo con parametri fittizi di default.
- **Riconoscimento delle Intenzioni (Intent Detection)**:
  1. **Saluti & Guida**: Rispondere cordialmente spiegando il ruolo dell'assistente quantistico JOKER 80 e come formulare le richieste per i 17 calcoli.
  2. **Fuori Ambito (Non Industriale)**: Riconoscere richieste estranee alle operazioni di fabbrica e informare l'utente con cortesia indicando i 17 processi disponibili.
  3. **Richiesta Pertinente senza Parametri**: Riconoscere la sotto-funzione o il calcolo (es. "orario" / "turni" -> Calcolo 3; "bema" / "vibrazioni" -> Calcolo 14), spiegare quali parametri numerici sono necessari ed invitare l'utente a fornirli o a usare la telemetria dell'impianto attivo.
  4. **Richiesta con Parametri Reali**: Estrarre ed elaborare ESCLUSIVAMENTE i parametri forniti dall'utente o letti in tempo reale dal gateway dell'impianto connesso.

## 2. Integrazione con Macchinari Elettric80 & SM.I.LE80
- I macchinari dello stabilimento selezionato (fasciatori Bema Silkworm, navette LGV/AGV, baie di carico, SmartStore) forniscono la telemetria live via gateway.
- Quando l'utente richiede "dati reali" o "telemetria attuale", utilizzare i valori effettivi presenti in `activeTenant.plantTopology`.

## 3. Coerenza dell'Interfaccia Utente
- Mantenere la netta distinzione tra l'interazione intelligente in linguaggio naturale (Chat Terminal) e la consultazione tecnica strutturata (Catalogo).
- Evitare duplicazioni visive ingombranti che sottraggono spazio allo schermo.
