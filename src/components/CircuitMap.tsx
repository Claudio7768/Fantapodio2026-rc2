import React from 'react';

// ─────────────────────────────────────────────────────────────
// CircuitMap — piantine SVG stilizzate per ogni circuito F1 2026
// ViewBox 200×130 per tutti, stroke-only, no fill
// ─────────────────────────────────────────────────────────────

interface CircuitInfo {
  d: string | string[];
  startLine?: [number, number, number, number];
  label?: string;
  length?: string;   // es. "5.303 km"
  laps?: number;
  record?: { time: string; driver: string; year: number };
}

const CIRCUITS: Record<string, CircuitInfo> = {

  // ── australia ──
  australia: {
    label: 'Melbourne',
    startLine: [82.4, 116.4, 87.4, 110.2],
    d: `M 84.9,113.3 L 61.9,95.1 L 61.9,82.6 L 39.9,64.0 L 27.7,47.6 L 41.2,43.4 L 42.7,25.1 L 78.0,10.0 L 100.5,16.7 L 108.4,23.6 L 112.7,41.0 L 105.7,52.1 L 102.2,68.1 L 106.8,83.4 L 123.7,97.2 L 140.8,99.5 L 157.4,110.5 L 163.7,118.2 L 172.3,142.5 L 149.6,150.0 L 144.4,148.0 L 133.3,133.6 L 125.1,139.9 L 118.6,140.2 L 84.9,113.3 Z`,
    length: '5.278 km',
    laps: 58,
    record: { time: '1:20.235', driver: 'Charles Leclerc', year: 2024 },
  
  },

  // ── china ──
  china: {
    label: 'Shanghai',
    startLine: [58.5, 137.2, 56.9, 129.4],
    d: `M 57.7,133.3 L 44.2,136.2 L 38.8,136.4 L 31.9,133.7 L 28.8,130.9 L 27.0,127.3 L 27.0,123.3 L 27.9,120.0 L 30.5,117.5 L 33.8,116.2 L 36.9,116.2 L 40.2,117.9 L 41.0,120.3 L 39.2,126.5 L 41.2,129.0 L 43.6,129.8 L 46.3,129.4 L 48.6,127.3 L 50.7,122.2 L 50.5,118.1 L 45.5,111.8 L 22.2,89.0 L 19.6,84.5 L 10.0,59.6 L 12.2,58.1 L 14.8,58.5 L 19.7,61.6 L 27.8,69.8 L 41.1,89.4 L 45.4,93.4 L 51.1,95.6 L 60.6,95.6 L 66.5,93.0 L 71.5,88.8 L 79.2,75.7 L 86.0,72.1 L 91.4,72.1 L 95.6,74.0 L 98.2,76.1 L 105.8,87.7 L 107.6,88.1 L 110.9,87.3 L 117.1,80.4 L 117.9,79.0 L 117.4,76.5 L 82.9,27.5 L 80.0,27.4 L 75.7,31.5 L 72.5,32.7 L 70.7,32.5 L 68.9,31.1 L 65.0,25.9 L 65.3,19.6 L 68.0,15.6 L 72.5,13.3 L 80.3,12.7 L 88.6,15.4 L 94.8,21.5 L 189.3,143.8 L 189.9,146.5 L 188.8,147.4 L 187.1,147.3 L 179.2,143.1 L 155.0,114.9 L 151.9,114.2 L 57.7,133.3 Z`,
    length: '5.451 km',
    laps: 56,
    record: { time: '1:32.238', driver: 'Michael Schumacher', year: 2004 },
  
  },

  // ── japan ──
  japan: {
    label: 'Suzuka',
    startLine: [166.5, 79.9, 160.9, 85.5],
    d: `M 163.7,82.7 L 189.0,108.1 L 190.0,112.1 L 188.3,116.9 L 185.6,119.1 L 182.6,119.4 L 179.5,118.0 L 168.9,105.5 L 158.4,103.6 L 153.2,93.3 L 138.5,89.6 L 136.5,84.4 L 139.4,75.9 L 136.0,71.6 L 127.7,68.6 L 119.2,68.7 L 110.9,72.6 L 100.0,83.3 L 85.5,84.4 L 82.3,76.1 L 79.2,60.9 L 82.5,50.8 L 79.5,50.8 L 72.1,60.6 L 67.8,63.9 L 60.1,65.7 L 54.1,65.6 L 41.5,62.2 L 35.5,58.5 L 30.7,53.1 L 24.0,41.4 L 14.7,41.2 L 11.3,42.8 L 10.0,45.2 L 12.2,49.9 L 30.0,61.1 L 86.3,78.3 L 91.5,77.7 L 99.9,74.3 L 118.5,61.2 L 122.9,63.4 L 129.8,59.9 L 136.7,60.2 L 145.7,64.8 L 163.7,82.7 Z`,
    length: '5.807 km',
    laps: 53,
    record: { time: '1:30.983', driver: 'Kimi Räikkönen', year: 2005 },
  
  },

  // ── bahrain ──
  bahrain: {
    label: 'Sakhir',
    startLine: [46.8, 76.2, 54.8, 76.6],
    d: `M 50.8,76.4 L 53.7,10.2 L 64.5,16.8 L 81.3,13.6 L 152.3,27.1 L 151.6,31.6 L 129.8,49.0 L 124.6,58.2 L 106.0,60.2 L 85.4,80.4 L 83.7,74.9 L 89.7,41.1 L 87.7,35.6 L 79.8,30.7 L 75.4,74.3 L 75.4,114.6 L 82.7,115.8 L 92.7,111.7 L 102.5,95.5 L 113.2,89.5 L 134.9,96.5 L 141.0,104.3 L 56.0,149.3 L 51.3,149.1 L 47.4,139.7 L 50.8,76.4 Z`,
    length: '5.412 km',
    laps: 57,
    record: { time: '1:31.447', driver: 'Pedro de la Rosa', year: 2005 },
  
  },

  // ── saudi ──
  saudi: {
    label: 'Jeddah',
    startLine: [104.0, 119.2, 111.6, 116.4],
    d: `M 107.8,117.8 L 100.1,96.9 L 96.3,96.3 L 95.5,74.4 L 90.4,69.5 L 92.9,62.2 L 88.4,48.9 L 94.1,43.8 L 96.8,31.7 L 95.9,12.3 L 93.0,10.0 L 89.2,13.9 L 93.5,28.9 L 83.9,49.1 L 94.9,84.1 L 94.1,96.6 L 99.2,105.6 L 93.4,124.3 L 99.6,139.1 L 114.8,149.8 L 107.8,117.8 Z`,
    length: '6.174 km',
    laps: 50,
    record: { time: '1:30.734', driver: 'Lewis Hamilton', year: 2021 },
  
  },

  // ── miami ──
  miami: {
    label: 'Miami',
    startLine: [100.8, 62.4, 96.8, 69.2],
    d: `M 98.8,65.8 L 123.8,80.6 L 116.1,87.9 L 115.6,97.5 L 109.5,103.3 L 91.4,105.1 L 59.0,88.3 L 38.1,93.2 L 24.1,85.7 L 12.6,89.9 L 10.1,97.9 L 13.6,101.5 L 41.5,104.5 L 74.0,103.5 L 106.3,112.1 L 121.9,111.0 L 155.4,99.9 L 179.7,87.2 L 171.7,77.8 L 174.0,73.8 L 187.1,70.8 L 190.0,66.2 L 187.2,63.8 L 188.2,53.6 L 33.8,47.8 L 32.1,51.4 L 41.7,57.5 L 73.9,52.8 L 98.8,65.8 Z`,
    length: '5.412 km',
    laps: 57,
    record: { time: '1:29.708', driver: 'Max Verstappen', year: 2023 },
  
  },

  // ── canada ──
  canada: {
    label: 'Montréal',
    startLine: [125.7, 110.3, 118.1, 112.5],
    d: `M 121.9,111.4 L 127.2,129.6 L 126.1,144.0 L 132.3,148.1 L 117.3,148.0 L 100.2,138.6 L 99.7,132.5 L 83.5,119.4 L 82.1,104.2 L 74.3,103.6 L 69.9,99.3 L 68.2,73.8 L 73.4,57.0 L 81.9,52.6 L 86.7,39.9 L 89.1,24.9 L 86.5,10.2 L 89.2,10.6 L 90.4,17.9 L 105.6,44.2 L 120.2,93.3 L 117.4,96.5 L 121.9,111.4 Z`,
    length: '4.361 km',
    laps: 70,
    record: { time: '1:13.078', driver: 'Valtteri Bottas', year: 2019 },
  
  },

  // ── monaco ──
  monaco: {
    label: 'Monaco',
    startLine: [118.5, 38.2, 126.3, 36.6],
    d: `M 122.4,37.4 L 122.1,35.9 L 123.7,32.8 L 146.6,10.4 L 148.4,10.0 L 152.0,11.3 L 153.1,12.8 L 153.6,16.7 L 159.9,24.4 L 161.0,24.6 L 163.1,23.6 L 163.3,22.7 L 156.7,16.9 L 156.1,15.0 L 156.9,13.6 L 168.4,10.5 L 172.6,10.9 L 173.2,12.5 L 172.6,22.1 L 168.5,38.1 L 166.2,42.6 L 162.1,47.7 L 150.8,57.3 L 141.2,61.5 L 124.4,67.3 L 106.0,71.0 L 95.2,72.3 L 93.8,75.4 L 92.2,75.8 L 90.0,76.0 L 86.2,74.9 L 43.4,79.3 L 40.3,82.9 L 36.9,90.0 L 36.3,100.1 L 42.9,105.6 L 46.9,121.8 L 46.1,123.4 L 43.0,124.7 L 42.9,127.2 L 46.4,133.9 L 50.9,139.2 L 54.5,141.8 L 61.7,144.4 L 63.3,146.9 L 62.9,147.9 L 61.5,148.4 L 52.2,150.0 L 48.1,149.8 L 46.1,148.6 L 45.2,144.9 L 37.5,136.9 L 35.4,132.8 L 30.9,121.5 L 28.8,114.0 L 26.8,100.9 L 26.8,96.0 L 27.7,88.5 L 30.6,80.7 L 30.4,77.5 L 32.4,76.3 L 35.8,75.7 L 53.8,74.0 L 74.1,69.8 L 85.4,68.8 L 103.8,63.0 L 124.1,60.0 L 127.7,58.3 L 132.6,54.0 L 133.3,49.7 L 130.1,43.3 L 124.5,39.8 L 122.4,37.4 Z`,
    length: '3.337 km',
    laps: 78,
    record: { time: '1:12.909', driver: 'Rubens Barrichello', year: 2004 },
  
  },

  // ── barcelona ──
  barcelona: {
    label: 'Barcelona',
    startLine: [147.0, 75.1, 141.0, 69.9],
    d: `M 144.0,72.5 L 83.4,143.7 L 66.9,140.6 L 42.0,150.0 L 31.8,147.5 L 25.1,140.9 L 23.6,132.4 L 26.7,123.5 L 52.3,94.2 L 62.9,96.1 L 66.5,104.3 L 48.4,129.3 L 50.8,134.7 L 80.6,126.0 L 97.3,110.2 L 98.3,106.0 L 87.1,98.0 L 74.9,76.6 L 75.1,70.0 L 81.2,64.4 L 153.6,36.0 L 153.1,31.5 L 145.8,28.5 L 137.2,28.7 L 124.1,34.9 L 114.1,31.5 L 114.5,24.1 L 134.2,11.7 L 147.5,11.0 L 171.9,22.8 L 176.4,29.6 L 173.7,37.4 L 144.0,72.5 Z`,
    length: '4.657 km',
    laps: 66,
    record: { time: '1:18.149', driver: 'Max Verstappen', year: 2021 },
  
  },

  // ── austria ──
  austria: {
    label: 'Spielberg',
    startLine: [130.7, 114.4, 129.3, 106.6],
    d: `M 130.0,110.5 L 84.7,118.6 L 58.8,92.8 L 36.7,63.6 L 10.1,43.0 L 37.4,41.5 L 123.0,49.0 L 124.0,53.4 L 111.0,61.7 L 100.1,63.5 L 71.2,60.7 L 61.5,64.0 L 60.6,72.2 L 76.6,88.1 L 86.7,87.4 L 97.9,79.8 L 109.8,76.9 L 180.8,77.8 L 189.0,97.0 L 130.0,110.5 Z`,
    length: '4.318 km',
    laps: 71,
    record: { time: '1:05.619', driver: 'Carlos Sainz', year: 2020 },
  
  },

  // ── britain ──
  britain: {
    label: 'Silverstone',
    startLine: [112.7, 7.3, 113.1, 15.3],
    d: `M 112.9,11.3 L 142.1,10.2 L 152.0,15.8 L 157.2,27.5 L 160.1,52.2 L 165.9,59.7 L 160.8,72.3 L 168.2,83.1 L 151.5,92.4 L 103.2,145.2 L 95.5,149.6 L 87.4,149.5 L 53.0,122.9 L 43.9,125.4 L 37.8,122.9 L 31.8,114.1 L 75.0,79.4 L 105.5,79.5 L 131.6,68.2 L 138.7,77.6 L 144.4,77.0 L 148.2,63.3 L 85.2,27.8 L 72.4,27.2 L 68.7,36.8 L 64.9,38.5 L 55.7,35.4 L 65.3,21.2 L 73.8,15.9 L 112.9,11.3 Z`,
    length: '5.891 km',
    laps: 52,
    record: { time: '1:27.097', driver: 'Max Verstappen', year: 2020 },
  
  },

  // ── belgium ──
  belgium: {
    label: 'Spa',
    startLine: [70.1, 27.4, 76.1, 22.2],
    d: `M 73.1,24.8 L 60.9,10.8 L 77.4,14.4 L 123.9,43.2 L 126.8,50.8 L 145.4,71.0 L 167.7,120.4 L 161.5,126.9 L 162.2,137.6 L 135.3,149.5 L 129.0,149.0 L 128.9,144.3 L 141.3,139.3 L 143.4,135.6 L 131.3,104.2 L 116.1,100.5 L 103.3,105.2 L 87.2,128.4 L 67.7,127.6 L 49.7,141.8 L 33.4,134.3 L 32.5,129.4 L 40.6,119.0 L 55.3,110.0 L 82.9,99.6 L 95.8,83.9 L 84.8,55.6 L 84.0,45.7 L 90.5,44.1 L 73.1,24.8 Z`,
    length: '7.004 km',
    laps: 44,
    record: { time: '1:46.286', driver: 'Valtteri Bottas', year: 2018 },
  
  },

  // ── hungary ──
  hungary: {
    label: 'Budapest',
    startLine: [53.0, 118.3, 56.8, 111.3],
    d: `M 54.9,114.8 L 11.4,91.5 L 10.2,88.3 L 35.2,87.9 L 76.1,107.3 L 85.7,105.3 L 87.3,101.1 L 77.4,86.9 L 103.2,50.4 L 114.6,39.3 L 107.1,18.0 L 113.8,11.5 L 130.7,16.0 L 151.1,30.3 L 148.7,36.7 L 157.0,54.3 L 177.7,58.5 L 179.6,63.2 L 176.6,81.0 L 189.9,98.3 L 187.5,103.9 L 146.2,135.0 L 120.4,119.7 L 110.7,120.3 L 111.1,126.6 L 131.7,138.5 L 131.7,144.5 L 124.7,148.5 L 114.5,146.7 L 54.9,114.8 Z`,
    length: '4.381 km',
    laps: 70,
    record: { time: '1:16.627', driver: 'Lewis Hamilton', year: 2020 },
  
  },

  // ── netherlands ──
  netherlands: {
    label: 'Zandvoort',
    startLine: [28.7, 73.7, 35.3, 78.3],
    d: `M 32.0,76.0 L 59.8,35.3 L 66.5,33.2 L 73.5,38.7 L 62.9,55.8 L 61.8,66.4 L 42.0,73.3 L 44.0,79.0 L 81.6,75.1 L 110.4,78.0 L 149.2,69.0 L 177.8,70.4 L 185.0,73.2 L 190.0,81.3 L 166.5,108.9 L 158.5,110.0 L 138.6,106.6 L 129.1,100.5 L 134.7,96.0 L 164.4,90.0 L 164.8,84.0 L 159.0,81.5 L 114.7,81.6 L 66.9,92.5 L 59.1,87.8 L 52.8,88.7 L 50.3,91.5 L 57.5,122.7 L 52.1,126.2 L 35.5,126.8 L 16.9,122.4 L 10.0,112.8 L 11.6,106.0 L 32.0,76.0 Z`,
    length: '4.259 km',
    laps: 72,
    record: { time: '1:11.097', driver: 'Max Verstappen', year: 2021 },
  
  },

  // ── italy ──
  italy: {
    label: 'Monza',
    startLine: [41.8, 98.4, 49.8, 99.4],
    d: `M 45.8,98.9 L 50.7,59.6 L 54.8,58.0 L 53.0,38.1 L 59.2,28.4 L 77.4,20.9 L 118.3,18.6 L 148.3,10.0 L 155.3,12.7 L 157.4,31.2 L 124.8,44.3 L 79.3,72.5 L 79.1,78.4 L 72.9,84.7 L 61.8,148.2 L 50.7,148.8 L 42.9,140.2 L 45.8,98.9 Z`,
    length: '5.793 km',
    laps: 53,
    record: { time: '1:21.046', driver: 'Rubens Barrichello', year: 2004 },
  
  },

  // ── madrid ──
  madrid: {
    label: 'Madrid',
    startLine: [115.7, 146.3, 114.7, 138.3],
    d: `M 115.2,142.3 L 96.3,144.8 L 94.4,149.2 L 80.8,148.6 L 51.9,113.4 L 48.9,102.2 L 54.3,87.3 L 53.4,81.1 L 42.9,60.9 L 47.1,57.0 L 43.2,49.7 L 43.2,37.0 L 51.4,30.4 L 46.9,17.7 L 50.4,11.5 L 60.1,10.1 L 68.9,16.3 L 67.8,24.8 L 48.9,45.6 L 63.1,56.2 L 67.0,72.0 L 74.4,75.5 L 94.2,73.4 L 107.9,88.6 L 126.0,89.1 L 129.8,92.9 L 135.3,115.5 L 151.2,113.8 L 155.6,136.8 L 115.2,142.3 Z`,
    length: '5.476 km',
    laps: 58,
    record: { time: '—', driver: '—', year: 2026 },
  
  },

  // ── azerbaijan ──
  azerbaijan: {
    label: 'Baku',
    startLine: [174.1, 51.9, 177.1, 59.3],
    d: `M 175.6,55.6 L 190.0,49.6 L 177.4,29.9 L 110.3,51.8 L 115.0,66.7 L 90.1,77.5 L 91.1,81.5 L 65.2,97.3 L 57.6,85.3 L 49.5,83.9 L 46.7,79.9 L 16.5,91.0 L 10.0,105.5 L 11.3,119.5 L 39.0,129.9 L 63.4,107.9 L 66.8,97.9 L 88.2,85.1 L 175.6,55.6 Z`,
    length: '6.003 km',
    laps: 51,
    record: { time: '1:43.009', driver: 'Charles Leclerc', year: 2019 },
  
  },

  // ── singapore ──
  singapore: {
    label: 'Marina Bay',
    startLine: [190.1, 65.6, 182.1, 66.6],
    d: `M 186.1,66.1 L 190.0,97.0 L 182.6,108.5 L 148.4,105.5 L 144.5,96.6 L 83.4,92.4 L 58.2,74.3 L 52.6,88.2 L 43.3,136.2 L 39.3,138.3 L 22.4,120.4 L 22.2,111.3 L 10.4,103.2 L 10.0,99.1 L 35.5,55.0 L 43.9,57.3 L 56.5,69.9 L 71.0,46.9 L 111.8,69.2 L 165.4,71.2 L 168.5,67.6 L 168.4,60.5 L 161.0,35.9 L 164.4,21.8 L 181.7,30.1 L 186.1,66.1 Z`,
    length: '4.940 km',
    laps: 62,
    record: { time: '1:35.867', driver: 'Kevin Magnussen', year: 2018 },
  
  },

  // ── usa ──
  usa: {
    label: 'Austin',
    startLine: [48.1, 104.8, 44.1, 111.6],
    d: `M 46.1,108.2 L 73.2,124.3 L 69.0,103.9 L 100.8,79.9 L 105.6,69.4 L 114.5,66.1 L 127.1,70.5 L 139.3,62.0 L 147.0,66.5 L 165.6,63.0 L 189.8,36.1 L 126.2,49.4 L 75.1,55.2 L 86.1,71.4 L 77.9,72.4 L 70.5,63.3 L 64.3,62.7 L 73.3,80.5 L 70.4,86.8 L 62.6,90.2 L 50.0,87.3 L 36.1,72.5 L 11.8,81.1 L 11.2,84.4 L 46.1,108.2 Z`,
    length: '5.513 km',
    laps: 56,
    record: { time: '1:36.169', driver: 'Charles Leclerc', year: 2019 },
  
  },

  // ── mexico ──
  mexico: {
    label: 'Mexico City',
    startLine: [43.4, 17.1, 42.4, 25.1],
    d: `M 42.9,21.1 L 185.3,40.3 L 184.6,50.2 L 190.0,53.9 L 188.2,63.8 L 150.0,124.9 L 156.3,132.7 L 144.2,141.2 L 140.7,139.9 L 145.0,102.5 L 134.2,94.0 L 129.2,85.7 L 107.0,81.0 L 100.9,69.8 L 82.2,60.5 L 34.6,53.4 L 30.4,32.3 L 24.8,36.5 L 10.5,33.2 L 12.8,25.1 L 19.8,19.5 L 42.9,21.1 Z`,
    length: '4.304 km',
    laps: 71,
    record: { time: '1:17.774', driver: 'Valtteri Bottas', year: 2021 },
  
  },

  // ── brazil ──
  brazil: {
    label: 'São Paulo',
    startLine: [65.0, 109.4, 57.2, 111.6],
    d: `M 61.1,110.5 L 70.5,144.0 L 74.6,149.4 L 80.1,149.3 L 87.7,143.2 L 100.9,147.9 L 110.5,147.5 L 123.7,137.0 L 148.0,54.3 L 146.8,48.9 L 129.1,44.8 L 118.4,48.0 L 81.0,90.0 L 65.6,86.2 L 60.5,67.7 L 63.6,62.3 L 74.9,66.7 L 81.0,61.7 L 69.0,45.8 L 67.7,31.6 L 71.6,31.7 L 84.6,44.2 L 97.6,44.7 L 117.3,20.0 L 115.8,15.4 L 101.3,10.3 L 92.8,10.8 L 71.5,18.2 L 62.9,26.1 L 51.7,70.4 L 61.1,110.5 Z`,
    length: '4.309 km',
    laps: 71,
    record: { time: '1:10.540', driver: 'Valtteri Bottas', year: 2018 },
  
  },

  // ── lasvegas ──
  lasvegas: {
    label: 'Las Vegas',
    startLine: [140.5, 131.4, 146.1, 137.2],
    d: `M 143.3,134.3 L 149.9,127.9 L 148.5,125.0 L 141.6,124.6 L 129.6,130.0 L 121.0,123.2 L 120.4,61.7 L 144.6,60.1 L 148.4,57.2 L 152.0,49.1 L 147.0,44.6 L 150.3,36.8 L 111.1,34.0 L 104.7,30.0 L 94.6,14.6 L 78.0,10.1 L 57.3,42.4 L 51.5,59.5 L 48.0,144.8 L 60.3,149.8 L 114.2,149.8 L 127.9,147.6 L 143.3,134.3 Z`,
    length: '6.201 km',
    laps: 50,
    record: { time: '1:35.490', driver: 'Oscar Piastri', year: 2023 },
  
  },

  // ── qatar ──
  qatar: {
    label: 'Lusail',
    startLine: [53.9, 96.6, 60.9, 92.8],
    d: `M 57.4,94.7 L 34.6,53.5 L 43.0,49.7 L 59.2,58.6 L 65.2,58.5 L 68.2,55.1 L 69.6,35.9 L 93.9,11.6 L 99.0,10.0 L 109.4,17.2 L 110.4,21.6 L 93.9,39.3 L 94.3,43.4 L 127.3,33.7 L 132.5,36.0 L 133.7,40.6 L 125.0,50.4 L 118.9,64.3 L 101.1,69.1 L 98.3,75.1 L 107.0,82.5 L 120.6,87.2 L 154.2,85.2 L 160.1,89.6 L 165.7,101.1 L 153.8,117.6 L 119.4,114.7 L 100.4,147.2 L 95.0,150.0 L 89.7,147.8 L 57.4,94.7 Z`,
    length: '5.380 km',
    laps: 57,
    record: { time: '1:24.319', driver: 'Max Verstappen', year: 2023 },
  
  },

  // ── abudhabi ──
  abudhabi: {
    label: 'Yas Marina',
    startLine: [98.6, 84.4, 99.6, 92.4],
    d: `M 99.1,88.4 L 120.5,85.8 L 123.2,82.4 L 118.0,65.5 L 106.0,60.4 L 101.9,55.2 L 104.5,33.6 L 101.5,12.6 L 98.1,10.0 L 64.0,101.8 L 69.5,101.9 L 79.9,121.3 L 103.8,138.6 L 128.9,150.0 L 133.7,148.9 L 136.1,144.5 L 130.8,137.5 L 110.8,135.8 L 100.4,129.6 L 97.8,120.0 L 107.8,116.8 L 107.4,107.5 L 80.0,107.1 L 73.7,96.7 L 74.0,92.0 L 99.1,88.4 Z`,
    length: '5.281 km',
    laps: 58,
    record: { time: '1:26.103', driver: 'Max Verstappen', year: 2021 },
  
  },

};

