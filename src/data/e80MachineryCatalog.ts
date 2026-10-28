import { MachineAsset, PlantNodeType } from '../types/quantum';

export interface E80MachineryDefinition {
  tipo: string;
  label: string;
  category: string;
  defaultNome: string;
  defaultReparto: string;
  defaultPlcTag: string;
  associatedNodeKey: PlantNodeType;
  descrizione: string;
  defaultTelemetria: Record<string, any>;
}

export const E80_MACHINERY_CATALOG: E80MachineryDefinition[] = [
  // =========================================================================
  // 1. FASCIATORI & PACKAGING SECONDARIO (BEMA / E80 GROUP)
  // =========================================================================
  {
    tipo: 'BEMA_FASCIATORE',
    label: 'Bema Silkworm - Fasciatore Robotico a Braccio Rotante (Standard)',
    category: 'Fasciatori & Packaging Fine Linea (Bema / E80)',
    defaultNome: 'Fasciatore Robotico Bema Silkworm',
    defaultReparto: 'Fine Linea Confezionamento (ECS)',
    defaultPlcTag: 'DB104.BEMA_SILKWORM_TENSIONE',
    associatedNodeKey: 'BEMA_FASCIATORE',
    descrizione: 'Fasciatore industriale a braccio rotante brevettato con bobina film da 1000 mm, prestiro elettronico fino al 300% e controllo torsione carichi.',
    defaultTelemetria: {
      velocitaRotazioneRpm: 34.5,
      tensioneFilmPreStiroPct: 295,
      temperaturaInverterC: 51.8,
      palletOra: 85,
      vibrazioneCuscinettiG: 0.36,
      pressioneAriaBar: 6.2
    }
  },
  {
    tipo: 'BEMA_SILKWORM_DOUBLE',
    label: 'Bema Silkworm Double Head - Fasciatore ad Alta Cadenza (160 pal/h)',
    category: 'Fasciatori & Packaging Fine Linea (Bema / E80)',
    defaultNome: 'Fasciatore Bema Silkworm Double Head',
    defaultReparto: 'Fine Linea Confezionamento (ECS)',
    defaultPlcTag: 'DB105.BEMA_DOUBLE_HEAD_STATUS',
    associatedNodeKey: 'BEMA_FASCIATORE',
    descrizione: 'Versione bi-testa ad altissima capacità di avvolgimento continuo con sdoppiamento bobine per linee beverage & food ad alta velocità.',
    defaultTelemetria: {
      velocitaRotazioneRpm: 46.2,
      tensioneFilmPreStiroPct: 310,
      temperaturaInverterC: 54.1,
      palletOra: 154,
      vibrazioneCuscinettiG: 0.41,
      pressioneAriaBar: 6.4
    }
  },
  {
    tipo: 'BEMA_BOXMOVE',
    label: 'Bema BoxMove - Sistema Robotico di Confezionamento Scatole',
    category: 'Fasciatori & Packaging Fine Linea (Bema / E80)',
    defaultNome: 'Sistema di Confezionamento Bema BoxMove',
    defaultReparto: 'Imballaggio Secondario & Cartoni',
    defaultPlcTag: 'DB108.BOXMOVE_FEED_SPEED',
    associatedNodeKey: 'BEMA_FASCIATORE',
    descrizione: 'Modulo specializzato nella formatura, legatura e incartonamento compatto di scatole e cluster fardellati.',
    defaultTelemetria: {
      cadenzaScatoleMinuto: 68,
      temperaturaIncollatoreC: 172.5,
      pressioneVuotoKpa: -84.2,
      integritaCartonePct: 99.8
    }
  },
  {
    tipo: 'CAPPUCCIATRICE_STRETCH_HOOD',
    label: 'Incappucciatrice Stretch Hood E80 (Tenuta Stagna & Cappuccio Tubolare)',
    category: 'Fasciatori & Packaging Fine Linea (Bema / E80)',
    defaultNome: 'Incappucciatrice Elastica Stretch Hood E80',
    defaultReparto: 'Fine Linea Confezionamento Impermeabile',
    defaultPlcTag: 'DB112.HOOD_STRETCH_RATIO',
    associatedNodeKey: 'BEMA_FASCIATORE',
    descrizione: 'Calzatura film tubolare estensibile su bancale per protezione totale impermeabile da intemperie e stabilità per trasporti pesanti.',
    defaultTelemetria: {
      tensioneTrazioneNewton: 185.0,
      temperaturaSaldaturaC: 145.0,
      cicliOra: 92,
      spessoreFilmMicron: 80
    }
  },

  // =========================================================================
  // 2. PALLETTIZZAZIONE & DEPALETTIZZAZIONE ROBOTIZZATA (E80 GROUP)
  // =========================================================================
  {
    tipo: 'ISOLA_ROBOT',
    label: 'Isola Robotica di Pallettizzazione Antropomorfa (Robot 4/6 Assi)',
    category: 'Pallettizzazione & Packaging Robotico (E80)',
    defaultNome: 'Isola Robotica Pallettizzazione Antropomorfa',
    defaultReparto: 'Pallettizzazione & Packaging Secondario',
    defaultPlcTag: 'DB120.ROBOT_PALLET_READY',
    associatedNodeKey: 'ISOLA_ROBOT',
    descrizione: 'Cella con braccio robotico antropomorfo Fanuc/Kuka equipaggiato con testa di presa multi-presa E80 a depressione / pinze pneumatiche.',
    defaultTelemetria: {
      cadenzaColliOra: 1850,
      pressioneVuotoBar: -0.85,
      precisionePosizionamentoMm: 0.8,
      cicliRoboticoMinuto: 18.2,
      temperaturaGiuntiC: 44.5
    }
  },
  {
    tipo: 'PALLETTIZZATORE_STRATO',
    label: 'Pallettizzatore a Spinta e a Strati Continuo (Alta Velocità)',
    category: 'Pallettizzazione & Packaging Robotico (E80)',
    defaultNome: 'Pallettizzatore Meccanico a Strati ad Alta Velocità',
    defaultReparto: 'Pallettizzazione Fardelli & Casse',
    defaultPlcTag: 'DB125.LAYER_PALLETIZER_POS',
    associatedNodeKey: 'ISOLA_ROBOT',
    descrizione: 'Macchina di pallettizzazione per linee ad altissima produttività con tavola formatrice dello strato e serrande a scorrimento orizzontale.',
    defaultTelemetria: {
      stratiOra: 210,
      palletOraCompletati: 78,
      pressioneTavolaSpintaBar: 5.8,
      temperaturaGuideC: 38.2
    }
  },
  {
    tipo: 'ROBOT_DEPALETTIZZATORE',
    label: 'Isola di Depallettizzazione Automatica (Scarico Pallet Inbound)',
    category: 'Pallettizzazione & Packaging Robotico (E80)',
    defaultNome: 'Isola Robotica di Depallettizzazione Automatica',
    defaultReparto: 'Alimentazione Linea & Ricevimento Materie',
    defaultPlcTag: 'DB130.DEPALLETIZER_CYCLE_ACTIVE',
    associatedNodeKey: 'ISOLA_ROBOT',
    descrizione: 'Disassortimento automatico di pallet di materie prime, flaconi vuoti, lattine o sacchi con rimozione automatica interfalde.',
    defaultTelemetria: {
      stratiScaricatiOra: 165,
      livelloVuotoKpa: -88.0,
      presenzaInterfaldaSensore: true,
      scartiRiconosciuti: 0
    }
  },
  {
    tipo: 'APPLICATORE_INTERFALDE',
    label: 'Robot Applicatore Interfalde & Fogli Antiscivolo E80',
    category: 'Pallettizzazione & Packaging Robotico (E80)',
    defaultNome: 'Robot Posizionatore Interfalde tra i Piani',
    defaultReparto: 'Pallettizzazione & Packaging Secondario',
    defaultPlcTag: 'DB135.SLIP_SHEET_VACUUM',
    associatedNodeKey: 'ISOLA_ROBOT',
    descrizione: 'Modulo robotico integrato per il prelievo da polmone e la stesura calibrata di fogli in cartone o plastica tra i piani del pallet.',
    defaultTelemetria: {
      scortaFogliPolmone: 240,
      tempoCicloStesuraSec: 2.8,
      vuotoVentoseBar: -0.82
    }
  },

  // =========================================================================
  // 3. ISPEZIONE & CONTROLLO QUALITÀ PALLET (BEMA / E80 GROUP)
  // =========================================================================
  {
    tipo: 'WOODPECKER',
    label: 'Bema Woodpecker - Controllo Conformità & Integrità Pallet Vuoti',
    category: 'Ispezione & Controllo Qualità Pallet (E80)',
    defaultNome: 'Stazione Ispezione Pallet Bema Woodpecker',
    defaultReparto: 'Controllo Qualità & Ingresso Bancali',
    defaultPlcTag: 'DB80.WOODPECKER_INTEGRITY_OK',
    associatedNodeKey: 'WOODPECKER',
    descrizione: 'Sistema di collaudo non distruttivo per pallet in legno: tasta pioli, assi rotte, chiodi sporgenti e flessione pattini prima dell’invio alle linee.',
    defaultTelemetria: {
      palletIspezionatiOra: 220,
      percentualeConformita: 98.4,
      difettiChiodiRilevati: 2,
      flessioneMediaMm: 1.2
    }
  },
  {
    tipo: 'SAGOMA_CHECK',
    label: 'Stazione Sagoma Check 3D & Pesa Pallet Integrata',
    category: 'Ispezione & Controllo Qualità Pallet (E80)',
    defaultNome: 'Stazione Sagoma Check 3D e Pesa a Ponte Pallet',
    defaultReparto: 'Verifica Spedizioni & Banchine',
    defaultPlcTag: 'DB85.SAGOMA_PROFILE_3D_OK',
    associatedNodeKey: 'WOODPECKER',
    descrizione: 'Portali laser e barriere ottiche per verifica 3D delle tolleranze di ingombro e celle di carico per pesatura certificata.',
    defaultTelemetria: {
      pesoLordoKg: 842.5,
      scostamentoSagomaMm: 3.4,
      conformitaSagomaPct: 99.9,
      altezzaRilevataMm: 1850
    }
  },
  {
    tipo: 'COLOR_CHECK_VISION',
    label: 'Sistema Visione Artificiale E80 ColorCheck & OCR Barcode',
    category: 'Ispezione & Controllo Qualità Pallet (E80)',
    defaultNome: 'Sistema di Visione Industriale ColorCheck E80',
    defaultReparto: 'Controllo Qualità Lotti & Confezionamento',
    defaultPlcTag: 'DB90.COLORCHECK_CAMERA_MATCH',
    associatedNodeKey: 'WOODPECKER',
    descrizione: 'Telecamere ad alta risoluzione con illuminatori polarizzati per controllo integrità etichette, match colori e lettura OCR matricole.',
    defaultTelemetria: {
      tempoAnalisiImmagineMs: 42,
      affidabilitaMatchingPct: 99.98,
      codiciBarcodeLettiOra: 4200
    }
  },

  // =========================================================================
  // 4. ETICHETTATURA ROBOTICA & TRACCIABILITÀ (BEMA / E80 GROUP)
  // =========================================================================
  {
    tipo: 'RAPTOR',
    label: 'Bema Raptor - Etichettatrice Robotizzata Pallet GS1-128 / SSCC',
    category: 'Etichettatura Robotica & Tracciabilità (E80)',
    defaultNome: 'Etichettatrice Robotica Bema Raptor',
    defaultReparto: 'Identificazione Finale & Tracciabilità WMS',
    defaultPlcTag: 'DB140.RAPTOR_LABEL_APPLIED',
    associatedNodeKey: 'RAPTOR',
    descrizione: 'Applicazione robotizzata su 1, 2, 3 o 4 lati del pallet con testina a trasferimento termico e validazione automatica scanner barcode prima del rilascio.',
    defaultTelemetria: {
      etichetteApplicateOra: 180,
      letturaBarcodeGrade: 'A (ISO/IEC 15416)',
      temperaturaTestinaC: 58.0,
      metriNastroResiduo: 340
    }
  },
  {
    tipo: 'RAPTOR_DUAL_APPLICATOR',
    label: 'Bema Raptor Dual Applicator - No-Stop con Sdoppiamento Bobina',
    category: 'Etichettatura Robotica & Tracciabilità (E80)',
    defaultNome: 'Etichettatrice Robotica Bema Raptor Dual No-Stop',
    defaultReparto: 'Identificazione Finale & Tracciabilità WMS',
    defaultPlcTag: 'DB142.RAPTOR_DUAL_REDUNDANT_OK',
    associatedNodeKey: 'RAPTOR',
    descrizione: 'Doppia testina ad azionamento alternato per cambio bobina automatico senza fermo linea per impianti a ciclo continuo 24/7.',
    defaultTelemetria: {
      bobinaAttiva: 'A',
      tempoMedioApplicazioneSec: 3.2,
      scansioniConfermatePct: 100.0
    }
  },

  // =========================================================================
  // 5. VEICOLI A GUIDA LASER (LASER GUIDED VEHICLES - LGV / AGV E80)
  // =========================================================================
  {
    tipo: 'FLOTTA_LGV',
    label: 'Flotta Navette LGV/AGV Elettric80 (Controller Centrale Flotta)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Supervisore Flotta Navette a Guida Laser LGV',
    defaultReparto: 'Logistica di Fabbrica & Movimentazione',
    defaultPlcTag: 'DB250.LGV_FLEET_CONTROLLER',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Hub di coordinamento del software SM.I.LE80 per la gestione di routing anticollisione, dispacciamento missioni e bilanciamento batterie.',
    defaultTelemetria: {
      veicoliInServizio: 12,
      missioniOraCompletate: 148,
      socMedioFlottaPct: 87.4,
      trafficoIncrociRitardoMedioSec: 1.2
    }
  },
  {
    tipo: 'LGV_COUNTERBALANCED_CB',
    label: 'Navetta LGV Contrappesata E80 CB / CB60 (Forche a Sbalzo)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV Contrappesata E80 CB60',
    defaultReparto: 'Corsie di Fabbrica & Baie di Carico',
    defaultPlcTag: 'DB160.LGV_CB60_POSITION_XY',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'La navetta più versatile di Elettric80: forche a sbalzo per prelievo pallet a terra, rulliere di fine linea e scarico rimorchi.',
    defaultTelemetria: {
      velocitaMs: 1.85,
      batteriaSoCPct: 89,
      caricoPresenteKg: 950,
      corsiaAttuale: 'L-04',
      temperaturaBmsC: 28.5
    }
  },
  {
    tipo: 'LGV_REACH_TRUCK',
    label: 'Navetta LGV Retrattile (Reach Truck E80 - Fino a 14 Metri)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV Retrattile High-Bay Reach Truck',
    defaultReparto: 'Magazzino Scaffalature Verticali (High Bay)',
    defaultPlcTag: 'DB165.LGV_REACH_MAST_ELEVATION',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Montante retrattile per stoccaggio e prelievo pallet in scaffalature drive-in e selettive ad altezze fino a 14 metri con sensori laser di sicurezza.',
    defaultTelemetria: {
      altezzaSollevamentoMm: 11200,
      stabilitaInclinazioneGradi: 0.1,
      batteriaSoCPct: 82,
      tempoInforcaturaSec: 8.5
    }
  },
  {
    tipo: 'LGV_VNA_VERY_NARROW',
    label: 'Navetta LGV per Corsie Strette VNA (Very Narrow Aisle)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV per Corsie Strette E80 VNA',
    defaultReparto: 'Magazzino Intensivo ad Alta Densità',
    defaultPlcTag: 'DB170.LGV_VNA_CORRIDOIO_STATUS',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Veicolo a torretta girevole tri-laterale per corsie millimetriche (<1.6m), massimizzando la densità di stoccaggio dello stabilimento.',
    defaultTelemetria: {
      rotazioneForcheGradi: 90.0,
      corsiaMillimetricaId: 'C-12',
      batteriaSoCPct: 91,
      velocitaTraslazioneMs: 2.1
    }
  },
  {
    tipo: 'LGV_DOUBLE_FORKS',
    label: 'Navetta LGV a Forche Doppie / Quadruple (2 o 4 Pallet Simultanei)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV Multi-Forche E80 Quad-Load',
    defaultReparto: 'Dorsale Principale di Trasporto Fabbrica-Magazzino',
    defaultPlcTag: 'DB175.LGV_MULTI_FORK_LOAD_STATUS',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Forche telescopiche doppie o quadruple per movimentare 2 o 4 pallet affiancati per ciclo, quadruplicando la portata oraria sui lunghi percorsi.',
    defaultTelemetria: {
      palletCaricatiCount: 4,
      pesoTotaleTrasportatoKg: 3450,
      velocitaCrocieraMs: 2.2,
      batteriaSoCPct: 78
    }
  },
  {
    tipo: 'LGV_CLAMP_ROBOT',
    label: 'Navetta LGV con Pinza Idraulica per Bobine (Paper & Tissue)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV con Pinza Rotante per Bobine Carta',
    defaultReparto: 'Magazzino Bobine & Converting Tissue',
    defaultPlcTag: 'DB180.LGV_CLAMP_PRESSURE_BAR',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Pinza rotante idraulica a pressione controllata per prelievo, ribaltamento e stoccaggio piramidale di bobine giganti senza bancale.',
    defaultTelemetria: {
      diametroBobinaMm: 2200,
      pressioneSerraggioBar: 145.0,
      angolaturaRotazioneGradi: 0.0,
      pesoBobinaKg: 2850
    }
  },
  {
    tipo: 'LGV_CONVEYOR_DECK',
    label: 'Navetta LGV con Rulliera / Nastro Motorizzato a Bordo',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Navetta LGV Shuttle con Rulliera Motorizzata a Bordo',
    defaultReparto: 'Interscambio Rapido Linea Pallet',
    defaultPlcTag: 'DB185.LGV_CONVEYOR_INTERLOCK',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Piano a rulli o catene motorizzato su ponte mobile per interscambio dinamico al volo con le rulliere fisse di stabilimento a tempo record (<10 sec).',
    defaultTelemetria: {
      tempoTrasferimentoPalletSec: 6.8,
      interbloccoOtticoAllineato: true,
      batteriaSoCPct: 85
    }
  },
  {
    tipo: 'AMR_SMART_TROLLEY',
    label: 'Autonomous Mobile Robot E80 AMR / Smart Trolley (Kitting & Ricambi)',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Robot Mobile Autonomo E80 AMR Smart Trolley',
    defaultReparto: 'Asservimento Linee & Logistica Ricambi',
    defaultPlcTag: 'DB190.AMR_LIDAR_NAVIGATION',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Navetta compatta SLAM / LiDAR per trasporto carrelli, materie sussidiarie, packaging leggero e rifornimento kitting operatore.',
    defaultTelemetria: {
      navigazioneSlamQuality: 99.4,
      ostacoliElusiOggi: 47,
      batteriaSoCPct: 94
    }
  },
  {
    tipo: 'STAZIONE_FAST_CHARGE',
    label: 'Stazione di Ricarica Induttiva Rapida Flash-Charge LGV E80',
    category: 'Veicoli a Guida Laser (LGV / AGV / AMR E80)',
    defaultNome: 'Stazione di Ricarica Rapida a Induzione LGV',
    defaultReparto: 'Punti di Ricarica Batteria Flotta (Opportunity Charging)',
    defaultPlcTag: 'DB195.FAST_CHARGE_KW_OUTPUT',
    associatedNodeKey: 'FLOTTA_LGV',
    descrizione: 'Piastra a pavimento a induzione magnetica o contatti ultra-rapidi per ricarica "opportunity" durante i tempi morti di attesa missione.',
    defaultTelemetria: {
      potenzaErogataKw: 48.5,
      temperaturaPiastraC: 38.0,
      correnteCaricaAmpere: 120.0,
      efficienzaRicaricaPct: 96.2
    }
  },

  // =========================================================================
  // 6. MAGAZZINI AUTOMATICI & ASRS SMARTSTORE E80
  // =========================================================================
  {
    tipo: 'SMARTSTORE',
    label: 'Magazzino Intensivo SmartStore 3D E80 (Multi-Profondità ASRS)',
    category: 'Magazzini Automatici & ASRS SmartStore 3D (E80)',
    defaultNome: 'Magazzino Automatico Intensivo SmartStore 3D',
    defaultReparto: 'Magazzino Prodotti Finiti ASRS',
    defaultPlcTag: 'DB300.SMARTSTORE_ASRS_STATUS',
    associatedNodeKey: 'SMARTSTORE',
    descrizione: 'La soluzione di stoccaggio intensivo brevettata da E80: navette verticali e satelliti orizzontali SmartShuttle per stoccaggio compatto ad altissima densità.',
    defaultTelemetria: {
      saturazioneCapacitaPct: 86.4,
      missioniInboundOra: 84,
      missioniOutboundOra: 92,
      palletStoccatiTotali: 18450,
      efficienzaFlussoPct: 99.2
    }
  },
  {
    tipo: 'TRASLOELEVATORE_SMARTSTORE',
    label: 'Trasloelevatore Stacker Crane E80 per Magazzino High-Bay',
    category: 'Magazzini Automatici & ASRS SmartStore 3D (E80)',
    defaultNome: 'Trasloelevatore Automatico Stacker Crane E80',
    defaultReparto: 'Corsia Magazzino ASRS',
    defaultPlcTag: 'DB310.CRANE_POS_XYZ',
    associatedNodeKey: 'SMARTSTORE',
    descrizione: 'Colonna di sollevamento su binario con forche telescopiche per scaffalature autoportanti fino a 40 metri di altezza e velocità fino a 4 m/s.',
    defaultTelemetria: {
      quotaElevazioneZmm: 18450,
      velocitaTraslazioneMs: 3.8,
      accelerazioneMs2: 1.2,
      consumoEnergeticoKw: 42.1
    }
  },
  {
    tipo: 'SMARTSHUTTLE_SATELLITE',
    label: 'Satellite Robotico E80 SmartShuttle (Navetta Canale Multi-Deep)',
    category: 'Magazzini Automatici & ASRS SmartStore 3D (E80)',
    defaultNome: 'Navetta Satellite SmartShuttle per Canali Intensivi',
    defaultReparto: 'Canali di Stoccaggio Profondo ASRS',
    defaultPlcTag: 'DB315.SMARTSHUTTLE_DEEP_LANE',
    associatedNodeKey: 'SMARTSTORE',
    descrizione: 'Carrello robotico ultra-piatto che penetra nei canali ciechi a 2, 4, 8 o 12 profondità di pallet per depositare e prelevare i colli.',
    defaultTelemetria: {
      canaleProfonditaPos: 6,
      batteriaSupercapSoCPct: 95,
      tempoInforcaturaCanaleSec: 4.2
    }
  },
  {
    tipo: 'MAGAZZINO_GRAVITA_FLOW',
    label: 'Magazzino Dinamico a Gravità (Flow Rack & Corsie a Rulli FIFO)',
    category: 'Magazzini Automatici & ASRS SmartStore 3D (E80)',
    defaultNome: 'Polmone Dinamico a Rulli a Gravità Flow-Rack',
    defaultReparto: 'Buffer Spedizione & Polmone Spinta Linea',
    defaultPlcTag: 'DB320.FLOW_RACK_BUFFER_COUNT',
    associatedNodeKey: 'SMARTSTORE',
    descrizione: 'Canali a gravità a rulli con regolatori magnetici di discesa per accumulo FIFO a zero consumo energetico prima della banchina.',
    defaultTelemetria: {
      palletPresentiInCanale: 18,
      canaliDisponibili: 4,
      frenoMagneticoStato: 'ATTIVO'
    }
  },

  // =========================================================================
  // 7. CONVOGLIATORI & RULLIERE PALLET (CONVEYORS E80)
  // =========================================================================
  {
    tipo: 'RULLIERA_MOTORIZZATA',
    label: 'Rulliera Motorizzata Pallet E80 (Accumulo Zero-Pressure)',
    category: 'Sistemi di Convogliamento & Smistamento Pallet (E80)',
    defaultNome: 'Rulliera Motorizzata Pallet ad Accumulo Zero-Pressure',
    defaultReparto: 'Linea Dorsale di Convogliamento',
    defaultPlcTag: 'DB400.ROLLER_CONVEYOR_RUN',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Sezioni a rulli motorizzati con fotocellule di passo per accumulo senza pressione tra i carichi per prevenire urti e deformazione film.',
    defaultTelemetria: {
      velocitaNastroMs: 0.35,
      assorbimentoMotoreAmpere: 4.2,
      palletInTransitoOggi: 1240,
      fotocellulaPresenzaPacco: true
    }
  },
  {
    tipo: 'CATENARIA_MOTORIZZATA',
    label: 'Convogliatore a Catene E80 (Trasferimento Trasversale 90°)',
    category: 'Sistemi di Convogliamento & Smistamento Pallet (E80)',
    defaultNome: 'Catenaria Motorizzata a Tre Tracce per Pallet Pesanti',
    defaultReparto: 'Bivi & Smistamento Linee Pallet',
    defaultPlcTag: 'DB405.CHAIN_CONVEYOR_CROSS',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Convogliatore a 2 o 3 catene ad anello per trasporto trasversale pallet con assi ortogonali al senso di marcia.',
    defaultTelemetria: {
      tensioneCatenaBar: 4.5,
      caricoSupportatoKg: 1500,
      lubrificazioneAutomaticaLivelloPct: 88
    }
  },
  {
    tipo: 'TAVOLA_ROTANTE',
    label: 'Tavola Rotante Motorizzata di Smistamento 360° E80',
    category: 'Sistemi di Convogliamento & Smistamento Pallet (E80)',
    defaultNome: 'Tavola Rotante di Smistamento Pallet 360 Gradi',
    defaultReparto: 'Nodi di Incrocio & Cambio Direzione',
    defaultPlcTag: 'DB410.TURNTABLE_ANGLE_DEG',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Ralla motorizzata rotativa per orientamento pallet e deviazione su direttrici multiple di stabilimento a 90, 180 o 270 gradi.',
    defaultTelemetria: {
      angoloRotazioneAttuale: 90.0,
      tempoManovraSec: 3.5,
      allineamentoSensoreProssimita: true
    }
  },
  {
    tipo: 'NAVETTA_RETTILINEA_RGV',
    label: 'Navetta su Rotaia RGV (Rail Guided Vehicle ad Altissima Velocità)',
    category: 'Sistemi di Convogliamento & Smistamento Pallet (E80)',
    defaultNome: 'Navetta su Rotaia Veloce RGV E80',
    defaultReparto: 'Tunnel di Collegamento Fabbrica - Magazzino',
    defaultPlcTag: 'DB415.RGV_RAIL_SPEED_MS',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Carrello elettrico su binario rettilineo che viaggia a oltre 5 m/s per coprire lunghe distanze tra edifici separati in tempi minimi.',
    defaultTelemetria: {
      velocitaCorsaMs: 4.8,
      posizioneEncoderMetri: 142.5,
      tempoTrattaFabbricaMagazzinoSec: 28
    }
  },
  {
    tipo: 'ELEVATORE_VERTICALE_LIFTER',
    label: 'Elevatore / Discensore Verticale Continuo per Pallet (Lifter Multi-Piano)',
    category: 'Sistemi di Convogliamento & Smistamento Pallet (E80)',
    defaultNome: 'Elevatore Verticale Continuo per Pallet Multi-Piano',
    defaultReparto: 'Collegamento Verticale Soppalchi & Mezzanini',
    defaultPlcTag: 'DB420.VERTICAL_LIFTER_FLOOR',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Colonna verticale con controbilanciamento per trasferire pallet tra piano terra, soppalchi di produzione e passerelle aeree.',
    defaultTelemetria: {
      pianoAttuale: 2,
      pesoCabinaKg: 1100,
      velocitaSalitaMs: 1.2,
      statoFrenoParacadute: 'ARMATO_OK'
    }
  },

  // =========================================================================
  // 8. BAIE DI CARICO AUTOMATICO CAMION & LOGISTICA PIAZZALE (ATLS & YMS E80)
  // =========================================================================
  {
    tipo: 'BAIA_CARICO',
    label: 'Baia di Carico / Scarico Merci Intermodale con Banchina Idraulica',
    category: 'Baie di Carico Automatico Camion (ATLS / YMS E80)',
    defaultNome: 'Baia di Carico Merci e Banchina Idraulica',
    defaultReparto: 'Piazzale Spedizioni & Banchina (YMS)',
    defaultPlcTag: 'DB50.BAY_DOCK_STATUS',
    associatedNodeKey: 'BAIE_INBOUND_OUTBOUND',
    descrizione: 'Stazione di banchina con pedana telescopica, sensori di presenza ruota rimorchio e semafori di piazzale per coordinamento autisti.',
    defaultTelemetria: {
      presenzaCamionSensore: true,
      pedanaEstesa: true,
      tempoSostaMinuti: 24,
      palletCaricatiTotali: 33
    }
  },
  {
    tipo: 'BAIA_CARICO_AUTOMATICO_ATLS',
    label: 'Baia di Carico Automatico Camion ATLS (Automatic Truck Loading System)',
    category: 'Baie di Carico Automatico Camion (ATLS / YMS E80)',
    defaultNome: 'Baia di Carico Automatico Camion ATLS E80',
    defaultReparto: 'Spedizioni Avanzate ATLS',
    defaultPlcTag: 'DB55.ATLS_TRUCK_LOAD_PCT',
    associatedNodeKey: 'BAIE_INBOUND_OUTBOUND',
    descrizione: 'Sistema all’avanguardia E80 per il caricamento completamente robotizzato di un bilico in meno di 10 minuti tramite piastre a rulli o LGV sincroni.',
    defaultTelemetria: {
      percentualeCompletamentoCarico: 72,
      tempoResiduoCaricoMin: 2.8,
      allineamentoLaserRimorchioMm: 1.5,
      palletNelRimorchioCount: 24
    }
  },
  {
    tipo: 'STAZIONE_PESA_A_PONTE',
    label: 'Stazione Pesa a Ponte Inbound / Outbound con Lettura Targhe OCR',
    category: 'Baie di Carico Automatico Camion (ATLS / YMS E80)',
    defaultNome: 'Pesa a Ponte Elettronica con Telecamere OCR Targhe',
    defaultReparto: 'Check-In Piazzale & Pesa Doganale (YMS)',
    defaultPlcTag: 'DB60.WEIGHBRIDGE_GROSS_KG',
    associatedNodeKey: 'BAIE_INBOUND_OUTBOUND',
    descrizione: 'Doppia pesa stradale per veicoli industriali con telecamera OCR per lettura targhe camion/rimorchio e registrazione e-CMR automatica.',
    defaultTelemetria: {
      pesoLordoKg: 42180,
      targaRilevata: 'PR849TX',
      tempoPesataSec: 14,
      scostamentoTaraConforme: true
    }
  },

  // =========================================================================
  // 9. GESTIONE PALLET VUOTI & SISTEMI AUSILIARI
  // =========================================================================
  {
    tipo: 'DISIMPILATORE_PALLET_VUOTI',
    label: 'Disimpilatore / Impilatore Automatico per Pallet Vuoti E80',
    category: 'Gestione Pallet Vuoti & Sistemi Ausiliari (E80)',
    defaultNome: 'Disimpilatore Automatico Polmone Pallet Vuoti',
    defaultReparto: 'Alimentazione Pallet Vuoti alle Linee',
    defaultPlcTag: 'DB70.DE_STACKER_LEVEL',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Magazzino verticale di accumulo per 15-20 pallet vuoti con ganci pneumatici di rilascio singolo banco alla base della linea.',
    defaultTelemetria: {
      palletInPilaCount: 14,
      tempoRilascioBancaleSec: 3.2,
      pressioneGanciBar: 6.0
    }
  },
  {
    tipo: 'INVERTITORE_PALLET',
    label: 'Invertitore / Ribaltatore di Pallet (Scambio Bancale Legno-Plastica)',
    category: 'Gestione Pallet Vuoti & Sistemi Ausiliari (E80)',
    defaultNome: 'Invertitore Automatico di Pallet Industriale',
    defaultReparto: 'Camera Bianca & Trasferimento Pharma/Food',
    defaultPlcTag: 'DB75.PALLET_INVERTER_CYCLE',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Dispositivo a doppia piastra di serraggio e rotazione a 180° per sostituire il pallet sporco in legno con pallet igienico in plastica sanificato.',
    defaultTelemetria: {
      tempoInversioneSec: 22.0,
      pressioneSerraggioCaricoBar: 110.0,
      cicliOggi: 86
    }
  },
  {
    tipo: 'RULLIERA_INBOUND',
    label: 'Rulliera Inbound Tracciabilità Materie Prime (MIP / e-CMR)',
    category: 'Gestione Pallet Vuoti & Sistemi Ausiliari (E80)',
    defaultNome: 'Rulliera Inbound Controllo Materie Prime',
    defaultReparto: 'Ricevimento Merci & Laboratorio MIP',
    defaultPlcTag: 'DB10.MIP_LOT_VERIFIED',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Linea di accettazione materie prime con pesatura in movimento, controllo etichetta fornitore e acquisizione e-CMR digitale.',
    defaultTelemetria: {
      colliAccettatiOra: 110,
      scartiNonConformi: 1,
      lottiVerificatiBlockchain: 14
    }
  },
  {
    tipo: 'ALTRO',
    label: 'Altro Macchinario / Nodo Industriale Speciale Elettric80',
    category: 'Gestione Pallet Vuoti & Sistemi Ausiliari (E80)',
    defaultNome: 'Macchinario Speciale Elettric80',
    defaultReparto: 'Reparto Produzione Personalizzato',
    defaultPlcTag: 'DB99.SPECIAL_NODE_CUSTOM',
    associatedNodeKey: 'QUALITA_TRACCIABILITA',
    descrizione: 'Nodo o sensore personalizzato di stabilimento integrato tramite gateway industriale JOKER 80.',
    defaultTelemetria: {
      stato_comunicazione: 'ONLINE',
      valore_custom: 100
    }
  }
];

