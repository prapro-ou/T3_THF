/**
 * クレジット管理クラス
 * credits.jsonからクレジット情報を読み込んで表示する
 */
export class CreditsManager {
    constructor() {
        this.creditsData = null;
        this.creditsModal = null;
        this.creditsBody = null;
        this.init();
    }

    async init() {
        this.creditsModal = document.getElementById('creditsModal');
        this.creditsBody = this.creditsModal?.querySelector('.credits-body');
        
        try {
            await this.loadCreditsData();
            this.renderCredits();
        } catch (error) {
            console.error('クレジット情報の読み込みに失敗しました:', error);
            this.renderDefaultCredits();
        }
    }

    /**
     * credits.jsonからクレジット情報を読み込む
     */
    async loadCreditsData() {
        const response = await fetch('./data/credits.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.creditsData = await response.json();
    }

    /**
     * クレジット情報をHTMLにレンダリング
     */
    renderCredits() {
        if (!this.creditsBody || !this.creditsData) return;

        let html = '';

        // チームアイコンをヘッダーに追加
        if (this.creditsData.team) {
            html += `<div class="credits-header-team">`;
            html += `<img src="${this.creditsData.team.logo}" alt="${this.creditsData.team.name}" class="team-logo">`;
            html += `<h2 class="team-name">${this.creditsData.team.name}</h2>`;
            if (this.creditsData.team.description) {
                html += `<p class="team-description">${this.creditsData.team.description}</p>`;
            }
            html += `</div>`;
        }

        // 各セクションをレンダリング
        this.creditsData.sections.forEach(section => {
            html += `<div class="credits-section">`;
            html += `<h3>${section.title}</h3>`;
            
            section.items.forEach(item => {
                html += `<div class="credit-item">`;
                if (item.role) {
                    html += `<span class="credit-role">${item.role}</span>`;
                    html += `<span class="credit-name">${item.name}</span>`;
                } else {
                    html += `<span class="credit-name" style="text-align: left; width: 100%;">${item.name}</span>`;
                }
                html += `</div>`;
            });
            
            html += `</div>`;
        });

        // 追加情報がある場合
        if (this.creditsData.additionalInfo) {
            const info = this.creditsData.additionalInfo;
            html += `<div class="credits-section">`;
            html += `<h3>ゲーム情報</h3>`;
            
            if (info.version) {
                html += `<div class="credit-item">`;
                html += `<span class="credit-role">バージョン</span>`;
                html += `<span class="credit-name">${info.version}</span>`;
                html += `</div>`;
            }
            
            if (info.buildDate) {
                html += `<div class="credit-item">`;
                html += `<span class="credit-role">ビルド日</span>`;
                html += `<span class="credit-name">${info.buildDate}</span>`;
                html += `</div>`;
            }
            
            if (info.website) {
                html += `<div class="credit-item">`;
                html += `<span class="credit-role">ウェブサイト</span>`;
                html += `<span class="credit-name"><a href="${info.website}" target="_blank" style="color: #C1272D; text-decoration: none;">${info.website}</a></span>`;
                html += `</div>`;
            }
            
            html += `</div>`;
        }

        // フッター
        if (this.creditsData.footer) {
            html += `<div class="credits-footer">`;
            html += `<p>${this.creditsData.footer}</p>`;
            html += `</div>`;
        }

        this.creditsBody.innerHTML = html;
    }

    /**
     * デフォルトのクレジット情報をレンダリング（読み込み失敗時）
     */
    renderDefaultCredits() {
        if (!this.creditsBody) return;

        const defaultHtml = `
            <div class="credits-header-team">
                <img src="assets/UI/TH_fullhouse.png" alt="TH_fullhouse" class="team-logo">
                <h2 class="team-name">TH_fullhouse</h2>
            </div>
            <div class="credits-section">
                <h3>開発</h3>
                <div class="credit-item">
                    <span class="credit-role">ゲームデザイン・プログラミング</span>
                    <span class="credit-name">[開発者名を入力]</span>
                </div>
            </div>
            <div class="credits-section">
                <h3>使用素材</h3>
                <div class="credit-item">
                    <span class="credit-role">フォント</span>
                    <span class="credit-name">Google Fonts (Kiwi Maru, Noto Serif JP)</span>
                </div>
            </div>
            <div class="credits-footer">
                <p>© 2024 [プロジェクト名] All Rights Reserved.</p>
            </div>
        `;

        this.creditsBody.innerHTML = defaultHtml;
    }

    /**
     * クレジット画面を表示
     */
    show() {
        if (this.creditsModal) {
            this.creditsModal.classList.remove('hidden');
        }
    }

    /**
     * クレジット画面を非表示
     */
    hide() {
        if (this.creditsModal) {
            this.creditsModal.classList.add('hidden');
        }
    }

    /**
     * クレジット情報を動的に更新
     * @param {Object} newCreditsData - 新しいクレジット情報
     */
    updateCredits(newCreditsData) {
        this.creditsData = newCreditsData;
        this.renderCredits();
    }

    /**
     * 特定のセクションの情報を更新
     * @param {string} sectionTitle - セクションタイトル
     * @param {Array} items - 新しいアイテム配列
     */
    updateSection(sectionTitle, items) {
        if (!this.creditsData) return;

        const section = this.creditsData.sections.find(s => s.title === sectionTitle);
        if (section) {
            section.items = items;
            this.renderCredits();
        }
    }

    /**
     * フッター情報を更新
     * @param {string} newFooter - 新しいフッター文言
     */
    updateFooter(newFooter) {
        if (!this.creditsData) return;

        this.creditsData.footer = newFooter;
        this.renderCredits();
    }
}
