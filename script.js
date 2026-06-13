const display = document.querySelector('#display');
const challengeElement = document.querySelector('#challenge');
const hintElement = document.querySelector('#hint');
const messageElement = document.querySelector('#message');
const scoreElement = document.querySelector('#score');
const streakElement = document.querySelector('#streak');
const timeElement = document.querySelector('#time');
const startButton = document.querySelector('#start');
const newChallengeButton = document.querySelector('#new-challenge');
const keys = document.querySelector('.keys');

const operations = [
  { symbol: '+', label: '+', fn: (a, b) => a + b },
  { symbol: '-', label: '−', fn: (a, b) => a - b },
  { symbol: '*', label: '×', fn: (a, b) => a * b },
  { symbol: '/', label: '÷', fn: (a, b) => a / b },
];

let expression = '';
let score = 0;
let streak = 0;
let timeLeft = 60;
let answer = 0;
let timerId = null;
let playing = false;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateDisplay() {
  display.textContent = expression || '0';
}

function setMessage(text, type = '') {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`.trim();
}

function updateStats() {
  scoreElement.textContent = score;
  streakElement.textContent = streak;
  timeElement.textContent = timeLeft;
}

function generateChallenge() {
  const op = operations[randomInt(0, operations.length - 1)];
  let a = randomInt(2, 25 + Math.min(streak, 15));
  let b = randomInt(2, 20 + Math.min(streak, 10));

  if (op.symbol === '/') {
    answer = randomInt(2, 18 + Math.min(streak, 10));
    b = randomInt(2, 12);
    a = answer * b;
  } else {
    answer = Math.round(op.fn(a, b));
  }

  challengeElement.textContent = `${a} ${op.label} ${b} = ?`;
  hintElement.textContent = streak >= 5 ? '高连击奖励中：答对可获得更多分数！' : '提示：答案四舍五入到整数。';
  expression = '';
  updateDisplay();
}

function safeEvaluate(value) {
  if (!/^[\d+\-*/.\s]+$/.test(value)) return Number.NaN;
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${value})`)();
}

function submitAnswer() {
  if (!playing || !expression) return;

  const result = Math.round(safeEvaluate(expression));
  if (Number.isFinite(result) && result === answer) {
    streak += 1;
    score += 10 + Math.min(streak * 2, 30);
    setMessage(`正确！连击 ${streak}，继续冲刺！`, 'success');
    generateChallenge();
  } else {
    streak = 0;
    score = Math.max(0, score - 3);
    setMessage(`差一点！正确答案是 ${answer}，再来一题。`, 'error');
    generateChallenge();
  }

  updateStats();
}

function endGame() {
  playing = false;
  clearInterval(timerId);
  timerId = null;
  startButton.textContent = '再玩一次';
  newChallengeButton.disabled = true;
  setMessage(`时间到！最终得分 ${score}，最高连击 ${streak}。`, 'success');
}

function startGame() {
  score = 0;
  streak = 0;
  timeLeft = 60;
  playing = true;
  startButton.textContent = '重新开始';
  newChallengeButton.disabled = false;
  updateStats();
  generateChallenge();
  setMessage('游戏开始！输入算式或答案后提交。');

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function appendValue(value) {
  if (!playing) return;
  if (expression.length >= 24) return;
  expression += value;
  updateDisplay();
}

keys.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const { value, action } = button.dataset;
  if (value) appendValue(value);
  if (action === 'clear') {
    expression = '';
    updateDisplay();
  }
  if (action === 'backspace') {
    expression = expression.slice(0, -1);
    updateDisplay();
  }
  if (action === 'equals') {
    const result = safeEvaluate(expression);
    expression = Number.isFinite(result) ? String(Number(result.toFixed(2))) : '';
    updateDisplay();
  }
  if (action === 'submit') submitAnswer();
});

startButton.addEventListener('click', startGame);
newChallengeButton.addEventListener('click', () => {
  if (!playing) return;
  score = Math.max(0, score - 2);
  streak = 0;
  updateStats();
  generateChallenge();
  setMessage('已换题，扣 2 分。');
});

window.addEventListener('keydown', (event) => {
  if (/^[0-9+\-*/.]$/.test(event.key)) appendValue(event.key);
  if (event.key === 'Enter') submitAnswer();
  if (event.key === 'Backspace') {
    expression = expression.slice(0, -1);
    updateDisplay();
  }
  if (event.key === 'Escape') {
    expression = '';
    updateDisplay();
  }
});

updateStats();
updateDisplay();
