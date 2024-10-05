/*--- const ---*/
var guardianMessages = ["r","ready","i'm ready","ready!!"];
var failCodes = [
    "You distributed one of your shapes before communicating to your partners that you were ready.",
    "You distributed one of your shapes too early. Give away the shapes that are different from the one your statue is holding first.",
    "You distributed a shape to the wrong statue. Give the shape that is different from the one your statue is holding to the statue that is actually holding it.",
    "You communicated to your partners that you were ready before you actually were ready.",
    "You were kicked from the fireteam for being annoying.",
    "The Imminent End timer ended. The fireteam wiped.",
    "You distributed both of your shapes to the same statue. Distribute one shape to each of the statues."
];

/*--- var ---*/

var walls = [[],[],[]]; //Room back walls
var statuesSymbols = []; //0 = T, 1 = C, 2 = S

var playerStatue; //0 = left, 1 = mid, 2 = right
var playerBuffs = []; //player symbol buffs

//room
var leftKnightSymbol;
var rightKnightSymbol;
var leftSymbol;
var rightSymbol;
var ogre;


var currentStep; //1 = two of own, 2 = distribute
var ready = []; //ready for step 2
var step2done = []; //cpu step 2
var lastDistributed;

//cpu
var cpu1;
var cpu1Statue;
var cpu2;
var cpu2Statue;
var userReady;
var chatTexts = [];
var chatGuardians = [];


var timer; //imminent end
var getOut; //out
var gameOn; //game not paused

/*---- func ----*/

//random integers
function getRandomIntmax(max) {
    return Math.floor(Math.random()*max);
}
function getRandomIntminmax(min,max) {
    return Math.floor(Math.random() * (max - min) + min);
}

//init knight
function initKnights() {
    if(walls[playerStatue].length > 0) {
        let wallCopy = [];
        for(let i = 0; i < walls[playerStatue].length; i++) wallCopy.push(walls[playerStatue][i]);
        for(let i = 0; i < playerBuffs.length; i++) {
            let j = 0;
            let found = false;
            while(j < wallCopy.length && !found) {
                if(playerBuffs[i] == wallCopy[j]) {
                    wallCopy.splice(j,1);
                    found = true;
                }
                j++;
            }
        }
        let randomKnight = getRandomIntmax(2);
        if(wallCopy.length == 1) {
            if(randomKnight == 0) leftKnightSymbol = wallCopy[0];
            else rightKnightSymbol = wallCopy[0];
        }
        else {
            if(randomKnight == 0) {
                leftKnightSymbol = wallCopy[0];
                rightKnightSymbol = wallCopy[1];
            }
            else {
                rightKnightSymbol = wallCopy[0];
                leftKnightSymbol = wallCopy[1];
            }
        }
    }
    checkOgre();
}

//check if ogre needs to spawn
function checkOgre() {
    if(leftKnightSymbol == -1
        && leftSymbol == -1
        && rightKnightSymbol == -1
        && rightSymbol == -1
        && walls[playerStatue].length > playerBuffs.length
    )
    ogre = true;
}

//on knight click
function interactKnight(knight) {
    if(knight == 0) {
        leftSymbol = leftKnightSymbol;
        leftKnightSymbol = -1;
    }
    else {
        rightSymbol = rightKnightSymbol;
        rightKnightSymbol = -1;
    }
    updateUI();
}

//on ogre click
function interactOgre() {
    if(ogre) {
        ogre = false;
        initKnights();
    }
    updateUI();
}

//on symbol click
function interactSymbol(symbol) {
    if(playerBuffs.length < 2) {
        if(symbol == 0) {
            playerBuffs.push(leftSymbol);
            leftSymbol = -1;
        }
        else {
            playerBuffs.push(rightSymbol);
            rightSymbol = -1;
        }
    }
    checkOgre();
    checkGetOut();
    updateUI();
}

//on statue click
function interactStatue(statue) {
    if(statue != playerStatue && playerBuffs.length > 0) {
        if(playerBuffs.length > 1) {
            while(playerBuffs.length) playerBuffs.pop();
        }
        else {
            if(playerBuffs[0] == statuesSymbols[playerStatue] && currentStep == 1) {
                if(walls[playerStatue][0] == statuesSymbols[playerStatue] 
                    && walls[playerStatue][1] == statuesSymbols[playerStatue])
                    showFail(0);
                else if(walls[playerStatue][0] != statuesSymbols[playerStatue] 
                    || walls[playerStatue][1] != statuesSymbols[playerStatue]
                    || playerBuffs[0] != statuesSymbols[statue])
                    showFail(1);
            }
            else if(playerBuffs[0] != statuesSymbols[statue] && currentStep == 1) {
                showFail(2);
            }
            else {
                if(currentStep == 2 && lastDistributed == statue)
                    showFail(6);
                else {
                    if(currentStep == 2) lastDistributed = statue;
                    walls[statue].push(playerBuffs[0]);
                    let symbolIndex = walls[playerStatue].findIndex(element => element == playerBuffs[0]);
                    walls[playerStatue].splice(symbolIndex,1);
                    playerBuffs.pop();
                }
            }
        }
    }
    checkOgre();
    updateUI();
}

