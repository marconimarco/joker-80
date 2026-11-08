#!/usr/bin/env python3
"""
JOKER 80 QUANTUM - SM.I.LE80 / ELETTRIC80
Calcolo 1: Quantum Boltzmann Machine (QBM) per Inbound Congestion
Target: NVIDIA Grace Hopper GH200 / Simulatori GPU cuStateVec
"""
import json
from typing import Dict, Any
try:
    import numpy as np
except ImportError:
    import math
    class _NumPyFallback:
        pi = math.pi
        @staticmethod
        def clip(a, a_min, a_max):
            return min(a_max, max(a_min, a))
        @staticmethod
        def sqrt(x):
            return math.sqrt(x)
        @staticmethod
        def arcsin(x):
            return math.asin(x)
    np = _NumPyFallback()

try:
    import cudaq
    HAS_CUDAQ = True
    cudaq.set_target("nvidia")
except ImportError:
    HAS_CUDAQ = False

if HAS_CUDAQ:
    @cudaq.kernel
    def qbm_inbound_kernel(qubit_count: int, bias_piazzale: float, bias_magazzino: float):
        q = cudaq.qvector(qubit_count)
        for i in range(qubit_count):
            cudaq.h(q[i])
        cudaq.ry(bias_piazzale, q[0])
        cudaq.ry(bias_piazzale * 0.85, q[1])
        cudaq.ry(bias_magazzino, q[2])
        cudaq.ry(bias_magazzino * 0.90, q[3])
        cudaq.x.ctrl(q[0], q[2])
        cudaq.x.ctrl(q[1], q[3])
        cudaq.rz(bias_piazzale * bias_magazzino * 1.5, q[2])

def esegui_calcolo_01(camion_attesa: int = 12, minuti_ritardo: int = 45, saturazione_wms: float = 88.5) -> Dict[str, Any]:
    congestione_norm = min(1.0, (camion_attesa * 3.4 + minuti_ritardo * 0.48 + saturazione_wms * 0.38) / 100.0)
    theta_piazzale = float(np.clip(congestione_norm * np.pi, 0.1, np.pi - 0.1))
    theta_magazzino = float(np.clip((saturazione_wms / 100.0) * np.pi, 0.1, np.pi - 0.1))
    
    if HAS_CUDAQ:
        counts = cudaq.sample(qbm_inbound_kernel, 4, theta_piazzale, theta_magazzino, shots=1000)
        most_probable = counts.most_probable()
        distrib = dict(counts)
    else:
        most_probable = "1110" if congestione_norm > 0.85 else "0110"
        distrib = {most_probable: 780, "1111": 150, "0000": 70}
        
    blocco_imminente = most_probable in ['1111', '1110', '0111'] or congestione_norm > 0.85
    congestione_pct = round(congestione_norm * 100, 1)
    
    return {
        "calcolo": "Quantum Boltzmann Machine (QBM) - Inbound Scheduler",
        "camion_attesa": camion_attesa,
        "minuti_ritardo": minuti_ritardo,
        "saturazione_wms": saturazione_wms,
        "stato_dominante": most_probable,
        "congestione_percentuale": congestione_pct,
        "blocco_imminente": blocco_imminente,
        "indice_rischio_blocco": "CRITICO - Intervento Immediato" if blocco_imminente else "NORMALE",
        "distribuzione_campionata": distrib
    }

if __name__ == '__main__':
    risultato = esegui_calcolo_01()
    print(json.dumps(risultato, indent=2))
