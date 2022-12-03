export default class ScoreManager {
    _playerScores = [0, 0, 0, 0, 0, 0];

    get playerScores() {
        return this._playerScores
    }

    tallyKill(bullet, drone) {
        this._playerScores[bullet.squadId] += ~~(drone.value * 100) * 100;
    }

    reset() {
        this._playerScores = [0, 0, 0, 0, 0, 0];
    }

    resetPlayer(index) {
        this._playerScores[index] = 0;
    }
}
