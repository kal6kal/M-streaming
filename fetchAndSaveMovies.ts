// scripts/fetchAndSaveMovies.ts
import "dotenv/config";
import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import { getFirestore, doc as firestoreDoc, setDoc, getDoc } from "firebase/firestore";
import { writeFileSync } from "fs";

// =========================
// 1️⃣ TMDB API KEY
// =========================
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
if (!API_KEY) {
  console.error("Missing REACT_APP_TMDB_API_KEY in .env");
  process.exit(1);
}

// =========================
// 2️⃣ Firebase config + validation
// =========================
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAvP15awrxJjVPj9TjuRtsgJud3F95BVZU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "react-4f889.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "react-4f889",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "react-4f889.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_ID || "120193257603",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:120193257603:web:47cba460f876cc5c0d0bb6",
};

// Validate that all keys are defined
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error("Missing Firebase config keys:", missingKeys.join(", "));
  process.exit(1);
}

console.log("Firebase config OK, initializing Firestore...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================
// 3️⃣ Helper functions
// =========================
function isValidValue(v: any): boolean {
  const t = typeof v;
  if (v === null) return true;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(v)) return v.every((el) => isValidValue(el));
  if (t === "object") {
    if (v instanceof Date) return true;
    return Object.keys(v).every((k) => {
      const val = v[k];
      if (typeof val === "undefined") return false;
      if (typeof val === "function") return false;
      if (typeof val === "symbol") return false;
      return isValidValue(val);
    });
  }
  return false;
}

function sanitizeDoc(obj: any): any {
  if (obj === null) return null;
  const t = typeof obj;
  if (t === "string" || t === "number" || t === "boolean") return obj;
  if (Array.isArray(obj)) return obj.map((el) => sanitizeDoc(el));
  if (obj instanceof Date) return obj.toISOString();
  if (t === "object") {
    const out: any = {};
    for (const k of Object.keys(obj)) {
      const val = obj[k];
      out[k] = typeof val === "undefined" ? null : sanitizeDoc(val);
    }
    return out;
  }
  return null;
}

// =========================
// 4️⃣ Main async function
// =========================
(async () => {
  try {
    console.log("Fetching popular movies (TMDB page 1)...");
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`
    );
    if (!res.ok) {
      console.error("TMDB API error", res.status, res.statusText);
      process.exit(1);
    }

    const data: any = await res.json();
    if (!data || !Array.isArray(data.results)) {
      console.error("TMDB returned unexpected data:", data);
      process.exit(1);
    }

    for (const movie of data.results) {
      try {
        if (!movie || !movie.id) {
          console.log("Skipping invalid movie entry:", movie);
          continue;
        }

        // Build document
        const docId = String(movie.id);
        const movieDoc = {
          tmdbId: movie.id,
          title: typeof movie.title === "string" ? movie.title : String(movie.title ?? "Untitled"),
          overview: movie.overview ?? "",
          poster_path: movie.poster_path ?? "",
          backdrop_path: movie.backdrop_path ?? "",
          release_date: movie.release_date ?? "",
          trailerKey: null,
          genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
        };

        // Fetch trailer
        try {
          const trailerRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`
          );
          if (trailerRes.ok) {
            const trailerData: any = await trailerRes.json();
            const trailer = Array.isArray(trailerData.results)
              ? trailerData.results.find((v: any) => v?.type === "Trailer" && v?.site === "YouTube")
              : undefined;
            movieDoc.trailerKey = trailer?.key ?? null;
          } else {
            movieDoc.trailerKey = null;
          }
        } catch {
          movieDoc.trailerKey = null;
        }

        // Sanitize doc
        const safeDoc = sanitizeDoc(movieDoc);

        // Validate
        if (!isValidValue(safeDoc)) {
          console.error("Invalid document, writing bad_doc.json and skipping.");
          writeFileSync("bad_doc.json", JSON.stringify(safeDoc, null, 2), { encoding: "utf8" });
          continue;
        }

        // Firestore: check if exists and write
        const docRef = firestoreDoc(db, "movies", docId);
        const existing = await getDoc(docRef);
        if (existing.exists()) {
          console.log("Already exists, skipping:", movie.title);
          continue;
        }

        await setDoc(docRef, safeDoc);
        console.log("Saved:", movie.title, `(docId: ${docId})`);

      } catch (innerErr) {
        console.error("Error processing movie entry:", innerErr);
      }
    }

    console.log("Done.");
    process.exit(0);

  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
})();