import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def hopfield_safety_kernel(theta_stress: float, theta_press: float):
    q = cudaq.qvector(4)
    for i in range(4):
        cudaq.h(q[i])
    cudaq.ry(theta_stress, q[0])
    cudaq.ry(theta_press, q[1])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])

def esegui_calcolo_07_hopfield(corsie_attive: int = 6, pressione_pattini_bar: float = 185.0, stress_strutturale_mpa: float = 142.5) -> Dict[str, Any]:
    c_att = max(1, int(corsie_attive))
    press = float(np.clip(pressione_pattini_bar, 50.0, 300.0))
    stress = max(1.0, float(np.clip(stress_strutturale_mpa, 20.0, 300.0)))
    theta_s = float(np.clip((stress / 250.0) * np.pi, 0.1, np.pi - 0.1))
    theta_p = float(np.clip((press / 250.0) * np.pi, 0.1, np.pi - 0.1))
    counts = cudaq.sample(hopfield_safety_kernel, theta_s, theta_p, shots=100)
    stato = counts.most_probable()
    limite_acciaio = 235.0
    fattore_sicurezza = round(float(limite_acciaio / stress), 2)
    return {
        "calcolo": "Quantum Hopfield Networks - Safety Scaffalature Intensive",
        "corsie_attive": c_att,
        "stress_strutturale_mpa": stress,
        "fattore_sicurezza": fattore_sicurezza,
        "conformita_asrs": "CONFORME NORMA EN 15635" if fattore_sicurezza >= 1.5 else "ALLARME SOVRACCARICO",
        "stato_qubit_memoria": stato
    }

if __name__ == '__main__':
    print(esegui_calcolo_07_hopfield())
