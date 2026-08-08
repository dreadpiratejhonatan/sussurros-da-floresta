/** Gera faces/albert.png 256×256 — protagonista (óculos, barba, cabelo escuro). */
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

// transparent canvas
fill(0, 0, W, H, 0, 0, 0, 0);

// light–medium skin (photo reference)
fill(48, 40, 208, 230, 198, 154, 118);

// short dark wavy hair fringe
fill(48, 40, 208, 92, 42, 28, 20);
fill(56, 88, 88, 108, 42, 28, 20);
fill(168, 88, 200, 108, 42, 28, 20);

// brows
fill(72, 108, 118, 120, 48, 32, 24);
fill(138, 108, 184, 120, 48, 32, 24);

// eyes — dark brown
fill(78, 126, 112, 148, 36, 24, 18);
fill(144, 126, 178, 148, 36, 24, 18);
fill(86, 132, 104, 144, 72, 48, 32);
fill(152, 132, 170, 144, 72, 48, 32);
// catchlight
fill(98, 134, 104, 140, 220, 220, 210);
fill(164, 134, 170, 140, 220, 220, 210);

// prescription glasses frame only — lenses stay clear so eyes show
fill(64, 118, 192, 126, 18, 18, 20); // top rim
fill(64, 152, 192, 160, 18, 18, 20); // bottom rim
fill(64, 118, 72, 160, 18, 18, 20); // left
fill(184, 118, 192, 160, 18, 18, 20); // right
fill(124, 130, 132, 148, 18, 18, 20); // bridge
// no lens tint — eyes remain visible through clear glass

// nose
fill(116, 148, 140, 178, 170, 128, 98);

// mustache + short beard
fill(96, 182, 160, 196, 58, 40, 30);
fill(88, 196, 168, 224, 62, 44, 34);
fill(72, 200, 96, 222, 62, 44, 34);
fill(160, 200, 184, 222, 62, 44, 34);
// mouth line through mustache
fill(108, 188, 148, 196, 120, 80, 64);

// ears hint (sides of face plate)
fill(44, 130, 52, 168, 188, 144, 110);
fill(204, 130, 212, 168, 188, 144, 110);

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
