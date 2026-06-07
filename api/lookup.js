export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'query too short' });
  }

  const key = process.env.TMDB_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
  }

  try {
    const sRes = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${key}&language=ja-JP&include_adult=false&page=1`
    );
    if (!sRes.ok) throw new Error('TMDb search ' + sRes.status);
    const sData = await sRes.json();

    const hits = (sData.results || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 6);

    const rows = await Promise.allSettled(hits.map(async r => {
      const pRes = await fetch(
        `https://api.themoviedb.org/3/${r.media_type}/${r.id}/watch/providers?api_key=${key}`
      );
      const pData = await pRes.json();
      const jp = pData?.results?.JP;
      return {
        title: r.title || r.name || '',
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        type: r.media_type === 'movie' ? '映画' : 'TV',
        providers: (jp?.flatrate || []).map(p => p.provider_name),
      };
    }));

    const results = rows
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
