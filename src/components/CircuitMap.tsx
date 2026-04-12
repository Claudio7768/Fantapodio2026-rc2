import React from 'react';

// ─────────────────────────────────────────────────────────────
// CircuitMap — piantine SVG stilizzate per ogni circuito F1 2026
// ViewBox 200×130 per tutti, stroke-only, no fill
// ─────────────────────────────────────────────────────────────

interface CircuitInfo {
  /** SVG path d="" — traccia il perimetro del circuito */
  d: string | string[];
  /** Posizione del punto di partenza [x, y] per la linea start/finish */
  startLine?: [number, number, number, number]; // x1,y1,x2,y2
  /** Rotazione opzionale dell'intera figura */
  label?: string;
}

const CIRCUITS: Record<string, CircuitInfo> = {

  // ── Australia – Albert Park, Melbourne ──────────────────────
  australia: {
    label: 'Melbourne',
    startLine: [64, 108, 64, 120],
    d: `M 64,114 L 64,78 Q 64,58 76,50 L 96,44 L 118,44 L 132,50
        Q 142,56 148,68 L 152,80 L 160,80 L 160,96 Q 160,110 148,114
        L 130,116 L 130,124 Q 130,132 120,132 L 72,132 Q 64,132 64,124 Z`,
  },

  // ── China – Shanghai International Circuit ─────────────────
  china: {
    label: 'Shanghai',
    startLine: [52, 128, 65, 128],
    d: [
      // Hairpin a raggio decrescente (firma del circuito)
      `M 58,134 L 58,116 Q 58,100 72,98 Q 88,96 89,112 Q 90,128 75,130
       Q 60,131 59,115`,
      // Rettilineo e curva S
      `M 72,98 L 72,70 Q 72,52 96,48 L 152,48 Q 165,48 166,60
       L 166,74 Q 166,86 154,88 L 90,88`,
      // Curva finale (curva 1–2 a forcella)
      `M 152,48 L 156,34 Q 160,22 148,18 Q 134,14 128,26 L 128,48`,
    ],
  },

  // ── Japan – Suzuka Circuit ──────────────────────────────────
  japan: {
    label: 'Suzuka',
    startLine: [148, 90, 155, 78],
    d: [
      // Loop superiore (130R → Casio Triangle)
      `M 100,72 L 76,58 Q 52,44 54,26 Q 56,10 74,8 Q 92,6 98,22
       L 106,38 L 100,72`,
      // Crossover (approx.)
      `M 100,72 L 110,80`,
      // Loop inferiore (Hairpin → Spoon → Chicane finale)
      `M 110,80 L 130,92 Q 154,106 152,124 Q 150,138 132,136
       L 100,128 L 70,136 Q 48,140 48,124 Q 48,108 68,102
       L 86,96 L 100,72`,
    ],
  },

  // ── Bahrain – Bahrain International Circuit, Sakhir ────────
  bahrain: {
    label: 'Sakhir',
    startLine: [58, 78, 58, 90],
    d: `M 58,84 L 58,62 Q 58,44 72,38 L 98,32 Q 118,30 128,44
        L 136,58 Q 144,72 136,86 L 124,96 Q 148,108 148,124
        Q 148,138 130,140 L 96,140 Q 76,140 70,126 Q 64,114 74,102
        L 58,94 Q 50,88 50,80 Q 50,68 58,64 Z`,
  },

  // ── Saudi Arabia – Jeddah Corniche Circuit ─────────────────
  saudi: {
    label: 'Jeddah',
    startLine: [50, 106, 50, 118],
    d: `M 50,112 L 50,92 L 62,80 L 62,62 Q 62,50 74,48
        L 154,48 Q 166,48 166,60 L 166,80 Q 166,90 156,92
        L 148,92 L 148,110 Q 148,126 136,128 L 64,128 Q 50,128 50,112 Z`,
  },

  // ── Miami – Miami International Autodrome ──────────────────
  miami: {
    label: 'Miami',
    startLine: [50, 112, 50, 124],
    d: `M 50,118 L 50,96 L 60,82 L 60,64 Q 60,50 74,46
        L 120,46 Q 136,46 144,58 L 156,58 L 156,70 Q 156,84 144,86
        L 128,86 L 128,108 Q 128,122 114,124 L 64,124 Q 50,124 50,118 Z`,
  },

  // ── Canada – Circuit Gilles Villeneuve, Montréal ───────────
  canada: {
    label: 'Montréal',
    startLine: [95, 44, 107, 44],
    d: `M 100,40 L 76,46 Q 54,56 52,78 Q 50,96 62,110
        L 80,120 L 100,126 Q 120,130 138,120 L 154,108 Q 166,94
        162,76 L 148,60 Q 136,48 120,44 Z`,
  },

  // ── Monaco – Circuit de Monaco ─────────────────────────────
  monaco: {
    label: 'Monaco',
    startLine: [100, 128, 112, 128],
    d: `M 106,132 L 56,132 Q 40,132 40,118 L 40,90 Q 40,78 52,72
        L 70,66 Q 78,50 92,44 L 118,38 Q 136,34 148,48 L 158,68
        Q 164,82 154,94 L 144,100 L 156,110 Q 162,118 154,126 Z`,
  },

  // ── Barcelona – Circuit de Barcelona-Catalunya ─────────────
  barcelona: {
    label: 'Barcelona',
    startLine: [42, 88, 42, 100],
    d: `M 42,94 L 42,70 Q 42,54 58,48 L 86,44 Q 100,42 106,36
        L 130,36 Q 148,36 154,50 L 158,66 L 158,90 Q 158,104
        144,108 L 122,110 L 122,120 Q 122,132 108,132 L 60,132
        Q 42,132 42,118 Z`,
  },

  // ── Austria – Red Bull Ring, Spielberg ─────────────────────
  austria: {
    label: 'Spielberg',
    startLine: [68, 124, 80, 124],
    d: `M 74,128 L 58,110 Q 44,94 50,74 L 64,56 Q 74,42 90,40
        L 118,38 Q 136,38 144,52 L 152,68 Q 158,82 150,98
        L 136,110 L 148,120 Q 156,130 144,134 L 84,134 Q 74,134 74,128 Z`,
  },

  // ── Britain – Silverstone Circuit ──────────────────────────
  britain: {
    label: 'Silverstone',
    startLine: [120, 40, 132, 40],
    d: `M 126,36 L 100,36 L 76,42 Q 54,50 50,70 L 50,96
        Q 50,112 64,120 L 82,126 L 100,126 Q 116,126 128,118
        L 144,118 Q 162,118 168,104 L 168,84 Q 168,70 156,62
        L 148,52 L 158,44 Q 164,34 152,30 Q 138,26 132,38 Z`,
  },

  // ── Belgium – Circuit de Spa-Francorchamps ─────────────────
  belgium: {
    label: 'Spa',
    startLine: [46, 88, 46, 100],
    d: `M 46,94 L 46,72 Q 46,56 60,50 L 78,46 L 92,36 Q 108,26 124,34
        L 142,48 Q 158,60 152,78 L 144,92 L 156,106 Q 164,118
        154,128 L 90,128 L 70,128 Q 48,128 46,110 Z`,
  },

  // ── Hungary – Hungaroring, Budapest ────────────────────────
  hungary: {
    label: 'Budapest',
    startLine: [56, 106, 56, 118],
    d: `M 56,112 L 56,90 Q 56,76 70,70 L 90,66 L 90,52 Q 90,38
        106,34 L 132,34 Q 148,34 150,50 L 150,70 Q 150,86
        134,90 L 114,90 L 114,108 Q 114,122 100,124 L 70,124
        Q 56,124 56,112 Z`,
  },

  // ── Netherlands – Circuit Zandvoort ────────────────────────
  netherlands: {
    label: 'Zandvoort',
    startLine: [54, 88, 54, 100],
    d: `M 54,94 Q 50,72 60,56 L 78,42 Q 98,30 120,36 L 142,50
        Q 158,64 158,86 Q 158,110 142,122 L 118,130 Q 96,134
        76,126 L 60,114 Z`,
  },

  // ── Italy – Autodromo Nazionale di Monza ───────────────────
  italy: {
    label: 'Monza',
    startLine: [50, 84, 50, 96],
    d: [
      // Ovale principale con due varianti (chicanes)
      `M 50,90 Q 48,66 66,52 L 96,36 L 96,24 Q 96,14 108,14
       Q 120,14 120,24 L 120,36 L 148,52 Q 164,66 162,90
       Q 162,114 148,126 L 120,136 L 120,126 L 96,126 L 96,136
       L 66,126 Q 48,114 50,90 Z`,
    ],
  },

  // ── Madrid – Circuito de Madrid (nuovo 2026) ───────────────
  madrid: {
    label: 'Madrid',
    startLine: [50, 102, 50, 114],
    d: `M 50,108 L 50,82 L 62,70 L 62,52 Q 62,38 78,36
        L 122,36 Q 138,36 144,50 L 158,62 L 158,88
        Q 158,104 142,110 L 116,112 L 116,124 Q 116,136
        102,136 L 64,136 Q 50,136 50,120 Z`,
  },

  // ── Azerbaijan – Baku City Circuit ─────────────────────────
  azerbaijan: {
    label: 'Baku',
    startLine: [48, 118, 48, 130],
    d: `M 48,124 L 48,104 Q 48,90 62,86 L 72,86 L 72,60
        Q 72,46 86,42 L 154,42 Q 168,42 168,56 L 168,70
        Q 168,84 154,86 L 144,86 L 144,108 Q 144,124
        130,126 L 64,128 Q 48,128 48,124 Z`,
  },

  // ── Singapore – Marina Bay Street Circuit ─────────────────
  singapore: {
    label: 'Marina Bay',
    startLine: [50, 108, 50, 120],
    d: `M 50,114 L 50,90 L 62,78 L 62,58 Q 62,44 76,42
        L 110,42 L 110,32 Q 110,22 122,22 Q 134,22 134,32
        L 134,52 L 150,62 Q 162,74 160,90 L 148,108
        L 148,120 Q 148,132 134,132 L 64,132 Q 50,132 50,120 Z`,
  },

  // ── USA – Circuit of the Americas, Austin ─────────────────
  usa: {
    label: 'Austin',
    startLine: [44, 108, 44, 120],
    d: `M 44,114 L 44,84 L 56,72 L 56,52 Q 60,36 78,34
        L 100,34 Q 118,34 120,50 L 130,50 Q 148,50 150,66
        L 150,88 Q 150,106 134,110 L 114,112 L 122,124
        Q 128,134 118,136 L 64,136 Q 44,134 44,120 Z`,
  },

  // ── Mexico – Autodromo Hermanos Rodriguez ──────────────────
  mexico: {
    label: 'Mexico City',
    startLine: [50, 108, 50, 120],
    d: `M 50,114 L 50,90 Q 50,76 66,70 L 86,68 L 86,52
        Q 86,38 102,36 L 136,36 Q 154,36 154,52 L 154,68
        L 154,88 Q 154,106 138,110 L 116,112 L 116,124
        Q 116,136 102,136 L 64,136 Q 50,136 50,124 Z`,
  },

  // ── Brazil – Autodromo Jose Carlos Pace, Interlagos ───────
  brazil: {
    label: 'São Paulo',
    startLine: [64, 126, 76, 126],
    d: `M 70,130 L 46,114 Q 36,98 44,80 L 60,64 Q 46,52
        46,38 Q 46,24 62,20 L 106,20 Q 124,20 132,34
        L 150,50 Q 164,66 156,84 L 138,104 Q 156,116
        156,128 Q 156,140 140,140 L 80,140 Z`,
  },

  // ── Las Vegas – Las Vegas Strip Circuit ────────────────────
  lasvegas: {
    label: 'Las Vegas',
    startLine: [54, 70, 54, 82],
    d: `M 54,76 L 54,48 Q 54,36 68,36 L 78,36 L 78,52
        L 122,52 L 122,36 L 132,36 Q 146,36 146,50
        L 146,120 Q 146,134 132,134 L 68,134 Q 54,134
        54,120 L 54,108 L 78,108 L 78,120 L 122,120
        L 122,108 L 54,108`,
  },

  // ── Qatar – Lusail International Circuit ──────────────────
  qatar: {
    label: 'Lusail',
    startLine: [60, 108, 60, 120],
    d: `M 60,114 Q 40,96 42,74 L 54,54 Q 66,36 90,32
        L 114,32 Q 138,32 152,50 L 162,70 Q 170,90
        158,110 L 140,126 Q 120,138 96,136 Q 74,134 60,118 Z`,
  },

  // ── Abu Dhabi – Yas Marina Circuit ────────────────────────
  abudhabi: {
    label: 'Yas Marina',
    startLine: [54, 102, 54, 114],
    d: [
      // Settore 1 + Marina Hotel section
      `M 54,108 L 54,78 Q 54,64 70,60 L 94,58 L 94,44
       Q 94,32 108,30 L 132,30 Q 150,30 152,46 L 152,64
       L 164,76 Q 174,88 162,106 L 148,120 Q 134,132
       116,128 L 106,128 L 106,116 L 94,116 L 94,128
       L 70,128 Q 54,128 54,114 Z`,
    ],
  },
};

