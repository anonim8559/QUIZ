"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [questionData, setQuestionData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false); // Nowy stan, który wskazuje, czy quiz został rozpoczęty.

  const totalQuestions = 10;

  const ip1 = "http://192.168.0.71:5678/webhook/que";
  const ip2 = "http://172.16.15.148:5678/webhook/que";

  const fetchQuestion = async () => {
    if (questionNumber >= totalQuestions) {
      setQuizFinished(true);
      return;
    }

    setLoading(true);
    setSelected(null);
    setShowNext(false);
    setTimeLeft(30);

    try {
      const res = await fetch(ip1);
      const data = await res.json();
      setQuestionData(data);
      setQuestionNumber((prev) => prev + 1);
    } catch (error) {
      console.error("Błąd pobierania pytania:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (answer) => {
    if (selected !== null || loading || timeLeft === 0) return;
    setSelected(answer);
    setShowNext(true);
    if (answer.is_Correct) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const getClass = (answer) => {
    if (!selected && timeLeft > 0) return "answer";
    if (answer === selected && answer.is_Correct) return "answer correct";
    if (answer === selected && !answer.is_Correct) return "answer wrong";
    if (answer.is_Correct) return "answer correct";
    return "answer";
  };

  useEffect(() => {
    if (!questionData || selected || loading || quizFinished) return;
    if (timeLeft <= 0) {
      setShowNext(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, selected, questionData, loading, quizFinished]);

  const timePercentage = (timeLeft / 30) * 100;
  const timeColor =
    timeLeft <= 10 ? "#dc3545" : timeLeft <= 20 ? "#ffc107" : "#28a745";

  const questionProgress = (questionNumber / totalQuestions) * 100;

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loaderContainer}>
            <div className="spinner" />
            <p>Generowanie pytania...</p>
          </div>
        ) : quizFinished ? (
          <>
            <h2 style={styles.question}>Koniec quizu!</h2>
            <p style={{ fontSize: "1.2rem", color: "gray" }}>
              Poprawne odpowiedzi: {correctAnswers} / {totalQuestions}
            </p>
          </>
        ) : !questionData ? (
          <button
            style={styles.button}
            onClick={() => {
              setQuizStarted(true);
              fetchQuestion();
            }}
          >
            Rozpocznij quiz
          </button>
        ) : (
          <>
            {/* Pasek czasu */}
            {quizStarted && (
              <div style={styles.progressWrapper}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${timePercentage}%`,
                    backgroundColor: timeColor,
                  }}
                />
                <span style={styles.progressText}>
                  {timeLeft > 0 ? `${timeLeft} sekund` : "⏰ Czas minął!"}
                </span>
              </div>
            )}

            <h2 style={styles.question}>{questionData.question}</h2>
            <div style={styles.answersWrapper}>
              {questionData.answers.map((answer, idx) => (
                <div
                  key={idx}
                  className={getClass(answer)}
                  onClick={() => handleAnswerClick(answer)}
                  style={{
                    ...styles.answer,
                    ...(getClass(answer).includes("correct") && styles.correct),
                    ...(getClass(answer).includes("wrong") && styles.wrong),
                    pointerEvents: selected || timeLeft <= 0 ? "none" : "auto",
                  }}
                >
                  {answer.content}
                </div>
              ))}
            </div>
            {showNext && (
              <button style={styles.button} onClick={fetchQuestion}>
                Dalej
              </button>
            )}
          </>
        )}

        {/* Pasek z licznikiem pytań (na dole) - tylko po wygenerowaniu pytania */}
        {quizStarted && !loading && !quizFinished && (
          <div style={styles.questionCounterWrapper}>
            <div
              style={{
                ...styles.progressBar,
                width: `${questionProgress}%`,
                backgroundColor: "#007bff",
              }}
            />
            <span style={styles.questionCounterText}>
              Pytanie {questionNumber} z {totalQuestions}
            </span>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style jsx>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #ccc;
          border-top-color: #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#eef2f7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "20px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
    maxWidth: "700px",
    width: "100%",
    textAlign: "center",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "1.2rem",
    color: "#555",
  },
  question: {
    marginBottom: "2rem",
    fontSize: "1.6rem",
    fontWeight: "600",
    color: "#333",
  },
  progressWrapper: {
    position: "relative",
    height: "30px",
    backgroundColor: "#e0e0e0",
    borderRadius: "15px",
    overflow: "hidden",
    marginBottom: "1.5rem",
  },
  progressBar: {
    position: "absolute",
    height: "100%",
    top: 0,
    left: 0,
    transition: "width 0.5s ease",
    zIndex: 1,
    borderRadius: "15px",
  },
  progressText: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    color: "#fff",
  },
  answersWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "2rem",
    color: "gray",
  },
  answer: {
    padding: "1rem",
    border: "2px solid #ccc",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1.1rem",
    backgroundColor: "#fafafa",
    transition: "all 0.3s",
  },
  correct: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
    color: "#155724",
  },
  wrong: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
    color: "#721c24",
  },
  button: {
    padding: "1rem 2rem",
    fontSize: "1.2rem",
    cursor: "pointer",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#007bff",
    color: "white",
    transition: "background 0.3s",
  },
  questionCounterWrapper: {
    marginTop: "1rem",
    height: "30px",
    backgroundColor: "#e0e0e0",
    borderRadius: "15px",
    position: "relative",
    marginBottom: "1.5rem",
  },
  questionCounterText: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    lineHeight: "30px",
    fontSize: "1.1rem",
    fontWeight: "500",
    color: "#333",
    zIndex: 2,
  },
};
