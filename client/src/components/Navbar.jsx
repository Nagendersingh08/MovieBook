import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { user } = useUser()
  const { openSignIn } = useClerk()
  const { shows, image_base_url } = useAppContext()

  const navigate = useNavigate()
  const location = useLocation()

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const searchResults = normalizedSearch
    ? shows.filter((movie) => {
        const titleMatch = movie.title?.toLowerCase().includes(normalizedSearch)
        const genreMatch = movie.genres?.some((genre) =>
          genre.name.toLowerCase().includes(normalizedSearch)
        )

        return titleMatch || genreMatch
      })
    : []

  const handleNavClick = () => {
    scrollTo(0, 0)
    setIsOpen(false)
    setIsSearchOpen(false)
  }

  const handleMyBookingsClick = () => {
    handleNavClick()

    if (user) {
      navigate('/my-bookings')
      return
    }

    openSignIn()
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    const query = searchTerm.trim()
    if (!query) return

    navigate(`/movies?q=${encodeURIComponent(query)}`)
    setIsSearchOpen(false)
    setSearchTerm('')
  }

  const handleSearchSelect = (movieId) => {
    navigate(`/movies/${movieId}`)
    setIsSearchOpen(false)
    setSearchTerm('')
    scrollTo(0, 0)
  }

  useEffect(() => {
    setIsSearchOpen(false)
    setSearchTerm('')
  }, [location.pathname])

  return (
    <div className='absolute inset-x-0 top-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-transparent'>
      <Link to='/' className='max-md:flex-1'>
        <img src={assets.logo} alt="" className='w-36 h-auto' />
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${
          isOpen ? 'max-md:w-full' : 'max-md:w-0'
        }`}
      >
        <XIcon
          className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer'
          onClick={() => setIsOpen(!isOpen)}
        />

        <Link onClick={handleNavClick} to='/'>Home</Link>
        <Link onClick={handleNavClick} to='/movies'>Movies</Link>
        <button onClick={handleMyBookingsClick} className='cursor-pointer'>My Bookings</button>
        {user && <Link onClick={handleNavClick} to='/favorite'>Favorites</Link>}
      </div>

      <div className='flex items-center gap-4 sm:gap-8'>
        <div className='relative'>
          <SearchIcon
            className='w-6 h-6 cursor-pointer'
            onClick={() => setIsSearchOpen((open) => !open)}
          />

          {isSearchOpen && (
            <div className='absolute right-0 top-10 w-[min(92vw,28rem)] rounded-2xl border border-white/10 bg-black/95 p-3 shadow-2xl backdrop-blur'>
              <form
                onSubmit={handleSearchSubmit}
                className='flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2'
              >
                <SearchIcon className='w-4 h-4 text-gray-400' />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder='Search movies or genres'
                  className='w-full bg-transparent outline-none text-sm'
                  autoFocus
                />
              </form>

              <div className='mt-3 max-h-80 overflow-y-auto space-y-2'>
                {normalizedSearch ? (
                  searchResults.length > 0 ? (
                    searchResults.slice(0, 6).map((movie) => (
                      <button
                        key={movie._id}
                        type='button'
                        onClick={() => handleSearchSelect(movie._id)}
                        className='flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5'
                      >
                        <img
                          src={`${image_base_url}${movie.poster_path || movie.backdrop_path || ''}`}
                          alt={movie.title}
                          className='h-12 w-12 rounded-lg object-cover'
                        />
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium'>{movie.title}</p>
                          <p className='truncate text-xs text-gray-400'>
                            {movie.genres?.slice(0, 2).map((genre) => genre.name).join(' • ')}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className='px-2 py-4 text-sm text-gray-400'>No matching movies found.</p>
                  )
                ) : (
                  <p className='px-2 py-4 text-sm text-gray-400'>Type a movie title or genre.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {!user ? (
          <button
            onClick={openSignIn}
            className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
          >
            Login
          </button>
        ) : (
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate('/my-bookings')}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      <MenuIcon
        className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer'
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  )
}

export default Navbar
