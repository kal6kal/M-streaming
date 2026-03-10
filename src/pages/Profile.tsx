// src/pages/Profile.tsx
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { currentUser } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Profile Page</h1>
      <p>Email: {currentUser?.email}</p>
    </div>
  );
}