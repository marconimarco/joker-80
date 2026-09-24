#!/usr/bin/env bash
# JOKER 80 - Script M2M per PC / IPC di Stabilimento
# Invia la telemetria verso il Quantum Control Panel

TARGET_URL="${JOKER80_URL:-https://ais-dev-j3xz33kaggpbtbgebgxqfs-71198816019.us-west1.run.app}"
GATEWAY_KEY="${INDUSTRIAL_GATEWAY_KEY:-JOKER80-NIS2-PEDRIGNANO-GW-2026}"

echo "=== JOKER 80: Invio Telemetria da PC di Fabbrica ==="
echo "Target: $TARGET_URL/api/telemetry/push"

# Se è installata gcloud CLI sul PC, possiamo ricavare il token Google M2M
AUTH_HEADER=""
if command -v gcloud &> /dev/null; then
    TOKEN=$(gcloud auth print-identity-token 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        AUTH_HEADER="-H \"Authorization: Bearer $TOKEN\""
        echo "Google Identity Token rilevato ed applicato."
    fi
fi

curl -s -X POST "$TARGET_URL/api/telemetry/push" \
  -H "Content-Type: application/json" \
  -H "X-Industrial-Gateway-Key: $GATEWAY_KEY" \
  $AUTH_HEADER \
  -d '{
    "macchinarioId": "bema-silkworm-01",
    "nome": "Fasciatore Robotico BEMA Silkworm (Stabilimento Pedrignano)",
    "tipo": "BEMA_FASCIATORE",
    "stato": "IN_MARCIA",
    "parametri": {
      "velocitaRotazioneRpm": 34.2,
      "tensioneFilmPreStiroPct": 295,
      "temperaturaInverterC": 51.6,
      "palletOra": 82,
      "vibrazioneCuscinettiG": 0.38,
      "pressioneAriaBar": 6.2
    },
    "lgv": {
      "id": "LGV-04",
      "modello": "E80 CB60 Fast-Drop",
      "batteriaSoC": 88,
      "velocitaMs": 1.75
    }
  }' | jq . || cat
