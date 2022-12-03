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
    playerInputEls,
    playerScoresEls,
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
        var params = new URLSearchParams();
        for(const {key, value} of arr) {
            params.set(key, value);
        }
        var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();
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
    if(!/\d+vs\d+vs\d+vs\d+vs\d+vs\d+/.test(squadrons)) return;
    const squadronIds = squadrons.split('vs');
    for(let i = 0; i < 6; i++) {
        playerInputEls[i].value = squadronIds[i]
    }
};

await loadSearchParamSquadrons();

let playerSquadrons = [];
let playerSquadronIds = [];

debug.initialiseListeners();

startButton.onclick = startGame;

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

async function startGame() {
    const numberRegex = /\d+/;

    for(let i = 0; i < 6; i++) {
        playerSquadronIds.push(playerInputEls[i].value);
        if(!playerInputEls[i].value) {
            alert(`Enter an objktId for player ${i+1}`);
            return;
        }
        if(!numberRegex.test(playerInputEls[i].value)) {
            alert('Objkt ids must be numbers');
            return;
        }
        try {
            const playerSquadron  = await fetchPlayerSquadron(playerInputEls[i].value);
            if(!playerSquadron) {
                alert('Unknown error, had some trouble fetching the squadrons.');
                return;
            }
            playerSquadrons.push(playerSquadron);
        } catch(e) {
            alert(`Failed to fetch squadron ${i+1}`);
            return;
        }
    }

    setSearchParams([{key: 'battle', value: `${playerSquadronIds.join('vs')}`}])
    startButton.style.display = 'none';
    playerForms.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('debug-bar').style.display = 'flex';
    await initialise();
}

const getObjktArtifactUri =async (objktId) => {
    const response = await fetch('https://api.hicdex.com/v1/graphql', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            query: `
              query Objkt($objktId: bigint!) {
                hic_et_nunc_token_by_pk(id: $objktId) {
                  artifact_uri
                }
              }
            `,
            variables: {objktId: Number(objktId)},
        }),
    });
    const data = await response.json();
    return data.data?.hic_et_nunc_token_by_pk?.artifact_uri
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

continueButton.onclick = async function() {
    continueButton.style.display = 'none';
    await initialise();
};

async function initialise() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    audioManager.play('music', 0.4, true);
    dm.init();
    pm.init();
    grid.init();
    await setupDrones();
    scoreManager.reset();
    scoresEl.style.display = 'flex';
    for(let i = 0; i < 6; i++) {
        playerScoresEls[i].style.color = colours[squadrons[i].colour];
    }
    continueButton.style.color = colours[squadrons[0].colour];
    continueButton.style.borderColor = colours[squadrons[0].colour];
    game.state = 'playing';
}

async function setupDrones() {
    squadrons.splice(0, squadrons.length);
    let i = 0;
    playerSquadrons.map(ps => {
        const colour = colourHex[i];
        i++;
        squadrons.push(SquadronFactory.make({
            id: i, colour, name: ps.leader,
            drones: ps.drones.map((d, j) => ({id: i+j, ...d})),
        }));
    });
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
        let deadSquadCount = 0;
        for(let i = 0; i < 6; i++) {
            playerScoresEls[i].innerText = scoreManager.playerScores[i].toString();
            if(squadrons[i]?.health <= 0) deadSquadCount++;
        }
        UI.displaySquadData();
        if(deadSquadCount >= 5) game.state = 'game-over';
    }
    if(game.state === 'game-over') {
        continueButton.style.display = 'block';
        new GameOver().draw();
    }
    requestAnimationFrame(animate);
    setFrameTimeData();
}
