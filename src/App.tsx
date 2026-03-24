import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import PrivateRoute from "./components/PrivateRoute";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails/MovieDetails";
import Fav from "./pages/Fav";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { FavProvider } from "./context/FavContext";

// Replace with a dynamic or hosted image in production
const BG_IMAGE_URL = "https://image.tmdb.org/t/p/original/9yTzXEIQ9mHWeQvM9bBfMawRjZg.jpg";

function Layout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      className={`app-container ${theme}`}
      style={{
        minHeight: "100vh",
        backgroundImage: `var(--bg-image-overlay), url(${BG_IMAGE_URL})`,
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        color: "var(--text-color)",
      }}
    >
      <Navbar />
      <div className="app-content">{children}</div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <FavProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Homepage */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />

              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Compatibility route */}
              <Route path="/home" element={<Navigate to="/" replace />} />

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

              {/* Catch-all: redirect unknown routes to homepage */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </Router>
      </FavProvider>
    </ThemeProvider>
  );
}

export default App;