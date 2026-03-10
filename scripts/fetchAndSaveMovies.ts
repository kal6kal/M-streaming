// scripts/fetchAndSaveMovies.ts
import "dotenv/config";
import fetch from "node-fetch";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  setDoc,
  doc as firestoreDoc,
  getDoc,
} from "firebase/firestore";
import { writeFileSync } from "fs";

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (!API_KEY) {
  console.error("Missing REACT_APP_TMDB_API_KEY in .env");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/** Validate a value is acceptable for Firestore write (no undefined, no functions, no symbols) */
function isValidValue(v: any): boolean {
  const t = typeof v;
  if (v === null) return true;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(v)) {
    return v.every((el) => isValidValue(el));
  }
  if (t === "object") {
    // Date is allowed (client SDK will convert), but convert to ISO string to be safe
    if (v instanceof Date) return true;
    // plain object: ensure no undefined properties
    return Object.keys(v).every((k) => {
      const val = v[k];
      // disallow undefined, functions, symbols
      if (typeof val === "undefined") return false;
      if (typeof val === "function") return false;
      if (typeof val === "symbol") return false;
      return isValidValue(val);
    });
  }
  return false; // BigInt, function, symbol, undefined, etc. are invalid
}

/** Convert any Date to ISO string, replace undefined with null (defensive) */
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
      // convert undefined -> null to avoid INVALID_ARGUMENT
      out[k] = typeof val === "undefined" ? null : sanitizeDoc(val);
    }
    return out;
  }
  // fallback: convert to null
  return null;
}

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

        // Build document using safe defaults
        const docId = String(movie.id); // use TMDB id as document id to avoid duplicates
        const movieDoc = {
          tmdbId: movie.id,
          title: typeof movie.title === "string" ? movie.title : String(movie.title ?? "Untitled"),
          overview: movie.overview ?? "",
          poster_path: movie.poster_path ?? "",
          backdrop_path: movie.backdrop_path ?? "",
          release_date: movie.release_date ?? "",
          // trailerKey will be filled below
          trailerKey: null,
          // keep genre ids raw (numbers) as well as empty fallback
          genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids : [],
        };

        // fetch trailer safely
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
        } catch (e) {
          movieDoc.trailerKey = null;
        }

        // sanitize doc and ensure no undefined
        const safeDoc = sanitizeDoc(movieDoc);

        // final validation: ensure every value is acceptable
        if (!isValidValue(safeDoc)) {
          console.error("Document contains invalid values (will skip). Document preview:");
          console.dir(safeDoc, { depth: 3 });
          // write to file to inspect
          writeFileSync("bad_doc.json", JSON.stringify(safeDoc, null, 2), { encoding: "utf8" });
          console.error("Wrote bad_doc.json for inspection. Skipping this movie.");
          continue;
        }

        // OPTIONAL: check if a doc already exists with this id
        const docRef = firestoreDoc(db, "movies", docId);
        const existing = await getDoc(docRef);
        if (existing.exists()) {
          console.log("Already exists, skipping:", movie.title);
          continue;
        }

        // attempt to write using setDoc (deterministic id avoids duplicates)
        try {
          await setDoc(docRef, safeDoc);
          console.log("Saved:", movie.title, `(docId: ${docId})`);
        } catch (writeErr) {
          console.error("Write failed for document. Dumping doc to bad_doc.json and exiting.");
          writeFileSync("bad_doc.json", JSON.stringify(safeDoc, null, 2), { encoding: "utf8" });
          console.error("Write error:", writeErr);
          process.exit(1);
        }
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