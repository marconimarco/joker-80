import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qgnn_batching_kernel(w0: float, w1: float, w2: float, w3: float, w4: float, w5: float, w6: float, w7: float, densita_grafo: float):
    q = cudaq.qvector(4)
    cudaq.ry(densita_grafo * 0.45, q[0])
    cudaq.ry(densita_grafo * 0.90, q[1])
    cudaq.ry(densita_grafo * 1.35, q[2])
    cudaq.ry(densita_grafo * 1.80, q[3])
    cudaq.rx(w0, q[0])
    cudaq.rz(w4, q[0])
    cudaq.rx(w1, q[1])
    cudaq.rz(w5, q[1])
    cudaq.rx(w2, q[2])
    cudaq.rz(w6, q[2])
    cudaq.rx(w3, q[3])
    cudaq.rz(w7, q[3])
    cudaq.x.ctrl(q[0], q[1])
    cudaq.x.ctrl(q[1], q[2])
    cudaq.x.ctrl(q[2], q[3])
    cudaq.x.ctrl(q[3], q[0])

def esegui_calcolo_09_qgnn(ordini_in_coda: int = 24, densita_affiliazioni_grafo: float = 0.65) -> Dict[str, Any]:
    n_ord = max(1, int(ordini_in_coda))
    dens = float(np.clip(densita_affiliazioni_grafo, 0.05, 1.0))
    w = [0.45, 0.62, 0.38, 0.71, 0.55, 0.40, 0.68, 0.33]
    counts = cudaq.sample(qgnn_batching_kernel, w[0], w[1], w[2], w[3], w[4], w[5], w[6], w[7], dens, shots=100)
    stato_cluster = counts.most_probable()
    n_cluster = max(2, min(8, int(stato_cluster, 2) % 6 + 2))
    efficienza = round(min(98.5, max(70.0, 82.0 + dens * 14.5)), 1)
    tempo_sec = round(float((n_ord / n_cluster) * 4.2), 1)
    return {
        "calcolo": "Quantum Graph Neural Network (QGNN) - Order Batching",
        "ordini_in_coda": n_ord,
        "cluster_ottimale_bitstring": stato_cluster,
        "numero_cluster_generati": n_cluster,
        "efficienza_batching_pct": efficienza,
        "tempo_consolidamento_sec": tempo_sec,
        "distribuzione_campionata": dict(counts)
    }

if __name__ == '__main__':
    print(esegui_calcolo_09_qgnn())
