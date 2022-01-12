'use strict';

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    manhattanDist(other) {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    euclideanDist(other) {
        return Math.sqrt(
            Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y)
        );
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
const INIT_SNAKE_SPEED = 0.005; // block per second

const canvas = document.getElementById('snake_canvas');
canvas.width = BOARD_SIZE * SCALE_FACTOR;
canvas.height = BOARD_SIZE * SCALE_FACTOR;
const ctx = canvas.getContext('2d');

let oofSound = new Howl({
    src: 'resources/oof.mp3'
});

let munchSound = new Howl({
    src: 'resources/munch.mp3'
});

let pizzaTheme = new Howl({
    src: 'resources/pizza_theme.mp3',
    loop: true,
    volume: 0
});

let laughTrack = new Howl({
    src: 'resources/laugh_track.mp3'
});

let blip = new Howl({
    src: 'resources/blip.mp3',
    volume: 0.5
});

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
        this.speed = INIT_SNAKE_SPEED;
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

    getFrameDelayForSnakeSpeed() {
        return Math.floor(1/this.speed);
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
            'position_updated': [],
        };
        this.fruitWasEatenThisFrame = false;
    }

    updateSnakePosition() {
        this.snake.updatePosition();
        this.eventListeners['position_updated'].forEach(
            cb => cb(this.snake.headPos.clone())
        );
    }

    addEventListener(type, cb) {
        if (!Object.keys(this.eventListeners).includes(type)) {
            console.log("Unknown eventlistener type: " + type);
            return;
        }
        
        this.eventListeners[type].push(cb);
    }

    removeEventListener(type, cb) {
        if (!Object.keys(this.eventListeners).includes(type)) {
            console.log("Unknown eventlistener type: " + type);
            return;
        }

        this.eventListeners[type].pop(cb);
    }
}

function dbToVolume(dB) {
    return Math.pow(10, 0.05*dB);
}

