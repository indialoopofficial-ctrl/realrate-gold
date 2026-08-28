import fs from 'node:fs/promises';

const SOURCE_URL = 'https://www.ibjarates.com/';
const out = new URL('../public/rates.json', import.meta.url);

const plain = (html) => html
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

function matchRate(text, label) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = text.match(new RegExp(`${safe}\\s+(\\d{5,6})(?:\\s+(\\d{5,6}))?`, 'i'));
  return m ? Number(m[2] || m[1]) : null;
}

try {
  const res = await fetch(SOURCE_URL, { headers: { 'User-Agent': 'Mozilla/5.0 RealRate/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = plain(await res.text());
  const payload = {
    updatedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    source: 'IBJA benchmark rates',
    sourceUrl: SOURCE_URL,
    status: 'cached',
    gold999Per10g: matchRate(text, 'Gold 999'),
    gold916Per10g: matchRate(text, 'Gold 916'),
    gold750Per10g: matchRate(text, 'Gold 750'),
    silver999PerKg: matchRate(text, 'Silver 999'),
  };
  if (!payload.gold999Per10g || !payload.gold916Per10g || !payload.gold750Per10g || !payload.silver999PerKg) throw new Error('Could not parse IBJA values');
  await fs.writeFile(out, JSON.stringify(payload, null, 2) + '\n');
  console.log('Updated public/rates.json from IBJA');
} catch (error) {
  console.warn('Could not refresh rates; existing public/rates.json will be used:', error.message);
}
