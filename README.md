# Japanese Master AI

版本：v1.1.0 Kana Learning

AI 日文學習平台：情境學習、角色對話、閱讀理解、翻譯學習、PDF / Word / 圖片文字匯入、My Learning 學習中心。

## 本機運行

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

## Vercel 部署

1. 上載整個專案到 GitHub
2. Vercel Import Project
3. Framework 選 Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`

## 重要修正版說明 v1.0.1

這個版本移除了 `package-lock.json`，並固定 dependencies 版本，避免 Vercel 安裝時因 `latest` 或 lockfile registry 問題出現：

```txt
npm error Exit handler never called!
Command "npm install" exited with 1
```

同時加入 `.npmrc` 及 `vercel.json` 的 `installCommand`，讓 Vercel 使用更穩定的安裝方式。

## AI 設定

Vercel 後端 API 使用環境變數：

```txt
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4o-mini
OPENAI_TRANSCRIBE_MODEL=whisper-1
```

如沒有設定 API Key，前端會使用本機 mock fallback，網站仍可開啟及測試介面。


## v1.1.0 新增功能

- 新增「50音」頁面
- 今日50音：每日自動抽 5 個平假名／片假名
- 50音學習：完整平假名及片假名表、點擊朗讀、例字、標記已學
- 50音測驗：看字選音、聽音選字混合測驗，保存正確率及進度

