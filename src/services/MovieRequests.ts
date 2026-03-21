import { db } from "./Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logMovieRequest = async (movieTitle: string, userId: string) => {
  try {
    const docRef = await addDoc(collection(db, "movie_requests"), {
      movie: movieTitle,
      userId,
      timestamp: serverTimestamp(),
    });
    console.log("Movie request logged with ID: ", docRef.id);
  } catch (e) {
    console.error("Error logging movie request: ", e);
  }
};