// Generates the PWA icons (public/icons/icon-192.png, icon-512.png) in pure
// Node — a dark-blue tile with three ascending white bars. No dependencies.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = [15, 23, 42]; // slate-900, matches theme-color
const BAR = [96, 165, 250]; // accent blue
const DOT = [52, 211, 153]; // positive green

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let crc = -1;
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, draw) {
  // RGBA raster
  const raster = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x / size, y / size);
      const i = (y * size + x) * 4;
      raster[i] = r;
      raster[i + 1] = g;
      raster[i + 2] = b;
      raster[i + 3] = a;
    }
  }
  // Add filter byte per scanline
  const rows = [];
  for (let y = 0; y < size; y++) {
    rows.push(Buffer.from([0]), raster.subarray(y * size * 4, (y + 1) * size * 4));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Bars: [x0, x1, height] in unit coordinates (height from baseline 0.78)
const BARS = [
  [0.2, 0.34, 0.2],
  [0.43, 0.57, 0.34],
  [0.66, 0.8, 0.5],
];

function drawIcon(u, v) {
  // background fills the whole tile (maskable-safe)
  for (const [x0, x1, h] of BARS) {
    if (u >= x0 && u <= x1 && v <= 0.78 && v >= 0.78 - h) return [...BAR, 255];
  }
  // green dot above the tallest bar
  const dx = u - 0.73;
  const dy = v - 0.18;
  if (dx * dx + dy * dy < 0.045 * 0.045) return [...DOT, 255];
  return [...BG, 255];
}

mkdirSync('public/icons', { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(`public/icons/icon-${size}.png`, png(size, drawIcon));
  console.error(`wrote public/icons/icon-${size}.png`);
}
