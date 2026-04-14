/**
 * engine.js — Chương III: Giai cấp & Dân tộc
 * Game engine: HP, timer, vòng lặp câu hỏi, điều kiện thắng/thua
 * Tái sử dụng: chỉ cần thay config và callbacks UI → dùng cho chương khác
 */

const GameEngine = (() => {
  // ─── CONFIG ────────────────────────────────────────────────────────────────
  const DEFAULT_CONFIG = {
    playerMaxHP:    100,
    bossMaxHP:      100,
    timerSeconds:   30,
    totalQuestions: 15,
    damageCorrect:    15,   // damage tới boss khi đúng
    damageWrong:      12,   // damage tới player khi sai
    damageTimeout:    20,   // damage tới player khi hết giờ
    bonusTimerFactor: 0.5,  // điểm bonus = thời gian còn lại × factor
    baseScoreRight:   100,
  };

  // ─── STATE ─────────────────────────────────────────────────────────────────
  let state = {};
  let timerInterval = null;
  let cfg = {};

  // ─── CALLBACKS (UI tự inject) ──────────────────────────────────────────────
  let callbacks = {
    onQuestionShow:    (question, index, total) => {},
    onTimerTick:       (remaining, total) => {},
    onPlayerHPChange:  (current, max) => {},
    onBossHPChange:    (current, max) => {},
    onAnswerResult:    (isCorrect, correctKey, selectedKey, explanation, pointsGained) => {},
    onGameWin:         (score, stats) => {},
    onGameOver:        (score, stats) => {},
    onScoreChange:     (score) => {},
  };

  // ─── INIT ──────────────────────────────────────────────────────────────────
  function init(config = {}, cbks = {}) {
    cfg = { ...DEFAULT_CONFIG, ...config };
    callbacks = { ...callbacks, ...cbks };

    state = {
      playerHP:    cfg.playerMaxHP,
      bossHP:      cfg.bossMaxHP,
      score:       0,
      currentIdx:  0,
      questions:   [],
      answered:    false,
      gameOver:    false,
      timerLeft:   cfg.timerSeconds,
      stats: {
        correct:   0,
        wrong:     0,
        timeout:   0,
        totalTime: 0,
      },
    };
  }

  // ─── LOAD QUESTIONS ─────────────────────────────────────────────────────────
  function setQuestions(questions) {
    state.questions = questions;
  }

  // ─── START GAME ─────────────────────────────────────────────────────────────
  function start() {
    if (!state.questions.length) {
      console.error('Chưa có câu hỏi!');
      return;
    }
    state.gameOver = false;
    state.currentIdx = 0;
    showQuestion();
  }

  // ─── SHOW QUESTION ──────────────────────────────────────────────────────────
  function showQuestion() {
    if (state.currentIdx >= state.questions.length) {
      endGame();
      return;
    }

    state.answered = false;
    state.timerLeft = cfg.timerSeconds;
    const q = currentQuestion();
    callbacks.onQuestionShow(q, state.currentIdx + 1, state.questions.length);
    startTimer();
  }

  function currentQuestion() {
    return state.questions[state.currentIdx];
  }

  // ─── TIMER ──────────────────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(timerInterval);
    callbacks.onTimerTick(state.timerLeft, cfg.timerSeconds);

    timerInterval = setInterval(() => {
      state.timerLeft--;
      callbacks.onTimerTick(state.timerLeft, cfg.timerSeconds);

      if (state.timerLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  // ─── ANSWER ─────────────────────────────────────────────────────────────────
  function submitAnswer(selectedKey) {
    if (state.answered || state.gameOver) return;
    state.answered = true;
    stopTimer();

    const q = currentQuestion();
    const isCorrect = selectedKey.toUpperCase() === q.answer.toUpperCase();
    const timeUsed = cfg.timerSeconds - state.timerLeft;
    state.stats.totalTime += timeUsed;

    let pointsGained = 0;

    if (isCorrect) {
      state.stats.correct++;
      const bonus = Math.round(state.timerLeft * cfg.bonusTimerFactor);
      pointsGained = cfg.baseScoreRight + bonus;
      state.score += pointsGained;

      // Deal damage to boss
      state.bossHP = Math.max(0, state.bossHP - cfg.damageCorrect);
      callbacks.onBossHPChange(state.bossHP, cfg.bossMaxHP);

    } else {
      state.stats.wrong++;

      // Deal damage to player
      state.playerHP = Math.max(0, state.playerHP - cfg.damageWrong);
      callbacks.onPlayerHPChange(state.playerHP, cfg.playerMaxHP);
    }

    callbacks.onScoreChange(state.score);
    callbacks.onAnswerResult(isCorrect, q.answer, selectedKey, q.explanation, pointsGained);

    // Loại bỏ setTimeout tự động chuyển câu hỏi
    // Sẽ đợi UI gọi GameEngine.next() để tiếp tục, cho phép người dùng đọc giải thích
  }

  // ─── TIMEOUT ────────────────────────────────────────────────────────────────
  function handleTimeout() {
    if (state.answered || state.gameOver) return;
    state.answered = true;
    state.stats.timeout++;

    const q = currentQuestion();
    state.playerHP = Math.max(0, state.playerHP - cfg.damageTimeout);
    callbacks.onPlayerHPChange(state.playerHP, cfg.playerMaxHP);
    callbacks.onAnswerResult(false, q.answer, null, q.explanation, 0);
    callbacks.onScoreChange(state.score);

    // Loại bỏ setTimeout tự động chuyển câu hỏi
    // Sẽ đợi UI gọi GameEngine.next()
  }

  // ─── NAVIGATION ─────────────────────────────────────────────────────────────
  function next() {
    if (!state.answered || state.gameOver) return;

    state.currentIdx++;
    showQuestion();
  }

  function prev() {
    if (state.currentIdx > 0) {
      state.currentIdx--;
      state.gameOver = false;
      showQuestion();
    }
  }

  function forceEnd() {
    state.bossHP = 0;
    endGame('win');
  }

  // ─── END GAME ───────────────────────────────────────────────────────────────
  function endGame(reason = null) {
    state.gameOver = true;
    stopTimer();

    // Determine result if not already forced
    let result = reason;
    if (!result) {
      const threshold = Math.ceil(state.questions.length / 2);
      result = state.stats.correct >= threshold ? 'win' : 'lose';
    }

    const finalStats = {
      ...state.stats,
      playerHP: state.playerHP,
      bossHP: state.bossHP,
      accuracy: state.stats.correct + state.stats.wrong + state.stats.timeout > 0
        ? Math.round((state.stats.correct / (state.stats.correct + state.stats.wrong + state.stats.timeout)) * 100)
        : 0,
    };

    if (result === 'win') {
      callbacks.onGameWin(state.score, finalStats);
    } else {
      callbacks.onGameOver(state.score, finalStats);
    }
  }

  // ─── GETTERS ────────────────────────────────────────────────────────────────
  function getState() { return { ...state }; }
  function getConfig() { return { ...cfg }; }

  // Public API
  return { init, setQuestions, start, submitAnswer, getState, getConfig, next, prev, forceEnd };
})();

// Export cho module environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
