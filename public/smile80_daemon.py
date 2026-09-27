#!/usr/bin/env python3
"""
JOKER 80 - SM.I.LE80 Industrial Gateway Telemetry Daemon
Modulo M2M Multi-Piattaforma per PC / IPC di Stabilimento
Compatibile al 100% con:
 - Linux (Ubuntu, Debian, RHEL, CentOS, Raspberry Pi CM4 / Yocto OT) tramite systemd
 - macOS Apple (Apple Silicon M1/M2/M3/M4 & Intel) tramite launchd
 - Windows (Windows 10/11 IoT Enterprise, Windows Server) tramite Servizi / Task Scheduler
 - Container Docker / Podman universale

Funzionalita principali:
 1. Rileva automaticamente l'OS (Linux, macOS Apple, Windows).
 2. Sincronizza dinamicamente la frequenza di campionamento (secondi, minuti, ore, giorni)
    dal pannello Admin di JOKER 80 (/api/telemetry/config).
 3. Invia la telemetria PLC autenticata con X-Industrial-Gateway-Key o mTLS.
"""

import time
import json
import os
import sys
import platform

try:
    import requests
except ImportError:
    print("[ERRORE] La libreria 'requests' non e' installata.")
    print("  Su Linux:   sudo apt install python3-pip && pip3 install requests")
    print("  Su Mac:     pip3 install requests")
    print("  Su Windows: python -m pip install requests")
    sys.exit(1)

# Configurazione Endpoint
SERVER_URL = os.environ.get("JOKER80_URL", "https://ais-dev-j3xz33kaggpbtbgebgxqfs-71198816019.us-west1.run.app")
ENDPOINT = f"{SERVER_URL}/api/telemetry/push"
CONFIG_ENDPOINT = f"{SERVER_URL}/api/telemetry/config"
GATEWAY_KEY = os.environ.get("INDUSTRIAL_GATEWAY_KEY", "JOKER80-NIS2-PEDRIGNANO-GW-2026")
BEARER_TOKEN = os.environ.get("GOOGLE_AUTH_TOKEN", "")

# Intervallo locale predefinito (sovrascritto da quello remoto del pannello Admin)
DEFAULT_INTERVAL_SEC = float(os.environ.get("TELEMETRY_INTERVAL_SEC", "5.0"))

def detect_os_info() -> dict:
    os_name = platform.system()
    os_release = platform.release()
    arch = platform.machine()
    
    label = "Linux IPC"
    if os_name == "Darwin":
        label = f"Apple Mac ({arch})"
    elif os_name == "Windows":
        label = f"Windows {os_release} ({arch})"
    elif os_name == "Linux":
        label = f"Linux ({arch})"

    return {
        "osName": os_name,
        "osLabel": label,
        "architecture": arch,
        "hostname": platform.node()
    }

def ottieni_frequenza_remota(current_interval: float) -> float:
    """Interroga il pannello Admin di JOKER 80 per leggere l'intervallo aggiornato."""
    try:
        res = requests.get(CONFIG_ENDPOINT, timeout=4)
        if res.status_code == 200:
            data = res.json()
            cfg = data.get("config", {})
            sec = cfg.get("intervalSeconds")
            if sec and isinstance(sec, (int, float)) and sec > 0:
                val = cfg.get("intervalValue")
                unit = cfg.get("intervalUnit")
                if sec != current_interval:
                    print(f"\n[CONFIG SYNC] Nuova frequenza ricevuta dal pannello Admin: ogni {val} {unit} ({sec}s totali)")
                return float(sec)
    except Exception:
        # Se non raggiungibile o offline, mantiene l'intervallo corrente
        pass
    return current_interval

def genera_telemetria_plc(ciclo: int, os_info: dict) -> dict:
    """Simula la lettura dei registri PLC del fasciatore Bema Silkworm e della navetta LGV."""
    rpm = round(34.2 + (ciclo % 5) * 0.1, 1)
    temp = round(51.6 + (ciclo % 4) * 0.2, 1)
    pallet = 82 + (ciclo // 3)
    
    return {
        "macchinarioId": "bema-silkworm-01",
        "nome": "Fasciatore Robotico BEMA Silkworm (Pedrignano)",
        "tipo": "BEMA_FASCIATORE",
        "stato": "IN_MARCIA",
        "parametri": {
            "velocitaRotazioneRpm": rpm,
            "tensioneFilmPreStiroPct": 295,
            "temperaturaInverterC": temp,
            "palletOra": pallet,
            "vibrazioneCuscinettiG": 0.38,
            "pressioneAriaBar": 6.2
        },
        "lgv": {
            "id": "LGV-04",
            "modello": "E80 CB60 Fast-Drop",
            "batteriaSoC": max(20, 95 - (ciclo % 40)),
            "velocitaMs": 1.75,
            "missione": f"Alimentazione continua linea Bema (Ciclo #{ciclo})"
        },
        "baia": {
            "id": "BAIA-02",
            "stato": "OPERATIVA",
            "camion": "SCANIA-R500-E80"
        },
        "nodeMetadata": {
            "os": os_info["osLabel"],
            "system": os_info["osName"],
            "arch": os_info["architecture"],
            "hostname": os_info["hostname"],
            "pythonVersion": platform.python_version()
        },
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def main():
    os_info = detect_os_info()
    current_interval = DEFAULT_INTERVAL_SEC

    print("=" * 70)
    print(" JOKER 80 - Demone Telemetrico Impianto E80 (SM.I.LE80)")
    print(f" Piattaforma Rilevata : {os_info['osLabel']} (Host: {os_info['hostname']})")
    print(f" Destinazione Cloud   : {ENDPOINT}")
    print(f" Chiave Gateway M2M   : {GATEWAY_KEY}")
    print(f" Frequenza Iniziale   : {current_interval} secondi")
    print("=" * 70)

    # Prima sincronizzazione frequenza da Admin
    current_interval = ottieni_frequenza_remota(current_interval)

    headers = {
        "Content-Type": "application/json",
        "X-Industrial-Gateway-Key": GATEWAY_KEY,
        "User-Agent": f"E80-Plant-Gateway/2.4 ({os_info['osLabel']}; JOKER-80-NIS2)"
    }
    
    if BEARER_TOKEN:
        headers["Authorization"] = f"Bearer {BEARER_TOKEN}"

    ciclo = 1
    last_sync_check = time.time()

    while True:
        # Controlla se la frequenza e' cambiata sul server ogni 30 secondi o prima di ogni trasmissione
        if time.time() - last_sync_check > 25:
            current_interval = ottieni_frequenza_remota(current_interval)
            last_sync_check = time.time()

        payload = genera_telemetria_plc(ciclo, os_info)
        t_start = time.time()
        try:
            res = requests.post(ENDPOINT, json=payload, headers=headers, timeout=12)
            durata_ms = round((time.time() - t_start) * 1000, 1)
            if res.status_code == 200:
                d = res.json()
                print(f"[CICLO #{ciclo:04d}] [HTTP 200 OK] {durata_ms}ms | Pkt: {d.get('packetId')} | Auth: {d.get('authType')} | Prox invio tra: {current_interval}s")
            else:
                print(f"[CICLO #{ciclo:04d}] [HTTP {res.status_code}] Risposta: {res.text[:120]}")
        except Exception as ex:
            print(f"[CICLO #{ciclo:04d}] [ERRORE RETE]: {ex}")

        ciclo += 1

        # Attesa configurabile in secondi
        time.sleep(current_interval)

if __name__ == "__main__":
    main()
