/** Gera faces/albert.png 256×256 — guia da mata, pintura de argila e olhos âmbar. */
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
// copper-brown skin (darker than b005 — clear prod test)
fill(52, 44, 204, 228, 96, 54, 34);
// black hair fringe
fill(52, 44, 204, 90, 18, 10, 6);
// brows
fill(74, 100, 118, 114, 28, 16, 10);
fill(138, 100, 182, 114, 28, 16, 10);
// eyes — warm amber iris (was green)
fill(82, 120, 110, 142, 22, 12, 8);
fill(146, 120, 174, 142, 22, 12, 8);
fill(90, 128, 104, 138, 210, 150, 55);
fill(154, 128, 168, 138, 210, 150, 55);
// nose
fill(116, 144, 140, 174, 78, 42, 26);
// mouth
fill(104, 190, 152, 200, 70, 36, 28);
// white clay forehead stripe (ancestral mark — very visible)
fill(108, 88, 148, 108, 232, 220, 190, 230);
// red ochre cheek bars (prod-visible paint)
fill(54, 150, 82, 178, 176, 58, 32, 220);
fill(174, 150, 202, 178, 176, 58, 32, 220);
// small spirit dot under left eye
fill(88, 148, 100, 160, 120, 200, 140, 200);

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
