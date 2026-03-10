import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useState } from "react";

type FormData = {
  email: string;
  password: string;
};

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [firebaseError, setFirebaseError] = useState("");

  const schema = yup.object({
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),

    password: yup
      .string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const handleRegister = async (data: FormData) => {
    try {
      setFirebaseError("");
      await registerUser(data.email, data.password);
      navigate("/home");
    } catch (error: any) {
      console.error("Register error:", error);
      setFirebaseError(error.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div
        style={{
          width: "400px",
          padding: "40px",
          borderRadius: "10px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          Create Account
        </h2>

        <form
          onSubmit={handleSubmit(handleRegister)}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <input
            type="email"
            placeholder="Email"
            {...register("email")}
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          {errors.email && (
            <p style={{ color: "red", fontSize: "14px" }}>
              {errors.email.message}
            </p>
          )}

          <input
            type="password"
            placeholder="Password"
            {...register("password")}
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc",
              fontSize: "16px",
            }}
          />

          {errors.password && (
            <p style={{ color: "red", fontSize: "14px" }}>
              {errors.password.message}
            </p>
          )}

          {firebaseError && (
            <p style={{ color: "red", fontSize: "14px" }}>
              {firebaseError}
            </p>
          )}

          <button
            type="submit"
            style={{
              padding: "10px",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#e50914",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", color: "#555" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#e50914", fontWeight: "bold" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}