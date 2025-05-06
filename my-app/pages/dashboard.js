import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";

export default function ProtectedPage() {
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        await pb.collection("users").authRefresh();
      } catch (err) {
        console.warn("Auth refresh failed:", err);
      }

      setAuthChecked(true);

      if (pb.authStore.isValid) {
        try {
          const userId = pb.authStore.model?.id;

          if (!userId) {
            throw new Error("User ID not found.");
          }

          const res = await pb.collection("results").getFullList({
            filter: `user="${userId}"`,
            sort: "-created",
          });

          setResults(res || []);
        } catch (err) {
          console.warn("No results found or query failed:", err);
          setResults([]);
        }
      }

      setLoading(false);
    };

    checkAuthAndFetch();
  }, []);

  if (!authChecked) {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <p style={styles.info}>Checking authentication...</p>
        </div>
      </main>
    );
  }

  if (!pb.authStore.isValid) {
    setTimeout(() => {
      router.push("/login");
    }, 2000);
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>🔒 Please log in to access the dashboard</h2>
          <p style={styles.info}>Redirecting to login page...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📊 Your Quiz Results</h2>
        {loading ? (
          <p style={styles.info}>Loading...</p>
        ) : results.length === 0 ? (
          <p style={styles.info}>You haven't completed any quizzes yet.</p>
        ) : (
          <ul style={styles.list}>
            {results.map((r) => (
              <li key={r.id} style={styles.item}>
                <strong>
                  Score: {r.score}/{r.total}
                </strong>
                <br />
                Time: {formatDuration(r.duration)}
                <br />
                Date: {new Date(r.created).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

// Funkcja do konwersji czasu w sekundach na format minut:sekund
const formatDuration = (duration) => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#eef2f7",
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
    maxWidth: "800px",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },
  title: {
    fontSize: "1.8rem",
    fontWeight: "600",
    marginBottom: "1.5rem",
    color: "#333",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  item: {
    backgroundColor: "#f9f9f9",
    marginBottom: "1rem",
    padding: "1rem",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    fontSize: "1rem",
    color: "#444",
  },
  info: {
    fontSize: "1.1rem",
    color: "#666",
  },
};
