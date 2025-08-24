import { playSE } from './KoukaonManager.js';

export function renderVolumeBar({barElem, valueElem, value, blockCount = 10, color = '#C1272D', onChange}) {
    barElem.innerHTML = '';
    const barWidth = 320;
    const bar = document.createElement('div');
    bar.style.width = barWidth + 'px';
    bar.style.height = '32px';
    bar.style.borderRadius = '6px';
    bar.style.background = '#444';
    bar.style.position = 'relative';
    bar.style.cursor = 'pointer';
    bar.style.boxShadow = '0 1px 4px #0002';
    bar.style.overflow = 'hidden';

    // 10個のブロックで見た目を表現
    const blockGap = 4;
    const blockWidth = (barWidth - blockGap * (blockCount - 1)) / blockCount;
    // hover値や初期値を考慮した選択値
    for (let i = 0; i < blockCount; i++) {
        const block = document.createElement('div');
        block.style.display = 'inline-block';
        block.style.width = blockWidth + 'px';
        block.style.height = '100%';
        block.style.marginRight = (i < blockCount - 1) ? blockGap + 'px' : '0';
        block.style.borderRadius = '4px';
        block.style.background = i < value ? color : '#888';
        block.style.transition = 'background 0.15s';
        bar.appendChild(block);
    }

    // イベント 
    bar.addEventListener('click', (e) => {
        const rect = bar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let newValue = Math.round(x / rect.width * blockCount);
        newValue = Math.max(0, Math.min(blockCount, newValue));
        valueElem.textContent = newValue;
        if (onChange) onChange(newValue);
        playSE("kettei");
        renderVolumeBar({barElem, valueElem, value: newValue, blockCount, color, onChange});
    });

    barElem.appendChild(bar);
}
