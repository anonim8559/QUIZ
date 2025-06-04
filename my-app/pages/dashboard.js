import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ProtectedPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [liveNow, setLiveNow] = useState({});
  const [allResults, setAllResults] = useState([]);
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [quizDetails, setQuizDetails] = useState({});

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

          setSessions(sessionsWithQuizData);

          const allQuizResults = sessionsWithQuizData.flatMap(
            (s) => s.quiz_history
          );
          setAllResults(allQuizResults);

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

  const handleToggleQuiz = async (quizId) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      return;
    }

    setExpandedQuizId(quizId);

    if (!quizDetails[quizId]) {
      try {
        const answers = await pb.collection("user_answers").getFullList({
          filter: `result="${quizId}"`,
          sort: "+order",
        });
        setQuizDetails((prev) => ({ ...prev, [quizId]: answers }));
      } catch (err) {
        console.error("Błąd pobierania szczegółów quizu:", err);
      }
    }
  };

  const COLORS = ["#00C49F", "#FF8042"];
  const chartData = allResults.map((r, idx) => ({
    name: `Quiz ${idx + 1}`,
    correct: r.score,
    incorrect: r.total - r.score,
  }));
  const totalCorrect = allResults.reduce((sum, r) => sum + r.score, 0);
  const totalTotal = allResults.reduce((sum, r) => sum + r.total, 0);
  const totalIncorrect = totalTotal - totalCorrect;
  const passRate =
    totalTotal > 0 ? Math.round((totalCorrect / totalTotal) * 100) : 0;
  const passedCount = allResults.filter((r) => r.score / r.total >= 0.5).length;
  const failedCount = allResults.length - passedCount;
  const categoryStats = allResults.reduce((acc, r) => {
    const cat = r.category || "Brak kategorii";
    if (!acc[cat]) {
      acc[cat] = { correct: 0, total: 0 };
    }
    acc[cat].correct += r.score;
    acc[cat].total += r.total;
    return acc;
  }, {});

  const categoryChartData = Object.entries(categoryStats).map(
    ([category, { correct, total }]) => ({
      category,
      correct,
      incorrect: total - correct,
    })
  );

  if (!authChecked) {
    return <p>Checking authentication...</p>;
  }

  if (!pb.authStore.isValid) {
    return <p>🔒 Please log in to view your dashboard</p>;
  }

  return (
    <main style={styles.container}>
      <h1 style={styles.header}>📈 Your Quiz Stats</h1>

      {allResults.length > 0 ? (
        <div style={styles.chartsContainer}>
          <div style={styles.chartBox}>
            <h2 style={{ color: "#333" }}>Overall Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Correct", value: totalCorrect },
                    { name: "Incorrect", value: totalIncorrect },
                  ]}
                  dataKey="value"
                  outerRadius={100}
                  label={{ fill: "#333", fontWeight: "bold" }}
                >
                  {COLORS.map((color, index) => (
                    <Cell key={index} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p style={{ marginTop: "1rem", color: "#333", fontWeight: "bold" }}>
              Accuracy: {passRate}%
            </p>
          </div>

          <div style={styles.chartBox}>
            <h2 style={{ color: "#333" }}>Quizzes Passed (≥ 50%)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Passed", value: passedCount },
                    { name: "Failed", value: failedCount },
                  ]}
                  dataKey="value"
                  outerRadius={100}
                  label={{ fill: "#333", fontWeight: "bold" }}
                >
                  <Cell fill="#00C49F" />
                  <Cell fill="#FF8042" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <p style={{ marginTop: "1rem", color: "#333", fontWeight: "bold" }}>
              Passed: {passedCount}/{allResults.length} (
              {Math.round((passedCount / allResults.length) * 100)}%)
            </p>
          </div>

          <div style={styles.chartBox}>
            <h2 style={{ color: "#333" }}>All Quiz Results</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="correct"
                  stackId="a"
                  fill="#00C49F"
                  name="Correct"
                />
                <Bar
                  dataKey="incorrect"
                  stackId="a"
                  fill="#FF8042"
                  name="Incorrect"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.chartBox}>
            <h2 style={{ color: "#333" }}>Performance by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData}>
                <XAxis dataKey="category" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="correct"
                  stackId="a"
                  fill="#00C49F"
                  name="Correct"
                />
                <Bar
                  dataKey="incorrect"
                  stackId="a"
                  fill="#FF8042"
                  name="Incorrect"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p style={{ color: "#333" }}>No quiz data to display.</p>
      )}

      {loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p>You have no sessions yet.</p>
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
              ⏱️ Duration:{" "}
              {formatDuration(
                session.end_time ? session.duration : liveNow[session.id] || 0
              )}
            </p>
            <p style={styles.info}>
              📊 Total quizzes: {session.quiz_count || 0}
            </p>

            <ul style={styles.list}>
              {session.quiz_history?.map((q, idx) => (
                <li key={idx} style={styles.item}>
                  <div
                    onClick={() => handleToggleQuiz(q.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>
                      Score: {q.score}/{q.total}
                    </strong>
                    <br />
                    Category: {q.category || "Brak kategorii"}
                    <br />
                    Time: {formatDuration(q.duration)}
                    <br />
                    Date: {formatQuizDate(q.created)}
                  </div>

                  {expandedQuizId === q.id && quizDetails[q.id] && (
                    <ul style={{ marginTop: "1rem", textAlign: "left" }}>
                      {quizDetails[q.id].map((ans, i) => (
                        <li key={i} style={{ marginBottom: "1rem" }}>
                          <strong>Question:</strong> {ans.question_text}
                          <br />
                          <strong>Your answer:</strong>{" "}
                          {ans.user_answer || "❌ No answer"}
                          <br />
                          <strong>Correct answer:</strong>{" "}
                          {ans.correct_answer || "Na"}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </main>
  );
}

const formatQuizDate = (date) =>
  new Date(date).toLocaleString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
  header: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#333",
  },
  chartsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2rem",
    width: "100%",
    maxWidth: "1200px",
  },
  chartBox: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "1.5rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    flex: "1 1 400px",
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
