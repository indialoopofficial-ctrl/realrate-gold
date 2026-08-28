const SOURCE_URL = 'https://www.ibjarates.com/';

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function toPlainText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

function matchRate(text, label) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${safe}\\s+(\\d{5,6})(?:\\s+(\\d{5,6}))?`, 'i'));
  if (!match) return null;
  const am = Number(match[1]);
  const pm = match[2] ? Number(match[2]) : null;
  return pm || am;
}

function validate(gold999, gold916, gold750, silver999) {
  if (![gold999, gold916, gold750, silver999].every(Number.isFinite)) throw new Error('Missing rate values');
  if (gold999 < 50000 || gold999 > 500000) throw new Error('Gold 999 outside safety range');
  if (gold916 < 40000 || gold916 > gold999) throw new Error('Gold 916 outside safety range');
  if (gold750 < 30000 || gold750 > gold916) throw new Error('Gold 750 outside safety range');
  if (silver999 < 30000 || silver999 > 1000000) throw new Error('Silver 999 outside safety range');
}

export default async function handler(req, res) {
  try {
    const upstream = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 RealRate/1.0', Accept: 'text/html,*/*' },
    });
    if (!upstream.ok) throw new Error(`IBJA HTTP ${upstream.status}`);

    const text = toPlainText(await upstream.text());
    const gold999 = matchRate(text, 'Gold 999');
    const gold916 = matchRate(text, 'Gold 916');
    const gold750 = matchRate(text, 'Gold 750');
    const silver999 = matchRate(text, 'Silver 999');
    validate(gold999, gold916, gold750, silver999);

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.status(200).json({
      updatedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      source: 'IBJA benchmark rates',
      sourceUrl: SOURCE_URL,
      status: 'live',
      gold999Per10g: gold999,
      gold916Per10g: gold916,
      gold750Per10g: gold750,
      silver999PerKg: silver999,
    });
  } catch (error) {
    res.status(503).json({ error: 'Rate source temporarily unavailable', detail: String(error?.message || error) });
  }
}
