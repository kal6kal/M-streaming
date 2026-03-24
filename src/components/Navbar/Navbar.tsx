import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav>
      <Link to="/" className="navbar-brand">T-Stream</Link>
      <div className="navbar-actions">
        
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>

        <Link to="/">Home</Link>
        {currentUser && <Link to="/fav">Favorites</Link>}
        
        {currentUser ? (
          <button onClick={logout} style={{ marginLeft: "10px" }}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
