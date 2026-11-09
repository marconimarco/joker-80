import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qft_bema_kernel(theta_freq: float):
    q = cudaq.qvector(4)
    for i in range(4):
        cudaq.ry(theta_freq * (i + 1), q[i])
    cudaq.h(q[0])
    cudaq.rz.ctrl(np.pi / 2.0, q[1], q[0])
    cudaq.rz.ctrl(np.pi / 4.0, q[2], q[0])
    cudaq.rz.ctrl(np.pi / 8.0, q[3], q[0])
    cudaq.h(q[1])
    cudaq.rz.ctrl(np.pi / 2.0, q[2], q[1])
    cudaq.rz.ctrl(np.pi / 4.0, q[3], q[1])
    cudaq.h(q[2])
    cudaq.rz.ctrl(np.pi / 2.0, q[3], q[2])
    cudaq.h(q[3])
    cudaq.x.ctrl(q[0], q[3])
    cudaq.x.ctrl(q[3], q[0])
    cudaq.x.ctrl(q[0], q[3])
    cudaq.x.ctrl(q[1], q[2])
    cudaq.x.ctrl(q[2], q[1])
    cudaq.x.ctrl(q[1], q[2])

def esegui_calcolo_14_qft_bema(rpm_tavola_bema: float = 48.5, vibrazione_cuscinetti_g: float = 0.36, pre_stiro_pct: float = 250.0) -> Dict[str, Any]:
    rpm = max(1.0, float(rpm_tavola_bema))
    vib_g = max(0.01, float(vibrazione_cuscinetti_g))
    prestiro = float(np.clip(pre_stiro_pct, 100.0, 350.0))
    f0_hz = round(float(rpm / 60.0), 3)
    theta_freq = float(np.clip(f0_hz * 1.25, 0.1, np.pi - 0.1))
    counts = cudaq.sample(qft_bema_kernel, theta_freq, shots=100)
    bin_dominante = counts.most_probable()
    bin_index = int(bin_dominante, 2)
    freq_armonica_hz = round(float(bin_index * (f0_hz * 2.0)), 2)
    return {
        "calcolo": "Quantum Fourier Transform (QFT) - Bema Wrapping Controller",
        "rpm_tavola": rpm,
        "frequenza_fondamentale_hz": f0_hz,
        "pre_stiro_pct": prestiro,
        "bin_spettrale_rilevato": bin_dominante,
        "frequenza_armonica_stimata_hz": freq_armonica_hz,
        "vibrazione_cuscinetti_g": vib_g,
        "stato_meccanico": "ALLARME MANUTENZIONE PREVENTIVA" if vib_g > 0.45 else "REGOLARE"
    }

if __name__ == '__main__':
    print(esegui_calcolo_14_qft_bema())
