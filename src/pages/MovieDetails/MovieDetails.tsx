// src/pages/MovieDetails/MovieDetails.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Movie } from "../../types/Movie";
import TrailerModal from "../../components/TrailerModal/TrailerModal";

const TMDB_KEY = process.env.REACT_APP_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const BACKEND_URL = "http://127.0.0.1:8000"; // FastAPI backend

const MovieDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState(""); 
  const [showTrailer, setShowTrailer] = useState(false);

  const mediaType = location.pathname.includes("/tv/") ? "tv" : "movie";

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      try {
        const res = await axios.get(
          `${BASE_URL}/${mediaType}/${id}?api_key=${TMDB_KEY}&language=en-US`
        );
        const data = res.data;

        const trailerRes = await axios.get(
          `${BASE_URL}/${mediaType}/${id}/videos?api_key=${TMDB_KEY}&language=en-US`
        );
        const trailer = trailerRes.data.results.find(
          (vid: any) => vid.type === "Trailer" && vid.site === "YouTube"
        );

        const genres = data.genres.map((g: any) => g.name);

        setMovie({
          id: data.id,
          title: data.title || data.name,
          overview: data.overview,
          poster_path: data.poster_path, // maybe also backdrop_path if needed
          release_date: data.release_date || data.first_air_date,
          trailerKey: trailer ? trailer.key : null,
          genres,
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, mediaType]);

  if (loading) return <h2 style={{ padding: "100px 20px" }}>Loading details...</h2>;
  if (!movie) return <h2 style={{ padding: "100px 20px" }}>Not found</h2>;

  const handleDownload = async () => {
    if (!movie) return;

    try {
      const res = await axios.post(`${BACKEND_URL}/search_movie`, { title: movie.title });
      console.log(res.data);
      setConfirmation(`✅ Sent "${movie.title}" to Telegram bot!`);
      setTimeout(() => setConfirmation(""), 5000);
    } catch (err: any) {
      console.error("Failed to send:", err);
      setConfirmation(`❌ Failed to send "${movie.title}"`);
      setTimeout(() => setConfirmation(""), 5000);
    }
  };

  return (
    <div style={{ padding: "20px 40px", position: "relative" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: "20px", background: "none", border: "1px solid #fff", color: "#fff" }}
      >
        ← Back
      </button>

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", marginTop: "20px" }}>
        {/* Poster */}
        {movie.poster_path && (
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            style={{ width: "300px", borderRadius: "10px", boxShadow: "0 0 15px rgba(0,0,0,0.5)" }} 
          />
        )}
        
        {/* Details */}
        <div style={{ flex: 1, minWidth: "300px" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>{movie.title}</h1>
          <p style={{ fontSize: "1.2rem", color: "#ccc", marginBottom: "15px" }}>{movie.release_date}</p>
          <p style={{ marginBottom: "20px", fontWeight: "bold" }}>{movie.genres.join(" • ")}</p>
          <p style={{ fontSize: "1.1rem", lineHeight: "1.5", marginBottom: "30px", maxWidth: "800px" }}>
            {movie.overview}
          </p>

          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            {movie.trailerKey && (
              <button
                onClick={() => setShowTrailer(true)}
                style={{
                  padding: "12px 25px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                ▶ Play Trailer
              </button>
            )}

            <button
              onClick={handleDownload}
              style={{
                padding: "12px 25px",
                fontSize: "18px",
                fontWeight: "bold",
                backgroundColor: "rgba(109, 109, 110, 0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              ⬇ Download via Telegram
            </button>
          </div>

          {confirmation && (
            <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#333", borderLeft: "4px solid #4CAF50", borderRadius: "4px" }}>
              {confirmation}
            </div>
          )}
        </div>
      </div>

      {showTrailer && movie.trailerKey && (
        <TrailerModal trailerKey={movie.trailerKey} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
};

export default MovieDetails;