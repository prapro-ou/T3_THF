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
	    
	    // BGMマネージャーの参照を取得
	    this.bgmManager = null;
	    this.seVolume = this.defaultVolume;
	    this.bgmVolume = this.defaultVolume;

		this.initEvents();
	}

	initEvents() {
		if (this.volumeButton && this.volumeModal) {
			this.volumeButton.addEventListener('click', () => {
                playSE("kettei");
				this.volumeModal.classList.remove('hidden');
				// モーダルが開かれた時にBGMマネージャーの参照を再確認
				this.updateBgmManagerReference();
			});
		}
		if (this.closeVolume && this.volumeModal) {
			this.closeVolume.addEventListener('click', () => {
                playSE("kasoruidou")
				this.volumeModal.classList.add('hidden');
			});
		}
		
		// 少し遅延してBGMマネージャーの参照を取得（初期化完了を待つ）
		setTimeout(() => {
			this.updateBgmManagerReference();
			this.initializeVolumeBars();
		}, 100);
	}
	
	// 音量バーの初期化
	initializeVolumeBars() {
		// SE音量バーの生成とイベント
		if (this.seVolumeBar && this.seVolumeValue) {
			renderVolumeBar({
				barElem: this.seVolumeBar,
				valueElem: this.seVolumeValue,
				value: this.seVolume,
				blockCount: this.blockCount,
				color: '#C1272D',
				onChange: (newValue) => {
					this.seVolume = newValue;
					const volume = newValue / this.blockCount;
					if (typeof window.setSEVolume === 'function') {
						window.setSEVolume(volume);
					}
					console.log('SE音量設定:', volume);
				}
			});
		}
		// BGM音量バーの生成とイベント
		if (this.bgmVolumeBar && this.bgmVolumeValue) {
			renderVolumeBar({
				barElem: this.bgmVolumeBar,
				valueElem: this.bgmVolumeValue,
				value: this.bgmVolume,
				blockCount: this.blockCount,
				color: '#C1272D',
				onChange: (newValue) => {
					this.bgmVolume = newValue;
					const volume = newValue / this.blockCount;
					this.updateBgmManagerReference();
					if (this.bgmManager && typeof this.bgmManager.setVolume === 'function') {
						this.bgmManager.setVolume(volume);
						console.log('BGM音量設定:', volume);
					} else {
						console.warn('BGMマネージャーが見つかりません');
					}
				}
			});
		}
	}
	
	// BGMマネージャーの参照を更新
	updateBgmManagerReference() {
		// グローバル変数からBGMマネージャーを取得
		if (window.bgmManager) {
			this.bgmManager = window.bgmManager;
		}
		// main.jsのbgmManager変数からも取得を試行
		if (window.game && window.game.bgmManager) {
			this.bgmManager = window.game.bgmManager;
		}
	}

	// 音量調整モーダルを開く（ポーズ画面から呼び出し用）
	showVolumeModal() {
		playSE("kettei");
		if (this.volumeModal) {
			this.volumeModal.classList.remove('hidden');
			// モーダルが開かれた時にBGMマネージャーの参照を再確認
			this.updateBgmManagerReference();
		}
	}
}
