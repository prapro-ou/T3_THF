// 効果音ファイルのAudioインスタンスを用意
const seFiles = {
    "baiku1": new Audio("SE2/baiku1.mp3"),
    "bossSE": new Audio("SE2/bossSE.mp3"),
    "can'ttouch": new Audio("SE2/can'ttouch.mp3"),
    "click": new Audio("SE2/click.mp3"),
    "close-husuma": new Audio("SE2/close-husuma.mp3"),
    "dog": new Audio("SE2/dog.mp3"),
    "enemy-death": new Audio("SE2/enemy-death.mp3"),
    "gameclear": new Audio("SE2/gameclear.wav"),
    "gameover": new Audio("SE2/gameover.wav"),
    "get": new Audio("assets/SE2/get.mp3"),
    "kasoruidou": new Audio("SE2/kasoruidou.mp3"),
    "kettei": new Audio("SE2/kettei.mp3"),
    "law-hp": new Audio("SE2/law-hp.mp3"),
    "levelup": new Audio("SE2/levelup.mp3"),
    "miss": new Audio("assets/SE2/miss.mp3"),
    "monkey1": new Audio("SE2/monkey1.mp3"),
    "onivoice": new Audio("SE2/onivoice.mp3"),
    "open-husuma": new Audio("SE2/open-husuma.mp3"),
    "pheasant1": new Audio("SE2/pheasant1.mp3"),
    "receivedamage": new Audio("SE2/receivedamage.mp3"),
    "recover": new Audio("assets/SE2/recover.mp3"),
    "set": new Audio("SE2/set.mp3"),
    "syoukan-syutugen": new Audio("SE2/syoukan-syutugen.mp3"),
    "taihou": new Audio("SE2/taihou.mp3"),
    "teki-syutugen": new Audio("SE2/teki-syutugen.mp3"),
    "Thunder": new Audio("SE2/Thunder.mp3"),
    "warp": new Audio("SE2/warp.mp3"),
    "Wind": new Audio("SE2/Wind.mp3"),
};

// 効果音再生関数
export function playSE(id) {
    const audio = seFiles[id];
    if (audio) {
        // 連続再生対応のため、毎回新しいAudioインスタンスを生成
        const se = audio.cloneNode();
        se.currentTime = 0;
        se.play();
    }
}
