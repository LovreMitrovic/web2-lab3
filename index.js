function formatTime(milis){
    if(!milis){
        return "00:00.000";
    }
    let seconds = Math.floor(milis/1000);
    milis -= seconds * 1000;
    let minutes = Math.floor(seconds/60);
    seconds -= minutes * 60;
    if(milis < 10){milis = "00" + milis;}
    else if(milis < 100){milis = "0" + milis;}
    if(seconds < 10){seconds = "0" + seconds;}
    if(minutes<10){minutes = "0" + minutes;}
    return `${minutes}:${seconds}.${milis}`;
}


let gameArea = {
    canvas: document.createElement("canvas"),
    start: function () {
        this.canvas.width = window.innerWidth - 20
        this.canvas.height = window.innerHeight - 20;
        this.realBorder = {
            top: - this.canvas.height,
            bottom: 2 * this.canvas.height,
            left: - this.canvas.width,
            right: 2 * this.canvas.width
        };
        this.ctx = this.canvas.getContext("2d");
        this.frameNo = 0;
        this.timeout = 20;
        this.interval = setInterval(updateGameArea, this.timeout);
        document.getElementById("container").appendChild(this.canvas);

    },
    drawStar: function (x, y) {
        let ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "white";
        ctx.fillRect(x,y,3,3);
        ctx.restore();
    },
    drawTimer: function () {
        let ctx = this.ctx;
        ctx.font = `30px Arial`;
        ctx.fillStyle = "white";
        let text = `Best Time: ${formatTime(bestTime)}`;
        let textWidth = ctx.measureText(text).width;
        ctx.fillText(text, this.canvas.width - textWidth - 40, 40);
        text = `Time: ${formatTime(this.getTime())}`;
        textWidth = ctx.measureText(text).width;
        ctx.fillText(text, this.canvas.width - textWidth - 40, 70);
    },
    getTime: function () {
        return this.frameNo * this.timeout;
    },
    refreshBackground: function () {
        this.frameNo += 1;
        this.clear();
        for(let i=0;i<20;i++){
            let x = Math.round(Math.random() * this.canvas.width);
            let y = Math.round(Math.random() * this.canvas.height);
            this.drawStar(x, y);
        }
    },
    stop: function () {
        clearInterval(this.interval);
    },
    clear: function () {
        this.ctx.fillStyle = "black";
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function component(width, height, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speed = {x: 4, y:2};
    this.update = function () {
        let ctx = gameArea.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        let img = type === "player" ?
            document.getElementsByTagName("img").namedItem('player') :
            document.getElementsByTagName("img").namedItem('asteroid')
        ctx.drawImage(img, this.width / -2, this.height / -2, this.width, this.height)
        ctx.restore();
    }
    this.detectCollision = function (otherobj) {
        return (this.x - this.width/2< otherobj.x + otherobj.width/2 &&
            this.x + this.width/2 > otherobj.x - otherobj.width/2 &&
            this.y - this.height/2< otherobj.y + otherobj.height/2 &&
            this.y + this.height/2 > otherobj.y - otherobj.height/2);
    }
    if(type === "asteroid"){
        this.newPosition = function () {
            if(this.x - this.width/2 < gameArea.realBorder.left
                || this.x + this.width/2 > gameArea.realBorder.right){
                this.speed.x *= -1;
            }
            if(this.y - this.height/2 < gameArea.realBorder.top
                || this.y + this.height/2 > gameArea.realBorder.bottom){
                this.speed.y *= -1;
            }
            this.x += this.speed.x;
            this.y -= this.speed.y;
        }
    } else if (type === "player"){
        this.newPosition = function () {
            if(pressedKeys.ArrowLeft && this.x - this.width/2 > 0){
                this.x -= this.speed.x;
            }
            if(pressedKeys.ArrowRight && this.x + this.width/2 < gameArea.canvas.width){
                this.x += this.speed.x;
            }
            if(pressedKeys.ArrowUp && this.y - this.height/2 > 0){
                this.y -= this.speed.y;
            }
            if(pressedKeys.ArrowDown && this.y + this.height/2 < gameArea.canvas.height){
                this.y += this.speed.y;
            }
        }
    }
}
function initAsteroids(numOfAsteroids) {
    let asteroids = [];
    for (let i = 0; i < numOfAsteroids; i++) {
        let size = Math.round(Math.random() * 100 + 150);
        let x = Math.random() < 0.5 ?
            Math.round(Math.random() * -1 * gameArea.realBorder.left + gameArea.realBorder.left) :
            Math.round(Math.random() * (gameArea.realBorder.right - gameArea.canvas.width) + gameArea.canvas.width);
        let y = Math.random() < 0.5 ?
            Math.round(Math.random() * -1 * gameArea.realBorder.top + gameArea.realBorder.top) :
            Math.round(Math.random() * (gameArea.realBorder.bottom - gameArea.canvas.height) + gameArea.canvas.height);
        let asteroid = new component(size, size, x, y, "asteroid");
        asteroid.speed = {
            x: Math.round(Math.random() * 4 + 1),
            y: Math.round(Math.random() * 4 + 1)
        };
        asteroids.push(asteroid);
    }
    return asteroids;
}

function loadLeaderboard(restart = false){
    if(typeof (Storage) === "undefined"){
        alert("Your browser does not support web storage!");
        return;
    }
    if(localStorage.getItem(key) === null){
        localStorage.setItem(key, JSON.stringify([]));
    }
    let leaderboard = JSON.parse(localStorage.getItem(key));
    if(!restart){
        leaderboard.push(gameArea.getTime());
        leaderboard.sort((a,b) => b-a);

    }
    localStorage.setItem(key, JSON.stringify(leaderboard));

    let leaderboardDiv = document.createElement("div");
    leaderboardDiv.classList.add("leaderboard");
    leaderboardDiv.setAttribute("id", "leaderboard");
    let h = document.createElement("h2");
    h.innerText = "Leaderboard";
    leaderboardDiv.appendChild(h);
    for(let time of leaderboard){
        let timeDiv = document.createElement("div");
        timeDiv.setAttribute("class", "time");
        timeDiv.innerText = formatTime(time);
        leaderboardDiv.appendChild(timeDiv);
    }
    let restartButton = document.createElement("button");
    restartButton.innerText = "Clear Leaderboard";
    restartButton.addEventListener("click", function () {
        localStorage.removeItem(key);
        let leaderboardDiv = document.getElementById("leaderboard");
        leaderboardDiv.parentNode.removeChild(leaderboardDiv);
        loadLeaderboard(true);
    })
    let playAgainButton = document.createElement("button");
    playAgainButton.innerText = "Play Again";
    playAgainButton.addEventListener("click", function () {
        location.reload();
    })
    let buttonsDiv = document.createElement("div");
    buttonsDiv.setAttribute("class", "buttons");
    buttonsDiv.appendChild(restartButton);
    buttonsDiv.appendChild(playAgainButton);
    leaderboardDiv.appendChild(buttonsDiv);
    let container = document.getElementById("container");
    container.appendChild(leaderboardDiv);


}
function initPlayer() {
    let width = 50;
    let height = 150;
    return new component(width, height, gameArea.canvas.width/2, gameArea.canvas.height/2, "player");
}

function updateGameArea() {
    gameArea.refreshBackground();
    for(let asteroid of asteroids){
        asteroid.newPosition();
        asteroid.update();
    }
    player.newPosition();
    player.update();
    gameArea.drawTimer();
    if(asteroids.some(asteroid => player.detectCollision(asteroid))){
        document.getElementById("explosion").play();
        gameArea.stop();
        loadLeaderboard();
    }
    if(gameArea.getTime() / 1000 % intervalForAddingAsteroidSec === 0 &&
        asteroids.length < numOfAsteroids){
        let newAsteroid = initAsteroids(1)[0];
        asteroids.push(newAsteroid);
    }

}


function run() {
    let leaderboard = localStorage.getItem(key);
    if(!leaderboard){
        bestTime = 0;
    } else {
        leaderboard = JSON.parse(leaderboard);
        leaderboard.sort((a, b) => b-a);
        bestTime = leaderboard[0];
    }
    const inputNumber = document.getElementById("number");
    const inputInterval = document.getElementById("interval");
    numOfAsteroids = inputNumber.value ? Number.parseInt(inputNumber.value) : 30;
    intervalForAddingAsteroidSec = inputInterval.value ? Number.parseInt(inputInterval.value) : 10;
    if(numOfAsteroids < 11){
        alert("Number of asteroids needs to be at least 11");
    } else if (intervalForAddingAsteroidSec < 1){
        alert("Interval needs to be at least 1");
    } else {
        let menu = document.getElementById("menu");
        menu.remove();
        gameArea.start();
        asteroids = initAsteroids(15);
        player = initPlayer();
    }
}

const key = "myGameBestTimeList";
let asteroids, player, numOfAsteroids, intervalForAddingAsteroidSec, bestTime;
let pressedKeys = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
document.addEventListener("keydown", function (e) {
    pressedKeys[e.key] = true;
});
document.addEventListener("keyup", function (e) {
    pressedKeys[e.key] = false;
});

document.getElementById("run").addEventListener("click", run);