//init cpu
function initCPUStatues() {
    switch(playerStatue) {
        case 0:
            cpu1Statue = 1;
            cpu2Statue = 2;
            break;
        case 1:
            cpu1Statue = 0;
            cpu2Statue = 2;
            break;
        case 2:
            cpu1Statue = 0;
            cpu2Statue = 1;
            break;
        default: break;
    }
}

//set cpu statues as clickable
function setCPUStatues() {
    switch(playerStatue) {
        case 0:
            $("#statue-container-1").removeClass("cpu");
            $("#statue-container-2").addClass("cpu");
            $("#statue-container-3").addClass("cpu");
            break;
        case 1:
            $("#statue-container-1").addClass("cpu");
            $("#statue-container-2").removeClass("cpu");
            $("#statue-container-3").addClass("cpu");
            break;
        case 2:
            $("#statue-container-1").addClass("cpu");
            $("#statue-container-2").addClass("cpu");
            $("#statue-container-3").removeClass("cpu");
            break;
        default: break;
    }
}

//check if player can get out
function checkGetOut() {
    if(currentStep == 2 && walls[playerStatue].length == 2) {
        if(statuesSymbols[playerStatue] == 0
            && ((playerBuffs[0] == 1 && playerBuffs[1] == 2) || (playerBuffs[0] == 2 && playerBuffs[1] == 1))
            && ((walls[playerStatue][0] == 1 && walls[playerStatue][1] == 2) || (walls[playerStatue][0] == 2 && walls[playerStatue][1] == 1)))
            getOut = true;
        else if(statuesSymbols[playerStatue] == 1
            && ((playerBuffs[0] == 0 && playerBuffs[1] == 2) || (playerBuffs[0] == 2 && playerBuffs[1] == 0))
            && ((walls[playerStatue][0] == 0 && walls[playerStatue][1] == 2) || (walls[playerStatue][0] == 2 && walls[playerStatue][1] == 0)))
            getOut = true;
        else if(statuesSymbols[playerStatue] == 2
            && ((playerBuffs[0] == 0 && playerBuffs[1] == 1) || (playerBuffs[0] == 1 && playerBuffs[1] == 0))
            && ((walls[playerStatue][0] == 0 && walls[playerStatue][1] == 1) || (walls[playerStatue][0] == 1 && walls[playerStatue][1] == 0)))
            getOut = true;
        else getOut = false;
    }
}

//init the game
function setGame() {
    //init/empty room walls
    while(walls[0].length) walls[0].pop();
    while(walls[1].length) walls[1].pop();
    while(walls[2].length) walls[2].pop();
    while(playerBuffs.length) playerBuffs.pop();

    //init statues symbols
    statuesSymbols[0] = getRandomIntmax(3);
    do { statuesSymbols[1] = getRandomIntmax(3);}
    while(statuesSymbols[1] == statuesSymbols[0]);
    do { statuesSymbols[2] = getRandomIntmax(3);}
    while(statuesSymbols[2] == statuesSymbols[0] || statuesSymbols[2] == statuesSymbols[1]);

    //add 1 of their symbols to the room walls
    walls[0].push(statuesSymbols[0]);
    walls[1].push(statuesSymbols[1]);
    walls[2].push(statuesSymbols[2]);

    //randomly fill walls
    let symbolBuffer = [0, 1, 2];
    let randomIndex = getRandomIntmax(3);
    walls[0].push(symbolBuffer[randomIndex]);
    symbolBuffer.splice(randomIndex, 1);
    randomIndex = getRandomIntmax(2);
    walls[1].push(symbolBuffer[randomIndex]);
    symbolBuffer.splice(randomIndex, 1);
    walls[2].push(symbolBuffer[0]);

    playerStatue = getRandomIntmax(3); //init player to a random statue
    setCPUStatues();
    initCPUStatues();
    initKnights(); //init knight symbols
    //init symbols
    leftSymbol = -1;
    rightSymbol = -1;
    ogre = false; //init ogre

    //init step 1
    currentStep = 1;
    ready = [false,false,false];
    step2done = [false,false, false];
    lastDistributed = -1;
    
    $("#rl-step1").css("display","block");
    $("#rl-step2").css("display","none");

    //init cpu
    cpu1 = getRandomIntminmax(4,7);
    cpu2 = getRandomIntminmax(4,7);

    timer = 210;

    while(chatTexts.length) chatTexts.pop();
    while(chatGuardians.length) chatGuardians.pop();
    userReady = 0;
    $("#tc-chat-1").removeClass("tc-chat-active");
    $("#tc-chat-2").removeClass("tc-chat-active");
    $("#tc-chat-3").removeClass("tc-chat-active");
    $("#tc-chat-4").removeClass("tc-chat-active");
    $("#tc-chat-5").removeClass("tc-chat-active");

    $("#message-failure").removeClass("unfold");
    $("#message-success").removeClass("unfold");
    $("#message-failure").css("transform","scale(0)");
    $("#message-success").css("transform","scale(0)");

    getOut = false;
    if(!$("#button-get-out").hasClass("go-innactive")) 
        $("#button-get-out").addClass("go-innactive");

    gameOn = true;
}