/**
 * Trova la definizione di un macchinario E80 a partire dal tipo
 */
export function getE80MachineryByType(tipo: string): E80MachineryDefinition {
  const found = E80_MACHINERY_CATALOG.find(m => m.tipo === tipo);
  if (found) return found;
  // Fallback flessibile se c'è matching parziale
  const partial = E80_MACHINERY_CATALOG.find(m => tipo.includes(m.tipo) || m.tipo.includes(tipo));
  if (partial) return partial;
  return E80_MACHINERY_CATALOG[E80_MACHINERY_CATALOG.length - 1]; // ALTRO
}

/**
 * Mappa qualsiasi tipo o nome di macchinario a uno degli 8 Macro-Nodi per i 21 calcoli quantistici
 */
export function mapMachineTipoToNodeKey(tipo: string, nome = ''): PlantNodeType {
  const t = (tipo || '').toUpperCase();
  const n = (nome || '').toLowerCase();

  if (
    t.includes('BEMA') || 
    t.includes('SILKWORM') || 
    t.includes('FASCIAT') || 
    t.includes('BOXMOVE') || 
    t.includes('CAPPUCC') || 
    n.includes('bema') || 
    n.includes('silkworm') ||
    n.includes('fasciator')
  ) {
    return 'BEMA_FASCIATORE';
  }

  if (
    t.startsWith('LGV') || 
    t.startsWith('AGV') || 
    t.startsWith('AMR') || 
    t.includes('FAST_CHARGE') || 
    t === 'FLOTTA_LGV' || 
    n.includes('lgv') || 
    n.includes('agv') ||
    n.includes('laser guided')
  ) {
    return 'FLOTTA_LGV';
  }

  if (
    t.includes('SMARTSTORE') || 
    t.includes('TRASLOELEVATORE') || 
    t.includes('SHUTTLE') || 
    t.includes('ASRS') || 
    t.includes('GRAVITA') || 
    n.includes('smartstore') || 
    n.includes('trasloelevatore') ||
    n.includes('asrs')
  ) {
    return 'SMARTSTORE';
  }

  if (
    t.startsWith('BAIA') || 
    t.includes('ATLS') || 
    t.includes('PESA') || 
    n.includes('baia') || 
    n.includes('dock') || 
    n.includes('piazzale') ||
    n.includes('camion')
  ) {
    return 'BAIE_INBOUND_OUTBOUND';
  }

  if (
    t.includes('PALLETTIZZ') || 
    t.includes('ROBOT') || 
    t.includes('INTERFALDE') || 
    n.includes('robot') || 
    n.includes('pallettizz') ||
    n.includes('depallettizz')
  ) {
    return 'ISOLA_ROBOT';
  }

  if (
    t.includes('WOODPECKER') || 
    t.includes('SAGOMA') || 
    t.includes('COLOR_CHECK') || 
    n.includes('woodpecker') || 
    n.includes('sagoma') ||
    n.includes('ispezione')
  ) {
    return 'WOODPECKER';
  }

  if (
    t.includes('RAPTOR') || 
    t.includes('ETICHETT') || 
    n.includes('raptor') || 
    n.includes('etichett')
  ) {
    return 'RAPTOR';
  }

  return 'QUALITA_TRACCIABILITA';
}

/**
 * Genera un nuovo MachineAsset completo e pronto all'uso dal catalogo
 */
export function buildMachineAssetFromCatalog(
  tipo: string,
  prefix: string,
  index = 1
): MachineAsset {
  const def = getE80MachineryByType(tipo);
  const p = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'E80';
  const idxStr = String(index).padStart(2, '0');

  return {
    id: `M-${p}-${def.tipo.slice(0, 8)}-${idxStr}`,
    nome: `${def.defaultNome} ${idxStr}`,
    tipo: def.tipo,
    reparto: def.defaultReparto,
    plcTag: `${def.defaultPlcTag}_${idxStr}`,
    stato: 'IN_MARCIA',
    telemetria: { ...def.defaultTelemetria }
  };
}
