/** Gera faces/albert.png 256×256 — Albert: cabelo curto, óculos de lente clara, rosto limpo. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "faces", "albert.png");
const W = 256;
const H = 256;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const px = Buffer.alloc(W * H * 4);
const set = (x, y, r, g, b, a = 255) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = r;
  px[i + 1] = g;
  px[i + 2] = b;
  px[i + 3] = a;
};
const fill = (x0, y0, x1, y1, r, g, b, a = 255) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(x, y, r, g, b, a);
};
const ellipse = (cx, cy, rx, ry, r, g, b, a = 255) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(x, y, r, g, b, a);
    }
  }
};

const SKIN = [208, 172, 138];
const HAIR = [40, 28, 20];
const FRAME = [28, 28, 30];

fill(0, 0, W, H, 0, 0, 0, 0);
fill(44, 48, 212, 228, ...SKIN);

// Short hair with uneven fringe (reads as hair, not a cap)
fill(44, 40, 212, 76, ...HAIR);
const fringe = [
  [50, 72, 94],
  [70, 98, 88],
  [96, 124, 84],
  [122, 150, 86],
  [148, 178, 90],
  [172, 206, 96],
];
for (const [x0, x1, y1] of fringe) fill(x0, 72, x1, y1, ...HAIR);
fill(44, 76, 60, 148, ...HAIR);
fill(196, 76, 212, 148, ...HAIR);

// brows
fill(78, 110, 110, 118, 55, 38, 30);
fill(146, 110, 178, 118, 55, 38, 30);

// Eyes on skin — small iris/pupil (lenses stay clear: no white/dark fill)
ellipse(94, 136, 7, 7, 58, 40, 28);
ellipse(162, 136, 7, 7, 58, 40, 28);
ellipse(94, 136, 3, 3, 22, 16, 12);
ellipse(162, 136, 3, 3, 22, 16, 12);
set(96, 134, 235, 235, 225);
set(164, 134, 235, 235, 225);

// Thin rectangular frames — interior is untouched skin (true clear lenses)
const drawRim = (x0, y0, x1, y1, t = 2) => {
  fill(x0, y0, x1, y0 + t, ...FRAME);
  fill(x0, y1 - t, x1, y1, ...FRAME);
  fill(x0, y0, x0 + t, y1, ...FRAME);
  fill(x1 - t, y0, x1, y1, ...FRAME);
};
drawRim(72, 120, 116, 152, 2);
drawRim(140, 120, 184, 152, 2);
fill(116, 132, 140, 138, ...FRAME); // bridge
fill(64, 132, 72, 138, ...FRAME);
fill(184, 132, 192, 138, ...FRAME);

// nose
fill(118, 146, 138, 174, 190, 150, 118);
fill(122, 170, 134, 178, 175, 135, 105);

// Clean-shaven: no mustache / beard — only a soft lip line
fill(114, 194, 142, 200, 168, 120, 105);
fill(118, 196, 138, 198, 130, 85, 75);

// ears
fill(40, 128, 50, 168, 200, 160, 128);
fill(206, 128, 216, 168, 200, 160, 128);

const raw = Buffer.alloc((W * 4 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 4 + 1)] = 0;
  px.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
}
const compressed = zlib.deflateSync(raw);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 6;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log("Wrote", out);
