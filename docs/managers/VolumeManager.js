import { renderVolumeBar } from './VolumeBar.js';
import { playSE } from './KoukaonManager.js';
// 音量調整UIの管理クラス
export class VolumeManager {
	constructor() {
		this.volumeButton = document.getElementById('volume');
		this.volumeModal = document.getElementById('volumeModal');
		this.closeVolume = document.getElementById('closeVolume');

        this.defaultVolume = 5;
	    this.blockCount = 10;
	    this.seVolumeBar = document.getElementById('seVolumeBar');
	    this.seVolumeValue = document.getElementById('seVolumeValue');
	    this.bgmVolumeBar = document.getElementById('bgmVolumeBar');
	    this.bgmVolumeValue = document.getElementById('bgmVolumeValue');
	    this.bgmManager = window.bgmManager || null;

		this.initEvents();
	}

	initEvents() {
		if (this.volumeButton && this.volumeModal) {
			this.volumeButton.addEventListener('click', () => {
                playSE("kettei");
				this.volumeModal.classList.remove('hidden');
			});
		}
		if (this.closeVolume && this.volumeModal) {
			this.closeVolume.addEventListener('click', () => {
                playSE("kasoruidou")
				this.volumeModal.classList.add('hidden');
			});
		}
		// SE音量バーの生成とイベント
		if (this.seVolumeBar && this.seVolumeValue) {
			renderVolumeBar({
				barElem: this.seVolumeBar,
				valueElem: this.seVolumeValue,
				value: this.defaultVolume,
				blockCount: this.blockCount,
				color: '#C1272D',
				onChange: (newValue) => {
					this.seVolume = newValue;
					if (typeof window.setSEVolume === 'function') {
						window.setSEVolume(newValue / this.blockCount);
					} 
				}
			});
		}
		// BGM音量バーの生成とイベント
		if (this.bgmVolumeBar && this.bgmVolumeValue) {
			renderVolumeBar({
				barElem: this.bgmVolumeBar,
				valueElem: this.bgmVolumeValue,
				value: this.defaultVolume,
				blockCount: this.blockCount,
				color: '#C1272D',
				onChange: (newValue) => {
					this.bgmVolume = newValue;
					if (this.bgmManager && typeof this.bgmManager.setVolume === 'function') {
						this.bgmManager.setVolume(newValue / this.blockCount);
					}
				}
			});
		}
	}
}
