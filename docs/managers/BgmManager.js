export class BgmManager {
    constructor() {
        this.bgms = {
            mainBgm:     new Audio('assets/sound/bgm/kibidango.mp3'),
            battleBgm:   new Audio('assets/sound/bgm/BGM253-241031-yaeichihyoujou-mp3.mp3'),
            bossBgm:     new Audio('assets/sound/bgm/BGM214-181031-youkaidaiseibai-mp3.mp3'),
            lastbossBgm: new Audio('assets/sound/bgm/8bit-Battle02.mp3')
        };
        // 各曲のループ開始・終了位置（秒）
        this.loopPoints = {
            mainBgm:     { start: 0, end: 12.3 },
            battleBgm:   { start: 0, end: 42 },
            bossBgm:     { start: 0, end: 46.1 },
            lastbossBgm: { start: 2.5, end: 45.7, intro: 2.5 }
        };
        this.currentKey = null;
        this.volume = 0.7;
        this.loopInterval = null;
        this.introTimeout = null;
        this.isUserInteracted = false; // ユーザーの最初の相互作用フラグ
        this.pendingPlay = null; // 保留中の再生要求
        Object.values(this.bgms).forEach(bgm => {
            bgm.loop = true;
            bgm.volume = this.volume;
        });

        // 初回クリック/タップでオーディオコンテキストを有効化
        this.initializeUserInteraction();

        // ループ戦略を設定
        this.loopStrategies = {
            default: (bgm, loop) => {
                this.loopInterval = setInterval(() => {
                    if (bgm.currentTime >= loop.end) {
                        bgm.currentTime = loop.start;
                        bgm.play();
                    }
                }, 200);
            },
            introThenLoop: (bgm, loop) => {
                // イントロ再生後にループ監視開始
                this.introTimeout = setTimeout(() => {
                    this.loopInterval = setInterval(() => {
                        if (bgm.currentTime >= loop.end) {
                            bgm.currentTime = loop.start;
                            bgm.play();
                        }
                    }, 200);
                }, (loop.intro || loop.start) * 1000);
            }
        };
        
        // 曲ごとの戦略指定
        this.loopStrategyMap = {
            mainBgm:     'default',
            battleBgm:   'default',
            bossBgm:     'default',
            lastbossBgm: 'introThenLoop'
        };
    }

    // ユーザーの初回相互作用を検出してオーディオを有効化
    initializeUserInteraction() {
        const enableAudio = async () => {
            if (!this.isUserInteracted) {
                this.isUserInteracted = true;
                
                // 音声案内を非表示
                const audioNotice = document.getElementById('audioNotice');
                if (audioNotice) {
                    audioNotice.style.display = 'none';
                }
                
                // 保留中の再生があれば実行
                if (this.pendingPlay) {
                    await this.playInternal(this.pendingPlay);
                    this.pendingPlay = null;
                }
                
                // イベントリスナーを削除
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
                document.removeEventListener('keydown', enableAudio);
            }
        };

        // 各種ユーザーイベントを監視
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
        document.addEventListener('keydown', enableAudio);
    }

    async play(key = 'mainBgm') {
        if (!this.isUserInteracted) {
            // ユーザーの相互作用前なら保留
            this.pendingPlay = key;
            console.log(`BGM "${key}" は最初のユーザー操作後に再生されます`);
            return;
        }
        
        await this.playInternal(key);
    }

    async playInternal(key) {
        this.stop();
        if (this.bgms[key]) {
            const bgm = this.bgms[key];
            const loop = this.loopPoints[key];
            const strategy = this.loopStrategyMap[key] || 'default';
            if (strategy === 'introThenLoop') {
                bgm.currentTime = 0;
            } else {
                bgm.currentTime = loop ? loop.start : 0;
            }
            
            try {
                await bgm.play();
                this.currentKey = key;
                this.loopStrategies[strategy](bgm, loop);
            } catch (error) {
                console.warn(`BGM "${key}" の再生に失敗しました:`, error);
            }
        }
    }

    stop() {
        Object.values(this.bgms).forEach(bgm => {
            bgm.pause();
            bgm.currentTime = 0;
        });
        this.currentKey = null;
        if (this.loopInterval) {
            clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
        if (this.introTimeout) {
            clearTimeout(this.introTimeout);
            this.introTimeout = null;
        }
    }

    pause() {
        if (this.currentKey !== null) {
            this.bgms[this.currentKey].pause();
        }
    }

    resume() {
        if (this.currentKey !== null && this.isUserInteracted) {
            this.bgms[this.currentKey].play().catch(error => {
                console.warn(`BGM "${this.currentKey}" の再開に失敗しました:`, error);
            });
        }
    }

    setVolume(volume) {
        this.volume = volume;
        Object.values(this.bgms).forEach(bgm => {
            bgm.volume = volume;
        });
    }

    getCurrentKey() {
        return this.currentKey;
    }
}