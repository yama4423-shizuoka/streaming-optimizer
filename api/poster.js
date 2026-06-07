export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { t } = req.query;
  if (!t) return res.status(400).json({ poster: null });

  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(500).json({ poster: null });

  try {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(t)}&api_key=${key}&language=ja-JP&include_adult=false&page=1`
    );
    const d = await r.json();
    const hit = (d.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');
    res.status(200).json({ poster: hit?.poster_path || null });
  } catch {
    res.status(200).json({ poster: null });
  }
}