function addTextChat(guardian, message) {
    chatTexts.unshift(message);
    chatGuardians.unshift(guardian);
    if(chatTexts.length > 0) {
        $("#tc-chat-n-1").text(chatGuardians[0]);
        $("#tc-chat-m-1").text(chatTexts[0]);
        if(!$("#tc-chat-1").hasClass("tc-chat-active")) $("#tc-chat-1").addClass("tc-chat-active");
    }
    if(chatTexts.length > 1) {
        $("#tc-chat-n-2").text(chatGuardians[1]);
        $("#tc-chat-m-2").text(chatTexts[1]);
        if(!$("#tc-chat-2").hasClass("tc-chat-active")) $("#tc-chat-2").addClass("tc-chat-active");
    }
    if(chatTexts.length > 2) {
        $("#tc-chat-n-3").text(chatGuardians[2]);
        $("#tc-chat-m-3").text(chatTexts[2]);
        if(!$("#tc-chat-3").hasClass("tc-chat-active")) $("#tc-chat-3").addClass("tc-chat-active");
    }
    if(chatTexts.length > 3) {
        $("#tc-chat-n-4").text(chatGuardians[3]);
        $("#tc-chat-m-4").text(chatTexts[3]);
        if(!$("#tc-chat-4").hasClass("tc-chat-active")) $("#tc-chat-4").addClass("tc-chat-active");
    }
    if(chatTexts.length > 4) {
        $("#tc-chat-n-5").text(chatGuardians[4]);
        $("#tc-chat-m-5").text(chatTexts[4]);
        if(!$("#tc-chat-5").hasClass("tc-chat-active")) $("#tc-chat-5").addClass("tc-chat-active");
    }
}

//player is ready
function imReady() {
    if(currentStep == 1 &&
        (walls[playerStatue].length != 2 
        || walls[playerStatue][0] != statuesSymbols[playerStatue]
        || walls[playerStatue][1] != statuesSymbols[playerStatue]))
            showFail(3);
    ready[playerStatue] = true;
    switch(userReady) {
        case 0:
            userReady++;
            addTextChat("To[Fireteam]:", "I'm ready!");
            break;
        case 1:
            userReady++;
            addTextChat("To[Fireteam]:", "I'm ready!");
            addTextChat("Guardian" + getRandomIntmax(9999) + ":", "we know");
            break;
        case 2:
            showFail(4);
            break;
        default: break;
    }

    if(ready[0] && ready[1] && ready[2]) {
        currentStep = 2;
        $("#rl-step1").css("display","none");
        $("#rl-step2").css("display","block");
    }
}

//cpu ready check
function checkReady(statue) {
    if(walls[statue].length == 2 
        && walls[statue][0] == statuesSymbols[statue] 
        && walls[statue][1] == statuesSymbols[statue] 
        && !ready[statue]) {
            ready[statue] = true;
            addTextChat("Guardian" + getRandomIntminmax(1000,9999) + ":", guardianMessages[getRandomIntmax(4)]);
    }
    if(ready[0] && ready[1] && ready[2]) {
        currentStep = 2;
        $("#rl-step1").css("display","none");
        $("#rl-step2").css("display","block");
    }
}

