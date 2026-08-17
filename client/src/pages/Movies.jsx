import React from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'
import { getGenreName } from '../lib/movieGenres'

const Movies = () => {

  const { shows } = useAppContext()
  const [searchParams] = useSearchParams()

  const searchQuery = searchParams.get('q')?.trim() || ''
  const normalizedSearch = searchQuery.toLowerCase()
  const filteredShows = normalizedSearch
    ? shows.filter((movie) => {
        const titleMatch = movie.title?.toLowerCase().includes(normalizedSearch)
        const genreMatch = movie.genres?.some((genre) =>
          getGenreName(genre).toLowerCase().includes(normalizedSearch)
        )

        return titleMatch || genreMatch
      })
    : shows

  return shows.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>

      <BlurCircle top="150px" left="0px"/>
      <BlurCircle bottom="50px" right="50px"/>

      <div className='my-4'>
        <h1 className='text-lg font-medium'>Now Showing</h1>
        {searchQuery && (
          <p className='mt-1 text-sm text-gray-400'>
            Showing results for "{searchQuery}"
          </p>
        )}
      </div>

      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {filteredShows.map((movie)=> (
          <MovieCard movie={movie} key={movie._id}/>
        ))}
      </div>

      {filteredShows.length === 0 && (
        <div className='mt-10 rounded-2xl border border-gray-300/20 bg-white/5 p-6 text-center text-gray-400'>
          No matching movies found.
        </div>
      )}
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No movies available</h1>
    </div>
  )
}

export default Movies
