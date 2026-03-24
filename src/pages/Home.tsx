import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar/SearchBar";
import GenreSection from "../components/GenreSection/GenreSection";
import HeroBanner from "../components/HeroBanner/HeroBanner";
import { Movie } from "../types/Movie";
import { useBackButton } from "../hooks/useBackButton";
import "./Home.css";

const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<Movie[]>([]);
  const navigate = useNavigate();

  useBackButton();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setAutocompleteResults([]);
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/search/multi?api_key=${TMDB_KEY}&language=en-US&query=${query}&page=1`
      );
      const results = res.data.results.filter(
        (item: any) => item.media_type === "movie" || item.media_type === "tv"
      );

      const searchResults: Movie[] = results.map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        overview: item.overview,
        release_date: item.release_date || item.first_air_date,
        genres: [],
        media_type: item.media_type,
      }));

      setAutocompleteResults(searchResults);
    } catch (err) {
      console.error("Search error:", err);
      setAutocompleteResults([]);
    }
  };

  const handleSelectMovie = (id: number, type?: string) => {
    navigate(`/${type || "movie"}/${id}`);
    setSearchQuery("");
    setAutocompleteResults([]);
  };

  const handleCardClick = (id: number, type: "movie" | "tv") => {
    navigate(`/${type}/${id}`);
  };

  return (
    <>
      <HeroBanner />
      <div className="home-page">
        <div className="home-top">
          <h1 className="home-title">Discover</h1>

          <div className="home-searchWrap">
            <SearchBar value={searchQuery} onSearch={handleSearch} />

            {autocompleteResults.length > 0 && (
              <div className="home-results">
                {autocompleteResults.map((item: any) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => handleSelectMovie(item.id, item.media_type)}
                    className="home-resultItem"
                  >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                    alt={item.title}
                    className="home-resultPoster"
                  />
                ) : (
                  <div className="home-resultPosterFallback"></div>
                )}
                <span>{item.title}</span>
              </div>
                ))}
              </div>
            )}
          </div>
        </div>

      <GenreSection  
        title="Action Movies" 
        fetchUrl="/discover/movie?with_genres=28&language=en-US" 
        onMovieClick={handleCardClick} 
        mediaType="movie" 
      />
      <GenreSection 
        title="Popular TV Series" 
        fetchUrl="/discover/tv?with_genres=10759&language=en-US" 
        onMovieClick={handleCardClick} 
        mediaType="tv" 
      />
      <GenreSection 
        title="Animation & Anime" 
        fetchUrl="/discover/movie?with_genres=16&with_original_language=ja&language=en-US" 
        onMovieClick={handleCardClick} 
        mediaType="movie" 
      />
      <GenreSection 
        title="Comedy" 
        fetchUrl="/discover/movie?with_genres=35&language=en-US" 
        onMovieClick={handleCardClick} 
        mediaType="movie" 
      />
      </div>
    </>
  );
};

export default Home;
