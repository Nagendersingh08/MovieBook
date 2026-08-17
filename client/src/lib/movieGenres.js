const genreNamesById = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
}

export const getGenreName = (genre) => {
  if (!genre) return ''
  if (typeof genre === 'string') return genre
  if (typeof genre === 'number') return genreNamesById[genre] || ''
  return genre.name || genreNamesById[genre.id] || ''
}

export const formatGenres = (genres, limit) => {
  if (!Array.isArray(genres)) return ''

  const names = genres.map(getGenreName).filter(Boolean)
  return typeof limit === 'number' ? names.slice(0, limit).join(' | ') : names.join(', ')
}

