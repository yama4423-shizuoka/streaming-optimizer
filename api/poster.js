export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { t } = req.query;
  if (!t) return res.status(400).json({ poster: null });

  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(500).json({ poster: null });

  async function search(query) {
    const r = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${key}&include_adult=false&page=1`
    );
    const d = await r.json();
    return (d.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');
  }

  try {
    // まず日本語タイトルで検索、ヒットしなければ中黒を除いて再検索
    let hit = await search(t);
    if (!hit?.poster_path) {
      const simplified = t.replace(/[・･]/g, ' ').replace(/\s+/g, ' ').trim();
      if (simplified !== t) hit = await search(simplified);
    }
    res.status(200).json({ poster: hit?.poster_path || null });
  } catch {
    res.status(200).json({ poster: null });
  }
}
