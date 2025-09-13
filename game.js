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

// ボール（複数対応）
const balls = [{
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    dx: 4,
    dy: -4,
    speed: 4
}];

// アイテム
const items = [];
const itemDropChance = 0.3; // 30%の確率でアイテムドロップ

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
    balls.length = 0;
    balls.push({
        x: canvas.width / 2,
        y: canvas.height - 50,
        radius: 8,
        dx: 4,
        dy: -4,
        speed: 4
    });
    paddle.x = canvas.width / 2 - paddle.width / 2;
    items.length = 0;
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

// アイテム作成
function createItem(x, y) {
    items.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        dy: 2,
        type: 'multiBall'
    });
}

// アイテム移動
function moveItems() {
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.dy;
        
        // パドルとの衝突
        if (collision({x: item.x + item.width/2, y: item.y + item.height/2, radius: item.width/2}, paddle)) {
            if (item.type === 'multiBall') {
                // 新しいボールを追加
                const newBall = {
                    x: balls[0].x,
                    y: balls[0].y,
                    radius: 8,
                    dx: balls[0].dx + (Math.random() - 0.5) * 4,
                    dy: balls[0].dy + (Math.random() - 0.5) * 2,
                    speed: 4
                };
                balls.push(newBall);
            }
            items.splice(i, 1);
        } else if (item.y > canvas.height) {
            // 画面外に出たアイテムを削除
            items.splice(i, 1);
        }
    }
}

// ボール移動
function moveBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        const ball = balls[i];
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
                
                // アイテムドロップ判定
                if (Math.random() < itemDropChance) {
                    createItem(block.x + block.width / 2 - 10, block.y + block.height);
                }
                break;
            }
        }

        // ボールが下に落ちた
        if (ball.y + ball.radius > canvas.height) {
            balls.splice(i, 1);
        }
    }
    
    // 全てのボールが落ちた場合
    if (balls.length === 0) {
        lives--;
        updateDisplay();
        if (lives <= 0) {
            gameRunning = false;
            gameStatusElement.innerHTML = '<div class="game-over">ゲームオーバー<br>スペースキーで再開</div>';
            resetGame();
        } else {
            balls.push({
                x: canvas.width / 2,
                y: canvas.height - 50,
                radius: 8,
                dx: 4,
                dy: -4,
                speed: 4
            });
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
    ctx.fillStyle = '#fff';
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
    
    // アイテム描画
    for (let item of items) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // アイテムの中に「+」マークを描画
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', item.x + item.width/2, item.y + item.height/2 + 5);
    }

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
        moveBalls();
        moveItems();
        checkGameClear();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// ゲーム初期化と開始
resetGame();
gameStatusElement.innerHTML = '<div style="color: white;">スペースキーでゲーム開始</div>';
gameLoop();