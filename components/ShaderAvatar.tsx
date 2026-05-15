function splitMix32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x9e3779b9) | 0;
    let t = s ^ (s >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 7) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2147483647;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

const BAYER_8: number[][] = [];

for (let r = 0; r < 8; r++) {
  BAYER_8[r] = [];
  for (let c = 0; c < 8; c++) {
    const x = c ^ r;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      v |= ((x >> k) & 1) << (2 * k);
    }
    BAYER_8[r][c] = v / 64;
  }
}

function bayer8(r: number, c: number, gridSize: number): number {
  const scale = gridSize / 8;
  const br = Math.floor(r / scale) % 8;
  const bc = Math.floor(c / scale) % 8;
  return BAYER_8[br][bc];
}

interface ShaderAvatarProps {
  name?: string | null;
  size?: number;
}

export function ShaderAvatar({ name, size = 80 }: ShaderAvatarProps) {
  const key = name ?? "?";
  const seed = hashSeed(key);
  const rng = splitMix32(seed);

  const hue0 = Math.floor(rng() * 360);
  const hue1 = (hue0 + 30 + Math.floor(rng() * 90)) % 360;
  const hue2 = (hue1 + 30 + Math.floor(rng() * 90)) % 360;
  const hue3 = (hue0 + 180 + Math.floor(rng() * 40 - 20)) % 360;

  const sat = 55 + Math.floor(rng() * 30);
  const midLight = 40 + Math.floor(rng() * 20);

  const colorStops = [
    { h: hue0, s: sat, l: midLight + 20 },
    { h: hue1, s: sat - 5, l: midLight + 8 },
    { h: hue2, s: sat + 5, l: midLight - 5 },
    { h: hue3, s: sat - 15, l: midLight - 18 },
    { h: (hue3 + 20) % 360, s: sat - 10, l: midLight - 30 },
  ];

  const waveFreq1 = 1.5 + rng() * 2.5;
  const waveFreq2 = 2 + rng() * 3;
  const waveAmp1 = 0.15 + rng() * 0.25;
  const waveAmp2 = 0.1 + rng() * 0.2;
  const radialWeight = 0.3 + rng() * 0.4;
  const angleWeight = 1 - radialWeight;
  const angleOffset = rng() * Math.PI * 2;
  const contrast = 1 + rng() * 1.5;

  const gridSize = 8 + Math.floor(rng() * 5);
  const cellSize = size / gridSize;
  const half = size / 2;
  const radius = half - 1;
  const cx = half;
  const cy = half;
  const cells: { x: number; y: number; fill: string }[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const px = col * cellSize;
      const py = row * cellSize;

      const nx = (col + 0.5) / gridSize - 0.5;
      const ny = (row + 0.5) / gridSize - 0.5;
      const dist = Math.sqrt(nx * nx + ny * ny) / Math.SQRT1_2;
      const angle = Math.atan2(ny, nx) + angleOffset;

      const radial = 1 - dist;
      const wave =
        Math.sin(angle * waveFreq1 + dist * 6) * waveAmp1 +
        Math.sin(nx * 8 + ny * 6 + waveFreq2) * waveAmp2;
      const angleGrad = (Math.sin(angle * 0.5) + 1) / 2;

      const raw = radial * radialWeight + angleGrad * angleWeight + wave * 0.5;
      const signal = clamp((raw - 0.3) * contrast + 0.3, 0, 1);

      const dither = bayer8(row, col, gridSize);
      const modulated = clamp(signal + (dither - 0.5) * 0.35, 0, 0.999);

      const stopIdx = Math.floor(modulated * (colorStops.length - 1));
      const t = modulated * (colorStops.length - 1) - stopIdx;
      const a = colorStops[Math.min(stopIdx, colorStops.length - 1)];
      const b = colorStops[Math.min(stopIdx + 1, colorStops.length - 1)];

      const h = a.h + ((b.h - a.h + 540) % 360 - 180) * t;
      const s = lerp(a.s, b.s, t);
      const l = lerp(a.l, b.l, t);
      const fill = `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;

      cells.push({ x: px, y: py, fill });
    }
  }

  const borderHue = (hue0 + 180) % 360;
  const clipId = `sa-${key.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Avatar for ${key}`}
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={radius} fill={cells[Math.floor(cells.length / 2)]?.fill ?? "#888"} />
      <g clipPath={`url(#${clipId})`}>
        {cells.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width={cellSize + 0.5}
            height={cellSize + 0.5}
            fill={c.fill}
          />
        ))}
      </g>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={`hsl(${borderHue}, ${sat - 10}%, ${midLight - 20}%)`}
        strokeWidth={1.5}
        opacity={0.3}
      />
    </svg>
  );
}
