// src/components/Navbar.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();

  return (
    <nav>
      <div>
        <Link to="/home">Home</Link>
        {currentUser && <Link to="/profile">Profile</Link>}
        {currentUser && <Link to="/fav">Favorites</Link>}
      </div>
      <div>
        {currentUser ? (
          <button onClick={logout}>Logout</button>
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