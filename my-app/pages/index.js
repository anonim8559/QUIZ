'use client';

import { useState } from 'react';

export default function Home() {
  const [questionData, setQuestionData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const totalQuestions = 10; // Możesz ustawić ile chcesz

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setShowNext(false);
    const res = await fetch('http://172.16.15.148:5678/webhook/que');
    const data = await res.json();
    setQuestionData(data);
    setQuestionNumber(prev => prev + 1);
    setLoading(false);
  };

  const handleAnswerClick = (answer) => {
    if (selected !== null || loading) return;
    setSelected(answer);
    setShowNext(true);
  };

  const getClass = (answer) => {
    if (!selected) return 'answer';
    if (answer === selected && answer.is_Correct) return 'answer correct';
    if (answer === selected && !answer.is_Correct) return 'answer wrong';
    if (answer.is_Correct) return 'answer correct';
    return 'answer';
  };

  return (
    <main style={styles.container}>
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loaderContainer}>
            <div className="spinner" />
            <p>Generowanie pytania...</p>
          </div>
        ) : !questionData ? (
          <button style={styles.button} onClick={fetchQuestion}>
            Rozpocznij quiz
          </button>
        ) : (
          <>
            <div style={styles.counter}>
              Pytanie {questionNumber} z {totalQuestions}
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
                    ...(getClass(answer).includes('correct') && styles.correct),
                    ...(getClass(answer).includes('wrong') && styles.wrong),
                    pointerEvents: selected ? 'none' : 'auto',
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
    minHeight: '100vh',
    backgroundColor: '#eef2f7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },
  card: {
    background: 'white',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    maxWidth: '700px',
    width: '100%',
    textAlign: 'center',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '1.2rem',
    color: '#555',
  },
  counter: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '1rem',
    fontWeight: '500',
  },
  question: {
    marginBottom: '2rem',
    fontSize: '1.6rem',
    fontWeight: '600',
    color: '#333',
  },
  answersWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem',
  },
  answer: {
    padding: '1rem',
    border: '2px solid #ccc',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    backgroundColor: '#fafafa',
    transition: 'all 0.3s',
  },
  correct: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    color: '#155724',
  },
  wrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    color: '#721c24',
  },
  button: {
    padding: '1rem 2rem',
    fontSize: '1.2rem',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    transition: 'background 0.3s',
  },
};
