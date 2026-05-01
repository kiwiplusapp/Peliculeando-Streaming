import axios from 'axios';

const KEY = process.env.OMDB_API_KEY || 'trilogy';

export interface OmdbRatings {
  imdbRating: string | null;
  imdbVotes: string | null;
  rottenTomatoes: string | null;
  metacritic: string | null;
  awards: string | null;
  boxOffice: string | null;
}

export async function getOmdbRatings(imdbId: string): Promise<OmdbRatings | null> {
  if (!imdbId) return null;
  try {
    const { data } = await axios.get('https://www.omdbapi.com/', {
      params: { apikey: KEY, i: imdbId, r: 'json' },
      timeout: 4000,
    });
    if (data.Response === 'False') return null;

    const rt = (data.Ratings as { Source: string; Value: string }[])?.find(
      r => r.Source === 'Rotten Tomatoes'
    );
    const mc = (data.Ratings as { Source: string; Value: string }[])?.find(
      r => r.Source === 'Metacritic'
    );

    return {
      imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
      imdbVotes: data.imdbVotes !== 'N/A' ? data.imdbVotes : null,
      rottenTomatoes: rt?.Value || null,
      metacritic: mc?.Value || null,
      awards: data.Awards !== 'N/A' ? data.Awards : null,
      boxOffice: data.BoxOffice !== 'N/A' ? data.BoxOffice : null,
    };
  } catch {
    return null;
  }
}
