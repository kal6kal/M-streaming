import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { Movie } from "../../types/Movie";
import MovieCard from "../MovieCard/MovieCard";

interface GenreSectionProps {
  title: string;
  fetchUrl: string; // e.g., `/discover/movie?with_genres=28`
  onMovieClick: (id: number, type: "movie" | "tv") => void;
  mediaType: "movie" | "tv";
}

const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const GenreSection: React.FC<GenreSectionProps> = ({ title, fetchUrl, onMovieClick, mediaType }) => {
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);
  
  const lastItemElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // If the last element is intersecting and we have more pages, load the next page
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, { rootMargin: "200px" }); // Start loading before it fully enters the viewport
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}${fetchUrl}&api_key=${TMDB_KEY}&page=${page}`);
        
        const newItems: Movie[] = res.data.results.map((item: any) => ({
          ...item,
          title: item.title || item.name, // Handle TV series name vs movie title
          poster_path: item.poster_path, // Could be null
          id: item.id
        })).filter((item: any) => item.poster_path !== null); // Remove items without a poster
        
        setItems(prev => {
          // Merge arrays and filter out duplicate IDs
          const uniqueItems = [...prev, ...newItems].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
          return uniqueItems;
        });
        
        setHasMore(res.data.page < res.data.total_pages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching genre:", title, error);
        setLoading(false);
      }
    };
    
    fetchItems();
  }, [fetchUrl, page, title]);

  return (
    <div style={{ marginBottom: "40px", padding: "0 20px" }}>
      <h2 style={{ color: "#fff", marginBottom: "15px", fontSize: "1.5rem", fontWeight: "bold" }}>{title}</h2>
      
      <div 
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "15px",
          paddingBottom: "20px",
          scrollbarWidth: "none", // Firefox
          WebkitOverflowScrolling: "touch",
        }}
        className="hide-scrollbar"
      >
        {items.map((item, index) => {
          if (items.length === index + 1) {
            return (
              <div ref={lastItemElementRef} key={`${item.id}-${index}`}>
                <MovieCard movie={item} onClick={() => onMovieClick(item.id, mediaType)} />
              </div>
            );
          } else {
            return (
              <MovieCard key={`${item.id}-${index}`} movie={item} onClick={() => onMovieClick(item.id, mediaType)} />
            );
          }
        })}
        {loading && <div style={{ minWidth: "160px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>}
      </div>
    </div>
  );
};

export default GenreSection;
