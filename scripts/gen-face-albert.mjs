/** Gera faces/albert.png 256×256 (NEAREST-friendly pixel art). */
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

// transparent bg
fill(0, 0, W, H, 0, 0, 0, 0);
// face skin
fill(48, 40, 208, 230, 107, 63, 42);
// hair
fill(48, 40, 208, 78, 42, 26, 16);
// brows
fill(70, 100, 118, 112, 40, 24, 14);
fill(138, 100, 186, 112, 40, 24, 14);
// eyes
fill(78, 118, 110, 138, 20, 20, 20);
fill(146, 118, 178, 138, 20, 20, 20);
fill(86, 124, 102, 134, 110, 200, 255); // tech lens tint
fill(154, 124, 170, 134, 110, 200, 255);
// glasses frame
fill(66, 114, 190, 120, 18, 18, 18);
fill(66, 114, 72, 142, 18, 18, 18);
fill(184, 114, 190, 142, 18, 18, 18);
fill(110, 124, 146, 130, 18, 18, 18);
// nose
fill(118, 140, 138, 168, 90, 52, 34);
// mouth
fill(100, 186, 156, 196, 70, 40, 30);
// cheek tech tattoo / glyph
fill(58, 150, 78, 170, 110, 200, 255, 180);

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
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log("Wrote", out);
