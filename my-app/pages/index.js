"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import pb from "../lib/pocketbase";
import { RippleButton } from "@/components/magicui/ripple-button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PulsatingButton } from "@/components/magicui/pulsating-button";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

export default function Home() {
  const router = useRouter();
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [questionData, setQuestionData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const totalQuestions = 10;
  const baseURL = "http://192.168.0.71:5678/webhook";

  const getClass = (answer) => {
    if (!selected && timeLeft > 0) return "answer";
    if (answer === selected && answer.is_Correct) return "answer correct";
    if (answer === selected && !answer.is_Correct) return "answer wrong";
    if (answer.is_Correct) return "answer correct";
    return "answer";
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${baseURL}/category`);
      const data = await res.json();
      setCategories(data.name || []);
    } catch (err) {
      console.error("Błąd podczas pobierania kategorii:", err);
    }
  };

  const fetchQuestion = async () => {
    const encodedCategory = encodeURIComponent(selectedCategory);

    if (questionNumber === 0) {
      setQuizStartTime(Date.now());

      const result = await pb.collection("results").create({
        user: pb.authStore.model.id,
        score: 0,
        total: 0,
        duration: 0,
        category: selectedCategory,
      });

      setResultId(result.id);
    }

    if (questionNumber >= totalQuestions) {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - quizStartTime) / 1000);

      await pb.collection("results").update(resultId, {
        score: correctAnswers,
        total: totalQuestions,
        duration: durationSeconds,
      });

      const sessions = await pb.collection("sessions").getFullList({
        filter: `user="${pb.authStore.model.id}"`,
        sort: "-created",
        perPage: 1,
      });

      if (sessions.length > 0) {
        const latestSession = sessions[0];
        await pb.collection("sessions").update(latestSession.id, {
          quiz_history: [...(latestSession.quiz_history || []), resultId],
          quiz_count: (latestSession.quiz_count || 0) + 1,
        });
      }

      setQuizFinished(true);
      return;
    }

    setLoading(true);
    setSelected(null);
    setShowNext(false);
    setTimeLeft(30);

    try {
      const res = await fetch(`${baseURL}/que?category=${encodedCategory}`);
      const data = await res.json();
      setQuestionData(data);
      setQuestionNumber((prev) => prev + 1);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = async (answer) => {
    if (selected !== null || loading || timeLeft === 0) return;

    setSelected(answer);
    setShowNext(true);

    if (answer.is_Correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    const correctAnswer =
      questionData?.answers.find((a) => a?.is_Correct)?.content || null;

    await pb.collection("user_answers").create({
      result: resultId,
      question_text: questionData?.question || "",
      options: JSON.stringify(questionData?.answers || []),
      correct_answer: correctAnswer,
      user_answer: answer?.content || null,
      order: questionNumber,
      category: selectedCategory,
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!questionData || selected || loading || quizFinished) return;

    if (timeLeft <= 0) {
      setShowNext(true);
      const correctAnswer =
        questionData?.answers.find((a) => a?.is_Correct)?.content || null;

      pb.collection("user_answers").create({
        result: resultId,
        question_text: questionData?.question || "",
        options: JSON.stringify(questionData?.answers || []),
        correct_answer: correctAnswer,
        user_answer: null,
        order: questionNumber,
        category: selectedCategory,
      });

      return;
    }

    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, selected, questionData, loading, quizFinished]);

  const handleStartQuiz = () => {
    if (!pb.authStore.isValid) {
      setShowLoginAlert(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      if (!selectedCategory) {
        alert("Wybierz kategorię!");
        return;
      }
      setQuizStarted(true);
      fetchQuestion();
    }
  };

  const timePercentage = (timeLeft / 30) * 100;
  const timeColor =
    timeLeft <= 10 ? "#dc3545" : timeLeft <= 20 ? "#ffc107" : "#28a745";
  const questionProgress = (questionNumber / totalQuestions) * 100;

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {showLoginAlert && (
          <div style={styles.card}>
            <h2
              style={{
                ...styles.title,
                color: "black",
                fontSize: "1.6rem",
                fontWeight: "700",
              }}
            >
              🔒 Please log in to start the quiz
            </h2>
            <p
              style={{
                ...styles.info,
                color: "gray",
                fontSize: "1.15rem",
                fontWeight: "500",
              }}
            >
              Redirecting to login page...
            </p>
          </div>
        )}

        <h2 style={styles.title}>Wybierz kategorię:</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div className="relative w-[220px]">
            {/* aceternity */}
            <GlowingEffect
              spread={60}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
            />
            {/* shadcn */}
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-full z-10 bg-white dark:bg-slate-900">
                <SelectValue placeholder="-- wybierz kategorię --" />
              </SelectTrigger>
              <SelectContent className="z-20">
                {categories.map((cat, idx) => (
                  <SelectItem key={idx} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* magicui */}
          <ShimmerButton
            style={{
              ...styles.button,
              padding: "0.75rem 1.5rem",
              fontSize: "1.1rem",
            }}
            onClick={handleStartQuiz}
          >
            Start quiz
          </ShimmerButton>
        </div>

        {loading ? (
          <div style={styles.loaderContainer}>
            <div className="spinner" />
            <p>Generating question...</p>
          </div>
        ) : quizFinished ? (
          <>
            <h2 style={styles.question}>Quiz Completed!</h2>
            <p style={{ fontSize: "1.2rem", color: "#333" }}>
              Correct answers: {correctAnswers} / {totalQuestions}
            </p>
          </>
        ) : (
          questionData && (
            <>
              <div style={styles.progressWrapper}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${timePercentage}%`,
                    backgroundColor: timeColor,
                  }}
                />
                <span style={styles.progressText}>
                  {timeLeft > 0 ? `${timeLeft} seconds` : "⏰ Time's up!"}
                </span>
              </div>

              <h2 style={styles.question}>{questionData.question}</h2>
              <div style={styles.answersWrapper}>
                {questionData.answers.map((answer, idx) => (
                  <div
                    key={idx}
                    className={getClass(answer)}
                    onClick={() => handleAnswerClick(answer)}
                    style={{
                      ...styles.answer,
                      ...(getClass(answer).includes("correct") &&
                        styles.correct),
                      ...(getClass(answer).includes("wrong") && styles.wrong),
                      pointerEvents:
                        selected || timeLeft <= 0 ? "none" : "auto",
                    }}
                  >
                    {answer.content}
                  </div>
                ))}
              </div>
              {showNext && (
                <button style={styles.button} onClick={fetchQuestion}>
                  Next
                </button>
              )}
            </>
          )
        )}

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
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
        )}
      </div>

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
    maxWidth: "700px",
    width: "100%",
    textAlign: "center",
    boxSizing: "border-box",
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "1.2rem",
    color: "#333",
  },
  question: {
    marginBottom: "2rem",
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333",
    lineHeight: "1.4",
  },
  progressWrapper: {
    position: "relative",
    height: "30px",
    backgroundColor: "#e0e0e0",
    borderRadius: "20px",
    overflow: "hidden",
    marginBottom: "2rem",
  },
  progressBar: {
    position: "absolute",
    height: "100%",
    top: 0,
    left: 0,
    transition: "width 0.5s ease",
    zIndex: 1,
    borderRadius: "20px",
  },
  progressText: {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "1.2rem",
    color: "#fff",
  },
  answersWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "2rem",
    color: "gray",
  },
  answer: {
    padding: "1rem",
    border: "2px solid #ccc",
    borderRadius: "15px",
    cursor: "pointer",
    fontSize: "1.2rem",
    backgroundColor: "#fafafa",
    transition: "all 0.3s",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
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
    borderRadius: "20px",
    backgroundColor: "#007bff",
    color: "white",
    transition: "background 0.3s",
    marginTop: "1rem",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
  },
  questionCounterWrapper: {
    marginTop: "1rem",
    height: "30px",
    backgroundColor: "#e0e0e0",
    borderRadius: "15px",
    position: "relative",
    marginBottom: "1.5rem",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  },
  questionCounterText: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    lineHeight: "30px",
    fontSize: "1.2rem",
    fontWeight: "500",
    color: "#fff",
    zIndex: 2,
  },
  alert: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    padding: "1rem",
    borderRadius: "10px",
    textAlign: "center",
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "80%",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
  },
  alertText: {
    fontSize: "1.2rem",
    fontWeight: "600",
  },

  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    color: "#333",
  },
  categoryContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "1rem",
    justifyContent: "center",
  },
  categoryButton: {
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "all 0.2s ease-in-out",
  },
  button: {
    padding: "0.6rem 1.2rem",
    fontSize: "1rem",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "1rem",
  },
};
