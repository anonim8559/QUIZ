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
        <div style={styles.logo} onClick={() => router.push("/")}>
          🧠 EduQuiz
        </div>
        <div style={styles.navItems}>
          {user ? (
            <>
              <Link href="/protected" style={styles.dashboardLink}>
                <span role="img" aria-label="dashboard">
                  📊
                </span>{" "}
                Dashboard
              </Link>
              <button onClick={handleLogout} style={styles.logoutButton}>
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/login")}
              style={styles.loginButton}
            >
              Login
            </button>
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
    backgroundColor: "#eef2f7",
    fontFamily: "'Roboto', sans-serif",
  },
  navbar: {
    background: "linear-gradient(135deg, #ffffff, #e6e6f1)",
    color: "#333",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
    borderRadius: "0 0 20px 20px",
  },
  logo: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#333",
    letterSpacing: "1px",
    cursor: "pointer",
  },
  navItems: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  navLink: {
    color: "#333",
    textDecoration: "none",
    fontSize: "1.1rem",
    fontWeight: "500",
    transition: "color 0.3s",
  },
  loginButton: {
    backgroundColor: "#34d399",
    border: "none",
    color: "#ffffff",
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "background-color 0.3s",
  },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    border: "none",
    color: "#ffffff",
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "500",
    transition: "background-color 0.3s",
  },
  dashboardLink: {
    color: "#333",
    fontSize: "1.8rem",
    fontWeight: "600",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
    padding: "0.3rem 0.5rem",
    borderRadius: "12px",
  },
  content: {
    padding: "2rem",
  },
};
