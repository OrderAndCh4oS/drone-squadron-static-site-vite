import Bullet from '../abstract/bullet.js';
import { colours, context, spriteManager } from '../../constants/constants.js';

export default class FusionShot extends Bullet {
    constructor(drone, x, y, angle, velocity) {
        super(drone, x, y, 47, 7, angle, velocity, 8);
        this._colour = colours.blue;
        this._sprite = spriteManager.getSprite('fusion-shot')
    }

    draw() {
        context.translate(this.position.x, this.position.y);
        context.rotate(this.vector.getAngle() + (Math.PI / 180) * 90);
        context.translate(this._sprite.x, this._sprite.y);
        context.drawImage(this._sprite.sprite, 0, 0, this._sprite.width, this._sprite.height);
        context.resetTransform();
    }
}
