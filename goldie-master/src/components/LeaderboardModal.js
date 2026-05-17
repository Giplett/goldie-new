import React, { useState, useEffect } from 'react';
import './LeaderboardModal.css';

const LeaderboardModal = ({ isOpen, onClose, showInput, onSubmitScore, currentScore }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (isOpen && !showInput) {
      fetchLeaderboard();
    }
  }, [isOpen, showInput]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/get-leaderboard');
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/submit-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          score: currentScore.score,
          gameDurationMs: currentScore.gameDurationMs,
          pipeCount: currentScore.pipeCount
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitMessage('Score submitted successfully!');
        setLeaderboard(data.leaderboard);
        setShowLeaderboard(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitMessage(data.message || 'Failed to submit score');
        if (data.currentTop10 !== undefined) {
          setShowLeaderboard(true);
          await fetchLeaderboard();
        }
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      setSubmitMessage('Error submitting score');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        {showInput && !showLeaderboard ? (
          <div className="username-input-section">
            <h2>New High Score!</h2>
            <p>Your score: {currentScore?.score}</p>
            <p className="subtitle">Enter your username to save your score</p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (max 20 chars)"
                maxLength={20}
                className="username-input"
                autoFocus
              />
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting || !username.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Score'}
              </button>
            </form>
            {submitMessage && (
              <p className={`message ${submitMessage.includes('success') ? 'success' : 'error'}`}>
                {submitMessage}
              </p>
            )}
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="leaderboard-section">
            <h2>🏆 Leaderboard</h2>
            {loading ? (
              <p className="loading">Loading...</p>
            ) : leaderboard.length === 0 ? (
              <p className="no-scores">No scores yet. Be the first!</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <div 
                    key={index} 
                    className={`leaderboard-entry ${index === 0 ? 'first' : ''} ${index === 1 ? 'second' : ''} ${index === 2 ? 'third' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="rank">{entry.rank}</span>
                    <span className="username">{entry.username}</span>
                    <span className="score">{entry.score}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="close-button" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardModal;
