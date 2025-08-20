/**
 * 操作説明モジュールのエントリーポイント
 * 必要なクラスと関数をエクスポート
 */

export { HelpManager } from './HelpManager.js';
export { helpConfig, updateHelpConfig, setTotalPages, addImage, removeImage, resetHelpConfig } from './helpConfig.js';

// デフォルトエクスポート
export { HelpManager as default } from './HelpManager.js';
