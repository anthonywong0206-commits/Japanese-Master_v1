# Japanese Master AI

參考 English Master 製作的 AI 日文學習平台，保留同類功能：

- 情境學習：電話、餐廳、外賣、購物、旅行等日常日文
- 角色對話：文字 / 錄音練習，AI 即時修正、回覆及口語評分
- 閱讀理解：AI 產生日文文章、中文翻譯、詞彙、文法重點及閱讀問題
- 翻譯學習：支援文字、圖片、PDF、Word 上傳，讀取內容後產生日中翻譯及學習建議
- 學習中心：儲存紀錄、統計、AI 設定、主題切換

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
6. 在 Vercel Environment Variables 加入：`OPENAI_API_KEY`

## GitHub Pages 部署

GitHub Pages 只會使用前端 mock fallback；如要真正使用 AI / 語音分析，建議部署到 Vercel，因為 `/api/ai` 及 `/api/speech` 需要 serverless function。

## AI 設定

此版本已改成日文老師 prompt：AI 會以繁體中文解釋，日文內容會附中文翻譯、羅馬音/讀音提示、詞彙、文法及練習。
