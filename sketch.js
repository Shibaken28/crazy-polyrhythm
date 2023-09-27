

let version = "ver. 0.1";
// リソースのパス
let resourcePath = "./resource/";
let bpm = 120;
let rhythmNum = 2;
let beep = new Array(rhythmNum);
let prevTime = 0;
let nowTime = 0;
let keyName = ["J","F"];
let tuplet = [[4,2],[4,3],[3,5],[4,7],[5,7]];
let levelColor = ["#000020","#002000","#200020","#202000","#400000"];
let level = 0;
let blockBeep;
let blockBeep2;
let crap;
let gameState = -1;
let scoreList = new Array();
let auto = false;
// 二次元配列
let inputTiming = new Array(rhythmNum);
let howtoplay = "あそび方\n JキーとKキーでポリリズムをキープしましょう\n スペースキーを押すとスタートし、4拍の合図の後開始です\n 4小節間でどのくらいうまくリズムキープできたかを採点します。\n お手本は0キーを押してオートを有効にすると見られます\n 3,4キーでリズムの変更、1,2キーでBPMの変更が可能です"



function preload() {
    beep[0] = loadSound(resourcePath + 'bass.mp3');
    beep[1] = loadSound(resourcePath + 'hat.mp3');
    blockBeep = loadSound(resourcePath + 'block.wav');
    blockBeep2 = loadSound(resourcePath + 'block2.wav');
    crap = loadSound(resourcePath + 'crap.mp3');
    for (let i = 0; i < inputTiming.length; i++) {
        inputTiming[i] = new Array();
    }    
}

/*座標*/
class pos {
    constructor(y, x) {
        this.y = y;
        this.x = x;
        this.col = 0;
    }
    print() {
        print("(", this.y, ",", this.x, ")")
    }
    rotate(dir) {
        dir = (dir + 4) % 4;
        for (let i = 0; i < dir; i++) {
            let y = this.y;
            this.y = -this.x;
            this.x = y;
        }
    }
}

class Effects{
    constructor(){
        this.pos = new Array();
        this.life = new Array();
    }
    addEffect(pos, life){
        this.pos.push(pos);
        this.life.push(life);
    }
    update(){
        for(let i=0;i<this.pos.length;i++){
            this.life[i]--;
            if(this.life[i]<=0){
                this.pos.splice(i,1);
                this.life.splice(i,1);
                i--;
            }
        }
    }
    draw(){
        for(let i=0;i<this.pos.length;i++){
            let x = this.pos[i].x;
            let y = this.pos[i].y;
            let life = this.life[i];
            let size = 10;
            let alpha = life/100;
            noStroke();
            stroke(250,250,50,alpha*255);
            strokeWeight(7);
            line(x, y - 10, x, y + 10);
        }
    }

}

class stopwatch {
    constructor() {
        this.startTime = 0;
        this.nowTime = 0;
        this.isRunning = false;
    }
    start() {
        this.startTime = millis();
        this.isRunning = true;
    }
    stop() {
        this.nowTime = millis();
        this.isRunning = false;
    }
    getTimeMs() {
        if (this.isRunning) {
            this.nowTime = millis();
        }
        // ミリ秒で返す
        return this.nowTime - this.startTime;
    }
    getTimeSec() {
        if (this.isRunning) {
            this.nowTime = millis();
        }
        // 秒で返す
        return (this.nowTime - this.startTime) / 1000;
    }
    reset() {
        this.startTime = 0;
        this.nowTime = 0;
        this.isRunning = false;
    }
}

function inArea(a, b, x) {
    // aとbが頂点(対角線を共有する)の長方形にxはあるか,ただしa<b
    return a.x <= x.x && x.x <= b.x && a.y <= x.y && x.y <= b.y;
}

function drawRhythmLine(y, leftX, rightX, tuplet, visual) {
    noStroke();
    stroke("#F0F0F0");
    strokeWeight(7);
    line(leftX, y, rightX, y);

    // 連符の描画
    strokeWeight(7);
    let width = rightX - leftX;
    let unit = width / tuplet;
    for (let i = 0; i <= tuplet; i++) {
        if(!visual && 0<i && i<tuplet){
            continue;
        }
        let x = leftX + unit * i;
        line(x, y - 10, x, y + 10);
    }
}

