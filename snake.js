'use strict';

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    clone() {
        return new Point(this.x, this.y);
    }
}

const SCALE_FACTOR = 20;
const INIT_SNAKE_LENGTH = 5;
const INIT_SNAKE_POSITION = new Point(5, 0);
const SNAKE_PADDING = .1;
const BOARD_SIZE = 25;
const FRAME_WAIT_TIME = 200;

const canvas = document.getElementById('snake_canvas');
canvas.width = BOARD_SIZE * SCALE_FACTOR;
canvas.height = BOARD_SIZE * SCALE_FACTOR;
const ctx = canvas.getContext('2d');

let oofSound = new Howl({
    src: 'resources/oof.mp3'
});

let munchSound = new Howl({
    src: 'resources/munch.mp3'
})

class Fruit {
    constructor(position, painter) {
        this.position = position;
        this.painter = painter;
    }
}

class Snake {
    constructor(initHeadPos, initLength, painter) {
        this.headPos = initHeadPos;
        this.bodyPositions = [];
        for (let i = 1; i <= initLength; i++)
            this.bodyPositions.push(new Point(this.headPos.x - i, this.headPos.y));

        this.direction = new Point(1, 0);
        this.painter = painter;
    }

    updatePosition() {
        this.bodyPositions.pop(this.bodyPositions.length - 1);
        this.bodyPositions.unshift(this.headPos.clone());
        this.headPos.x += this.direction.x;
        this.headPos.y += this.direction.y;
    }

    eatFruit(fruit) {
        this.bodyPositions.push(fruit.position.clone());
    }
}

class GameState {
    constructor() {
        this.snake = new Snake(
            INIT_SNAKE_POSITION,
            INIT_SNAKE_LENGTH,
            drawSnake
        );
        this.fruit = new Fruit(
            randomPointOutsideSnake(this.snake),
            drawFruit
        );
        this.score = 0;
        this.shouldUpdateSnake = false;
        this.isGameOver = false;
        this.eventListeners = {
            'game_over': [],
            'fruit_eaten': [],
        };
    }

    addEventListener(type, cb) {
        if (!Object.keys(this.eventListeners).includes(type)) {
            console.log("Unknown eventlistener type: " + type);
            return;
        }
        
        this.eventListeners[type].push(cb);
    }
}

function drawScaledPaddedUnitRectangleAt(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        x * SCALE_FACTOR + SNAKE_PADDING * SCALE_FACTOR,
        y * SCALE_FACTOR + SNAKE_PADDING * SCALE_FACTOR,
        SCALE_FACTOR - SNAKE_PADDING * SCALE_FACTOR,
        SCALE_FACTOR - SNAKE_PADDING * SCALE_FACTOR
    )
}

function drawSnake(snake, ctx) {
    // draw head
    drawScaledPaddedUnitRectangleAt(
        ctx,
        snake.headPos.x,
        snake.headPos.y,
        'blue'
    );
    // draw tail
    for (let i = 0; i < snake.bodyPositions.length; i++) {
        drawScaledPaddedUnitRectangleAt(
            ctx,
            snake.bodyPositions[i].x,
            snake.bodyPositions[i].y,
            'lightblue'
        )
    }
}

function drawFruit(fruit) {
    drawScaledPaddedUnitRectangleAt(
        ctx,
        fruit.position.x,
        fruit.position.y,
        'red'
    );
}

/**
 * Input handling
 */
function handleInput(gameState) {
    return function (event) {
        let snake = gameState.snake;

        if (event.key === 'ArrowRight' && snake.direction.x === 0) {
            snake.direction.x = 1;
            snake.direction.y = 0;
            gameState.shouldUpdateSnake = true;
        }
        else if (event.key === 'ArrowLeft' && snake.direction.x === 0) {
            snake.direction.x = -1;
            snake.direction.y = 0;
            gameState.shouldUpdateSnake = true;
        }
        else if (event.key === 'ArrowDown' && snake.direction.y === 0) {
            snake.direction.x = 0;
            snake.direction.y = 1;
            gameState.shouldUpdateSnake = true;
        }
        else if (event.key === 'ArrowUp' && snake.direction.y === 0) {
            snake.direction.x = 0;
            snake.direction.y = -1;
            gameState.shouldUpdateSnake = true;
        }
    }
}

/**
 * Generate random int between 0 and max (not inclusive)
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function randomPointOutsideSnake(snake) {
    if (snake.bodyPositions.length === BOARD_SIZE * BOARD_SIZE - 1)
        return;

    let candidate = new Point(getRandomInt(BOARD_SIZE), getRandomInt(BOARD_SIZE));
    while([snake.headPos, ...snake.bodyPositions].find(x => x.equals(candidate)) !== undefined)
    {
    	console.log("problem");
    	candidate = new Point(getRandomInt(BOARD_SIZE), getRandomInt(BOARD_SIZE));
    }

    return candidate;
}

function detectFruitEaten(gameState) {
    let snake = gameState.snake;
    let fruit = gameState.fruit;
    if (snake.headPos.equals(fruit.position)) {
        gameState.eventListeners['fruit_eaten'].forEach(x => x(fruit));
        gameState.fruit = new Fruit(
            randomPointOutsideSnake(snake),
            drawFruit
        )
    }
}

function detectGameOver(gameState) {
    let snake = gameState.snake;
    if (snake.bodyPositions.find(x => x.equals(snake.headPos)) !== undefined)
    	gameState.isGameOver = true;
    if (
        snake.headPos.x < 0 ||
        snake.headPos.y < 0 ||
        snake.headPos.x > BOARD_SIZE - 1 ||
        snake.headPos.y > BOARD_SIZE - 1) {
        gameState.isGameOver = true;
    }

    if (gameState.isGameOver)
        gameState.eventListeners['game_over'].forEach(cb => {
            cb()
        });
}

function setScoreText(score) {
    const scoreLabel = document.getElementById("score_label");
    scoreLabel.innerText = `Score: ${score}`
}

let gameState = new GameState;
gameState.addEventListener('game_over', function () {
    oofSound.play();
});

gameState.addEventListener('fruit_eaten', function() {
    gameState.score += 1;
    setScoreText(gameState.score);
});

gameState.addEventListener('fruit_eaten', function(fruit) {
    gameState.snake.eatFruit(fruit)
});

gameState.addEventListener('fruit_eaten', function() {
    munchSound.play();
});

document.addEventListener('keydown', handleInput(gameState));
let previousUpdateTimestamp;

function draw(timestamp) {
    if (previousUpdateTimestamp === undefined)
        previousUpdateTimestamp = timestamp;

    if (gameState.shouldUpdateSnake || timestamp - previousUpdateTimestamp > FRAME_WAIT_TIME) {
        detectFruitEaten(gameState);
        gameState.snake.updatePosition();
        previousUpdateTimestamp = timestamp;
        gameState.shouldUpdateSnake = false;
    }

    detectGameOver(gameState);

    // check game over before the state is drawn
    if (gameState.isGameOver) {
        alert("Game over! Your score was: " + gameState.score)
        document.location.reload()
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.fruit.painter(gameState.fruit, ctx);
    gameState.snake.painter(gameState.snake, ctx);

    if (!gameState.isGameOver)
        window.requestAnimationFrame(draw);
}

setScoreText(gameState.score);

window.requestAnimationFrame(draw);
