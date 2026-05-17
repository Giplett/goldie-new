import React, { useRef, useEffect, useState, useCallback } from 'react';
import './GoldieGame.css';
import LeaderboardModal from './LeaderboardModal';

const GoldieGame = () => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [currentScore, setCurrentScore] = useState(null);

  // Ensure component only renders on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Game state refs to persist across renders
  const gameRef = useRef({
    frames: 0,
    state: { current: 0, getReady: 0, game: 1, over: 2 },
    startBtn: { x: 120, y: 263, w: 83, h: 29 },
    sprite: null,
    sounds: {},
    fish: null,
    bg: null,
    fg: null,
    pipes: null,
    score: null,
    getReady: null,
    gameOver: null,
    animationId: null,
    initialized: false,
    gameStartTime: null,
    gameDuration: 0,
    pipeCount: 0
  });

  // Responsive scaling
  useEffect(() => {
    if (!mounted) return;
    
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const baseWidth = 320;
      const baseHeight = 480;
      
      const scaleX = Math.min(windowWidth / baseWidth, 1);
      const scaleY = Math.min(windowHeight / baseHeight, 1);
      const newScale = Math.min(scaleX, scaleY);
      
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  // Initialize game assets
  useEffect(() => {
    if (!mounted) return;
    
    const game = gameRef.current;
    
    // Prevent duplicate initialization in React Strict Mode
    if (game.initialized) {
      return () => {
        if (game.animationId) {
          cancelAnimationFrame(game.animationId);
        }
      };
    }
    
    game.initialized = true;
    
    // Load sprite image
    game.sprite = new Image();
    game.sprite.src = process.env.PUBLIC_URL + '/img/sprite.png';

    // Load sounds
    game.sounds = {
      SCORE_S: new Audio(process.env.PUBLIC_URL + '/audio/sfx_point.wav'),
      FLAP: new Audio(process.env.PUBLIC_URL + '/audio/sfx_flap.wav'),
      HIT: new Audio(process.env.PUBLIC_URL + '/audio/sfx_hit.wav'),
      SWOOSHING: new Audio(process.env.PUBLIC_URL + '/audio/sfx_swooshing.wav'),
      DIE: new Audio(process.env.PUBLIC_URL + '/audio/sfx_die.wav')
    };

    // Initialize game objects
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');

    game.bg = {
      sX: 0, sY: 0, w: 275, h: 226, x: 0, y: cvs.height - 226,
      draw: function() {
        ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
      }
    };

    game.fg = {
      sX: 276, sY: 0, w: 224, h: 112, x: 0, y: cvs.height - 112, dx: 2,
      draw: function() {
        ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x + this.w, this.y, this.w, this.h);
      },
      update: function() {
        if (game.state.current === game.state.game) {
          this.x = (this.x - this.dx) % (this.w / 2);
        }
      }
    };

    game.fish = {
      animation: [
        { sX: 276, sY: 112 },
        { sX: 276, sY: 139 },
        { sX: 276, sY: 164 },
        { sX: 276, sY: 139 }
      ],
      x: 50, y: 150, w: 34, h: 26, radius: 12, frame: 0,
      gravity: 0.2, jump: 4.3, speed: 0, rotation: 0,
      draw: function() {
        let fish = this.animation[this.frame];
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(game.sprite, fish.sX, fish.sY, this.w, this.h, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
      },
      flap: function() {
        this.speed = -this.jump;
      },
      update: function() {
        this.period = game.state.current === game.state.getReady ? 10 : 5;
        this.frame += game.frames % this.period === 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length;

        if (game.state.current === game.state.getReady) {
          this.y = 150;
          this.rotation = 0;
        } else {
          this.speed += this.gravity;
          this.y += this.speed;

          if (this.y + this.h / 2 >= cvs.height - game.fg.h) {
            this.y = cvs.height - game.fg.h - this.h / 2;
            if (game.state.current === game.state.game) {
              game.state.current = game.state.over;
              game.sounds.DIE.play();
            }
          }

          if (this.speed >= this.jump) {
            this.rotation = 30 * Math.PI / 180;
            this.frame = 1;
          } else {
            this.rotation = -20 * Math.PI / 180;
          }
        }
      },
      speedReset: function() {
        this.speed = 0;
      }
    };

    game.getReady = {
      sX: 0, sY: 228, w: 173, h: 152,
      x: cvs.width / 2 - 173 / 2, y: 80,
      draw: function() {
        if (game.state.current === game.state.getReady) {
          ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
      }
    };

    game.gameOver = {
      sX: 175, sY: 228, w: 225, h: 202,
      x: cvs.width / 2 - 225 / 2, y: 90,
      draw: function() {
        if (game.state.current === game.state.over) {
          ctx.drawImage(game.sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
        }
      }
    };

    game.pipes = {
      position: [],
      top: { sX: 553, sY: 0 },
      bottom: { sX: 502, sY: 0 },
      w: 53, h: 400, gap: 90, maxYPos: -150, dx: 2,
      draw: function() {
        for (let i = 0; i < this.position.length; i++) {
          let p = this.position[i];
          let topYPos = p.y;
          let bottomYPos = p.y + this.h + this.gap;
          ctx.drawImage(game.sprite, this.top.sX, this.top.sY, this.w, this.h, p.x, topYPos, this.w, this.h);
          ctx.drawImage(game.sprite, this.bottom.sX, this.bottom.sY, this.w, this.h, p.x, bottomYPos, this.w, this.h);
        }
      },
      update: function() {
        if (game.state.current !== game.state.game) return;

        if (game.frames % 100 === 0) {
          this.position.push({
            x: cvs.width,
            y: this.maxYPos * (Math.random() + 1)
          });
        }
        for (let i = 0; i < this.position.length; i++) {
          let p = this.position[i];
          let bottomPipeYPos = p.y + this.h + this.gap;

          // Collision detection
          if (game.fish.x + game.fish.radius > p.x && game.fish.x - game.fish.radius < p.x + this.w &&
              game.fish.y + game.fish.radius > p.y && game.fish.y - game.fish.radius < p.y + this.h) {
            game.state.current = game.state.over;
            game.sounds.HIT.play();
          }
          if (game.fish.x + game.fish.radius > p.x && game.fish.x - game.fish.radius < p.x + this.w &&
              game.fish.y + game.fish.radius > bottomPipeYPos && game.fish.y - game.fish.radius < bottomPipeYPos + this.h) {
            game.state.current = game.state.over;
            game.sounds.HIT.play();
          }

          p.x -= this.dx;

          if (p.x + this.w <= 0) {
            this.position.shift();
            game.score.value += 1;
            game.sounds.SCORE_S.play();
            game.score.best = Math.max(game.score.value, game.score.best);
            localStorage.setItem("best", game.score.best);
          }
        }
      },
      reset: function() {
        this.position = [];
      }
    };

    game.score = {
      best: parseInt(localStorage.getItem("best")) || 0,
      value: 0,
      draw: function() {
        ctx.fillStyle = "#FFF";
        ctx.strokeStyle = "#000";

        if (game.state.current === game.state.game) {
          ctx.lineWidth = 2;
          ctx.font = "35px Teko";
          ctx.fillText(this.value, cvs.width / 2, 50);
          ctx.strokeText(this.value, cvs.width / 2, 50);
        } else if (game.state.current === game.state.over) {
          ctx.font = "25px Teko";
          ctx.fillText(this.value, 225, 186);
          ctx.strokeText(this.value, 225, 186);
          ctx.fillText(this.best, 225, 228);
          ctx.strokeText(this.best, 225, 228);
        }
      },
      reset: function() {
        this.value = 0;
      }
    };

    // Track game start time
    game.gameStartTime = Date.now();
    game.gameDuration = 0;
    game.pipeCount = 0;

  }, [mounted]);

  // Game loop
  useEffect(() => {
    if (!mounted) return;
    
    const game = gameRef.current;
    const cvs = canvasRef.current;
    if (!cvs || !game.sprite) return;
    
    const ctx = cvs.getContext('2d');

    const draw = () => {
      ctx.fillStyle = "#009dff";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      game.bg.draw();
      game.pipes.draw();
      game.fg.draw();
      game.fish.draw();
      game.getReady.draw();
      game.gameOver.draw();
      game.score.draw();
    };

    const update = () => {
      game.fish.update();
      game.fg.update();
      game.pipes.update();
    };

    const loop = () => {
      update();
      draw();
      game.frames++;
      game.animationId = requestAnimationFrame(loop);
    };

    // Start game loop when sprite is loaded
    if (game.sprite.complete) {
      loop();
    } else {
      game.sprite.onload = loop;
    }

    return () => {
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
      }
    };
  }, [mounted]);

  // Handle click/touch
  const handleClick = useCallback((evt) => {
    const game = gameRef.current;
    const cvs = canvasRef.current;
    if (!cvs) return;

    const rect = cvs.getBoundingClientRect();
    const clickX = (evt.clientX - rect.left) / scale;
    const clickY = (evt.clientY - rect.top) / scale;

    switch (game.state.current) {
      case game.state.getReady:
        game.state.current = game.state.game;
        game.sounds.SWOOSHING.play();
        game.gameStartTime = Date.now();
        game.gameDuration = 0;
        game.pipeCount = 0;
        break;
      case game.state.game:
        if (game.fish.y - game.fish.radius <= 0) return;
        game.fish.flap();
        game.sounds.FLAP.play();
        break;
      case game.state.over:
        if (clickX >= game.startBtn.x && clickX <= game.startBtn.x + game.startBtn.w &&
            clickY >= game.startBtn.y && clickY <= game.startBtn.y + game.startBtn.h) {
          game.pipes.reset();
          game.fish.speedReset();
          game.score.reset();
          game.state.current = game.state.getReady;
          game.gameStartTime = Date.now();
          game.gameDuration = 0;
          game.pipeCount = 0;
        }
        break;
      default:
        break;
    }
  }, [scale]);

  // Check if score qualifies for leaderboard
  const checkLeaderboardQualification = useCallback(async (score) => {
    try {
      const response = await fetch('/api/get-leaderboard');
      const data = await response.json();
      if (data.success && data.leaderboard.length >= 10) {
        const minTopScore = data.leaderboard[data.leaderboard.length - 1].score;
        return score >= minTopScore;
      }
      return true;
    } catch (error) {
      console.error('Failed to check leaderboard:', error);
      return false;
    }
  }, []);

  // Handle game over
  useEffect(() => {
    const game = gameRef.current;
    
    const handleGameOver = async () => {
      if (game.state.current === game.state.over && game.score.value > 0) {
        const qualifies = await checkLeaderboardQualification(game.score.value);
        if (qualifies) {
          setCurrentScore({
            score: game.score.value,
            gameDurationMs: game.gameDuration,
            pipeCount: game.pipeCount
          });
          setShowUsernameInput(true);
        }
      }
    };

    handleGameOver();
  }, [checkLeaderboardQualification]);

  // Update game duration and pipe count
  useEffect(() => {
    const game = gameRef.current;
    
    const interval = setInterval(() => {
      if (game.state.current === game.state.game && game.gameStartTime) {
        game.gameDuration = Date.now() - game.gameStartTime;
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Track pipe count when score increases
  useEffect(() => {
    const game = gameRef.current;
    
    if (game.score && !game.score._patched) {
      game.score._patched = true;
      const originalUpdate = game.pipes.update;
      game.pipes.update = function() {
        const oldScore = game.score.value;
        originalUpdate.call(this);
        if (game.score.value > oldScore) {
          game.pipeCount = game.score.value;
        }
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const game = gameRef.current;
      if (game.animationId) {
        cancelAnimationFrame(game.animationId);
      }
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="goldie-game-container">
      <button 
        className="leaderboard-button"
        onClick={() => setShowLeaderboard(true)}
      >
        🏆 Leaderboard
      </button>
      <canvas
        ref={canvasRef}
        width="320"
        height="480"
        onClick={handleClick}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          border: '1px solid #000',
          display: 'block',
          margin: '0 auto',
          maxWidth: '100%',
          maxHeight: '100vh'
        }}
      />
      <LeaderboardModal
        isOpen={showLeaderboard || showUsernameInput}
        onClose={() => {
          setShowLeaderboard(false);
          setShowUsernameInput(false);
          setCurrentScore(null);
        }}
        showInput={showUsernameInput}
        onSubmitScore={setCurrentScore}
        currentScore={currentScore}
      />
    </div>
  );
};

export default GoldieGame;
