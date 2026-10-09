import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width: number, height: number, bgColor: [number, number, number], fgColor: [number, number, number]): Buffer {
  // Simple uncompressed or raw filtered scanlines
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * bytesPerPixel;
      // Border radius check
      const cx = width / 2;
      const cy = height / 2;
      const r = width * 0.45;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Simple glyph in center
      const inCenter = Math.abs(dx) < width * 0.28 && Math.abs(dy) < height * 0.28;

      if (dist < r) {
        if (inCenter) {
          rawData[pxOffset] = fgColor[0];
          rawData[pxOffset + 1] = fgColor[1];
          rawData[pxOffset + 2] = fgColor[2];
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = bgColor[0];
          rawData[pxOffset + 1] = bgColor[1];
          rawData[pxOffset + 2] = bgColor[2];
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent outside
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG chunks
  function crc32(buf: Buffer): number {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return ~c >>> 0;
  }

  function makeChunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

// Write PNG icons (indigo on dark slate)
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, [30, 34, 50], [99, 102, 241]));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, [30, 34, 50], [99, 102, 241]));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, [18, 20, 30], [129, 140, 248]));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, [30, 34, 50], [99, 102, 241]));

// Also create clean SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#11131a"/>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="#161925" stroke="#312e81" stroke-width="12"/>
  <text x="50%" y="54%" font-family="monospace" font-size="190" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">k<tspan fill="#818cf8">No</tspan></text>
</svg>`;
fs.writeFileSync(path.join(pubDir, 'icon.svg'), svg, 'utf-8');
fs.writeFileSync(path.join(pubDir, 'favicon.svg'), svg, 'utf-8');

console.log('PWA icons generated successfully in public/');
