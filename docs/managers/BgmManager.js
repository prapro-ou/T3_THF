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
        Object.values(this.bgms).forEach(bgm => {
            bgm.loop = true;
            bgm.volume = this.volume;
        });

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

    play(key = 'mainBgm') {
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
            bgm.play();
            this.currentKey = key;
            this.loopStrategies[strategy](bgm, loop);
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
        if (this.currentKey !== null) {
            this.bgms[this.currentKey].play();
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