// ── Risultati ufficiali GP 2026 ───────────────────────────────
// Aggiungi qui ogni GP dopo la gara.
// Il pulsante Fetch li carica e li salva su Supabase automaticamente.

import type { DriverResult, OpenF1RaceData } from './openf1';

export const GP_RESULTS: Record<string, OpenF1RaceData> = {

  australia: {
    p1: 'Russell', p2: 'Antonelli', p3: 'Leclerc',
    dnf: ['Hadjar', 'Bottas', 'Alonso', 'Norris', 'Piastri', 'Hulkenberg'],
    rimonta: ['Verstappen'],
    classification: [
      { pos:1,  number:63, name:'Russell',    acronym:'RUS', team:'Mercedes',     gap:'WINNER', gapToLeader:null,  fastestLap:false, dnf:false, startPos:1  },
      { pos:2,  number:12, name:'Antonelli',  acronym:'ANT', team:'Mercedes',     gap:'+2.9',   gapToLeader:2.9,   fastestLap:false, dnf:false, startPos:2  },
      { pos:3,  number:16, name:'Leclerc',    acronym:'LEC', team:'Ferrari',      gap:'+15.0',  gapToLeader:15.0,  fastestLap:false, dnf:false, startPos:4  },
      { pos:4,  number:44, name:'Hamilton',   acronym:'HAM', team:'Ferrari',      gap:'+15.6',  gapToLeader:15.6,  fastestLap:false, dnf:false, startPos:7  },
      { pos:5,  number:1,  name:'Norris',     acronym:'NOR', team:'McLaren',      gap:'+55.3',  gapToLeader:55.3,  fastestLap:false, dnf:false, startPos:5  },
      { pos:6,  number:3,  name:'Verstappen', acronym:'VER', team:'Red Bull',     gap:'+62.1',  gapToLeader:62.1,  fastestLap:true,  dnf:false, startPos:20 },
      { pos:7,  number:87, name:'Bearman',    acronym:'BEA', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:8  },
      { pos:8,  number:41, name:'Lindblad',   acronym:'LIN', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:9  },
      { pos:9,  number:5,  name:'Bortoleto',  acronym:'BOR', team:'Audi',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:15 },
      { pos:10, number:10, name:'Gasly',      acronym:'GAS', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:12 },
      { pos:11, number:31, name:'Ocon',       acronym:'OCO', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:14 },
      { pos:12, number:30, name:'Lawson',     acronym:'LAW', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:13 },
      { pos:13, number:43, name:'Colapinto',  acronym:'COL', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:10 },
      { pos:14, number:23, name:'Albon',      acronym:'ALB', team:'Williams',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:16 },
      { pos:15, number:55, name:'Sainz',      acronym:'SAI', team:'Williams',     gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:21 },
      { pos:16, number:11, name:'Perez',      acronym:'PER', team:'Cadillac',     gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:17 },
      { pos:17, number:18, name:'Stroll',     acronym:'STR', team:'Aston Martin', gap:'+2 LAPS',gapToLeader:null,  fastestLap:false, dnf:false, startPos:22 },
      { pos:18, number:14, name:'Alonso',     acronym:'ALO', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:3  },
      { pos:19, number:77, name:'Bottas',     acronym:'BOT', team:'Cadillac',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:18 },
      { pos:20, number:6,  name:'Hadjar',     acronym:'HAD', team:'Red Bull',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:3  },
      { pos:21, number:81, name:'Piastri',    acronym:'PIA', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:6  },
      { pos:22, number:27, name:'Hulkenberg', acronym:'HUL', team:'Audi',         gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:11 },
    ],
  },

  china: {
    p1: 'Antonelli', p2: 'Russell', p3: 'Hamilton',
    dnf: ['Verstappen', 'Alonso', 'Stroll', 'Norris', 'Piastri', 'Bortoleto', 'Albon'],
    rimonta: [],
    classification: [
      { pos:1,  number:12, name:'Antonelli',  acronym:'ANT', team:'Mercedes',     gap:'WINNER', gapToLeader:null,  fastestLap:false, dnf:false, startPos:1  },
      { pos:2,  number:63, name:'Russell',    acronym:'RUS', team:'Mercedes',     gap:'+5.5',   gapToLeader:5.5,   fastestLap:false, dnf:false, startPos:2  },
      { pos:3,  number:44, name:'Hamilton',   acronym:'HAM', team:'Ferrari',      gap:'+25.0',  gapToLeader:25.0,  fastestLap:false, dnf:false, startPos:3  },
      { pos:4,  number:16, name:'Leclerc',    acronym:'LEC', team:'Ferrari',      gap:'+28.3',  gapToLeader:28.3,  fastestLap:false, dnf:false, startPos:4  },
      { pos:5,  number:87, name:'Bearman',    acronym:'BEA', team:'Haas',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:9  },
      { pos:6,  number:10, name:'Gasly',      acronym:'GAS', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:11 },
      { pos:7,  number:30, name:'Lawson',     acronym:'LAW', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:12 },
      { pos:8,  number:6,  name:'Hadjar',     acronym:'HAD', team:'Red Bull',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:13 },
      { pos:9,  number:55, name:'Sainz',      acronym:'SAI', team:'Williams',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:14 },
      { pos:10, number:43, name:'Colapinto',  acronym:'COL', team:'Alpine',       gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:15 },
      { pos:11, number:11, name:'Perez',      acronym:'PER', team:'Cadillac',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:16 },
      { pos:12, number:77, name:'Bottas',     acronym:'BOT', team:'Cadillac',     gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:17 },
      { pos:13, number:27, name:'Hulkenberg', acronym:'HUL', team:'Audi',         gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:10 },
      { pos:14, number:41, name:'Lindblad',   acronym:'LIN', team:'Racing Bulls', gap:'+1 LAP', gapToLeader:null,  fastestLap:false, dnf:false, startPos:19 },
      { pos:15, number:3,  name:'Verstappen', acronym:'VER', team:'Red Bull',     gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:5  },
      { pos:16, number:14, name:'Alonso',     acronym:'ALO', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:6  },
      { pos:17, number:18, name:'Stroll',     acronym:'STR', team:'Aston Martin', gap:'DNF',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:7  },
      { pos:18, number:1,  name:'Norris',     acronym:'NOR', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:18 },
      { pos:19, number:81, name:'Piastri',    acronym:'PIA', team:'McLaren',      gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:20 },
      { pos:20, number:5,  name:'Bortoleto',  acronym:'BOR', team:'Audi',         gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:21 },
      { pos:21, number:23, name:'Albon',      acronym:'ALB', team:'Williams',     gap:'DNS',    gapToLeader:null,  fastestLap:false, dnf:true,  startPos:8  },
    ],
  },

};
