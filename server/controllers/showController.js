import axios from "axios"

import https from "https";

import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// API to get now playing movies from TMDB API

let cachedMovies = null;

const tmdbAgent = new https.Agent({
    family: 4,
    keepAlive: false,
    minVersion: "TLSv1.2",
});

const tmdbRequestConfig = () => ({
    headers: {
        Accept: "application/json",
        "User-Agent": "MovieBook/1.0",
        ...(process.env.TMDB_API_KEY?.startsWith("eyJ")
            ? { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
            : {}),
    },
    ...(process.env.TMDB_API_KEY?.startsWith("eyJ")
        ? {}
        : { params: { api_key: process.env.TMDB_API_KEY } }),
    httpsAgent: tmdbAgent,
    timeout: 15000,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchFromTmdb = async (url) => {
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
            return await axios.get(url, tmdbRequestConfig());
        } catch (error) {
            lastError = error;
            if (attempt < 2) {
                await wait(750);
            }
        }
    }

    throw lastError;
};

const buildMoviePayload = (movieId, movieData = {}, creditsData = {}) => ({
    _id: String(movieId),
    title: movieData.title || movieData.name || "Untitled",
    overview: movieData.overview || "No overview available.",
    poster_path: movieData.poster_path || movieData.backdrop_path || "/placeholder.jpg",
    backdrop_path: movieData.backdrop_path || movieData.poster_path || "/placeholder.jpg",
    genres: movieData.genres || movieData.genre_ids || [],
    casts: movieData.casts || creditsData.cast || [],
    release_date: movieData.release_date || movieData.first_air_date || "Unknown",
    original_language: movieData.original_language || "",
    tagline: movieData.tagline || "",
    vote_average: movieData.vote_average || 0,
    runtime: movieData.runtime || 0,
});

const fetchMovieDetails = async (movieId) => {
    const movieDetailsResponse = await fetchFromTmdb(`https://api.themoviedb.org/3/movie/${movieId}`);
    const movieCreditsResponse = await fetchFromTmdb(`https://api.themoviedb.org/3/movie/${movieId}/credits`);

    return buildMoviePayload(movieId, movieDetailsResponse.data, movieCreditsResponse.data);
};

const fetchMovieMetadata = async (movieId) => {
    const movieDetailsResponse = await fetchFromTmdb(`https://api.themoviedb.org/3/movie/${movieId}`);

    return {
        runtime: movieDetailsResponse.data.runtime || 0,
        genres: movieDetailsResponse.data.genres || [],
    };
};

const hasGenreNames = (genres) => (
    Array.isArray(genres) && genres.length > 0 && genres.every((genre) => genre?.name)
);

const updateMovieMetadata = async (movie) => {
    if(!movie || (movie.runtime > 0 && hasGenreNames(movie.genres))){
        return movie;
    }

    try {
        const metadata = await fetchMovieMetadata(movie._id);
        let shouldSave = false;

        if((!movie.runtime || movie.runtime <= 0) && metadata.runtime > 0){
            movie.runtime = metadata.runtime;
            shouldSave = true;
        }

        if(!hasGenreNames(movie.genres) && metadata.genres.length > 0){
            movie.genres = metadata.genres;
            shouldSave = true;
        }

        if(shouldSave){
            await movie.save();
        }
    } catch (error) {
        console.error(`Movie metadata update failed for movie ${movie._id}:`, error.message);
    }

    return movie;
};

const formatMovieForNowPlaying = (movie) => ({
    id: movie._id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    genre_ids: movie.genres,
    release_date: movie.release_date,
    original_language: movie.original_language,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count || 0,
    runtime: movie.runtime || 0,
});

export const getNowPlayingMovies = async (req, res) => {
    try {
        const response = await fetchFromTmdb('https://api.themoviedb.org/3/movie/now_playing');

        cachedMovies = response.data.results;

        res.json({
            success: true,
            movies: cachedMovies
        });

    } catch (error) {
        console.error("TMDB Error:", error.message);

        // If TMDB is temporarily unavailable,
        // use the last successful TMDB result.
        if (cachedMovies) {
            return res.json({
                success: true,
                movies: cachedMovies
            });
        }

        const savedMovies = await Movie.find({})
            .sort({ createdAt: -1 })
            .limit(20);

        if(savedMovies.length > 0){
            return res.json({
                success: true,
                movies: savedMovies.map(formatMovieForNowPlaying)
            });
        }

        res.json({
            success: false,
            message: "Unable to load now playing movies. Please try again later."
        });
    }
};


// API to add a new show to the database
export const addShow = async (req, res) =>{

    try {
        const {movieId, movie: movieData, showsInput, showPrice} = req.body

        if(!movieId || !Array.isArray(showsInput) || showsInput.length === 0 || !showPrice){
            return res.json({success: false, message: "Missing required fields."})
        }

        let movie = await Movie.findById(movieId)

        if(!movie) {
            let movieDetails = null;

            try {
                movieDetails = await fetchMovieDetails(movieId);
            } catch (error) {
                if(!movieData){
                    throw error;
                }

                console.error("TMDB movie details error:", error.message);
            }

            // Add movie to the database. Use the selected now-playing movie as a safe fallback.
            movie = await Movie.create(movieDetails || buildMoviePayload(movieId, movieData));
        }else{
            movie = await updateMovieMetadata(movie);
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            const times = Array.isArray(show.time) ? show.time : [];

            times.forEach((time)=>{
                const dateTimeString = `${showDate}T${time}`;
                const showDateTime = new Date(dateTimeString);

                if(!Number.isNaN(showDateTime.getTime())){
                    showsToCreate.push({
                        movie: movie._id,
                        showDateTime,
                        showPrice: Number(showPrice),
                        occupiedSeats: {}
                    })
                }
            })
        });

        if(showsToCreate.length === 0){
            return res.json({success: false, message: "Please select at least one valid show time."})
        }

        await Show.insertMany(showsToCreate);

         //  Trigger Inngest event
         try {
            await inngest.send({
                name: "app/show.added",
                data: {movieTitle: movie.title}
            })
         } catch (error) {
            console.error("Inngest show notification error:", error.message);
         }

        res.json({success: true, message: 'Show Added successfully.'})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows from the database
export const getShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({ showDateTime: 1 });

        // Keep only one card per movie.
        const uniqueMovies = new Map();

        shows.forEach((show) => {
            if(show.movie){
                uniqueMovies.set(String(show.movie._id), show.movie);
            }
        });

        const movies = await Promise.all(
            Array.from(uniqueMovies.values()).map(updateMovieMetadata)
        );

        res.json({success: true, shows: movies})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) =>{
    try {
        const {movieId} = req.params;
        // get all upcoming shows for the movie
        const shows = await Show.find({movie: movieId, showDateTime: { $gte: new Date() }})

        const movie = await updateMovieMetadata(await Movie.findById(movieId));
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
