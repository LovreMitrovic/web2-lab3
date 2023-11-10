// funkcija koja formatira vrijeme u obliku prikladnom za ispis
// prima ms a vraća string oblika mm:ss.ms
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

// objekt gameArea predstavlja "igraču ploča" na kojoj se odvija igra
let gameArea = {
    // igraču se prikacuje samo dio ploče u obliku canvas elementa
    // iako igra postoji na području kojeg definira realBorder atribut
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
    // metoda za crtanje zvijedica
    drawStar: function (x, y) {
        let ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = "white";
        ctx.fillRect(x,y,3,3);
        ctx.restore();
    },
    // metoda za ispis timera i najboljeg vremena
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
    // metoda za dohvaćanje vremena u milisekundama
    getTime: function () {
        return this.frameNo * this.timeout;
    },
    // metoda koja osvježava pozadinu
    refreshBackground: function () {
        this.frameNo += 1;
        this.ctx.fillStyle = "black";
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for(let i=0;i<20;i++){
            let x = Math.round(Math.random() * this.canvas.width);
            let y = Math.round(Math.random() * this.canvas.height);
            this.drawStar(x, y);
        }
    },
    // metoda za zaustavljanje igre prekida glavnu petlju tj interval u JS
    stop: function () {
        clearInterval(this.interval);
    }
}

// konstruktor igraćih komponenti tj asteroida i igrača
function component(width, height, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.speed = {x: 4, y:2};  // zadana brzina
    // metoda koja ažurira sliku komponente
    this.update = function () {
        let ctx = gameArea.ctx;
        ctx.save();
        ctx.translate(this.x, this.y);
        let img = type === "player" ?
            document.getElementsByTagName("img").namedItem('player') :
            document.getElementsByTagName("img").namedItem('asteroid');
        ctx.shadowBlur = 20;
        ctx.shadowColor = "white";
        ctx.drawImage(img, this.width / -2, this.height / -2, this.width, this.height)
        ctx.restore();
    }
    // metoda za detektiranje sudara
    this.detectCollision = function (otherobj) {
        return (this.x - this.width/2< otherobj.x + otherobj.width/2 &&
            this.x + this.width/2 > otherobj.x - otherobj.width/2 &&
            this.y - this.height/2< otherobj.y + otherobj.height/2 &&
            this.y + this.height/2 > otherobj.y - otherobj.height/2);
    }
    // ovisno o tome koji je tip komponente
    // postavlja se funkcija za računanje nove pozicije
    if(type === "asteroid"){
        // asteroid se odbija od granica ploče vidi: gameArea.realBorder
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
        // igrač je kontroliran strelicama i nije mu dopušteno da izađe iz
        // vidljivog područja ploče vidi: gameArea.canvas
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

// generator asteroida
function initAsteroids(numOfAsteroids) {
    let asteroids = [];
    for (let i = 0; i < numOfAsteroids; i++) {
        let size = Math.round(Math.random() * 100 + 150);
        // pozicija se slučajno definira da je izvan vidljivog područja ploče
        // ovdje generiram točke sve dok ne dobijem zadovoljavajuće rješenje
        // navedeni postupak je moguće optimizirati tako da izračunam odmah zadovoljavajuće rješenje
        // ali bi trebalo razložiti na slučajeve, a ovaj korišteni potupak je razumljiviji u kodu
        // i dovoljno efikasan cca 90%
/*
        let x = Math.random() < 0.5 ?
            Math.round(Math.random() * -1 * gameArea.realBorder.left + gameArea.realBorder.left) :
            Math.round(Math.random() * (gameArea.realBorder.right - gameArea.canvas.width) + gameArea.canvas.width);
        let y = Math.random() < 0.5 ?
            Math.round(Math.random() * -1 * gameArea.realBorder.top + gameArea.realBorder.top) :
            Math.round(Math.random() * (gameArea.realBorder.bottom - gameArea.canvas.height) + gameArea.canvas.height);

 */
        let x = Math.round(Math.random() * (gameArea.realBorder.right - gameArea.realBorder.left) + gameArea.realBorder.left);
        let y = Math.round(Math.random() * (gameArea.realBorder.bottom - gameArea.realBorder.top) + gameArea.realBorder.top);
        while ( x > 0 && x < gameArea.canvas.width &&
        y > 0 && y < gameArea.canvas.height){
            x = Math.round(Math.random() * (gameArea.realBorder.right - gameArea.realBorder.left) - gameArea.realBorder.left);
            y = Math.round(Math.random() * (gameArea.realBorder.bottom - gameArea.realBorder.top) - gameArea.realBorder.top);
        }
        let asteroid = new component(size, size, x, y, "asteroid");
        asteroid.speed = {
            x: Math.round(Math.random() * 4 + 1),
            y: Math.round(Math.random() * 4 + 1)
        };
        asteroids.push(asteroid);
    }
    return asteroids;
}

// metoda za prikaz leaderboarda
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

// konstruktor igrača
function initPlayer() {
    let width = 50;
    let height = 150;
    return new component(width, height, gameArea.canvas.width/2, gameArea.canvas.height/2, "player");
}

// igrača petlja
function updateGameArea() {
    gameArea.refreshBackground();
    for(let asteroid of asteroids){
        asteroid.newPosition();
        asteroid.update();
    }
    player.newPosition();
    player.update();
    gameArea.drawTimer(); // timer nije u refreshBackground jer se prikazuje iznad pozadine, asteroida i igrača
    if(asteroids.some(asteroid => player.detectCollision(asteroid))){
        document.getElementById("explosion").play();
        gameArea.stop();
        loadLeaderboard();
    }
    if(gameArea.getTime() / 1000 % intervalForAddingAsteroidSec === 0 &&
        asteroids.length < maxNumOfAsteroids){
        let newAsteroid = initAsteroids(1)[0];
        asteroids.push(newAsteroid);
    }

}

// funkcija za pokretanje igra
function run() {
    let leaderboard = localStorage.getItem(key);
    if(!leaderboard){
        bestTime = 0;
    } else {
        leaderboard = JSON.parse(leaderboard);
        leaderboard.sort((a, b) => b-a);
        bestTime = leaderboard[0];
    }
    const inputNumberMaximum = document.getElementById("number");
    const inputInterval = document.getElementById("interval");
    const inputStarting = document.getElementById("starting");
    maxNumOfAsteroids = inputNumberMaximum.value ? Number.parseInt(inputNumberMaximum.value) : 30;
    intervalForAddingAsteroidSec = inputInterval.value ? Number.parseInt(inputInterval.value) : 10;
    startNumOfAsteroids = inputStarting.value ? Number.parseInt(inputStarting.value) : 15;
    if(startNumOfAsteroids < 1){
        alert("Min number of asteroids needs to be at least 1")
    } else if(maxNumOfAsteroids < 11){
        alert("Max number of asteroids needs to be at least 11");
    } else if (intervalForAddingAsteroidSec < 1){
        alert("Interval needs to be at least 1");
    } else {
        let menu = document.getElementById("menu");
        menu.remove();
        gameArea.start();
        asteroids = initAsteroids(startNumOfAsteroids);
        player = initPlayer();
    }
}

const key = "myGameBestTimeList";
let asteroids, player, maxNumOfAsteroids, intervalForAddingAsteroidSec, bestTime, startNumOfAsteroids;
let pressedKeys = {ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false};
document.addEventListener("keydown", function (e) {
    pressedKeys[e.key] = true;
});
document.addEventListener("keyup", function (e) {
    pressedKeys[e.key] = false;
});

document.getElementById("run").addEventListener("click", run);

