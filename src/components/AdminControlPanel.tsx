import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  ShieldCheck, 
  Server, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Network,
  Cpu,
  Globe,
  HardDrive,
  Key,
  Sliders,
  Radio,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Zap,
  Boxes,
  Truck,
  Layers,
  Wifi,
  WifiOff,
  Pencil,
  Edit3,
  Save,
  CheckSquare,
  Square,
  UserCheck,
  Building,
  Factory,
  Lock,
  FileCode,
  UploadCloud,
  Eye,
  EyeOff,
  Shield,
  Play,
  Pause,
  Terminal,
  HelpCircle,
  Send,
  Download
} from 'lucide-react';
import { FactoryTenant, UserAccount, IndustrialProtocol } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { 
  PlantAutoDiscoveryService, 
  AutoDiscoveryResult 
} from '../services/plantAutoDiscovery';

interface Props {
  tenants: FactoryTenant[];
  onUpdateTenants: (tenants: FactoryTenant[]) => void;
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
  currentUser: UserAccount;
}

export const AdminControlPanel: React.FC<Props> = ({
  tenants,
  onUpdateTenants,
  activeTenant,
  onSelectTenant,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'topology' | 'operators' | 'mtls'>('discovery');
  const [users, setUsers] = useState<UserAccount[]>(() => AuthStorage.getUsers());

  // PFX / PKCS#12 Certificate Upload State
  const [pfxFile, setPfxFile] = useState<File | null>(null);
  const [pfxPassword, setPfxPassword] = useState('');
  const [showPfxPassword, setShowPfxPassword] = useState(false);
  const [isUploadingPfx, setIsUploadingPfx] = useState(false);
  const [pfxUploadFeedback, setPfxUploadFeedback] = useState<{ success: boolean; message: string; fingerprint?: string } | null>(null);
  const [mtlsStatus, setMtlsStatus] = useState<any>(null);

  // Live Telemetry from Local PC state
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([]);
  const [isSendingSimTelemetry, setIsSendingSimTelemetry] = useState(false);
  const [simTelemetrySuccess, setSimTelemetrySuccess] = useState<string | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  const [streamingCycle, setStreamingCycle] = useState(0);
  const [customJsonPayload, setCustomJsonPayload] = useState<string>(() => JSON.stringify({
    macchinarioId: 'bema-silkworm-01',
    nome: 'Fasciatore Robotico BEMA Silkworm (Linea 1)',
    tipo: 'BEMA_FASCIATORE',
    stato: 'IN_MARCIA',
    parametri: {
      velocitaRotazioneRpm: 34.2,
      tensioneFilmPreStiroPct: 295,
      temperaturaInverterC: 51.6,
      palletOra: 82,
      vibrazioneCuscinettiG: 0.38,
      pressioneAriaBar: 6.2
    },
    lgv: {
      id: 'LGV-04',
      modello: 'E80 CB60 Fast-Drop',
      batteriaSoC: 88,
      velocitaMs: 1.75,
      missione: 'Carico pallet linea 1'
    }
  }, null, 2));
  const [isSendingCustom, setIsSendingCustom] = useState(false);

  useEffect(() => {
    fetch('/api/mtls/status')
      .then(async r => {
        const contentType = r.headers.get('content-type') || '';
        if (r.ok && contentType.includes('application/json')) {
          return await r.json();
        }
        return null;
      })
      .then(d => {
        if (d) setMtlsStatus(d);
      })
      .catch(() => {});
  }, []);

  // Poll latest telemetry from local machine when on mtls tab
  useEffect(() => {
    let interval: any = null;
    const fetchLatest = () => {
      fetch('/api/telemetry/latest')
        .then(async r => {
          const ct = r.headers.get('content-type') || '';
          if (r.ok && ct.includes('application/json')) return await r.json();
          return null;
        })
        .then(d => {
          if (d && Array.isArray(d.recentPackets)) {
            setTelemetryHistory(d.recentPackets);
          }
        })
        .catch(() => {});
    };

    fetchLatest();
    if (activeTab === 'mtls') {
      interval = setInterval(fetchLatest, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  const handleSendSimulatedPacket = async (tipo: 'bema' | 'lgv' | 'allarme' = 'bema') => {
    setIsSendingSimTelemetry(true);
    setSimTelemetrySuccess(null);
    try {
      let samplePayload: any;
      if (tipo === 'allarme') {
        samplePayload = {
          macchinarioId: 'bema-silkworm-01',
          nome: 'Fasciatore Robotico BEMA Silkworm (Linea 1)',
          tipo: 'BEMA_FASCIATORE',
          stato: 'ALLARME',
          parametri: {
            velocitaRotazioneRpm: 0,
            tensioneFilmPreStiroPct: 0,
            temperaturaInverterC: 68.4,
            vibrazioneCuscinettiG: 1.85,
            palletOra: 0,
            allarmeAttivo: 'ERR_402_ROTTURA_FILM_E_SOVRATEMPERATURA'
          },
          lgv: {
            id: 'LGV-04',
            modello: 'E80 CB60 Fast-Drop',
            batteriaSoC: 45,
            missione: 'Arresto di sicurezza per linea bloccata',
            velocitaMs: 0
          },
          timestamp: new Date().toISOString()
        };
      } else if (tipo === 'lgv') {
        samplePayload = {
          macchinarioId: 'lgv-fleet-e80',
          nome: 'Flotta Navette AGV/LGV E80',
          tipo: 'LGV_FLEET',
          stato: 'IN_MARCIA',
          parametri: {
            veicoliAttivi: 8,
            missioniCompletateOra: 42,
            efficienzaNavettePct: 98.2,
            tempoMedioCicloSec: 114
          },
          lgv: {
            id: 'LGV-02',
            modello: 'E80 CB60 Laser-Guided',
            batteriaSoC: 84,
            missione: 'Trasferimento Pallet Pedrignano -> Baia di Carico 02',
            velocitaMs: 1.65,
            coordinate: { x: 12450, y: 8200 }
          },
          baia: {
            id: 'BAIA-02',
            stato: 'OCCUPATA',
            camionAssegnato: 'CAM-884-E80 (Scania R500)'
          },
          timestamp: new Date().toISOString()
        };
      } else {
        samplePayload = {
          macchinarioId: 'bema-silkworm-01',
          nome: 'Fasciatore Robotico BEMA Silkworm (Linea 1)',
          tipo: 'BEMA_FASCIATORE',
          stato: 'IN_MARCIA',
          parametri: {
            velocitaRotazioneRpm: 34.2,
            tensioneFilmPreStiroPct: 295,
            temperaturaInverterC: 51.6,
            vibrazioneCuscinettiG: 0.38,
            palletOra: 82,
            metriFilmRimanenti: 1280,
            allarmeAttivo: null
          },
          lgv: {
            id: 'LGV-04',
            modello: 'E80 CB60 Fast-Drop',
            batteriaSoC: 91,
            missione: 'Alimentazione automatica pallet su rulliera Bema',
            velocitaMs: 1.8
          },
          timestamp: new Date().toISOString()
        };
      }

      const res = await fetch('/api/telemetry/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });
      let data: any = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const txt = await res.text().catch(() => '');
          data = { success: false, error: txt || `HTTP ${res.status}` };
        }
      } catch (parseErr: any) {
        data = { success: false, error: 'Errore decodifica risposta: ' + parseErr.message };
      }

      if (res.ok && data?.success) {
        setSimTelemetrySuccess(`✅ Pacchetto "${samplePayload.nome}" acquisito e registrato sul server via canale mTLS!`);
        // Refresh history
        try {
          const rLatest = await fetch('/api/telemetry/latest');
          const ct = rLatest.headers.get('content-type') || '';
          if (rLatest.ok && ct.includes('application/json')) {
            const dLatest = await rLatest.json();
            if (dLatest?.recentPackets) setTelemetryHistory(dLatest.recentPackets);
          }
        } catch {
          // ignore latest polling error
        }
      } else {
        setSimTelemetrySuccess(`❌ Errore: ${data?.error || 'Invio fallito'}`);
      }
    } catch (err: any) {
      setSimTelemetrySuccess(`❌ Errore invio: ${err?.message || err}`);
    } finally {
      setIsSendingSimTelemetry(false);
    }
  };

  // Continuous real-time telemetry streaming simulation (green march)
  useEffect(() => {
    if (!isStreamingActive) return;

    let cycle = streamingCycle;
    const streamInterval = setInterval(async () => {
      cycle++;
      setStreamingCycle(cycle);
      const rpm = (34.0 + (Math.sin(cycle * 0.45) * 0.8)).toFixed(1);
      const temp = (51.2 + (Math.sin(cycle * 0.25) * 1.6)).toFixed(1);
      const pallets = 82 + Math.floor(cycle / 4);
      const lgvSpeed = (1.6 + (Math.cos(cycle * 0.35) * 0.2)).toFixed(2);
      const battery = Math.max(15, 92 - Math.floor(cycle * 0.15));

      const payload = {
        macchinarioId: 'bema-silkworm-01',
        nome: 'Fasciatore Robotico BEMA Silkworm (Linea 1)',
        tipo: 'BEMA_FASCIATORE',
        stato: 'IN_MARCIA',
        parametri: {
          velocitaRotazioneRpm: parseFloat(rpm),
          tensioneFilmPreStiroPct: 295,
          temperaturaInverterC: parseFloat(temp),
          vibrazioneCuscinettiG: +(0.36 + Math.random() * 0.04).toFixed(2),
          palletOra: pallets,
          metriFilmRimanenti: Math.max(80, 1280 - cycle * 3),
          allarmeAttivo: null
        },
        lgv: {
          id: 'LGV-04',
          modello: 'E80 CB60 Fast-Drop',
          batteriaSoC: battery,
          missione: `Alimentazione continua rulliera Bema [Ciclo #${cycle}]`,
          velocitaMs: parseFloat(lgvSpeed)
        },
        timestamp: new Date().toISOString()
      };

      try {
        const res = await fetch('/api/telemetry/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const rLatest = await fetch('/api/telemetry/latest');
          const ct = rLatest.headers.get('content-type') || '';
          if (rLatest.ok && ct.includes('application/json')) {
            const dLatest = await rLatest.json();
            if (dLatest?.recentPackets) setTelemetryHistory(dLatest.recentPackets);
          }
        }
      } catch (e) {
        console.error('Errore durante streaming telemetrico:', e);
      }
    }, 2200);

    return () => clearInterval(streamInterval);
  }, [isStreamingActive, streamingCycle]);

  const handleSendCustomPayload = async () => {
    setIsSendingCustom(true);
    setSimTelemetrySuccess(null);
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(customJsonPayload);
      } catch (jsonErr: any) {
        // Fallback: try parsing with relaxed quotes or formatting
        try {
          const relaxed = customJsonPayload
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
            .replace(/'/g, '"');
          parsed = JSON.parse(relaxed);
        } catch {
          setSimTelemetrySuccess(`❌ JSON non valido: ${jsonErr?.message}`);
          setIsSendingCustom(false);
          return;
        }
      }

      const res = await fetch('/api/telemetry/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      let data: any = null;
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          data = await res.json();
        } else {
          const txt = await res.text().catch(() => '');
          data = { success: false, error: txt || `HTTP ${res.status}` };
        }
      } catch (parseErr: any) {
        data = { success: false, error: 'Errore decodifica risposta server: ' + parseErr.message };
      }

      if (res.ok && data?.success) {
        setSimTelemetrySuccess(`✅ Telemetria personalizzata acquisita con successo sul server! Record: ${data.packetId}`);
        try {
          const rLatest = await fetch('/api/telemetry/latest');
          const ct = rLatest.headers.get('content-type') || '';
          if (rLatest.ok && ct.includes('application/json')) {
            const dLatest = await rLatest.json();
            if (dLatest?.recentPackets) setTelemetryHistory(dLatest.recentPackets);
          }
        } catch {
          // ignore
        }
      } else {
        setSimTelemetrySuccess(`❌ Errore server: ${data?.error || 'Invio fallito'}`);
      }
    } catch (err: any) {
      setSimTelemetrySuccess(`❌ Errore connessione: ${err?.message || err}`);
    } finally {
      setIsSendingCustom(false);
    }
  };

  const handleUploadPfx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfxFile) {
      setPfxUploadFeedback({ success: false, message: 'Seleziona prima il file .pfx dal tuo Desktop.' });
      return;
    }
    setIsUploadingPfx(true);
    setPfxUploadFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const base64Content = result.includes(',') ? result.split(',')[1] : result;
        const response = await fetch('/api/mtls/upload-pfx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pfxBase64: base64Content,
            passphrase: pfxPassword,
            filename: pfxFile.name
          })
        });

        const contentType = response.headers.get('content-type') || '';
        let resData: any = null;
        if (contentType.includes('application/json')) {
          try {
            resData = await response.json();
          } catch {
            resData = null;
          }
        }

        if (!resData) {
          const rawText = await response.text().catch(() => '');
          throw new Error(rawText ? `Risposta dal server: ${rawText.slice(0, 140)}` : `Errore HTTP ${response.status}`);
        }

        if (response.ok && resData.success) {
          setPfxUploadFeedback({
            success: true,
            message: resData.message || 'File .PFX decifrato e validato con successo!',
            fingerprint: resData.fingerprint
          });
          if (resData.status) {
            setMtlsStatus(resData.status);
          }
        } else {
          setPfxUploadFeedback({
            success: false,
            message: resData.error || 'Errore di decifratura. Verifica la password del file .PFX.'
          });
        }
      } catch (err: any) {
        setPfxUploadFeedback({
          success: false,
          message: err?.message || 'Errore di comunicazione con il server.'
        });
      } finally {
        setIsUploadingPfx(false);
      }
    };
    reader.onerror = () => {
      setPfxUploadFeedback({ success: false, message: 'Impossibile leggere il file selezionato dal computer locale.' });
      setIsUploadingPfx(false);
    };
    reader.readAsDataURL(pfxFile);
  };

  // Company / Establishment Hierarchy Filter
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');

  const companies = Array.from(new Set(tenants.map(t => t.azienda || 'Azienda Industriale'))).filter(Boolean);
  const displayedTenants = selectedCompanyFilter === 'all'
    ? tenants
    : tenants.filter(t => (t.azienda || '').toLowerCase() === selectedCompanyFilter.toLowerCase());

  // Discovery & Plant Edit/Create Form State
  const [selectedExistingTenantId, setSelectedExistingTenantId] = useState<string | null>(() => activeTenant.id || null);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [showAllPlants, setShowAllPlants] = useState<boolean>(true);

  // Form Fields: Società, Numero Stabilimento, Nome, Sito, Endpoint, ecc.
  const [plantAzienda, setPlantAzienda] = useState(() => activeTenant.azienda || 'Barilla G. e R. Fratelli');
  const [plantNumeroStabilimento, setPlantNumeroStabilimento] = useState<number | string>(() => activeTenant.numeroStabilimento || 1);
  const [plantNome, setPlantNome] = useState(() => activeTenant.nome || '');
  const [plantSito, setPlantSito] = useState(() => activeTenant.sito || '');
  const [plantEndpoint, setPlantEndpoint] = useState(() => activeTenant.endpoint || '');
  const [plantProtocol, setPlantProtocol] = useState<IndustrialProtocol>(() => activeTenant.protocol || 'REST_HTTPS');
  const [plantPlcIp, setPlantPlcIp] = useState(() => activeTenant.plcIp || '');
  const [plantColor, setPlantColor] = useState(() => activeTenant.logoColor || '#3b82f6');
  const [plantApiKey, setPlantApiKey] = useState(() => `E80_SEC_${(activeTenant.id || 'GW').toUpperCase()}_TOKEN_2026`);
  const [selectedOperatorIds, setSelectedOperatorIds] = useState<string[]>(() => activeTenant.operatoriAssegnati || []);

  // Feedback notifications
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Execution states
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStep, setDiscoveryStep] = useState<string>('');
  const [discoveryResult, setDiscoveryResult] = useState<AutoDiscoveryResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Manual Operator Creation State (Tab 3)
  const [newOpUsername, setNewOpUsername] = useState('');
  const [newOpNomeCompleto, setNewOpNomeCompleto] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('linea2026');
  const [newOpLinea, setNewOpLinea] = useState('Linea 1 - Inbound & Scarico Baie');
  const [newOpTenantId, setNewOpTenantId] = useState(activeTenant.id);
  const [newOpSuccess, setNewOpSuccess] = useState<string | null>(null);
  const [operatorFilterTenant, setOperatorFilterTenant] = useState<string>('all');

  // Handle Selecting an Existing Saved Plant to load into Form
  const handleSelectExistingTenant = (tenant: FactoryTenant) => {
    setSelectedExistingTenantId(tenant.id);
    setIsEditingMode(true);
    setPlantAzienda(tenant.azienda || 'Azienda');
    setPlantNumeroStabilimento(tenant.numeroStabilimento || 1);
    setPlantNome(tenant.nome);
    setPlantSito(tenant.sito);
    setPlantEndpoint(tenant.endpoint);
    setPlantProtocol(tenant.protocol || 'REST_HTTPS');
    setPlantPlcIp(tenant.plcIp || '');
    setPlantColor(tenant.logoColor || '#3b82f6');
    setPlantApiKey(`E80_SEC_${tenant.id.toUpperCase()}_TOKEN_2026`);
    setSelectedOperatorIds(tenant.operatoriAssegnati || []);
    setDiscoveryResult(null);
    setSaveSuccessMessage(null);
  };

  // Edit Tenant action with smooth scroll to form
  const handleEditTenant = (tenant: FactoryTenant) => {
    handleSelectExistingTenant(tenant);
    const formEl = document.getElementById('plant-form-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Reset form to enter a completely new plant
  const handleClearForm = () => {
    setSelectedExistingTenantId(null);
    setIsEditingMode(false);
    // Suggest next establishment number for the currently selected company
    const currentComp = selectedCompanyFilter !== 'all' ? selectedCompanyFilter : plantAzienda;
    const sameCompTenants = tenants.filter(t => (t.azienda || '').toLowerCase() === currentComp.toLowerCase());
    setPlantAzienda(currentComp);
    setPlantNumeroStabilimento(sameCompTenants.length + 1);
    setPlantNome('');
    setPlantSito('');
    setPlantEndpoint('');
    setPlantProtocol('REST_HTTPS');
    setPlantPlcIp('');
    setPlantColor('#3b82f6');
    setPlantApiKey('');
    setSelectedOperatorIds([]);
    setDiscoveryResult(null);
    setSaveSuccessMessage(null);

    const formEl = document.getElementById('plant-form-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle operator assignment
  const handleToggleOperator = (opId: string) => {
    setSelectedOperatorIds(prev => 
      prev.includes(opId) ? prev.filter(id => id !== opId) : [...prev, opId]
    );
  };

  // Direct Save Plant Handler (Pulsante "Salva")
  const handleSavePlantDirectly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!plantNome.trim() || !plantEndpoint.trim()) {
      alert('Compilare almeno il Nome Stabilimento e l\'Endpoint Gateway!');
      return;
    }

    if (selectedExistingTenantId && isEditingMode) {
      // Modifica stabilimento esistente
      const existing = tenants.find(t => t.id === selectedExistingTenantId);
      if (!existing) return;

      const updated: FactoryTenant = {
        ...existing,
        nome: plantNome.trim(),
        azienda: plantAzienda.trim() || 'Azienda Industriale',
        numeroStabilimento: Number(plantNumeroStabilimento) || 1,
        sito: plantSito.trim() || 'Stabilimento di Produzione',
        endpoint: plantEndpoint.trim(),
        protocol: plantProtocol,
        plcIp: plantPlcIp.trim() || existing.plcIp,
        logoColor: plantColor || existing.logoColor,
        operatoriAssegnati: selectedOperatorIds
      };

      AuthStorage.updateTenant(updated);
      const allTenants = AuthStorage.getTenants();
      onUpdateTenants(allTenants);
      if (activeTenant.id === updated.id) {
        onSelectTenant(updated);
      }
      setSaveSuccessMessage(`Stabilimento "${updated.nome}" (#${updated.numeroStabilimento}) di "${updated.azienda}" salvato con successo!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } else {
      // Creazione nuovo stabilimento
      const slug = plantNome.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16);
      const uniqueId = `tenant_${slug}_${Date.now().toString(36)}`;

      const newTenant: FactoryTenant = {
        id: uniqueId,
        nome: plantNome.trim(),
        azienda: plantAzienda.trim() || 'Nuova Società',
        numeroStabilimento: Number(plantNumeroStabilimento) || 1,
        sito: plantSito.trim() || 'Stabilimento Industriale',
        endpoint: plantEndpoint.trim(),
        protocol: plantProtocol,
        connectionStatus: 'CONNESSO',
        plcIp: plantPlcIp.trim() || `${plantEndpoint.replace(/^https?:\/\//, '').split('/')[0]}:502`,
        qpuTarget: 'Simulatore GPU CUDA-Q (cuStateVec)',
        logoColor: plantColor || '#3b82f6',
        plantTopology: activeTenant.plantTopology,
        operatoriAssegnati: selectedOperatorIds,
        createdAt: new Date().toISOString()
      };

      AuthStorage.addTenant(newTenant);
      const allTenants = AuthStorage.getTenants();
      onUpdateTenants(allTenants);
      onSelectTenant(newTenant);
      setSelectedExistingTenantId(newTenant.id);
      setIsEditingMode(true);
      setSaveSuccessMessage(`Nuovo stabilimento "${newTenant.nome}" (#${newTenant.numeroStabilimento}) per "${newTenant.azienda}" creato e salvato con successo!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    }
  };

  // Generate Automatic Safe Token
  const handleGenerateToken = () => {
    const raw = Math.random().toString(36).substring(2, 10).toUpperCase();
    setPlantApiKey(`E80_GW_AUTH_${raw}_2026`);
  };

  // Run Auto-Discovery / Reconnection and Automatic Operator Provisioning
  const handleStartAutoDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantNome.trim() || !plantEndpoint.trim()) return;

    setIsDiscovering(true);
    setDiscoveryResult(null);

    const isReconnecting = !!selectedExistingTenantId;

    try {
      setDiscoveryStep(isReconnecting
        ? '1/4: Stabilimento handshake mTLS con Gateway e verifica latenza...'
        : '1/4: Stabilimento handshake di rete e verifica certificati mTLS...');
      await new Promise(r => setTimeout(r, 600));

      setDiscoveryStep(isReconnecting
        ? '2/4: Interrogazione SM.I.LE80 e controllo modifiche topologiche reparti...'
        : '2/4: Scansione topologica SM.I.LE80 (Reparti Inbound, WMS, BEMA, Outbound)...');
      await new Promise(r => setTimeout(r, 700));

      setDiscoveryStep(isReconnecting
        ? '3/4: Rilevamento telemetria live e scansione nuovi macchinari / flotta AGV...'
        : '3/4: Rilevamento telemetria macchine, tag PLC e flotta AGV...');
      await new Promise(r => setTimeout(r, 600));

      setDiscoveryStep(isReconnecting
        ? '4/4: Ricalcolo matrice QPU ed allineamento credenziali operatori...'
        : '4/4: Dimensionamento matrice QPU e generazione automatica account operatori...');
      
      const result = await PlantAutoDiscoveryService.discoverAndConnectPlant({
        nome: plantNome,
        azienda: plantAzienda,
        numeroStabilimento: Number(plantNumeroStabilimento) || 1,
        sito: plantSito || 'Stabilimento di Produzione',
        endpoint: plantEndpoint,
        protocol: plantProtocol,
        plcIp: plantPlcIp,
        logoColor: plantColor,
        wmsApiKey: plantApiKey,
        existingTenantId: selectedExistingTenantId || undefined,
        operatoriAssegnati: selectedOperatorIds
      });

      // Update state in app
      const updatedTenants = AuthStorage.getTenants();
      const updatedUsers = AuthStorage.getUsers();
      onUpdateTenants(updatedTenants);
      setUsers(updatedUsers);
      onSelectTenant(result.tenant);

      setDiscoveryResult(result);
      setSelectedExistingTenantId(result.tenant.id);
      setIsEditingMode(true);
      setShowAllPlants(true);
      setSaveSuccessMessage(`Stabilimento "${result.tenant.nome}" collegato e configurato con successo!`);
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(`Errore durante il collegamento: ${err.message}`);
    } finally {
      setIsDiscovering(false);
      setDiscoveryStep('');
    }
  };

  // Re-sync existing plant telemetry
  const handleResync = async (tenant: FactoryTenant) => {
    setIsSyncing(tenant.id);
    try {
      const updated = await PlantAutoDiscoveryService.resyncTenant(tenant);
      const allTenants = AuthStorage.getTenants();
      onUpdateTenants(allTenants);
      if (activeTenant.id === tenant.id) {
        onSelectTenant(updated);
      }
    } finally {
      setIsSyncing(null);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = (id: string, nome: string) => {
    if (id === 'local') {
      alert('Non è possibile eliminare l\'ambiente locale di simulazione base.');
      return;
    }
    if (window.confirm(`Sei sicuro di voler rimuovere lo stabilimento "${nome}"? Gli operatori assegnati non potranno più accedere.`)) {
      AuthStorage.deleteTenant(id);
      const updated = AuthStorage.getTenants();
      onUpdateTenants(updated);
      if (activeTenant.id === id) {
        onSelectTenant(updated[0]);
      }
    }
  };

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Manual Operator Creation Handler (Tab 3)
  const handleCreateManualOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpUsername.trim() || !newOpNomeCompleto.trim()) return;

    if (users.some(u => u.username.toLowerCase() === newOpUsername.trim().toLowerCase())) {
      alert('Un operatore con questo username esiste già!');
      return;
    }

    const created = AuthStorage.addUser({
      username: newOpUsername.trim(),
      nomeCompleto: newOpNomeCompleto.trim(),
      ruolo: 'Operatore di Linea',
      password: newOpPassword.trim() || 'linea2026',
      lineaAssegnata: newOpLinea,
      tenantId: newOpTenantId,
      attivo: true
    });

    const updatedUsers = AuthStorage.getUsers();
    setUsers(updatedUsers);
    setNewOpSuccess(`Operatore "${created.nomeCompleto}" (${created.username}) abilitato all'accesso per lo stabilimento selezionato!`);
    setNewOpUsername('');
    setNewOpNomeCompleto('');
    setTimeout(() => setNewOpSuccess(null), 5000);
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (username === 'admin') {
      alert('Non puoi eliminare l\'amministratore principale.');
      return;
    }
    if (window.confirm(`Rimuovere l'operatore ${username}?`)) {
      AuthStorage.deleteUser(id);
      setUsers(AuthStorage.getUsers());
    }
  };

  const handleToggleUserActive = (id: string) => {
    const updated = users.map(u => {
      if (u.id === id && u.username !== 'admin') {
        return { ...u, attivo: !u.attivo };
      }
      return u;
    });
    AuthStorage.saveUsers(updated);
    setUsers(updated);
  };

  const filteredOperators = users.filter(u => {
    if (u.ruolo !== 'Operatore di Linea') return false;
    if (operatorFilterTenant === 'all') return true;
    return u.tenantId === operatorFilterTenant;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              Pannello Amministratore Joker 80
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Super-Admin
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Connessione dinamica e Auto-Discovery SM.I.LE80: inserimento minimo, scansione automatica macchine e generazione automatica degli account dipendenti.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'discovery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Connessione Rapida & Sedi ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'topology'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Digital Twin & Macchine ({activeTenant.plantTopology?.macchinari.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('operators')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'operators'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operatori Generati ({users.filter(u => u.ruolo === 'Operatore di Linea').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mtls')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'mtls'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sicurezza mTLS & File .PFX</span>
          </button>
        </div>
      </div>

      {/* QUICK BANNER: STATO mTLS & LINK DI CARICAMENTO .PFX */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${mtlsStatus?.configured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Canale di Comunicazione mTLS (TLS 1.3 / Direttiva NIS2):</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mtlsStatus?.configured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {mtlsStatus?.configured ? 'ATTIVO & SICURO' : 'IN ATTESA DI BUNDLE .PFX'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {mtlsStatus?.details || 'Carica il file .pfx generato con OpenSSL dal tuo Desktop per stabilire il collegamento sicuro con i server Google.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('mtls')}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{mtlsStatus?.configured ? 'Gestisci File .PFX' : 'Carica File .PFX dal Desktop'}</span>
        </button>
      </div>

      {/* TAB 1: CONNESSIONE RAPIDA, AUTO-DISCOVERY & SEDI */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* SELEZIONE SOCIETÀ E GESTIONE STABILIMENTI */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  Gestione Stabilimenti per Società / Azienda
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Seleziona prima la società per visualizzarne gli stabilimenti collegati, modificarli con il pulsante Edit o registrarne uno nuovo.
                </p>
              </div>

              <button
                onClick={handleClearForm}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/40 text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm shadow-purple-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo Stabilimento (Pulisci Modulo)</span>
              </button>
            </div>

            {/* FILTRO SOCIETÀ (AZIENDE) */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono font-semibold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>1. Seleziona Società / Azienda:</span>
                </span>
                <span className="text-slate-500 text-[10px]">
                  {companies.length} Società Registrate
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                    selectedCompanyFilter === 'all'
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>Tutte le Aziende</span>
                  <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono">
                    {tenants.length}
                  </span>
                </button>

                {companies.map(comp => {
                  const count = tenants.filter(t => (t.azienda || '').toLowerCase() === comp.toLowerCase()).length;
                  const isSelected = selectedCompanyFilter.toLowerCase() === comp.toLowerCase();
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setSelectedCompanyFilter(comp)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{comp}</span>
                      <span className="px-1.5 py-0.2 rounded bg-black/30 text-[10px] font-mono">
                        {count} {count === 1 ? 'stabilimento' : 'stabilimenti'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ELENCO DEGLI STABILIMENTI PER LA SOCIETÀ SELEZIONATA */}
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <div className="text-[10px] font-mono font-semibold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Stabilimenti {selectedCompanyFilter !== 'all' ? `per "${selectedCompanyFilter}"` : 'nel Sistema'} ({displayedTenants.length}):</span>
                </span>
                <span className="text-slate-500 text-[10px]">
                  Fai clic su "Modifica" per compilare e salvare i parametri
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayedTenants.map(t => {
                  const isSelected = selectedExistingTenantId === t.id;
                  const isActive = activeTenant.id === t.id;
                  const assignedOps = users.filter(u => 
                    (t.operatoriAssegnati && t.operatoriAssegnati.includes(u.id)) || u.tenantId === t.id
                  );

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl transition-all border flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-500/50 shadow-md'
                          : isActive
                          ? 'bg-slate-950/90 border-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Header: Company & Stabilimento # */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 truncate max-w-[170px]">
                            {t.azienda || 'Azienda Industriale'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                            Stabilimento #{t.numeroStabilimento || 1}
                          </span>
                        </div>

                        {/* Plant Name & Site */}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: t.logoColor || '#06b6d4' }}
                            />
                            <h4 className="text-xs font-bold font-mono text-slate-100 truncate">
                              {t.nome}
                            </h4>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <span>{t.sito}</span>
                          </p>
                        </div>

                        {/* Assigned Operators Badges */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Operatori Assegnati ({assignedOps.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {assignedOps.length > 0 ? (
                              assignedOps.slice(0, 3).map((op, oIdx) => (
                                <span 
                                  key={`${op.id || 'op'}-${oIdx}`}
                                  className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-300 truncate max-w-[120px]"
                                  title={`${op.nomeCompleto} (@${op.username})`}
                                >
                                  {op.nomeCompleto.split(' ')[0]} (@{op.username})
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] font-mono text-slate-500 italic">
                                Nessun operatore assegnato
                              </span>
                            )}
                            {assignedOps.length > 3 && (
                              <span className="px-1 py-0.5 text-[9px] font-mono text-slate-400">
                                +{assignedOps.length - 3} altri
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Gateway info */}
                        <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-2">
                          <span>GW: <code className="text-slate-300 truncate max-w-[130px] inline-block align-bottom">{t.endpoint}</code></span>
                          <span>•</span>
                          <span>{t.protocol || 'REST_HTTPS'}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1">
                          {/* PULSANTE MODIFICA (PENCIL) */}
                          <button
                            type="button"
                            onClick={() => handleEditTenant(t)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Modifica stabilimento, parametri e operatori assegnati"
                          >
                            <Pencil className="w-3 h-3 text-cyan-300" />
                            <span>Modifica</span>
                          </button>

                          {/* Quick resync */}
                          <button
                            type="button"
                            onClick={() => handleResync(t)}
                            disabled={isSyncing === t.id}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Risincronizza telemetria"
                          >
                            <RefreshCw className={`w-3 h-3 ${isSyncing === t.id ? 'animate-spin text-cyan-400' : ''}`} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => onSelectTenant(t)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-[11px] font-mono border border-slate-700 transition-all cursor-pointer"
                            >
                              Attiva
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> In Uso
                            </span>
                          )}

                          {t.id !== 'local' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTenant(t.id, t.nome)}
                              className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Elimina stabilimento"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid: Form on Left, Discovered Result / Plant List on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Complete Data Input & Edit Form */}
            <div id="plant-form-section" className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    {isEditingMode ? (
                      <>
                        <Pencil className="w-4 h-4 text-cyan-400" />
                        <span>Modifica Stabilimento: {plantNome || 'Stabilimento'} (#{plantNumeroStabilimento})</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-purple-400" />
                        <span>Nuovo Stabilimento per Società</span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {isEditingMode
                      ? 'Modifica i dati della società, la numerazione stabilimento, i parametri di rete e assegna gli operatori abilitati.'
                      : 'Inserisci i parametri dello stabilimento da aggiungere alla società e assegna gli operatori.'}
                  </p>
                </div>

                {selectedExistingTenantId && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                    title="Pulisci modulo per inserire un nuovo stabilimento"
                  >
                    + Nuovo Stabilimento
                  </button>
                )}
              </div>

              {/* Banner Successo Salvataggio */}
              {saveSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}

              {/* Status Banner when existing plant is selected for editing */}
              {selectedExistingTenantId && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Modifica attiva: {plantNome} ({plantAzienda} #{plantNumeroStabilimento})</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[10px] font-bold">
                    IN EDIT
                  </span>
                </div>
              )}

              <form onSubmit={handleStartAutoDiscovery} className="space-y-4 text-xs font-mono">
                {/* 1. Azienda / Società (Brand) */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    1. Azienda / Società (Brand) *
                  </label>
                  <input
                    type="text"
                    required
                    list="companies-datalist"
                    placeholder="Es. Barilla G. e R. Fratelli, Nestlé, Ferrero..."
                    value={plantAzienda}
                    onChange={e => setPlantAzienda(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                  <datalist id="companies-datalist">
                    {companies.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Digita il nome della società capogruppo o selezionala dall'elenco esistente.
                  </p>
                </div>

                {/* 2. Numero Stabilimento */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    2. Numero Stabilimento (Prog. Impianto) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={plantNumeroStabilimento}
                    onChange={e => setPlantNumeroStabilimento(e.target.value)}
                    placeholder="Es. 1, 2, 3..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Identificativo progressivo per la stessa azienda (es. Stabilimento 1, Stabilimento 2).
                  </p>
                </div>

                {/* 3. Nome Stabilimento */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    3. Nome dello Stabilimento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Stabilimento Pedrignano (Linea Pasta), Alba Polo 2..."
                    value={plantNome}
                    onChange={e => setPlantNome(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                {/* 4. Ubicazione */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    4. Città / Sito Geografico
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Parma (PR), Alba (CN), Rubbiano (PR)..."
                    value={plantSito}
                    onChange={e => setPlantSito(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                {/* 5. Endpoint Gateway SM.I.LE80 */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Network className="w-3.5 h-3.5 text-emerald-400" />
                    5. Host Gateway o URL Middleware SM.I.LE80 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. https://barilla-pedrignano.smile80.net/api/v1 o 192.168.10.20:8080"
                    value={plantEndpoint}
                    onChange={e => setPlantEndpoint(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                </div>

                {/* 6. Protocollo & Colore */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      6. Protocollo Industriale
                    </label>
                    <select
                      value={plantProtocol}
                      onChange={e => setPlantProtocol(e.target.value as IndustrialProtocol)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100"
                    >
                      <option value="REST_HTTPS">REST API (HTTPS / JSON)</option>
                      <option value="OPC_UA">OPC-UA (Binary TCP:4840)</option>
                      <option value="MQTT">MQTT Broker (Telemetry E80)</option>
                      <option value="SIEMENS_S7">Siemens S7-1500 (Industrial Ethernet)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      Colore Badge Fabbrica
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="color"
                        value={plantColor}
                        onChange={e => setPlantColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">{plantColor}</span>
                    </div>
                  </div>
                </div>

                {/* 7. Token / Chiave Gateway con generatore automatico */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      7. Token Gateway / Password API
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateToken}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                    >
                      <Sparkles className="w-3 h-3" /> Genera Token Automatico
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Esempio: E80_SEC_TOKEN_2026..."
                    value={plantApiKey}
                    onChange={e => setPlantApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                </div>

                {/* 8. Assegna Operatore o Più Operatori */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      8. Assegna Operatore o Più Operatori ({selectedOperatorIds.length} selezionati)
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setSelectedOperatorIds(users.filter(u => u.ruolo === 'Operatore di Linea').map(u => u.id))}
                        className="text-cyan-400 hover:underline cursor-pointer"
                      >
                        Seleziona Tutti
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedOperatorIds([])}
                        className="text-slate-400 hover:underline cursor-pointer"
                      >
                        Deseleziona
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Seleziona gli account operatori che avranno autorizzazione ad accedere e operare su questo stabilimento.
                  </p>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-slate-800 rounded-xl p-2 bg-slate-950/80">
                    {users.filter(u => u.ruolo === 'Operatore di Linea').length === 0 ? (
                      <div className="text-[11px] font-mono text-slate-500 p-2 text-center">
                        Nessun account operatore registrato nel sistema.
                      </div>
                    ) : (
                      users.filter(u => u.ruolo === 'Operatore di Linea').map((op, oIdx) => {
                        const isChecked = selectedOperatorIds.includes(op.id);
                        return (
                          <label
                            key={`${op.id || 'op'}-${oIdx}`}
                            className={`flex items-center justify-between p-2 rounded-lg text-[11px] font-mono cursor-pointer transition-all border ${
                              isChecked
                                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleOperator(op.id)}
                                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                              />
                              <div className="truncate">
                                <span className="font-bold text-slate-200">{op.nomeCompleto}</span>
                                <span className="ml-2 text-[10px] text-slate-500">(@{op.username})</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2 hidden sm:inline">
                              {op.lineaAssegnata}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* PULSANTE SALVA DIRETTO */}
                <button
                  type="button"
                  onClick={handleSavePlantDirectly}
                  disabled={!plantNome.trim() || !plantEndpoint.trim()}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 transition-all cursor-pointer text-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingMode ? '💾 Salva Modifiche Stabilimento' : '💾 Salva Nuovo Stabilimento'}</span>
                </button>

                {/* PULSANTE COLLAUDA & AUTO-DISCOVERY */}
                <button
                  type="submit"
                  disabled={isDiscovering || !plantNome.trim() || !plantEndpoint.trim()}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-200 font-bold flex items-center justify-center gap-2 border border-slate-700 hover:border-cyan-500 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer text-xs disabled:opacity-40"
                >
                  {isDiscovering ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{discoveryStep || 'Connessione e Auto-Discovery in corso...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>⚡ Salva & Collauda Connessione SM.I.LE80 (Auto-Discovery)</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Live Discovery Result & Connected Plants */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* If Discovering / Connecting: Live Step Progress Card */}
              {isDiscovering && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold font-mono text-cyan-200">
                        {selectedExistingTenantId 
                          ? 'Riconnessione & Scansione Nuovi Macchinari in Corso...' 
                          : 'Connessione e Auto-Discovery SM.I.LE80 in Corso...'}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                        {discoveryStep || 'Verifica handshake di rete e scansione macchinari...'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* If Discovery/Reconnection Completed: Beautiful Summary Card */}
              {discoveryResult && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-white">
                          {discoveryResult.isReconnection 
                            ? 'Riconnessione & Auto-Discovery Completati con Successo!' 
                            : 'Auto-Discovery SM.I.LE80 Completato con Successo!'}
                        </h4>
                        <p className="text-[11px] text-emerald-300/80 font-mono">
                          Impianto: <strong className="text-white">{discoveryResult.tenant.nome}</strong> (Latenza: {discoveryResult.summary.handshakeLatencyMs}ms)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {discoveryResult.summary.newMachinesDiscoveredCount && discoveryResult.summary.newMachinesDiscoveredCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          +{discoveryResult.summary.newMachinesDiscoveredCount} Nuovi Asset
                        </span>
                      ) : null}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ATTIVO & SINCRONIZZATO
                      </span>
                    </div>
                  </div>

                  {/* Discovered Topology Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Reparti</div>
                      <div className="text-sm font-bold text-cyan-400">{discoveryResult.summary.repartiCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Macchinari</div>
                      <div className="text-sm font-bold text-purple-400">{discoveryResult.summary.macchinariCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Flotta LGV</div>
                      <div className="text-sm font-bold text-emerald-400">{discoveryResult.summary.agvCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">QPU Qubits</div>
                      <div className="text-sm font-bold text-amber-400">{discoveryResult.summary.qubitsAllocated}</div>
                    </div>
                  </div>

                  {/* Discovered / Updated Events List */}
                  {discoveryResult.newDiscoveredItems && discoveryResult.newDiscoveredItems.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dettagli Scansione e Rilevamenti Topologia:</span>
                      </div>
                      <div className="space-y-1 text-[10px] font-mono text-slate-300">
                        {discoveryResult.newDiscoveredItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created/Verified Operator Credentials Table */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Users className="w-3.5 h-3.5" />
                        Account Operatori di Linea Allineati ({discoveryResult.createdOperators.length}):
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {discoveryResult.createdOperators.map((op, oIdx) => (
                        <div
                          key={`${op.id || 'op'}-${oIdx}`}
                          className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                        >
                          <div>
                            <div className="text-slate-200 font-bold">{op.nomeCompleto}</div>
                            <div className="text-slate-400 flex items-center gap-2">
                              <span>User: <code className="text-cyan-400">{op.username}</code></span>
                              <span>•</span>
                              <span>Pass: <code className="text-amber-400">{op.password}</code></span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyText(`${op.username} / ${op.password}`, op.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                            title="Copia credenziali di login"
                          >
                            {copiedKey === op.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stabilimento Connesso Card (Single Plant View by default) */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      {showAllPlants ? `Stabilimenti Connessi (${tenants.length})` : 'Stabilimento Connesso'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {showAllPlants 
                        ? 'Elenco completo degli stabilimenti registrati nel sistema.' 
                        : 'Visualizzazione dello stabilimento selezionato nel Banco di Prova SM.I.LE80.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllPlants(!showAllPlants)}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 underline transition-colors cursor-pointer shrink-0"
                  >
                    {showAllPlants ? '← Mostra solo stabilimento selezionato' : `Mostra tutti (${tenants.length})`}
                  </button>
                </div>

                {/* VISTA 1: STABILIMENTO SINGOLO SELEZIONATO (O ATTIVO) */}
                {!showAllPlants && (() => {
                  const targetTenant = (selectedExistingTenantId ? tenants.find(t => t.id === selectedExistingTenantId) : null) || tenants.find(t => t.id === activeTenant.id) || tenants[0];
                  if (!targetTenant) return null;

                  const isActive = targetTenant.id === activeTenant.id;
                  const isLoadedInForm = selectedExistingTenantId === targetTenant.id;
                  const topo = targetTenant.plantTopology;

                  return (
                    <div
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLoadedInForm
                          ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/40 shadow-sm'
                          : isActive
                          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: targetTenant.logoColor || '#06b6d4' }}
                          />
                          <span className="font-mono font-bold text-xs text-slate-100">
                            {targetTenant.nome}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {targetTenant.azienda || 'Azienda'} #{targetTenant.numeroStabilimento || 1}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ATTIVO
                            </span>
                          )}
                          {isLoadedInForm && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              NEL MODULO
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                            <Wifi className="w-2.5 h-2.5" />
                            {targetTenant.connectionStatus || 'CONNESSO'}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400">
                          Sito: <span className="text-slate-300">{targetTenant.sito}</span>
                          {topo && (
                            <span className="ml-2 text-cyan-400/80">
                              ({topo.macchinari.length} Macchine, {topo.flottaAgv.length} LGV, QPU {topo.qubitCapacity} Qubits)
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>GW: <code className="text-cyan-400">{targetTenant.endpoint}</code></span>
                          {targetTenant.protocol && <span>Prot: <span className="text-slate-300">{targetTenant.protocol}</span></span>}
                          {targetTenant.plcIp && <span>PLC: <span className="text-slate-300">{targetTenant.plcIp}</span></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEditTenant(targetTenant)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 cursor-pointer transition-all"
                          title="Modifica stabilimento e operatori"
                        >
                          <Pencil className="w-3 h-3 text-cyan-300" />
                          <span>Modifica</span>
                        </button>

                        {/* Load into Form & Test Button */}
                        <button
                          onClick={() => handleSelectExistingTenant(targetTenant)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                            isLoadedInForm
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          }`}
                          title="Carica dati nel modulo per testare riconnessione e nuovi macchinari"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{isLoadedInForm ? 'Dati nel Modulo' : 'Carica Dati'}</span>
                        </button>

                        {/* Re-sync Telemetry Button */}
                        <button
                          onClick={() => handleResync(targetTenant)}
                          disabled={isSyncing === targetTenant.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="Risincronizza telemetria da SM.I.LE80"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === targetTenant.id ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {!isActive ? (
                          <button
                            onClick={() => onSelectTenant(targetTenant)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                          >
                            Connetti
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 px-3 py-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>In Uso</span>
                          </div>
                        )}

                        {targetTenant.id !== 'local' && (
                          <button
                            onClick={() => handleDeleteTenant(targetTenant.id, targetTenant.nome)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Rimuovi ambiente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* VISTA 3: TUTTI GLI STABILIMENTI (SOLO SE L'UTENTE CLICCA 'MOSTRA TUTTI') */}
                {showAllPlants && (
                  <div className="space-y-3">
                    {tenants.map(t => {
                      const isActive = t.id === activeTenant.id;
                      const isLoadedInForm = selectedExistingTenantId === t.id;
                      const topo = t.plantTopology;
                      return (
                        <div
                          key={t.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isLoadedInForm
                              ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/40 shadow-sm'
                              : isActive
                              ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: t.logoColor || '#06b6d4' }}
                              />
                              <span className="font-mono font-bold text-xs text-slate-100">
                                {t.nome}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  ATTIVO
                                </span>
                              )}
                              {isLoadedInForm && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  NEL MODULO
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                                <Wifi className="w-2.5 h-2.5" />
                                {t.connectionStatus || 'CONNESSO'}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-400">
                              Sito: <span className="text-slate-300">{t.sito}</span>
                              {topo && (
                                <span className="ml-2 text-cyan-400/80">
                                  ({topo.macchinari.length} Macchine, {topo.flottaAgv.length} LGV, QPU {topo.qubitCapacity} Qubits)
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>GW: <code className="text-cyan-400">{t.endpoint}</code></span>
                              {t.protocol && <span>Prot: <span className="text-slate-300">{t.protocol}</span></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleEditTenant(t)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 cursor-pointer transition-all"
                              title="Modifica stabilimento e operatori"
                            >
                              <Pencil className="w-3 h-3 text-cyan-300" />
                              <span>Modifica</span>
                            </button>

                            <button
                              onClick={() => handleSelectExistingTenant(t)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                                isLoadedInForm
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title="Carica dati nel modulo per testare riconnessione e nuovi macchinari"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Carica Dati</span>
                            </button>

                            <button
                              onClick={() => handleResync(t)}
                              disabled={isSyncing === t.id}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Risincronizza telemetria da SM.I.LE80"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === t.id ? 'animate-spin text-cyan-400' : ''}`} />
                            </button>

                            {!isActive ? (
                              <button
                                onClick={() => onSelectTenant(t)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                              >
                                Connetti
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 px-3 py-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>In Uso</span>
                              </div>
                            )}

                            {t.id !== 'local' && (
                              <button
                                onClick={() => handleDeleteTenant(t.id, t.nome)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Rimuovi ambiente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL TWIN & MACCHINE DELLO STABILIMENTO ATTIVO */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Active Plant Topology Header */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: activeTenant.logoColor || '#06b6d4' }}
                />
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    Digital Twin: {activeTenant.nome}
                    <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LIVE TELEMETRY
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Sito: {activeTenant.sito} | Gateway: <code className="text-cyan-400">{activeTenant.endpoint}</code> [{activeTenant.protocol || 'REST_HTTPS'}]
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleResync(activeTenant)}
                disabled={isSyncing === activeTenant.id}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === activeTenant.id ? 'animate-spin' : ''}`} />
                <span>Aggiorna Dati da SM.I.LE80</span>
              </button>
            </div>

            {/* QPU Dimensioning & Hamiltonian Matrix Spec */}
            {activeTenant.plantTopology && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> QPU Qubits Allocati:
                  </div>
                  <div className="text-base font-bold text-white mt-1">
                    {activeTenant.plantTopology.qubitCapacity} Qubit Logici
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" /> Matrice Hamiltoniana:
                  </div>
                  <div className="text-base font-bold text-purple-300 mt-1 truncate">
                    {activeTenant.plantTopology.qpuDimensioning.hamiltonianSize}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" /> Backend Simulatore:
                  </div>
                  <div className="text-xs font-bold text-emerald-300 mt-1 truncate">
                    {activeTenant.plantTopology.qpuDimensioning.simulatorBackend}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Machinery & Sensors */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              Macchinari di Fabbrica & Tag PLC Rilevati ({activeTenant.plantTopology?.macchinari.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTenant.plantTopology?.macchinari.map(mac => (
                <div
                  key={mac.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 truncate">{mac.nome}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {mac.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Reparto: <span className="text-slate-300">{mac.reparto}</span>
                  </div>

                  <div className="text-[10px] text-amber-300/90 flex items-center gap-1">
                    <span>PLC Tag:</span> <code className="bg-slate-900 px-1 py-0.5 rounded">{mac.plcTag}</code>
                  </div>

                  {mac.telemetria && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                      {Object.entries(mac.telemetria).map(([k, v]) => (
                        <span key={k} className="bg-slate-900/80 px-1.5 py-0.5 rounded text-cyan-300">
                          {k}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: AGV / LGV Fleet */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Flotta Veicoli a Guida Laser LGV / AGV E80 ({activeTenant.plantTopology?.flottaAgv.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {activeTenant.plantTopology?.flottaAgv.map(agv => (
                <div
                  key={agv.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{agv.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      agv.stato === 'MISSIONE'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : agv.stato === 'IN_CARICA'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {agv.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">{agv.modello}</div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Batteria SoC:</span>
                    <span className={`font-bold ${agv.batteriaSoC > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {agv.batteriaSoC}% ({agv.temperatura}°C)
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate">
                    Pos: <span className="text-slate-300">{agv.posizione}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Loading / Unloading Bays */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Baie di Carico e Scarico Inbound / Outbound ({activeTenant.plantTopology?.baie.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {activeTenant.plantTopology?.baie.map(baia => (
                <div
                  key={baia.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{baia.nome}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      baia.stato === 'LIBERA'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : baia.stato === 'OCCUPATA'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {baia.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Tipo: <span className="text-cyan-300 font-bold">{baia.tipo}</span>
                  </div>

                  {baia.camionAssegnato && (
                    <div className="text-[10px] text-amber-300/90 truncate">
                      Veicolo: {baia.camionAssegnato}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIONE OPERATORI & PERSONALE */}
      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Manual Operator Form (optional addition) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Aggiungi Singolo Operatore Manuale
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Gli account operatore per gli stabilimenti vengono normalmente generati in automatico durante l'Auto-Discovery. Qui puoi crearne di addizionali se necessario.
              </p>
            </div>

            {newOpSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{newOpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateManualOperator} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Stabilimento Assegnato *
                </label>
                <select
                  value={newOpTenantId}
                  onChange={e => setNewOpTenantId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Nome e Cognome Operatore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mario Rossi, Laura Bianchi..."
                  value={newOpNomeCompleto}
                  onChange={e => setNewOpNomeCompleto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Username di Accesso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. op_rossi, op_ferrero_3..."
                  value={newOpUsername}
                  onChange={e => setNewOpUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  Password Assegnata *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password di login..."
                  value={newOpPassword}
                  onChange={e => setNewOpPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Linea di Produzione Assegnata
                </label>
                <input
                  type="text"
                  value={newOpLinea}
                  onChange={e => setNewOpLinea(e.target.value)}
                  placeholder="Es. Linea 1 - Inbound, Linea 3 - Bema Silkworm..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva Operatore</span>
              </button>
            </form>
          </div>

          {/* Right: Existing Operators List with Tenant Badges */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Personale & Operatori Abilitati ({filteredOperators.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Accesso ristretto e vincolato rigorosamente al rispettivo stabilimento.
                </p>
              </div>

              {/* Filter by Tenant */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Filtra:</span>
                <select
                  value={operatorFilterTenant}
                  onChange={e => setOperatorFilterTenant(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="all">Tutti gli Stabilimenti</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredOperators.map((op, opIdx) => {
                const assignedTenant = tenants.find(t => t.id === op.tenantId);
                return (
                  <div
                    key={`${op.id || 'op'}-${opIdx}`}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      op.attivo
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-950/30 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-100">
                          {op.nomeCompleto}
                        </span>
                        {assignedTenant && (
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: `${assignedTenant.logoColor || '#3b82f6'}33`, border: `1px solid ${assignedTenant.logoColor || '#3b82f6'}88` }}
                          >
                            {assignedTenant.nome.split('(')[0].trim()}
                          </span>
                        )}
                        {!op.attivo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            DISABILITATO
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Linea: <span className="text-slate-300">{op.lineaAssegnata}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-3">
                        <span>Username: <code className="text-cyan-400">{op.username}</code></span>
                        <span>Password: <code className="text-amber-400">{op.password}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleCopyText(`${op.username} / ${op.password}`, op.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copia credenziali"
                      >
                        {copiedKey === op.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleToggleUserActive(op.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          op.attivo
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {op.attivo ? 'Sospendi' : 'Riattiva'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(op.id, op.username)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Rimuovi account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SICUREZZA mTLS & CARICAMENTO BUNDLE .PFX (PKCS#12) */}
      {activeTab === 'mtls' && (
        <div className="space-y-6 animate-in fade-in duration-200 font-mono">
          {/* Card di Stato Attuale */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${mtlsStatus?.configured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Infrastruttura di Sicurezza mTLS (Mutual TLS 1.3 - Direttiva NIS2)
                    <span className={`px-2.5 py-0.5 text-xs rounded-full border ${mtlsStatus?.configured ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                      {mtlsStatus?.configured ? 'ATTIVO & SICURO' : 'NON CONFIGURATO'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Canale crittografato per far comunicare il tuo PC locale / Gateway SM.I.LE80 con i server Google Cloud.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetch('/api/mtls/status')
                      .then(async r => {
                        const contentType = r.headers.get('content-type') || '';
                        if (r.ok && contentType.includes('application/json')) {
                          return await r.json();
                        }
                        return null;
                      })
                      .then(d => {
                        if (d) setMtlsStatus(d);
                      })
                      .catch(() => {});
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Verifica Stato</span>
                </button>
              </div>
            </div>

            {/* Griglia Diagnostica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Root CA Industriale (/certs/):</div>
                <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ca_radice.crt Presente
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Bundle .PFX / Chiave Privata:</div>
                <div className={`font-bold mt-1 flex items-center gap-1.5 ${mtlsStatus?.pfxPresent || mtlsStatus?.privateKeyPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {mtlsStatus?.pfxPresent || mtlsStatus?.privateKeyPresent ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> 
                      <span>{mtlsStatus?.loadedCertName || 'Certificato & Chiave Attivi'}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" /> In attesa di caricamento
                    </>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Versione Protocollo TLS:</div>
                <div className="text-white font-bold mt-1">
                  TLSv1.3 Strict (RFC 8446)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Curva Crittografica:</div>
                <div className="text-white font-bold mt-1">
                  ECDSA prime256v1 (P-256)
                </div>
              </div>
            </div>
          </div>

          {/* Form di Caricamento File .PFX */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  Carica File .PFX (PKCS#12) dal tuo Computer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Seleziona il file .pfx che hai sul Desktop ed inserisci la password di protezione stabilita in OpenSSL.
                </p>
              </div>

              {pfxUploadFeedback && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                  pfxUploadFeedback.success 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                }`}>
                  {pfxUploadFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold">{pfxUploadFeedback.message}</div>
                    {pfxUploadFeedback.fingerprint && (
                      <div className="text-[11px] text-slate-300 font-mono">
                        Impronta SHA-256 Bundle: <span className="text-cyan-300">{pfxUploadFeedback.fingerprint}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleUploadPfx} className="space-y-4 text-xs">
                {/* 1. Selezione File .PFX */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    1. File Certificato Unificato (.pfx o .p12) *
                  </label>
                  
                  <div className="p-4 rounded-xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-cyan-500/60 transition-colors text-center">
                    <input
                      type="file"
                      id="pfx-file-input"
                      accept=".pfx,.p12"
                      onChange={e => {
                        const f = e.target.files?.[0] || null;
                        setPfxFile(f);
                        setPfxUploadFeedback(null);
                      }}
                      className="hidden"
                    />
                    <label 
                      htmlFor="pfx-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <UploadCloud className="w-7 h-7 text-cyan-400" />
                      <div className="text-slate-300 font-bold">
                        {pfxFile ? pfxFile.name : 'Clicca per selezionare il file .pfx dal tuo Desktop'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {pfxFile ? `${(pfxFile.size / 1024).toFixed(1)} KB pronto per la validazione` : 'Supporta file binari PKCS#12 (.pfx / .p12)'}
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Password del PFX */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-400" />
                    2. Password di Protezione del File .PFX *
                  </label>
                  <div className="relative">
                    <input
                      type={showPfxPassword ? 'text' : 'password'}
                      required
                      placeholder="Inserisci la password definita durante l'export OpenSSL..."
                      value={pfxPassword}
                      onChange={e => setPfxPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPfxPassword(!showPfxPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPfxPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Questa password viene utilizzata dal server Google esclusivamente per sbloccare la chiave in memoria e stabilire l'handshake mTLS.
                  </p>
                </div>

                {/* 3. Pulsante di Sblocco e Installazione */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!pfxFile || isUploadingPfx}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-cyan-600 hover:from-amber-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    {isUploadingPfx ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Decifratura e verifica in corso sui server Google...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verifica Password & Installa Bundle sul Server</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Pannello Informativo & Guida ai Percorsi */}
            <div className="lg:col-span-5 space-y-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  Mappa Percorsi sul Server Google Cloud
                </h4>
                <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
                  <p>
                    Quando carichi il file dal form qui a fianco, il server effettua automaticamente:
                  </p>
                  <ul className="space-y-1.5 pl-2 list-disc list-inside text-slate-400">
                    <li><strong className="text-slate-200">Verifica decifratura:</strong> convalida che la password corrisponda al blocco PKCS#12.</li>
                    <li><strong className="text-slate-200">Archiviazione protetta:</strong> salva il file in <code className="text-amber-300">/certs/client_active.pfx</code> con permessi POSIX <code className="text-cyan-300">0600</code>.</li>
                    <li><strong className="text-slate-200">Inizializzazione TLS 1.3:</strong> configura l'agente di rete HTTPS in <code className="text-slate-200">server/mtlsClient.ts</code> per la connessione al tuo IP locale.</li>
                  </ul>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  Alternativa da Riga di Comando (OpenSSL PEM)
                </h4>
                <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                  <p>
                    Se preferisci estrarre manualmente i file in formato testo PEM dal tuo terminale:
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 overflow-x-auto select-all">
                    # 1. Estrai il certificato pubblico:<br />
                    openssl pkcs12 -in certificato.pfx -clcerts -nokeys -out programma_google.crt<br /><br />
                    # 2. Estrai la chiave privata decifrata:<br />
                    openssl pkcs12 -in certificato.pfx -nocerts -nodes -out chiave_privata.key
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    Puoi incollare il contenuto di <code className="text-slate-300">chiave_privata.key</code> direttamente nella variabile segreta <code className="text-amber-300">MTLS_PRIVATE_KEY</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SEZIONE COLLAUDO: RICEVITORE E SIMULATORE TELEMETRIA SM.I.LE80 (E80 GROUP) */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Ricevitore Live Telemetria Macchinario E80 (SM.I.LE80)
                    <span className="px-2.5 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      IN ASCOLTO SU /api/telemetry/push
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Invia dati dal tuo computer locale verso questo server: l'applicazione li elabora e li proietta a schermo in tempo reale.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Pacchetti Ricevuti: <strong className="text-cyan-400">{telemetryHistory.length}</strong>
                </div>
              </div>
            </div>

            {simTelemetrySuccess && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <span>{simTelemetrySuccess}</span>
                <button
                  type="button"
                  onClick={() => setSimTelemetrySuccess(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs ml-2 cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            )}

            {/* Banner Spiegazione Cookie Check & Soluzione Immediata */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs font-mono space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Perché compare l'errore "Cookie check - Action required to load your app" dal terminale del PC?</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                L'applicazione è protetta dal proxy di sicurezza perimetrale di <strong>Google Cloud (Identity-Aware Proxy)</strong>. 
                Quando lanci un comando <code className="text-amber-300">curl</code> o <code className="text-amber-300">PowerShell</code> anonimo dal prompt del tuo PC, la richiesta non contiene i cookie di autenticazione Google del browser e viene intercettata dal firewall prima ancora di raggiungere il server di JOKER 80.
              </p>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/20 text-[11px] space-y-1 text-slate-300">
                <strong className="text-emerald-400 block mb-1">💡 2 Modi Immediati per Trasmettere Dati dal tuo Computer:</strong>
                <div>
                  <strong>Modo A (Dal prompt comandi del tuo PC):</strong> Nel browser premi <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">F12</kbd> &rarr; vai su <strong>Rete (Network)</strong> &rarr; clicca il pulsante <em>"Bema Silkworm"</em> qui sotto &rarr; fai tasto destro sulla riga <code className="text-cyan-300">push</code> &rarr; <em>Copia</em> &rarr; <strong>Copia come cURL (bash o PowerShell)</strong>. Incollalo nel terminale del tuo PC: conterrà il cookie di sessione autorizzato e passerà all'istante con HTTP 200 verde!
                </div>
                <div className="mt-1">
                  <strong>Modo B (Simulatore Streaming Marcia Verde / Editor JSON):</strong> Usa i controlli qui sotto nel browser (già autenticato): puoi avviare lo streaming continuo automatico della macchina in marcia verde o incollare il tuo file JSON personalizzato!
                </div>
              </div>
            </div>

            {/* Simulatore Streaming Continuo Marcia Verde */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Simulatore PLC Smile 80 in Marcia Verde Continua
                  </span>
                  {isStreamingActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      STREAMING ATTIVO (Ciclo #{streamingCycle})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Simula la trasmissione ciclica in tempo reale del PLC BEMA Silkworm e delle navette LGV al server mTLS (1 pacchetto ogni 2.2s).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStreamingActive(!isStreamingActive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 ${
                  isStreamingActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                }`}
              >
                {isStreamingActive ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Ferma Streaming Marcia Verde</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Avvia Streaming Marcia Verde (PLC Live)</span>
                  </>
                )}
              </button>
            </div>

            {/* Griglia Opzioni di Invio Dati */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Colonna Sinistra: Editor JSON Personalizzato */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Inietta Telemetria JSON Personalizzata
                  </span>
                  <button
                    type="button"
                    disabled={isSendingCustom}
                    onClick={handleSendCustomPayload}
                    className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingCustom ? 'Invio in corso...' : 'Invia Dati nel Tunnel'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Modifica i parametri o incolla il payload JSON della tua macchina locale:
                </p>

                <textarea
                  value={customJsonPayload}
                  onChange={(e) => setCustomJsonPayload(e.target.value)}
                  rows={9}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Colonna Destra: Iniezione Rapida 1-Click e Copia Comando */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Preset Immediati 1-Click (Simulazione Singolo Pacchetto)
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Spara un singolo pacchetto per testare l'elaborazione del server e l'aggiornamento del log:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isSendingSimTelemetry}
                    onClick={() => handleSendSimulatedPacket('bema')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-cyan-300 group-hover:text-cyan-200">
                      Bema Silkworm
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      34.2 RPM • 82 p/h • Marcia Verde
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingSimTelemetry}
                    onClick={() => handleSendSimulatedPacket('lgv')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-purple-300 group-hover:text-purple-200">
                      Flotta LGV & Baia
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      LGV-02 • 1.65 m/s • Baia 2
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSendingSimTelemetry}
                    onClick={() => handleSendSimulatedPacket('allarme')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rose-500/30 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-[11px] font-bold text-rose-300 group-hover:text-rose-200">
                      Allarme Critico
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Rottura Film • 68.4°C
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span>Comando cURL per Terminale Locale:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const curlCmd = `curl -X POST "${window.location.origin}/api/telemetry/push" -H "Content-Type: application/json" -d "{\\"macchinarioId\\":\\"bema-silkworm-01\\",\\"nome\\":\\"Fasciatore Robotico BEMA Silkworm\\",\\"tipo\\":\\"BEMA_FASCIATORE\\",\\"stato\\":\\"IN_MARCIA\\",\\"parametri\\":{\\"velocitaRotazioneRpm\\":34.2,\\"temperaturaInverterC\\":51.6,\\"palletOra\\":82},\\"lgv\\":{\\"id\\":\\"LGV-04\\",\\"batteriaSoC\\":88,\\"velocitaMs\\":1.75}}"`;
                        navigator.clipboard.writeText(curlCmd);
                        setCopiedCurl(true);
                        setTimeout(() => setCopiedCurl(false), 2000);
                      }}
                      className="text-cyan-300 hover:text-cyan-200 font-mono text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCurl ? 'Copiato!' : 'Copia'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 overflow-x-auto whitespace-nowrap">
                    curl -X POST "{typeof window !== 'undefined' ? window.location.origin : ''}/api/telemetry/push" ...
                  </div>
                  <p className="text-[10px] text-amber-400/90">
                    * Ricorda: dal prompt del PC aggiungi l'header del cookie copiato da DevTools (F12) per superare il check perimetrale di Google.
                  </p>
                </div>
              </div>
            </div>

            {/* Kit Script M2M per PC Industriale di Stabilimento */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Kit Automazione M2M per PC / IPC di Fabbrica (Headless / Senza Browser)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Script pronti all'uso per inviare ciclicamente la telemetria PLC da nodi non presidiati (Beckhoff, Siemens, Ubuntu OT, Windows IPC).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/smile80_daemon.py"
                    download="smile80_daemon.py"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica smile80_daemon.py</span>
                  </a>
                  <a
                    href="/send_telemetry_m2m.sh"
                    download="send_telemetry_m2m.sh"
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica send_telemetry_m2m.sh</span>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">Chiave Gateway M2M</span>
                  <code className="text-cyan-300 text-xs break-all">X-Industrial-Gateway-Key: JOKER80-NIS2-PEDRIGNANO-GW-2026</code>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">Modalità Produzione mTLS (Opzione 2)</span>
                  <code className="text-emerald-300 text-xs">--cert-type P12 --cert client.pfx:PASS</code>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] block">Collaudo Cloud (Opzione 1)</span>
                  <code className="text-amber-300 text-xs">Authorization: Bearer $(gcloud auth token)</code>
                </div>
              </div>
            </div>

            {/* Tabella Live dei Pacchetti Ricevuti */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
                <span>Feed Live degli Ultimi Pacchetti Ricevuti ({telemetryHistory.length})</span>
                <span className="text-[10px] text-slate-500 font-mono">Aggiornamento automatico ogni 2.5s</span>
              </div>

              {telemetryHistory.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
                  <div className="text-xs font-bold text-slate-300 font-mono">Nessun pacchetto ancora ricevuto</div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Lancia il comando cURL dal tuo computer o clicca su uno dei tre pulsanti sopra per inviare il primo test.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {telemetryHistory.map((pkt, pIdx) => {
                    const isAlarm = pkt.stato === 'ALLARME' || pkt.parametri?.allarmeAttivo;
                    return (
                      <div
                        key={`${pkt.id}-${pIdx}`}
                        className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                          isAlarm
                            ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                            <strong className="text-white">{pkt.nomeMacchinario || 'Macchinario E80'}</strong>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAlarm ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {pkt.stato || 'ONLINE'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>Sorgente IP: <code className="text-cyan-400">{pkt.clientIp}</code></span>
                            <span>•</span>
                            <span>{new Date(pkt.receivedAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          {pkt.parametri?.velocitaRotazioneRpm !== undefined && (
                            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                              <span className="text-slate-500 text-[10px] block">Velocità Rpm:</span>
                              <strong className="text-cyan-300">{pkt.parametri.velocitaRotazioneRpm} RPM</strong>
                            </div>
                          )}

                          {pkt.parametri?.temperaturaInverterC !== undefined && (
                            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                              <span className="text-slate-500 text-[10px] block">Temp. Inverter:</span>
                              <strong className={pkt.parametri.temperaturaInverterC > 60 ? 'text-rose-400' : 'text-emerald-300'}>
                                {pkt.parametri.temperaturaInverterC} °C
                              </strong>
                            </div>
                          )}

                          {pkt.parametri?.palletOra !== undefined && (
                            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                              <span className="text-slate-500 text-[10px] block">Produzione:</span>
                              <strong className="text-amber-300">{pkt.parametri.palletOra} pallet/h</strong>
                            </div>
                          )}

                          {pkt.lgv && (
                            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                              <span className="text-slate-500 text-[10px] block">Navetta {pkt.lgv.id}:</span>
                              <strong className="text-purple-300">{pkt.lgv.batteriaSoC}% SoC ({pkt.lgv.velocitaMs || 0} m/s)</strong>
                            </div>
                          )}
                        </div>

                        {pkt.parametri?.allarmeAttivo && (
                          <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Allarme Rilevato: <strong>{pkt.parametri.allarmeAttivo}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