function drawNowTimeLine(y, leftX, rightX, prevTime, time, bpm, tuplet, beepId, sound) {
    let w = rightX - leftX;
    let x = leftX + w * time / (60*4 / bpm * 1000);
    noStroke();
    fill("#F0F0F0");
    circle(x, y, 20);

    // 連符で音を鳴らす
    if(sound){
        for(let i=0;i<tuplet;i++){
            playSoundWhenTuplet(time, prevTime, bpm, tuplet, i, beep[beepId]);
        }
    }
}

function playSoundWhenTuplet(time, prevTime, bpm, tuplet, i, beep){
    if(i==0){
        if(nowTime == 0){
            beep.play();
        }
    }else{
        // prevTimeのときには超えていなくて、timeのときには超えている
        // bpmのときtupletのi番目が何ミリ秒か
        let t = 60*4 / bpm * 1000 / tuplet * i;
        if (prevTime < t && t <= time) {
            beep.play();
        }
    }
}
    

function setup() {
    createCanvas(windowWidth, windowHeight);
    stopwatch = new stopwatch();
    textFont("Times New Roman");
    effects = new Effects();
}



function draw() {
    drawBackground();
    // タイトル描画
    noStroke();
    strokeWeight(2);
    textSize(50);
    textAlign(CENTER, CENTER);
    fill("#F0F0F0");
    text("Crazy PolyRhythm", width / 2, 50);
    textSize(20);
    text(version, width / 2, 100);
    
    // スコア描画
    textSize(50);
    textAlign(CENTER, CENTER);
    let avgScore = 0;
    for(let i=0;i<scoreList.length;i++){
        avgScore += scoreList[i];
    }
    avgScore /= scoreList.length;
    if(scoreList.length == 0)avgScore = 0;
    if(auto)avgScore = 0;
    if(gameState == -2 && avgScore >= 95){
        crap.play();   
    }
    fill("#F0F0F0");
    if(avgScore >= 95){
        fill("#FFFF00");
    }

    let Rank = "";
    if(scoreList.length == 4){
        Rank = "    Rank = "
        if(avgScore >= 100){
            Rank += "CHEATER";
        }else if(avgScore >= 99){
            Rank += "METRONOME";
        }else if(avgScore >= 98){
            Rank += "PRO";
        }else if(avgScore >= 95){
            Rank += "S";
        }else if(avgScore >= 92.5){
            Rank += "A";
        }else if(avgScore >= 90){
            Rank += "B";
        }else if(avgScore >= 85){
            Rank += "BAD";
        }
    }
    // スコアを100で割って小数点第二位まで表示
    text("BPM = "+bpm + "   Score = "+avgScore.toFixed(2)+Rank, width / 2, 150);
    // オートが有効であることを示す
    textSize(20);
    textAlign(CENTER, CENTER);
    fill("#F0F0F0");
    text((auto?"Auto Enable (0-Key toggle Auto)":"(0-Key toggle Auto)") , width / 2, 200);
    
    // 画面の下の方にあそびかたを表示
    textSize(18);
    textAlign(CENTER, CENTER);
    fill("#F0F0F0");
    text(howtoplay, width / 2, height-100);

    if (stopwatch.isRunning) {
        // 停止ボタン
        noStroke();
        fill("#F0F0F0");
        rect(width / 2 - 20, 230, 10, 40);
        rect(width / 2 + 10, 230, 10, 40);
        
    } else {
        // 再生ボタン
        noStroke();
        fill("#F0F0F0");
        triangle(width / 2 - 20, 230, width / 2 - 20, 270, width / 2 + 20, 250);
    }

    // 再生ボタン or 停止ボタン
    // スペースキーで操作できることを示す
    textSize(20);
    textAlign(CENTER, CENTER);
    fill("#F0F0F0");
    text("Press Space Key", width / 2, 300);
 
    
    for (let i = 0; i < rhythmNum; i++) {
        let y = 200 + (height-200) / (rhythmNum+2) * (i+1);
        drawRhythmLine(y, 150, width-100, tuplet[level][i], (gameState<=2));
        if(stopwatch.isRunning && gameState >= 1){
            drawNowTimeLine(y, 150, width-100, prevTime, nowTime, bpm, tuplet[level][i], i, auto);
        }

        noStroke();
        strokeWeight(2);
        textSize(50);
        textAlign(CENTER, CENTER);
        fill("#F0F0F0");
        text(keyName[i] + "   " + tuplet[level][i], 80, y);
    }

    if(gameState >= 0){
        // 次の小節へ
        if (stopwatch.getTimeMs() > 60*4 / bpm * 1000) {
            if(gameState>0)scoreList.push(calcScore());
            sectionReset();
            gameState += 1;
        }
    }
    if(gameState==-2){
        gameState = -1;
    }
    if(gameState == 5){
        // ゲーム終了
        stopwatch.stop();
        gameState = -2;
    }
    if(gameState == 0){
        for (let i = 0; i < 4; i++) {
            if(i==0) playSoundWhenTuplet(nowTime, prevTime, bpm, 4, i, blockBeep);
            else playSoundWhenTuplet(nowTime, prevTime, bpm, 4, i, blockBeep2);
        }
    }
    effects.update();
    effects.draw(); 

    prevTime = nowTime;
    nowTime = stopwatch.getTimeMs();
    
}

