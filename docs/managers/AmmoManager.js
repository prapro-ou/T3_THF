export class AmmoManager {
    constructor(player, initialMaxAmmo = 10, maxAmmoLimit = 20) {
        this.player = player;
        this.maxAmmo = maxAmmoLimit;
        this.ammo = initialMaxAmmo;
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

    setAmmo(value) {
        this.ammo = Math.max(0, Math.min(value, this.maxAmmo));
    }

    getMaxAmmo() {
        return this.maxAmmo;
    }

    setMaxAmmo(value) {
        this.maxAmmo = Math.max(1, value);
        this.ammo = Math.min(this.ammo, this.maxAmmo);
    }

    getRecoveryRatio() {
        return this.ammoRecoveryTimer / this.ammoRecoveryTime;
    }

    reset() {
        this.ammo = this.maxAmmo;
        this.ammoRecoveryTimer = 0;
    }
} 