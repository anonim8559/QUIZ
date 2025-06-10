import { useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const authData = await pb
        .collection("users")
        .authWithPassword(email, password);
      const userId = authData.record.id;

      const newSession = await pb.collection("sessions").create({
        user: userId,
        quiz_count: 0,
        quiz_history: [],
        duration: 0,
      });

      localStorage.setItem("activeSessionId", newSession.id);
      localStorage.setItem("sessionStart", new Date().toISOString());

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        <p style={styles.footer}>
          Don't have an account?{" "}
          <a href="/register" style={styles.link}>
            Register
          </a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    fontFamily: "'Roboto', sans-serif",
  },
  card: {
    background: "linear-gradient(135deg, #ffffff, #e6e6f1)",
    padding: "2rem",
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },
  header: {
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333",
  },
  inputGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    fontSize: "1.1rem",
    fontWeight: "500",
    color: "#333",
    display: "block",
    marginBottom: "0.5rem",
  },
  input: {
    width: "100%",
    padding: "1rem",
    fontSize: "1.2rem",
    border: "2px solid #ccc",
    borderRadius: "10px",
    boxSizing: "border-box",
    color: "gray",
  },
  button: {
    padding: "1rem 2rem",
    fontSize: "1.2rem",
    cursor: "pointer",
    border: "none",
    borderRadius: "20px",
    backgroundColor: "#007bff",
    color: "white",
    transition: "background 0.3s",
    width: "100%",
  },
  error: {
    color: "#dc3545",
    marginBottom: "1rem",
  },
  footer: {
    marginTop: "1rem",
    fontSize: "1.1rem",
    color: "#333",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};
