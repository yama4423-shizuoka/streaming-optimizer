export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { t } = req.query;
  if (!t) return res.status(400).json({ poster: null });

  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`,
      { headers: { 'User-Agent': 'streaming-optimizer/1.0 (contact@example.com)' } }
    );
    const d = await r.json();
    res.status(200).json({ poster: d?.thumbnail?.source || null });
  } catch {
    res.status(200).json({ poster: null });
  }
}
