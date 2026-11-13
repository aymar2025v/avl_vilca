// Descarga Vue a js/vendor/ para que el simulador funcione SIN Internet:   node tools/fetch-vue.mjs
import { mkdir, writeFile } from 'node:fs/promises';
const VERSION = '3.5.13';
const res = await fetch(`https://cdn.jsdelivr.net/npm/vue@${VERSION}/dist/vue.esm-browser.prod.js`);
if (!res.ok) throw new Error(`No se pudo descargar Vue (HTTP ${res.status})`);
const dir = new URL('../js/vendor/', import.meta.url);
await mkdir(dir, { recursive: true });
await writeFile(new URL('vue.esm-browser.prod.js', dir), Buffer.from(await res.arrayBuffer()));
console.log(`Vue ${VERSION} guardado en js/vendor/ — ya no se necesita Internet.`);
