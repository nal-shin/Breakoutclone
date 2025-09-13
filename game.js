const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameStatusElement = document.getElementById('gameStatus');

// ゲーム状態
let gameRunning = false;
let score = 0;
let lives = 3;

// パドル
const paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 30,
    width: 120,
    height: 15,
    speed: 8
};

// ボール
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    dx: 4,
    dy: -4,
    speed: 4
};

// ブロック
const blocks = [];
const blockRows = 6;
const blockCols = 10;
const blockWidth = 70;
const blockHeight = 25;
const blockPadding = 5;
const blockOffsetTop = 60;
const blockOffsetLeft = (canvas.width - (blockCols * (blockWidth + blockPadding) - blockPadding)) / 2;

// ブロックの色
const blockColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

// ブロックを初期化
function initBlocks() {
    blocks.length = 0;
    for (let row = 0; row < blockRows; row++) {
        for (let col = 0; col < blockCols; col++) {
            blocks.push({
                x: blockOffsetLeft + col * (blockWidth + blockPadding),
                y: blockOffsetTop + row * (blockHeight + blockPadding),
                width: blockWidth,
                height: blockHeight,
                color: blockColors[row],
                visible: true
            });
        }
    }
}

// キー入力
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameRunning) {
            startGame();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ゲーム開始
function startGame() {
    gameRunning = true;
    gameStatusElement.innerHTML = '';
}

// ゲーム初期化
function resetGame() {
    score = 0;
    lives = 3;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 50;
    ball.dx = 4;
    ball.dy = -4;
    paddle.x = canvas.width / 2 - paddle.width / 2;
    initBlocks();
    updateDisplay();
}

// 表示更新
function updateDisplay() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

// 衝突判定
function collision(ball, rect) {
    return ball.x + ball.radius > rect.x &&
           ball.x - ball.radius < rect.x + rect.width &&
           ball.y + ball.radius > rect.y &&
           ball.y - ball.radius < rect.y + rect.height;
}

// パドル移動
function movePaddle() {
    if (keys['ArrowLeft'] && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }
}

// ボール移動
function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 壁との衝突
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // パドルとの衝突
    if (collision(ball, paddle)) {
        ball.dy = -Math.abs(ball.dy);
        // パドルの位置による角度変更
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = ball.speed * (hitPos - 0.5) * 2;
    }

    // ブロックとの衝突
    for (let block of blocks) {
        if (block.visible && collision(ball, block)) {
            ball.dy = -ball.dy;
            block.visible = false;
            score += 10;
            updateDisplay();
            break;
        }
    }

    // ボールが下に落ちた
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateDisplay();
        if (lives <= 0) {
            gameRunning = false;
            gameStatusElement.innerHTML = '<div class="game-over">ゲームオーバー<br>スペースキーで再開</div>';
            resetGame();
        } else {
            ball.x = canvas.width / 2;
            ball.y = canvas.height - 50;
            ball.dx = 4;
            ball.dy = -4;
            gameRunning = false;
            gameStatusElement.innerHTML = '<div style="color: white;">スペースキーでボールを発射</div>';
        }
    }
}

// ゲームクリアチェック
function checkGameClear() {
    const visibleBlocks = blocks.filter(block => block.visible);
    if (visibleBlocks.length === 0) {
        gameRunning = false;
        gameStatusElement.innerHTML = '<div class="game-clear">ゲームクリア！<br>スペースキーで再開</div>';
        resetGame();
    }
}

// 描画
function draw() {
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // パドル描画
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // ボール描画
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.closePath();

    // ブロック描画
    for (let block of blocks) {
        if (block.visible) {
            ctx.fillStyle = block.color;
            ctx.fillRect(block.x, block.y, block.width, block.height);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(block.x, block.y, block.width, block.height);
        }
    }
}

// ゲームループ
function gameLoop() {
    if (gameRunning) {
        movePaddle();
        moveBall();
        checkGameClear();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// ゲーム初期化と開始
resetGame();
gameStatusElement.innerHTML = '<div style="color: white;">スペースキーでゲーム開始</div>';
gameLoop();