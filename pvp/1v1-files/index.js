import {
    audioManager,
    background,
    canvas,
    colourHex,
    colours,
    continueButton,
    debug,
    dm,
    game,
    grid,
    loading,
    playerForms,
    playerOneInput,
    playerOneScoreEl,
    playerTwoInput,
    playerTwoScoreEl,
    pm,
    scoreManager,
    scoresEl,
    squadrons,
    startButton,
    stopButton,
} from './constants/constants.js';
import { deltaTime } from './service/delta-time.js';
import SquadronFactory from './factory/squadron-factory.js';
import UI from './user-interface/ui.js';
import GameOver from './user-interface/display-game-over.js';

const apiKey = 'ZIMcGcGQ2s85G8ZTlwu3w5BvIJoowvt9aTlS9V96';
const baseUrl = 'https://hh9lpf2krk.execute-api.eu-west-2.amazonaws.com/prod';

let fpsInterval, startTime, now, then, elapsed;

loading.style.display = 'block';
await audioManager.setAudioFile('explosion', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/explosion_1.wav');
await audioManager.setAudioFile('pulse-rifle', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/pulse-rifle.wav');
await audioManager.setAudioFile('arc-gun', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/arc-gun.wav');
await audioManager.setAudioFile('phase-rifle', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/phase-rifle.wav');
await audioManager.setAudioFile('fusion-cannon', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/fusion-cannon.wav');
await audioManager.setAudioFile('plasma-cannon', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/sound/plasma-cannon.wav');
await audioManager.setAudioFile('music', 'https://dwodb1f89mlko.cloudfront.net/assets/audio/music.mp3', 'audio/mpeg');
loading.style.display = 'none';
startAnimating(60);

function setSearchParams(arr) {
    if (history.pushState) {
        const params = new URLSearchParams();
        for(const {key, value} of arr) {
            params.set(key, value);
        }
        const newUrl = window.location.protocol +
            '//' +
            window.location.host +
            window.location.pathname +
            '?' +
            params.toString();
        window.history.pushState({path:newUrl},'',newUrl);
    }
}

const getParameter = (key) => {
    const address = window.location.search;
    const parameterList = new URLSearchParams(address);

    return parameterList.get(key);
};

const loadSearchParamSquadrons = async () => {
    const squadrons = getParameter('battle');
    if(!squadrons) return;
    if(!/\d+vs\d+/.test(squadrons)) return;
    const [squadronOneId, squadronTwoId] = squadrons.split('vs')
    playerOneInput.value = squadronOneId
    playerTwoInput.value = squadronTwoId
    // await startGame();
};

await loadSearchParamSquadrons();

let squadronOne = null;
let squadronTwo = null;

debug.initialiseListeners();

startButton.onclick = startGame;

async function startGame() {
    if(!playerOneInput.value) {
        alert('Enter an objktId for player one');
        return;
    }
    if(!playerTwoInput.value) {
        alert('Enter an objktId for player two');
        return;
    }
    const numberRegex = /\d+/;
    console.warn(playerOneInput);
    console.warn(playerOneInput.value);
    if(!numberRegex.test(playerOneInput.value) || !numberRegex.test(playerTwoInput.value)) {
        alert('Objkt ids must be numbers');
        return;
    }
    try {
        squadronOne = await fetchPlayerSquadron(playerOneInput.value);
    } catch(e) {
        alert('Failed to fetch squadron one');
        return;
    }
    try {
        squadronTwo = await fetchPlayerSquadron(playerTwoInput.value);
    } catch(e) {
        alert('Failed to fetch squadron two');
        return;
    }
    if(!squadronOne || !squadronTwo) {
        alert('Unknown error, had some trouble fetching the squadrons.');
        return;
    }
    setSearchParams([{key: 'battle', value: `${playerOneInput.value}vs${playerTwoInput.value}`}])
    startButton.style.display = 'none';
    playerForms.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('debug-bar').style.display = 'flex';
    await initialise();
}

continueButton.onclick = async function() {
    continueButton.style.display = 'none';
    await initialise();
};

stopButton.onclick = async() => {
    continueButton.style.display = 'none';
    game.state = 'stopped';
    game.rank = 0;
    canvas.style.display = 'none';
    scoreManager.reset();
    audioManager.stop('music');
    startButton.style.display = 'block';
    playerForms.style.display = 'block';
    document.getElementById('debug-bar').style.display = 'none';
    scoresEl.style.display = 'none';
};

window.onresize = async() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    background.update();
    background.draw();
};

async function initialise() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    audioManager.play('music', 0.4, true);
    dm.init();
    pm.init();
    grid.init();
    await setupDrones();
    if(game.rank === 0) {
        scoreManager.resetPlayerOne();
    }
    scoreManager.resetPlayerTwo();
    scoresEl.style.display = 'flex';
    playerOneScoreEl.style.color = colours[squadrons[0].colour];
    playerTwoScoreEl.style.color = colours[squadrons[1].colour];
    continueButton.style.color = colours[squadrons[0].colour];
    continueButton.style.borderColor = colours[squadrons[0].colour];
    game.state = 'playing';
}

const getObjktArtifactUri =async (objktId) => {
    const response = await fetch('https://api.teztok.com/v1/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            query: `query GetDroneSquadronById($objktId: String!) {
                tokens_by_pk(fa2_address: "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton", token_id: $objktId) {
                  artifact_uri
                }
              }`,
            variables: {objktId: String(objktId)},
        }),
    });
    const data = await response.json();
    return data.data?.tokens_by_pk?.artifact_uri
};

async function fetchPlayerSquadron(objktId) {
    const artifactUri = await getObjktArtifactUri(objktId);
    console.log(artifactUri)
    if(!artifactUri) throw new Error('objkt id not found');
    const playerSquadronData = await fetch(
        `https://nftstorage.link/ipfs/${artifactUri.slice(7)}/data/player-drones/squadron.json`,
    );

    return await playerSquadronData.json();
}

async function setupDrones() {
    squadrons.splice(0, squadrons.length);
    const playerOne = squadronOne;
    const playerTwo = squadronTwo;
    const c1 = playerOne.colour;
    let c2;
    do {
        c2 = ~~(Math.random() * 6);
    } while(c2 === c1);
    [
        {
            id: 1, colour: colourHex[c1], name: 'Squadron ' + playerOne.leader,
            drones: playerOne.drones.map((d, i) => ({id: i, ...d})),
        },
        {
            id: 2, colour: colourHex[c2], name: 'Squadron ' + playerTwo.leader,
            drones: playerTwo.drones.map((d, i) => ({id: i + playerOne.drones.length + 1, ...d})),
        },
    ].map(s => squadrons.push(SquadronFactory.make(s)));
}

function startAnimating(fps) {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}

function setFrameTimeData() {
    now = Date.now();
    elapsed = now - then;
    if(elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
    }
}

function animate() {
    background.draw();
    deltaTime.update();
    if(game.state === 'playing' || game.state === 'game-over') {
        pm.update();
        dm.update();
        grid.draw();
        grid.log();
        playerOneScoreEl.innerText = scoreManager.playerOneScore.toString();
        playerTwoScoreEl.innerText = scoreManager.playerTwoScore.toString();
        UI.displaySquadData();
        if(squadrons[0]?.health <= 0 || squadrons[1]?.health <= 0) game.state = 'game-over';
    }
    if(game.state === 'game-over') {
        continueButton.style.display = 'block';
        new GameOver().draw();
    }
    requestAnimationFrame(animate);
    setFrameTimeData();
}