//cpu ia
function cpuFunc(statue) {
    if(currentStep == 1) {
        checkReady(statue);
        if(!ready[statue]) {
            let symbolIndex = 0;
            let symbolFound = false;
            while (symbolIndex < walls[statue].length && !symbolFound) {
                if(walls[statue][symbolIndex] != statuesSymbols[statue]) symbolFound = true;
                else symbolIndex++;
            }
            if(symbolFound) {
                let statueIndex = 0;
                let statueFound = false;
                while (statueIndex < 3 && !statueFound) {
                    if(walls[statue][symbolIndex] == statuesSymbols[statueIndex]) statueFound = true;
                    else statueIndex++;
                }
                if(statueFound) {
                    walls[statueIndex].push(walls[statue][symbolIndex]);
                    walls[statue].splice(symbolIndex,1);
                }
            }
        }
    }
    else {
        if(!step2done[statue]) {
            switch(statue) {
                case 0:
                    walls[1].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    walls[2].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    break;
                case 1:
                    walls[0].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    walls[2].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    break;
                case 2:
                    walls[0].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    walls[1].push(walls[statue][0]);
                    walls[statue].splice(0,1);
                    break;
                default: break;
            }
            step2done[statue] = true;
        }
    }
    checkOgre();
}

/*---- UI ----*/
function getImageSymbol(symbol) {
    switch(symbol) {
        case 0: return "./resources/images/image_symbol_triangle.png";
        case 1: return "./resources/images/image_symbol_circle.png";
        case 2: return "./resources/images/image_symbol_square.png";
        default: return "";
    }
}
function getStatueSymbol(symbol) {
    switch(symbol) {
        case 0: return "./resources/images/image_statue_triangle.png";
        case 1: return "./resources/images/image_statue_circle.png";
        case 2: return "./resources/images/image_statue_square.png";
        default: return "";
    }
}
function getImageShadow(symbol) {
    switch(symbol) {
        case 0: return "./resources/images/image_shadow_triangle.png";
        case 1: return "./resources/images/image_shadow_circle.png";
        case 2: return "./resources/images/image_shadow_square.png";
        default: return "";
    }
}

//seconds to m:s format
function timerToText() {
    let minutes = ~~(timer / 60);
    let extraSeconds = timer % 60;
    if(extraSeconds < 10) return minutes + ":0" + extraSeconds;
    else return minutes + ":" + extraSeconds;
}

//set game start views
function updateStaticUI() {
    $("#statue-symbol-1").attr("src",getStatueSymbol(statuesSymbols[0]));
    $("#statue-symbol-2").attr("src",getStatueSymbol(statuesSymbols[1]));
    $("#statue-symbol-3").attr("src",getStatueSymbol(statuesSymbols[2]));

    if(playerStatue == 0) {
        $("#statue-name-1").text("YOU");
        $("#statue-name-1").css("border-top-color", "var(--green)");
    }
    else {
        $("#statue-name-1").text("CPU");
        $("#statue-name-1").css("border-top-color", "var(--red)");
    }
    if(playerStatue == 1) {
        $("#statue-name-2").text("YOU");
        $("#statue-name-2").css("border-top-color", "var(--green)");
    }
    else {
        $("#statue-name-2").text("CPU");
        $("#statue-name-2").css("border-top-color", "var(--red)");
    }
    if(playerStatue == 2) {
        $("#statue-name-3").text("YOU");
        $("#statue-name-3").css("border-top-color", "var(--green)");
    }
    else {
        $("#statue-name-3").text("CPU");
        $("#statue-name-3").css("border-top-color", "var(--red)");
    }
}

//set player buff name and icon
function setBuffs() {
    if(playerBuffs.length == 0) {
        $("#buff-shape-icon").attr("src", "./resources/images/icon_empty.svg");
        $("#buff-shape-name").text("---");
    }
    else if(playerBuffs.length == 1) {
        switch(playerBuffs[0]) {
            case 0:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_trigon.svg");
                $("#buff-shape-name").text("Trigon");
                break;
            case 1:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_orbicular.svg");
                $("#buff-shape-name").text("Orbicular");
                break;
            case 2:
                $("#buff-shape-icon").attr("src", "./resources/images/icon_quadrate.svg");
                $("#buff-shape-name").text("Quadrate");
                break;
        }
    }
    else {
        if(playerBuffs[0] == 0 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_pyramidal.svg");
            $("#buff-shape-name").text("Pyramidal");
        }
        else if(playerBuffs[0] == 0 && playerBuffs[1] == 1 || playerBuffs[0] == 1 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_conoid.svg");
            $("#buff-shape-name").text("Conoid");
        }
        else if(playerBuffs[0] == 0 && playerBuffs[1] == 2 || playerBuffs[0] == 2 && playerBuffs[1] == 0) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_trilateral.svg");
            $("#buff-shape-name").text("Trilateral");
        }
        else if(playerBuffs[0] == 1 && playerBuffs[1] == 1) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_spherical.svg");
            $("#buff-shape-name").text("Spherical");
        }
        else if(playerBuffs[0] == 1 && playerBuffs[1] == 2 || playerBuffs[0] == 2 && playerBuffs[1] == 1) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_cylindric.svg");
            $("#buff-shape-name").text("Cylindric");
        }
        else if(playerBuffs[0] == 2 && playerBuffs[1] == 2) {
            $("#buff-shape-icon").attr("src", "./resources/images/icon_cubic.svg");
            $("#buff-shape-name").text("Cubic");
        }
    }
}

