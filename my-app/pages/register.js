import { useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // Poprawiono nazwę zmiennej
  const [error, setError] = useState(null);

  const router = useRouter();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!validateEmail(email)) {
      setError("Invalid email format.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm, // Nie jest wymagane w Pocketbase, ale możemy go dodać, dla porządku
        emailVisibility: true,
      });

      router.push("/login");
    } catch (err) {
      console.error(err);

      if (err?.response?.data?.email) {
        setError("Email is already in use.");
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Register</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleRegister}>
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
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              style={styles.input}
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account?{" "}
          <a href="/login" style={styles.link}>
            Login
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
