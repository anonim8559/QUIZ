import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";

export default function ProtectedPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [liveNow, setLiveNow] = useState({});


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
          if (!userId) throw new Error("User ID not found.");

          const sessionData = await pb.collection("sessions").getFullList({
            filter: `user="${userId}"`,
            sort: "-created",
          });

          const sessionsWithQuizData = await Promise.all(
            sessionData.map(async (session) => {
              const quizDetails = await Promise.all(
                (session.quiz_history || []).map(async (quizId) => {
                  try {
                    return await pb.collection("results").getOne(quizId);
                  } catch {
                    return null;
                  }
                })
              );
              return {
                ...session,
                quiz_history: quizDetails.filter(Boolean),
              };
            })
          );

          setSessions(sessionsWithQuizData);// Jeżeli jest trwająca sesja, ustaw interwał liczenia duration
          const active = sessionsWithQuizData.find((s) => !s.end_time);
          if (active) {
            const interval = setInterval(() => {
              const start = new Date(active.created);
              const now = new Date();
              const duration = Math.floor((now - start) / 1000);
              setLiveNow((prev) => ({ ...prev, [active.id]: duration }));
            }, 1000);
          
            return () => clearInterval(interval);
          }
          
        } catch (err) {
          console.warn("Failed to fetch sessions or quiz data:", err);
          setSessions([]);
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
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ ...styles.title, color: "black", fontWeight: "600" }}>
            🔒 Please log in to view your dashboard
          </h2>
          <p style={{ ...styles.info, color: "gray", fontWeight: "500" }}>
            Redirecting to login page...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      {loading ? (
        <div style={styles.card}>
          <p style={styles.info}>Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div style={styles.card}>
          <p style={styles.info}>You have no sessions yet.</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div key={session.id} style={styles.card}>
            <h2 style={styles.title}>
              📅 Session:{" "}
              {new Date(session.created).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              →{" "}
              {session.end_time
                ? new Date(session.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "in progress"}
            </h2>

            <p style={styles.info}>
              ⏱️ Duration: {formatDuration(
  session.end_time ? session.duration : liveNow[session.id] || 0
)}

            </p>
            <p style={styles.info}>
              📊 Total quizzes: {session.quiz_count || 0}
            </p>

            <ul style={styles.list}>
              {session.quiz_history?.length > 0 ? (
                session.quiz_history.map((q, idx) => (
                  <li key={idx} style={styles.item}>
                    <strong>
                      Score: {q.score}/{q.total}
                    </strong>
                    <br />
                    Time: {formatDuration(q.duration)}
                    <br />
                    Date: {formatQuizDate(q.created)}
                  </li>
                ))
              ) : (
                <p style={styles.info}>No quizzes in this session.</p>
              )}
            </ul>
          </div>
        ))
      )}
    </main>
  );
}

const formatQuizDate = (date) => {
  // Format dla quizu: 20:09 (tylko godzina i minuta)
  return new Date(date).toLocaleString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
    fontFamily: "'Roboto', sans-serif",
    gap: "2rem",
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
