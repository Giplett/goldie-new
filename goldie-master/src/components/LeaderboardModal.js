import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import './LeaderboardModal.css';

// Initialize Supabase client with safety validation
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

const LeaderboardModal = ({ isOpen, onClose, showInput, onSubmitScore, currentScore }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [ensName, setEnsName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && !showInput) {
      fetchLeaderboard();
    }
  }, [isOpen, showInput]);

  // Connect wallet using MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      setWalletError('MetaMask not installed. Please install MetaMask to submit your score.');
      return;
    }

    setIsConnecting(true);
    setWalletError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        setWalletError('No accounts found. Please connect your wallet.');
        return;
      }

      const address = accounts[0];
      setWalletAddress(address);

      // Resolve ENS name if available
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const ens = await provider.lookupAddress(address);
        setEnsName(ens || '');
      } catch (ensError) {
        console.log('ENS resolution failed:', ensError);
        setEnsName('');
      }

    } catch (error) {
      console.error('Wallet connection error:', error);
      setWalletError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Shorten wallet address for display
  const shortenAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setLeaderboard([]);
        setShowLeaderboard(true);
        return;
      }

      const { data, error } = await supabase
        .from('scores')
        .select('username, score, created_at')
        .order('score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      const leaderboard = data.map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        score: entry.score,
        date: entry.created_at
      }));

      setLeaderboard(leaderboard);
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (!walletAddress) {
      setWalletError('Please connect your wallet to submit your score');
      return;
    }

    setSubmitting(true);
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        setSubmitMessage('Leaderboard not available');
        return;
      }

      // Check if score qualifies for top 10
      const { data: topScores } = await supabase
        .from('scores')
        .select('score')
        .order('score', { ascending: false })
        .limit(10);

      const minTopScore = topScores && topScores.length >= 10 
        ? topScores[topScores.length - 1].score 
        : 0;

      if (currentScore.score < minTopScore) {
        setSubmitMessage('Score did not qualify for top 10');
        setShowLeaderboard(true);
        await fetchLeaderboard();
        return;
      }

      // Insert score
      const { data, error } = await supabase
        .from('scores')
        .insert([
          {
            username: username.trim(),
            wallet_address: walletAddress,
            ens_name: ensName || null,
            score: currentScore.score,
            game_duration_ms: currentScore.gameDurationMs,
            pipe_count: currentScore.pipeCount
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        setSubmitMessage('Failed to submit score');
        return;
      }

      setSubmitMessage('Score submitted successfully!');
      await fetchLeaderboard();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit score:', error);
      setSubmitMessage('Error submitting score');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        
        {showInput && !showLeaderboard ? (
          <div className="username-input-section">
            <h2>New High Score!</h2>
            <p>Your score: {currentScore?.score}</p>
            <p className="subtitle">Enter your username and connect your wallet</p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (max 20 chars)"
                maxLength={20}
                className="username-input"
              />
              
              {!walletAddress ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="connect-wallet-button"
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="wallet-info">
                  <p className="wallet-address">
                    {ensName ? ensName : shortenAddress(walletAddress)}
                  </p>
                  {!ensName && (
                    <p className="full-wallet-address">{walletAddress}</p>
                  )}
                </div>
              )}
              
              {walletError && (
                <p className="error-message">{walletError}</p>
              )}
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting || !username.trim() || !walletAddress}
              >
                {submitting ? 'Submitting...' : 'Confirm & Submit Score'}
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
