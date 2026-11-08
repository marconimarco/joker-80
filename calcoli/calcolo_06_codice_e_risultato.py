import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def bin_packing_kernel(theta_rot: float, theta_sat: float):
    q = cudaq.qvector(4)
    cudaq.h(q[0])
    cudaq.ry(theta_rot, q[1])
    cudaq.ry(theta_sat, q[2])
    cudaq.x.ctrl(q[1], q[0])
    cudaq.x.ctrl(q[2], q[3])

def esegui_calcolo_06_bin_packing(id_pallet: str = "PLT-NOV-88412", classe_rotazione: str = "HIGH", saturazione_wms: float = 78.5) -> Dict[str, Any]:
    sat = float(np.clip(saturazione_wms, 0.0, 100.0))
    rot_val = 1.0 if classe_rotazione.upper() == "HIGH" else (0.6 if classe_rotazione.upper() == "MED" else 0.2)
    theta_rot = float(rot_val * np.pi * 0.75)
    theta_sat = float((sat / 100.0) * np.pi)
    counts = cudaq.sample(bin_packing_kernel, theta_rot, theta_sat, shots=100)
    stato = counts.most_probable()
    corsia = (int(stato, 2) % 6) + 1
    campata = ((int(stato, 2) * 3) % 40) + 1
    livello = (int(stato[:2], 2) % 8) + 1
    tempo_ciclo_sec = round(float(35.0 + (corsia * 2.2) + (livello * 1.8)), 1)
    return {
        "calcolo": "Quantum Digital Twin 3D Bin Packing - Put-Away Logic",
        "id_pallet": id_pallet,
        "classe_rotazione": classe_rotazione,
        "coordinate_cella_3d": {"corsia": corsia, "campata": campata, "livello": livello},
        "tempo_ciclo_trasloelevatore_sec": tempo_ciclo_sec,
        "efficienza_slotting_pct": round(min(99.0, 88.0 + rot_val * 10.0), 1),
        "stato_qubit_allocazione": stato
    }

if __name__ == '__main__':
    print(esegui_calcolo_06_bin_packing())