// スペースキーを押したときにタイマーをスタート or ストップ
function keyPressed() {
    if (keyCode == 32) {
        if (stopwatch.isRunning) {
            stopwatch.stop();
        } else {
            sectionReset();
            scoreList = new Array();
            gameState = 0;
        }
    }
    // 押されたキーに対応する inputTiming に現在の時間を追加
    for (let i = 0; i < rhythmNum; i++) {
        if (keyCode == keyName[i].charCodeAt()) {
            inputTiming[i].push(stopwatch.getTimeMs());
            // おとをならす
            beep[i].play();
            // エフェクトを追加
            if(gameState > 0)
            effects.addEffect(
                new pos(200 + (height-200) / (rhythmNum+2) * (i+1), 150 +  nowTime * (width - 250) / (60*4 / bpm * 1000)),
                100); 
        }
    }
    // 0キーでオートモード
    if(keyCode == 48){
        auto = !auto;
    }
    // 1キーでBPMを下げる, 2キーでBPMを上げる
    if(keyCode == 49){
        bpm -= 1;
    }
    if(keyCode == 50){
        bpm += 1;
    }
    // 3キーでレベルを下げる, 4キーでレベルを上げる
    if(keyCode == 51){
        level -= 1;
    }
    if(keyCode == 52){
        level += 1;
    }
    if(level < 0)level = tuplet.length-1;
    if(level >= tuplet.length)level = 0;
}

function calcScore() {
    let scoreMax = 0;
    for(let zure=-300; zure<=300; zure+=20){
        let score = 10000;
        for (let i = 0; i < rhythmNum; i++) {
            console.log(inputTiming[i].length);
            for (let j = 1; j < tuplet[level][i]; j++) {
                let t = 60*4 / bpm * 1000 / tuplet[level][i] * j;
                let min = 100000000;
                for (let k = 0; k < inputTiming[i].length; k++) {
                    min = Math.min(min, Math.abs(inputTiming[i][k]+zure - t));
                }
                score -= min;
            }
            // 余計な入力を減点
            score -= Math.max(0, (inputTiming[i].length - 1 - tuplet[level][i]) * 1000);
        }
        scoreMax = Math.max(scoreMax, score);
    }
    return  Math.max(0, scoreMax/100);
}

function sectionReset() {
    stopwatch.reset();
    stopwatch.start();
    prevTime = 0;
    nowTime = 0;
    for(let i=0;i<rhythmNum;i++){
        inputTiming[i] = new Array();
    }
}

function drawBackground() {
    background(levelColor[level]);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
