// src/pages/Home.tsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchBar from "../components/SearchBar/SearchBar";
import GenreSection from "../components/GenreSection/GenreSection";
import { Movie } from "../types/Movie";

const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<Movie[]>([]);
  const navigate = useNavigate();

  // Live search: fetch from TMDB API
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
    <div style={{ padding: "20px", minHeight: "100vh" }}>
      <h1 style={{ color: "#fff", marginBottom: "20px" }}>Discover</h1>

      <div style={{ position: "relative", maxWidth: "400px", marginBottom: "20px", marginLeft: "20px" }}>
        <SearchBar value={searchQuery} onSearch={handleSearch} />

        {autocompleteResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "40px",
              left: 0,
              width: "100%",
              backgroundColor: "#141414",
              border: "1px solid #333",
              borderRadius: "8px",
              maxHeight: "300px",
              overflowY: "auto",
              zIndex: 1000,
              boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
            }}
          >
            {autocompleteResults.map((item: any) => (
              <div
                key={`${item.media_type}-${item.id}`}
                onClick={() => handleSelectMovie(item.id, item.media_type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px",
                  cursor: "pointer",
                  borderBottom: "1px solid #333",
                  color: "#fff"
                }}
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                    alt={item.title}
                    style={{ width: "40px", borderRadius: "4px" }}
                  />
                ) : (
                  <div style={{ width: "40px", height: "60px", backgroundColor: "#333", borderRadius: "4px" }}></div>
                )}
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        )}
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
  );
};

export default Home;