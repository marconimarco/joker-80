#!/usr/bin/env python3
"""
JOKER 80 - SM.I.LE80 Industrial Gateway Telemetry Daemon
Modulo M2M per PC / IPC di Stabilimento (E80 Group Ecosystem)

Questo script gira come demone di background sui PC industriali di stabilimento
(linee fasciatori BEMA Silkworm, navette LGV, baie di carico).
Invia periodicamente i dati telemetrici al server JOKER 80 Quantum.
"""

import time
import json
import os
import sys

try:
    import requests
except ImportError:
    print("[ERRORE] La libreria 'requests' non e' installata. Esegui: pip install requests")
    sys.exit(1)

# Configurazione Endpoint
SERVER_URL = os.environ.get("JOKER80_URL", "https://ais-dev-j3xz33kaggpbtbgebgxqfs-71198816019.us-west1.run.app")
ENDPOINT = f"{SERVER_URL}/api/telemetry/push"
GATEWAY_KEY = os.environ.get("INDUSTRIAL_GATEWAY_KEY", "JOKER80-NIS2-PEDRIGNANO-GW-2026")
BEARER_TOKEN = os.environ.get("GOOGLE_AUTH_TOKEN", "")

# Se presente un file PFX per mTLS nativo in produzione
PFX_CERT_PATH = os.environ.get("MTLS_PFX_PATH", "")
PFX_PASSWORD = os.environ.get("MTLS_PFX_PASS", "")

def genera_telemetria_plc(ciclo: int) -> dict:
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
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

def main():
    print("=" * 65)
    print(" JOKER 80 - Demone Telemetrico Impianto E80 (SM.I.LE80)")
    print(f" Destinazione: {ENDPOINT}")
    print(f" Chiave Gateway: {GATEWAY_KEY}")
    print("=" * 65)

    headers = {
        "Content-Type": "application/json",
        "X-Industrial-Gateway-Key": GATEWAY_KEY,
        "User-Agent": "E80-Plant-Gateway/2.4 (JOKER-80-NIS2)"
    }
    
    if BEARER_TOKEN:
        headers["Authorization"] = f"Bearer {BEARER_TOKEN}"

    ciclo = 1
    while True:
        payload = genera_telemetria_plc(ciclo)
        try:
            res = requests.post(ENDPOINT, json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                d = res.json()
                print(f"[CICLO #{ciclo:04d}] [HTTP 200 OK] Pacchetto: {d.get('packetId')} | Auth: {d.get('authType')} | mTLS: {d.get('mtlsSecurity', {}).get('protocol')}")
            else:
                print(f"[CICLO #{ciclo:04d}] [HTTP {res.status_code}] Risposta: {res.text[:120]}")
        except Exception as ex:
            print(f"[CICLO #{ciclo:04d}] [ERRORE RETE]: {ex}")

        ciclo += 1
        time.sleep(3.0)

if __name__ == "__main__":
    main()