// ─────────────────────────────────────────────────────────────

interface CircuitMapProps {
  gpId: string;
  className?: string;
  /** Colore principale del tratto (default: bianco con opacità) */
  color?: string;
  /** Mostra il nome del circuito sotto */
  showLabel?: boolean;
}

const CircuitMap: React.FC<CircuitMapProps> = ({
  gpId,
  className = '',
  color = 'rgba(255,255,255,0.85)',
  showLabel = false,
}) => {
  const circuit = CIRCUITS[gpId];

  if (!circuit) {
    // Fallback generico se il circuito non è mappato
    return (
      <div className={`flex items-center justify-center text-white/10 ${className}`}>
        <svg viewBox="0 0 200 130" className="w-full h-full">
          <ellipse cx="100" cy="65" rx="70" ry="40" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="8 4" />
        </svg>
      </div>
    );
  }

  const paths = Array.isArray(circuit.d) ? circuit.d : [circuit.d];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <svg
        viewBox="0 0 200 160"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Glow / ombra dietro il tracciato */}
        <g filter="url(#glow)">
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.15"
              strokeDasharray="none"
            />
          ))}
        </g>

        {/* Tracciato principale */}
        {paths.map((d, i) => (
          <path
            key={`main-${i}`}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Linea di partenza/arrivo */}
        {circuit.startLine && (
          <line
            x1={circuit.startLine[0]}
            y1={circuit.startLine[1]}
            x2={circuit.startLine[2]}
            y2={circuit.startLine[3]}
            stroke="#e10600"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Filtro glow */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {showLabel && circuit.label && (
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mt-1">
          {circuit.label}
        </p>
      )}
    </div>
  );
};

export default CircuitMap;
