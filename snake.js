const canvas = document.getElementById('snake_canvas');
canvas.width = 500;
canvas.height = 500;
const ctx = canvas.getContext('2d');

let head_x = 100;
let head_y = 0;
let snake_dir_x = 1;
let snake_dir_y = 0;
let snake_size = 20;
let frameWait = 200;
let snakeBodyX = [80, 60, 40, 20, 0];
let snakeBodyY = [0, 0, 0, 0, 0];
let fruitX = 60;
let fruitY = 60;
let gameOver = false;
let punten = 0;
const snake_offset = 2;
let lastFrameTimestamp = 0;


window.originalSetTimeout = window.setTimeout;
window.originalClearTimeout = window.clearTimeout;
window.activeTimers = 0;

window.setTimeout = function(func, delay) {
    window.activeTimers++;
    return window.originalSetTimeout(func, delay);
};

window.clearTimeout = function(timerID) {
    window.activeTimers--;
    window.originalClearTimeout(timerID);
};


const giphy = {
	baseURL: "https://api.giphy.com/v1/gifs/",
	apiKey: "0UTRbFtkMxAplrohufYco5IY74U8hOes",
	tag: "fail",
	type: "random",
	rating: "pg-13"
};

let giphyURL = encodeURI(
	giphy.baseURL +
		giphy.type +
		"?api_key=" +
		giphy.apiKey +
		"&tag=" +
		giphy.tag +
		"&rating=" +
		giphy.rating
);

document.addEventListener('keyup', keyPressed);

function keyPressed(event){
	if (event.key === 'ArrowRight' && snake_dir_x !== -1){
		snake_dir_y = 0;
		snake_dir_x = 1;
		clearTimeoutAndDraw();
	}
	else if (event.key === 'ArrowLeft' && snake_dir_x !== 1){
		snake_dir_y = 0;
		snake_dir_x = -1;
		clearTimeoutAndDraw();
	}
	else if (event.key === 'ArrowDown' && snake_dir_y !== -1){
		snake_dir_x = 0;
		snake_dir_y = 1;
		clearTimeoutAndDraw();
	}
	else if (event.key === 'ArrowUp' && snake_dir_y !== 1){
		snake_dir_x = 0;
		snake_dir_y = -1;
		clearTimeoutAndDraw();
	}
}

function clearTimeoutAndDraw(){
	window.clearTimeout(lastFrameTimer);
	draw();
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

function drawSnake(){
	// draw head
	ctx.fillStyle = 'blue';
	ctx.fillRect(head_x + snake_offset, head_y + snake_offset, snake_size - snake_offset, snake_size - snake_offset);
	// draw tail
	ctx.fillStyle = 'lightblue';
	for(let i = 0; i < snakeBodyX.length; i++){
		ctx.fillRect(snakeBodyX[i] + snake_offset, snakeBodyY[i] + snake_offset, snake_size - snake_offset, snake_size - snake_offset);
	}
}

function drawFruit(){
	ctx.fillStyle = 'red';
	ctx.fillRect(fruitX + snake_offset, fruitY + snake_offset, snake_size - snake_offset, snake_size - snake_offset);
}

const gif_window = document.getElementById('gif_window');
async function detectFruitEaten(){
	if (head_x === fruitX && head_y === fruitY){
		snakeBodyX.push(fruitX);
		snakeBodyY.push(fruitY);
			fruitX = getRandomInt(25)*snake_size;
		while([head_x, ...snakeBodyX].includes(fruitX)){
			fruitX = getRandomInt(25)*snake_size;
		}
		fruitY = getRandomInt(25)*snake_size;
		while([head_y, ...snakeBodyY].includes(fruitY)){
			fruitY = getRandomInt(25)*snake_size;
		}
		fetch(giphyURL).then(resp => {
			resp.json().then(json => {
				gif_window.setAttribute("src", `${json.data.image_original_url}`);
			});
		});
		punten += 1;
	}
}

function updateSnake(){
	snakeBodyX.pop(snakeBodyX.length - 1);
	snakeBodyY.pop(snakeBodyX.length - 1);
	snakeBodyX.unshift(head_x);
	snakeBodyY.unshift(head_y);
	head_x += snake_dir_x*snake_size;
	head_y += snake_dir_y*snake_size;
}

function detectGameOver(){
	for(let i = 0; i < snakeBodyY.length; i++){
		if (head_x === snakeBodyX[i] && head_y === snakeBodyY[i]){
			gameOver = true;
			alert("GAME OVER!");
		}
	}
	if (
		head_x < 0 ||
		head_y < 0 ||
		head_x > 480 ||
		head_y > 480){
		gameOver = true;
		alert("GAME OVER!");
	}
}

let lastFrameTimer = undefined;

function scheduleNextFrame(){
	window.clearTimeout(lastFrameTimer);
	lastFrameTimer = setTimeout(() => {
		window.activeTimers--;
		window.requestAnimationFrame(draw);
	}, frameWait);
}

function setScoreText(){
	const scoreLabel = document.getElementById("score_label");
	scoreLabel.innerText = `Score: ${punten}`
}

function draw(timestamp){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (timestamp - lastFrameTimestamp > 1000){
		updateSnake();
		lastFrameTimestamp = timestamp;
	}
	detectGameOver();
	drawFruit();
	drawSnake();
	setScoreText();
	detectFruitEaten();
	window.requestAnimationFrame(draw);
}

draw();
