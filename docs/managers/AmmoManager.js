export class AmmoManager {
    constructor(player) {
        this.player = player;
        this.maxAmmo = player.maxAmmo;
        this.ammo = this.maxAmmo;
        this.ammoRecoveryTime = 3;
        this.ammoRecoveryTimer = 0;
    }

    update(deltaTime) {
        if (this.ammo < this.maxAmmo) {
            this.ammoRecoveryTimer += deltaTime;
            if (this.ammoRecoveryTimer >= this.ammoRecoveryTime) {
                this.ammo++;
                this.ammoRecoveryTimer = 0;
            }
        } else {
            this.ammoRecoveryTimer = 0;
        }
    }

    consumeAmmo() {
        if (this.ammo > 0) {
            this.ammo--;
            return true;
        }
        return false;
    }

    getAmmo() {
        return this.ammo;
    }

    getMaxAmmo() {
        return this.maxAmmo;
    }

    getRecoveryRatio() {
        return this.ammoRecoveryTimer / this.ammoRecoveryTime;
    }

    reset() {
        this.ammo = this.maxAmmo;
        this.ammoRecoveryTimer = 0;
    }
} 