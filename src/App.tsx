import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails/MovieDetails";
import Profile from "./pages/Profile";
import Fav from "./pages/Fav";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";

// Replace with a dynamic or hosted image in production
const BG_IMAGE_URL = "https://image.tmdb.org/t/p/original/9yTzXEIQ9mHWeQvM9bBfMawRjZg.jpg";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${BG_IMAGE_URL})`,
      backgroundSize: "cover",
      backgroundAttachment: "fixed",
      backgroundPosition: "center",
      color: "#fff"
    }}>
      {/* Fixed Logo Example */}
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 1100 }}>
         <h2 style={{ color: "#E50914", margin: 0, fontWeight: "bold", textShadow: "2px 2px 4px #000" }}>M-STREAMING</h2>
      </div>
      <Navbar />
      <div style={{ paddingTop: "80px" }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Redirect root to /home */}
          <Route path="/" element={<Navigate to="/home" />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/fav"
            element={
              <PrivateRoute>
                <Fav />
              </PrivateRoute>
            }
          />

          {/* Movie & TV Details page (protected) */}
          <Route
            path="/movie/:id"
            element={
              <PrivateRoute>
                <MovieDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/tv/:id"
            element={
              <PrivateRoute>
                <MovieDetails />
              </PrivateRoute>
            }
          />

          {/* Catch-all: redirect unknown routes to /home */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;