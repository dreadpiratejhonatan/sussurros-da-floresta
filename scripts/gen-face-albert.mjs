/** Gera faces/albert.png 256×256 — traços humanos / indígenas, sem óculos tech. */
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

fill(0, 0, W, H, 0, 0, 0, 0);
// skin
fill(52, 44, 204, 228, 118, 72, 48);
// hair fringe
fill(52, 44, 204, 86, 28, 16, 10);
// brows
fill(74, 104, 116, 116, 36, 22, 14);
fill(140, 104, 182, 116, 36, 22, 14);
// eyes — warm dark, no cyan lenses
fill(82, 120, 108, 140, 28, 18, 12);
fill(148, 120, 174, 140, 28, 18, 12);
fill(90, 128, 102, 136, 90, 160, 110); // soft green iris hint
fill(156, 128, 168, 136, 90, 160, 110);
// nose
fill(118, 142, 138, 172, 95, 55, 36);
// mouth
fill(104, 188, 152, 198, 80, 45, 32);
// ochre face paint marks (ancestral, not tech)
fill(60, 148, 78, 168, 184, 106, 42, 200);
fill(178, 148, 196, 168, 184, 106, 42, 200);
fill(118, 96, 138, 108, 184, 106, 42, 160);

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
