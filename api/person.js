export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { q } = req.query;
  if (!q || q.length < 2) return res.status(400).json({ error: 'query too short' });

  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });

  try {
    // 出演者検索
    const pRes = await fetch(
      `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(q)}&api_key=${key}&language=ja-JP&page=1`
    );
    const pData = await pRes.json();
    const person = (pData.results || [])[0];
    if (!person) return res.status(200).json({ person: null, results: [] });

    // 出演作品取得
    const cRes = await fetch(
      `https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${key}&language=ja-JP`
    );
    const cData = await cRes.json();

    const works = (cData.cast || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 8);

    // 各作品の配信サービスを並行取得
    const rows = await Promise.allSettled(works.map(async w => {
      const wRes = await fetch(
        `https://api.themoviedb.org/3/${w.media_type}/${w.id}/watch/providers?api_key=${key}`
      );
      const wData = await wRes.json();
      const jp = wData?.results?.JP;
      return {
        title: w.title || w.name || '',
        year: (w.release_date || w.first_air_date || '').slice(0, 4),
        type: w.media_type === 'movie' ? '映画' : 'TV',
        providers: (jp?.flatrate || []).map(p => p.provider_name),
      };
    }));

    res.status(200).json({
      person: { name: person.name, jaName: q },
      results: rows.filter(r => r.status === 'fulfilled').map(r => r.value),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
