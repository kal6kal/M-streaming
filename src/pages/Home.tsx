// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/Firebase";

interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  trailerKey?: string | null;
}

const Home = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      const snapshot = await getDocs(collection(db, "movies"));
      const movieList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Movie, "id">),
      }));
      setMovies(movieList);
      setLoading(false);
    };
    fetchMovies();
  }, []);

  if (loading) return <h2>Loading movies...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Popular Movies</h1>

      {/* Movie Grid */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {movies.map((movie) => (
          <div
            key={movie.id}
            style={{
              width: "200px",
              cursor: movie.trailerKey ? "pointer" : "default",
              textAlign: "center",
            }}
            onClick={() => movie.trailerKey && setSelectedTrailer(movie.trailerKey)}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <h3 style={{ fontSize: "16px", margin: "8px 0 4px" }}>{movie.title}</h3>
            <p style={{ fontSize: "14px", color: "#888" }}>{movie.release_date}</p>
          </div>
        ))}
      </div>

      {/* Modal Trailer */}
      {selectedTrailer && (
        <div
          onClick={() => setSelectedTrailer(null)} // close when clicking outside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside iframe
            style={{ position: "relative" }}
          >
            <iframe
              width="900"
              height="506"
              src={`https://www.youtube.com/embed/${selectedTrailer}?autoplay=1`}
              title="Movie Trailer"
              allow="autoplay; fullscreen"
              style={{ borderRadius: "8px" }}
            ></iframe>
            <button
              onClick={() => setSelectedTrailer(null)}
              style={{
                position: "absolute",
                top: "-40px",
                right: "0",
                padding: "8px 12px",
                background: "#ff3d00",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;