// ─────────────────────────────────────────────────────────────

interface CircuitMapProps {
  gpId: string;
  className?: string;
  color?: string;
  showLabel?: boolean;
  showInfo?: boolean;  // mostra lunghezza, giri e record
}

const CircuitMap: React.FC<CircuitMapProps> = ({
  gpId,
  className = '',
  color = 'rgba(255,255,255,0.85)',
  showLabel = false,
  showInfo = false,
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

  if (showInfo && !showLabel) {
    // Info-only mode: no SVG
    return (
      <div className={className}>
        {circuit.length && (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-white/20 uppercase tracking-widest font-bold">Lunghezza</span>
              <span className="text-white/60 font-black">{circuit.length}</span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-white/20 uppercase tracking-widest font-bold">Giri</span>
              <span className="text-white/60 font-black">{circuit.laps}</span>
            </div>
            {circuit.record && (
              <div className="pt-1.5 border-t border-white/5 mt-1.5">
                <p className="text-white/20 uppercase tracking-widest font-bold text-[9px] mb-0.5">Record giro</p>
                <p className="text-primary font-black text-[11px] italic">{circuit.record.time}</p>
                <p className="text-white/40 font-bold text-[9px]">{circuit.record.driver} · {circuit.record.year}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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

      {showInfo && (
        <div className="w-full space-y-1 mt-2">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-white/20 uppercase tracking-widest font-bold">Lunghezza</span>
            <span className="text-white/60 font-black">{circuit.length ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-white/20 uppercase tracking-widest font-bold">Giri</span>
            <span className="text-white/60 font-black">{circuit.laps ?? '—'}</span>
          </div>
          {circuit.record && (
            <div className="pt-1 border-t border-white/5">
              <p className="text-white/20 uppercase tracking-widest font-bold text-[9px] mb-0.5">Record</p>
              <p className="text-primary font-black text-[10px] italic">{circuit.record.time}</p>
              <p className="text-white/40 font-bold text-[9px]">{circuit.record.driver} · {circuit.record.year}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircuitMap;