//update view
function updateUI() {
    if(leftKnightSymbol != -1) $("#knight-left").css("display","block");
    else $("#knight-left").css("display","none");

    if(leftSymbol != -1) {
        $("#symbol-left").css("display","block");
        $("#symbol-left").attr("src", getImageSymbol(leftSymbol));
    }
    else $("#symbol-left").css("display","none");

    if(rightKnightSymbol != -1) $("#knight-right").css("display","block");
    else $("#knight-right").css("display","none");

    if(rightSymbol != -1) {
        $("#symbol-right").css("display","block");
        $("#symbol-right").attr("src", getImageSymbol(rightSymbol));
    }
    else $("#symbol-right").css("display","none");

    if(ogre) $("#ogre").css("display","block");
    else $("#ogre").css("display","none");

    setBuffs();

    if(getOut && $("#button-get-out").hasClass("go-innactive")) 
        $("#button-get-out").removeClass("go-innactive");
}

//set fail code text and show fail dialog
function showFail(code) {
    gameOn = false;
    $("#failure-reason").text(failCodes[code]);
    $("#message-failure").addClass("unfold");
}

//show success dialog
function showSuccess() {
    gameOn = false;
    $("#message-success").addClass("unfold");
}

/*---- intervals ----*/
var CPUInterval = setInterval(function() {
    if(gameOn) {
        timer -= 1;
        $("#imminent-end-time").text(timerToText());
        if(timer == 0) showFail(5)
        cpu1 -= 1;
        if(cpu1 <= 0) {
            cpuFunc(cpu1Statue);
            cpu1 = getRandomIntminmax(4,7);
        }
        cpu2 -= 1;
        if(cpu2 <= 0) {
            cpuFunc(cpu2Statue);
            cpu2 = getRandomIntminmax(4,7);
        }
    }
}, 1000);

var rotatingSymbol = 0;
var wallInterval = setInterval(function() {
    if(gameOn) {
        rotatingSymbol+=0.25;
        if(rotatingSymbol >= walls[playerStatue].length) rotatingSymbol = 0;
        if(walls[playerStatue].length > 0) {
            var split = (rotatingSymbol + "").split(".");
            if(split.length > 1 && split[1] == "75")
                $("#wall-symbol").css("background-image", 'url(./resources/images/image_shadow_transition.png)');
            else
                $("#wall-symbol").css("background-image", 'url(' + getImageShadow(walls[playerStatue][rotatingSymbol|0]) + ')');
        }
    }
}, 250);


/*---- START ----*/
function startGame() {
    setGame();
    $("#imminent-end-time").text(timerToText());
    updateStaticUI();
    updateUI();

    $("#knight-left").click(function(){ interactKnight(0); });
    $("#knight-right").click(function(){ interactKnight(1); });
    $("#symbol-left").click(function(){ interactSymbol(0); });
    $("#symbol-right").click(function(){ interactSymbol(1); });
    $("#ogre").click(function(){ interactOgre(); });
    $("#statue-container-1").click(function(){ interactStatue(0); });
    $("#statue-container-2").click(function(){ interactStatue(1); });
    $("#statue-container-3").click(function(){ interactStatue(2); });
    $("#tc-input").click(function(){ imReady(); });
    $("#try-again-fail").click(function(){ tryAgain(); });
    $("#try-again-success").click(function(){ tryAgain(); });
    $("#button-get-out").click(function(){ getOutRequested(); });
}

//on get out button click
function getOutRequested() {
    if(getOut)
        showSuccess();
}

//restart the game
function tryAgain() {
    setGame();
    $("#imminent-end-time").text(timerToText());
    updateStaticUI();
    updateUI();
}

startGame();
