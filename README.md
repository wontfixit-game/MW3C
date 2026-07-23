# 墨魂三國 Ink Soul Dynasty

水墨橫卷動作遊戲（MVP）— Vite 模組化專案，可持續更新關卡／武將／戰鬥。

## 本地開發

```bash
npm install
npm run dev
```

瀏覽器打開終端顯示的網址（通常是 `http://localhost:5173`）。

```bash
npm run build    # 產出 dist/
npm run preview  # 預覽正式建置
```

## 用網頁建立 GitHub repo 並上傳

Repo：https://github.com/wontfixit-game/MW3C

1. 開 repo → **Add file → Upload files**
2. 把本資料夾內容拖上去（**不要**上傳 `node_modules/`、`dist/`）
3. Commit changes

### 開 GitHub Pages（可線上玩）

1. Repo → **Settings → Pages**
2. **Source** 選 **GitHub Actions**
3. 上傳後會跑 `.github/workflows/deploy.yml` 自動建置
4. 完成後網址：`https://wontonsit-game.github.io/MW3C/`

## 專案結構

```
src/
  data/        武將、關卡數值
  render/      水墨繪製
  ui/          選單、武將畫面
  battle/      戰鬥引擎
  save.js      localStorage 存檔
  audio.js     WebAudio 音效
  main.js      啟動與導覽
```

## 之後怎麼更新

改 `src/` 底下對應模組 → 本地 `npm run dev` 驗證 → 上傳／推送變更 → Pages 自動重新發佈。
