import Propegator from "./Propegator.js";

let timer = document.getElementById("timer");
let timerString = document.getElementById("timerString");
let playButton = document.getElementById("timelinePlayButton");

let forwardButton = document.getElementById("timelineForward");
let backwardButton = document.getElementById("timelineBackward");
let fastForwardButton = document.getElementById("fastForwardButton");
let fastBackwardButton = document.getElementById("fastBackwardButton");

let velocityXForm = document.getElementById("velocityXForm");
let velocityYForm = document.getElementById("velocityYForm");
let velocityZForm = document.getElementById("velocityZForm");

let positionXForm = document.getElementById("positionXForm");
let positionYForm = document.getElementById("positionYForm");
let positionZForm = document.getElementById("positionZForm");

let asteroidDiameterForm = document.getElementById("asteroidDiameterForm");
let asteroidMassForm = document.getElementById("asteroidMassForm");

let resetButton = document.getElementById("resetButton");

let simTimeSeconds = 0;
let defaultTimeStep = Propegator.timeStep; // Seconds
let timeStepMultiplier = 1;

let playing = false;
let backward = false;

let dataPoint = 0;

Propegator.setup();

resetButton.addEventListener('click', () => {
    playing = false;
    playButton.src = "../../images/run.png";
    backward = false;

    Propegator.collided = -1;

    dataPoint = 0;
    simTimeSeconds = 0;
    timeStepMultiplier = 1;
    defaultTimeStep = Propegator.timeStep;

    Propegator.timeSteps = [];

    Propegator.asteroid = { x: 0, y: 0, z: 0};
    Propegator.planet = { x: 0, y: 0, z: 0};

    Propegator.planetPhysicsLocation = { x: 0, y: 0, z: 0};
    Propegator.asteroidPhysicsLocation = {
        x: parseFloat(positionXForm.value * 1000),
        y: parseFloat(positionYForm.value * 1000),
        z: parseFloat(positionZForm.value * 1000)
    };

    Propegator.asteroidAcceleration = { x: 0, y: 0, z: 0};
    Propegator.asteroidVelocity = {
        x: parseFloat(velocityXForm.value),
        y: parseFloat(velocityYForm.value),
        z: parseFloat(velocityZForm.value)
    };

    Propegator.asteroidDiameter = parseFloat(asteroidDiameterForm.value);
    Propegator.asteroidMass = parseFloat(asteroidMassForm.value);


    Propegator.earthMass = 5.972e24;
    Propegator.gravitationalConstant = 6.67e-11;
    Propegator.timeStep = 10; //s

    Propegator.setup();

    formatClock();
});

playButton.addEventListener('click', () => {
    if(playing == true) {
        playButton.src = "../../images/run.png";
        playing = false;
    } else {
        playButton.src = "../../images/pause.png";
        playing = true;
    }
});

forwardButton.addEventListener('click', () => {
    timeStepMultiplier = 1;
    backward = false;
});

backwardButton.addEventListener('click', () => {
    timeStepMultiplier = 1;
    backward = true;
});

fastForwardButton.addEventListener('click', () => {
    timeStepMultiplier = 10;
    backward = false;
});

fastBackwardButton.addEventListener('click', () => {
    timeStepMultiplier = 10;
    backward = true;
});

setInterval(() => {
    let timeStep = timeStepMultiplier * defaultTimeStep;
    if(playing) {
        Propegator.displayNextStep(dataPoint);
        formatClock();
        if(backward == true) {
            if(simTimeSeconds - timeStep >= 0) {
                simTimeSeconds -= timeStep;
                dataPoint -= timeStepMultiplier;
            } else {
                simTimeSeconds = 0;
                dataPoint = 0;
            }
        } else {
            if(Propegator.collided == -1) {
                simTimeSeconds += timeStep;
                dataPoint += timeStepMultiplier;
            } else {
                if(dataPoint + timeStepMultiplier <= Propegator.collided) {
                    simTimeSeconds += timeStep;
                    dataPoint += timeStepMultiplier;
                } else {
                    dataPoint = Propegator.collided;
                }
            }
        }
    }
}, 1000 / 10);

function formatClock() {

    let seconds = simTimeSeconds;
    let minutes = 0;
    let hours = 0;
    let days = 0;
    let years = 0;

    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    hours = Math.floor(minutes / 60);
    minutes = minutes % 60;

    days = Math.floor(hours / 24);
    hours = hours % 24;

    let totalDays = days;

    years = Math.floor(days / 365);
    days = days % 365;

    timer.innerText = years.toString().padStart(2, '0') + ":" + days.toString().padStart(3, '0') + ":" + hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');

    timerString.innerText = totalDays.toString() + " days " + hours.toString().padStart(2, '0') + " hours";
}

