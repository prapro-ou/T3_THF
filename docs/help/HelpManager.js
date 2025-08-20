/**
 * 操作説明管理クラス
 * 単一責任: 操作説明画面の表示、ページング、画像管理
 */
import { helpConfig } from './helpConfig.js';

export class HelpManager {
    constructor() {
        this.currentPage = 1;
        this.isVisible = false;
        
        // DOM要素の参照
        this.elements = {
            modal: null,
            image: null,
            currentPageSpan: null,
            totalPagesSpan: null,
            prevBtn: null,
            nextBtn: null,
            closeBtn: null
        };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        this.getElements();
        this.bindEvents();
        this.updatePage();
    }
    
    /**
     * DOM要素の取得
     */
    getElements() {
        this.elements.modal = document.getElementById('helpModal');
        this.elements.image = document.getElementById('helpImage');
        this.elements.currentPageSpan = document.getElementById('currentHelpPage');
        this.elements.totalPagesSpan = document.getElementById('totalHelpPages');
        this.elements.prevBtn = document.getElementById('prevHelpPage');
        this.elements.nextBtn = document.getElementById('nextHelpPage');
        this.elements.closeBtn = document.getElementById('closeHelp');
    }
    
    /**
     * イベントのバインド
     */
    bindEvents() {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.goToPrevPage());
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.goToNextPage());
        }
        
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.hide());
        }
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    /**
     * キーボードイベントの処理
     */
    handleKeydown(e) {
        if (!this.isVisible) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                this.goToPrevPage();
                break;
            case 'ArrowRight':
                this.goToNextPage();
                break;
            case 'Escape':
                this.hide();
                break;
        }
    }
    
    /**
     * 操作説明を表示
     */
    show() {
        if (!this.elements.modal) return;
        
        this.currentPage = 1;
        this.isVisible = true;
        this.updatePage();
        this.elements.modal.classList.remove('hidden');
    }
    
    /**
     * 操作説明を非表示
     */
    hide() {
        if (!this.elements.modal) return;
        
        this.isVisible = false;
        this.elements.modal.classList.add('hidden');
    }
    
    /**
     * 前のページへ移動
     */
    goToPrevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePage();
        }
    }
    
    /**
     * 次のページへ移動
     */
    goToNextPage() {
        if (this.currentPage < helpConfig.totalPages) {
            this.currentPage++;
            this.updatePage();
        }
    }
    
    /**
     * ページの更新
     */
    updatePage() {
        this.updatePageInfo();
        this.updateImage();
        this.updateNavigation();
    }
    
    /**
     * ページ情報の更新
     */
    updatePageInfo() {
        if (this.elements.currentPageSpan) {
            this.elements.currentPageSpan.textContent = this.currentPage;
        }
        
        if (this.elements.totalPagesSpan) {
            this.elements.totalPagesSpan.textContent = helpConfig.totalPages;
        }
    }
    
    /**
     * 画像の更新
     */
    updateImage() {
        if (this.elements.image && helpConfig.images[this.currentPage - 1]) {
            this.elements.image.src = helpConfig.images[this.currentPage - 1];
        }
    }
    
    /**
     * ナビゲーションボタンの更新
     */
    updateNavigation() {
        if (this.elements.prevBtn) {
            this.elements.prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (this.elements.nextBtn) {
            this.elements.nextBtn.disabled = this.currentPage >= helpConfig.totalPages;
        }
    }
    
    /**
     * ページ数の変更（helpConfigを直接更新するため、このメソッドは不要）
     * 互換性のために残しているが、helpConfig.setTotalPages() を使用することを推奨
     * @param {number} totalPages - 新しいページ数
     */
    setTotalPages(totalPages) {
        // helpConfigを直接更新
        helpConfig.totalPages = totalPages;
        if (this.currentPage > totalPages) {
            this.currentPage = totalPages;
        }
        this.updatePage();
    }
}