function volumeToDb(volume) {
    return 20 * Math.log10(volume)
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

function drawScaledPaddedUnitImageAt(ctx, x, y, image) {
    ctx.drawImage(
        image,
        x * SCALE_FACTOR + SNAKE_PADDING * SCALE_FACTOR,
        y * SCALE_FACTOR + SNAKE_PADDING * SCALE_FACTOR,
        SCALE_FACTOR - SNAKE_PADDING * SCALE_FACTOR,
        SCALE_FACTOR - SNAKE_PADDING * SCALE_FACTOR
    );
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

function drawPizzaSnake(snake){
    // draw head
    drawScaledPaddedUnitImageAt(
        ctx,
        snake.headPos.x,
        snake.headPos.y,
        spoderman
    );
    // draw tail
    for (let i = 0; i < snake.bodyPositions.length; i++) {
        drawScaledPaddedUnitImageAt(
            ctx,
            snake.bodyPositions[i].x,
            snake.bodyPositions[i].y,
            pizzaImg
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

function drawPizzaFruit(fruit) { 
    drawScaledPaddedUnitImageAt(
        ctx,
        fruit.position.x,
        fruit.position.y,
        pizzaImg
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
    if (!snake.headPos.equals(fruit.position))
        return false;

    gameState.eventListeners['fruit_eaten'].forEach(x => x(fruit));
    gameState.fruit = new Fruit(
        randomPointOutsideSnake(snake),
        drawFruit
    )
    gameState.fruitWasEatenThisFrame = true;
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

gameState.addEventListener('fruit_eaten', function() {
    gameState.score += 1;
    setScoreText(gameState.score);
});

gameState.addEventListener('fruit_eaten', function(fruit) {
    gameState.snake.eatFruit(fruit)
});

class Scene {
    constructor(condition, startScene, destroyScene) {
        this.condition = condition;
        this.startScene = startScene;
        this.destroyScene = destroyScene;
    }
}

class Scenario {
    constructor(gameState, initScene) {
        this.activeGameState = gameState;
        this.scenes = [initScene]; 
        initScene.startScene(this.activeGameState);
        this.activeSceneIndex = 0;
    }

    addScene(scene) {
        this.scenes.push(scene);
    }

    checkSceneTransition() {
        if (this.activeSceneIndex === this.scenes.length - 1)
            return -1;

        if (this.scenes[this.activeSceneIndex + 1].condition(this.activeGameState)){
            this.nextScene();
        }
    }

    nextScene() {
        console.log('transitioning scene');
        if (this.activeSceneIndex === this.scenes.length - 1)
            return;
        this.scenes[this.activeSceneIndex].destroyScene(this.activeGameState);
        this.activeSceneIndex++;
        this.scenes[this.activeSceneIndex].startScene(this.activeGameState);
        console.log('transitioned scene');
    }
}

let startScene = new Scene(null, 
    function(gameState) {
        this.playBlip = function () {
            blip.play();
        };
        gameState.addEventListener('fruit_eaten', this.playBlip);
    },
    function (gameState) {
        gameState.removeEventListener('fruit_eaten', this.playBlip);
    }
);

let memeTransitionScene = new Scene(
    function(gameState) {
        return gameState.score > 10
    },
    function(gameState) {
        this.spidermanVolumeListener = function(newPosition) {
            pizzaTheme.volume(
                dbToVolume(
                    -newPosition.manhattanDist(gameState.fruit.position)/
                    (2*BOARD_SIZE)*100
                )
            );
        };
        this.fruitEatenListener = function() {
            munchSound.play();
        };

        this.gameOverListener = function() {
            pizzaTheme.stop();
        };

        gameState.fruit = new Fruit(
            new Point(BOARD_SIZE - 1, BOARD_SIZE - 1),
            drawPizzaFruit
        );

        gameState.addEventListener('position_updated', this.spidermanVolumeListener);
        gameState.addEventListener('fruit_eaten', this.fruitEatenListener);
        gameState.addEventListener('game_over', this.gameOverListener);
        pizzaTheme.play();
    },
    function(gameState) {
        gameState.removeEventListener('position_updated', this.spidermanVolumeListener)
        gameState.removeEventListener('fruit_eaten', this.fruitEatenListener);
        gameState.removeEventListener('game_over', this.gameOverListener);
    }
);

let memeScene = new Scene(
    function(gameState) {
        return gameState.fruitWasEatenThisFrame;
    },
    function (gameState) {
        this.fruitEatenListener =  function() {
            const maxScore = BOARD_SIZE*BOARD_SIZE - INIT_SNAKE_LENGTH-450;
            const newRate = 1 + ((1 + gameState.score)/maxScore);
            console.log(newRate)
            pizzaTheme.rate(newRate);
            gameState.snake.speed = INIT_SNAKE_SPEED*newRate;
            munchSound.play();
        };

        this.gameOverListener = function() {
                oofSound.play();
                laughTrack.play();
                pizzaTheme.stop();
        };
        pizzaTheme.volume(1);
        gameState.addEventListener('fruit_eaten', this.fruitEatenListener);
        gameState.addEventListener('game_over', this.gameOverListener);  
        gameState.snake.painter = drawPizzaSnake;
    },
    function (gameState) {
        gameState.removeEventListener('fruit_eaten', this.fruitEatenListener);
        gameState.removeEventListener('game_over', this.gameOverListener);
    }
)

let scenario = new Scenario(gameState, startScene);
let spoderman = new Image();
spoderman.src = 'resources/spoderman.png';
let pizzaImg = new Image();
pizzaImg.src = 'resources/laughing_emoji.jpg';
scenario.addScene(memeTransitionScene);
scenario.addScene(memeScene);

document.addEventListener('keydown', handleInput(gameState));
let previousUpdateTimestamp;

function draw(timestamp) {
    if (previousUpdateTimestamp === undefined)
        previousUpdateTimestamp = timestamp;


    if (gameState.shouldUpdateSnake || timestamp - previousUpdateTimestamp > gameState.snake.getFrameDelayForSnakeSpeed()) {
        detectFruitEaten(gameState);
        gameState.updateSnakePosition();
        previousUpdateTimestamp = timestamp;
        gameState.shouldUpdateSnake = false;
    }

    detectGameOver(gameState);
    scenario.checkSceneTransition();

    // check game over before the state is drawn
    if (gameState.isGameOver) {
        // alert("Game over! Your score was: " + gameState.score)
        // document.location.reload()
        ctx.font = '48px sans-serif';
        ctx.fillStyle = 'black'
        ctx.fillText('GAME OVER', BOARD_SIZE*SCALE_FACTOR/5, BOARD_SIZE*SCALE_FACTOR/2);
        if (scenario.scenes[scenario.activeSceneIndex] === memeScene)
        {
            ctx.font = '14px sans-serif';
            if (gameState.score < 70)
                ctx.fillText('"Danku" om te spelen, volgende keer beter he', BOARD_SIZE*SCALE_FACTOR/5, BOARD_SIZE*SCALE_FACTOR/1.5);
            else if (gameState.score > 70)
                ctx.fillText('Amai dat is kostbare tijd van uw leven die ge niet gaat terug krijgen.', BOARD_SIZE*SCALE_FACTOR/5, BOARD_SIZE*SCALE_FACTOR/1.5)
            
        }
        return;
    }

    if (gameState.snake.length === BOARD_SIZE*BOARD_SIZE)
    {
        ctx.font = '48px sans-serif';
        ctx.fillStyle = 'black'
        ctx.fillText('PROFICIAT', BOARD_SIZE*SCALE_FACTOR/5, BOARD_SIZE*SCALE_FACTOR/2);
        ctx.font = '14px sans-serif';
        ctx.fillText('Voila dat was het, zoek nu maar een andere hobby', BOARD_SIZE*SCALE_FACTOR/5, BOARD_SIZE*SCALE_FACTOR/1.5);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gameState.fruit.painter(gameState.fruit, ctx);
    gameState.snake.painter(gameState.snake, ctx);

    gameState.fruitWasEatenThisFrame = false;
    if (!gameState.isGameOver)
        window.requestAnimationFrame(draw);
}

setScoreText(gameState.score);

window.requestAnimationFrame(draw);

