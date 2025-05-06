import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import pb from "../lib/pocketbase";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setUser(pb.authStore.model);
    pb.authStore.onChange(() => setUser(pb.authStore.model));
  }, []);

  const handleLogout = () => {
    pb.authStore.clear();
    router.push("/");
  };

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navbar}>
        <div style={styles.logo}>🧠 EduQuiz</div>
        <div style={styles.navItems}>
          <Link href="/" style={styles.navLink}>
            Home
          </Link>
          {user ? (
            <>
              <Link href="/protected" style={styles.navLink}>
                Dashboard
              </Link>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" style={styles.navLink}>
              Login
            </Link>
          )}
        </div>
      </nav>
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#f4f6fa",
    fontFamily: "'Segoe UI', sans-serif",
  },
  navbar: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
  },
  logo: {
    fontSize: "1.4rem",
    fontWeight: "bold",
  },
  navItems: {
    display: "flex",
    alignItems: "center",
    gap: "1.2rem",
  },
  navLink: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "1rem",
    transition: "color 0.2s",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "#ffffff",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "background 0.3s",
  },
  content: {
    padding: "2rem",
  },
};
