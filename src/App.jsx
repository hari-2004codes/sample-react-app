import Search from "./components/search";
import { use, useEffect, useState } from "react";
import Spinner from "./components/spinner";
import MovieCard from "./components/moviecard";
import {useDebounce} from 'react-use'
import { getTrendingMovies, updateSearchCount } from "../appwrite";
// This is a React application that fetches and displays movies from The Movie Database (TMDB) API.
const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY =  import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};



const App = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const [errormessage, setErrorMessage] = useState('');

  const [movielist, setMovieList] = useState([]);

  const [loading, setLoading] = useState(false); 
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [TrendingMovies, setTrendingMovies] = useState(['']);

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm);
  }, 500, [searchTerm]); // Debounce the search term for 500ms
  // This function fetches movies from the TMDB API based on the search term.

  const fetchMovies = async (query= "") => {
    setLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}` : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
      
      const response = await fetch(endpoint, API_OPTIONS);
      
      if(!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      console.log(data);

      if (data.results && data.results.length === 0 && query) {
        setErrorMessage(`No movies found for "${query}"`);
        setMovieList([]);
        return;
      }
      setMovieList(data.results || []);

      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Failed to fetch movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingMovies = async () => { 
    try {
      const trendingMovies_list = await getTrendingMovies();
      setTrendingMovies(trendingMovies_list);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);
//whenever the searchTerm changes, fetchMovies will be called with the new searchTerm with the updated query

  useEffect(() => {
    fetchTrendingMovies();
  }, []); // Fetch trending movies only once when the component mounts

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="hero banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {TrendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {TrendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="all-movies">
          <h2>Search Result for {searchTerm} </h2>

          {loading ? (<Spinner />) : errormessage ? <p className="text-red-500">{errormessage}</p> 
          : (
            <ul>
              {movielist.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
export default App;