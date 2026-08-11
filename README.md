# 3D 回憶小屋

一個私人的 3D 互動回憶空間：漫遊房間、擺放家具與記憶物件、寫信/翻閱信件。手機與網頁共用同一份雲端資料。

## 技術架構

```
Next.js 14 (App Router) + TypeScript
+ React Three Fiber + drei          ← 3D 渲染層
+ Supabase (Postgres + Storage + Auth) ← 資料同步、圖片上傳、登入
+ PWA (manifest + service worker)   ← 手機「加入主屏幕」
```

這是舊版單檔案 Three.js (r128) 原型的重構版本。舊版 repo 內容已損毀（每個檔案都被寫入了帶有
`+  123` 這種 diff 行號前綴的錯誤內容，無法直接使用），因此依照交接文件的架構全部重新搭建，
UI/互動邏輯則參考文件描述重新實作。

## 專案結構

```
app/                    Next.js App Router 入口 (layout.tsx, page.tsx)
components/
  Scene.tsx             R3F <Canvas> 容器：燈光、房間、家具、玩家控制
  Room.tsx               房間幾何（地板/牆/天花/窗景）
  Character.tsx           透明玻璃質感的陪伴角色（手動關節 Group，非 skeleton）
  PlayerControls.tsx      WASD + 拖曳視角（桌面）
  MobileJoysticks.tsx     雙搖桿（行動裝置）
  CatalogPanel.tsx        目錄 UI：放置家具/記憶物件
  LetterPanel.tsx         信件 UI：寫信、翻閱信件列表
  MemoryObjectEditor.tsx  記憶物件（星星瓶/照片框/禮物盒）標題、筆記、照片編輯
  AuthGate.tsx            Supabase Magic Link 登入（未設定 Supabase 時直接跳過，走本機模式）
  HouseApp.tsx            上層狀態容器：載入資料、串接所有 UI 與 3D 場景
  furniture/*.tsx          已建模家具（沙發、餐桌、廚房中島、書架、床、書桌）
lib/
  textures.ts             程序化材質產生器（人字拼花地板、灰泥牆、大理石、维港夜景）
  supabase.ts             Supabase client（未設定環境變數時為 null）
  storage.ts               資料存取層：有 Supabase session 時讀寫雲端，否則 fallback 至 localStorage
  types.ts / catalog.ts    型別與目錄資料
supabase/schema.sql      rooms / placed_items / letters / memory_objects 資料表 + RLS + Storage bucket
public/                  manifest.json、sw.js、icon.svg（PWA）
```

## 本機開發

```bash
npm install
npm run dev
```

開發模式下若未設定 Supabase 環境變數，App 會自動進入「本機模式」：跳過登入、資料存在
`localStorage`（並有記憶體變數 fallback，避免 sandboxed 瀏覽器完全無法寫入 storage 時整個壞掉）。
畫面右上角會有一顆橘色提示「未連接雲端」。

## 設定 Supabase（跨裝置同步）

1. 建立 Supabase 專案（或用 `supabase start` 起本機實例）。
2. 在 SQL Editor 執行 `supabase/schema.sql`，會建立四張表、RLS 政策，以及 `memory-house` Storage bucket。
3. 於 Supabase Dashboard → Authentication，確認 Email OTP（Magic Link）已啟用。
4. 複製 `.env.example` 為 `.env.local`，填入：
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
5. 重新啟動 `npm run dev`。此時首次載入會要求輸入 Email 取得登入連結；登入後資料即寫入雲端，
   手機與電腦用同一個帳號登入即可共用同一個房間。

## 測試各階段功能

- **房間渲染 / 移動**：`npm run dev` 後打開 `http://localhost:3000`。桌面用 WASD 移動、拖曳畫面看方向；
  手機（或縮小視窗＋切換裝置模擬）會出現雙搖桿，左搖桿移動、右搖桿看方向。
- **目錄放置物品**：點右上角「📦 目錄」，選任一家具或記憶物件，會隨機出現在房間內；記憶物件放置後
  會直接跳出編輯視窗填標題/筆記/照片。
- **信件**：點「✉️ 信件」→「寫信」分頁撰寫、選心情標籤、可附加圖片 → 「封存這封信」；回到「信件」
  分頁可看到列表並點開翻閱。
- **陪伴角色互動**：點擊房間裡的透明人形，會跳出對話框（你好 / 今天過得怎麼樣？/ 關閉）。
- **跨裝置同步**：設定好 Supabase 並登入後，用另一台裝置（或無痕視窗）以同一 Email 登入，應該會看到
  同樣的房間、放置物品與信件。
- **PWA 安裝**：用手機瀏覽器打開網址 → 加入主屏幕；`public/sw.js` 會快取靜態資源，讓已載入過的頁面在
  斷線時仍可開啟殼層。

## 已完成 vs. 待辦（對照原交接文件的分階段計畫）

| 階段 | 狀態 | 說明 |
|---|---|---|
| Phase 1：Next.js + Supabase + 登入 | ✅ 已完成 | Magic Link 登入、rooms 表 get-or-create |
| Phase 2：房間/材質/家具搬進 R3F | ✅ 已完成 | 房間幾何、四種程序化材質、六件家具、陪伴角色 |
| Phase 3：Catalog / 信件改用 Supabase 讀寫 | ✅ 已完成 | 含記憶物件（星星瓶/照片框/禮物盒），目前用簡單幾何體占位 |
| Phase 5（提前）：PWA | ✅ 已完成 | manifest + service worker（stale-while-revalidate 靜態資源，其餘 network-first） |
| Phase 4：家具深度互動（開抽屜、翻書）、多房間 | ⬜ 待辦 | `rooms` 表已支援多房，UI 尚未做房間切換 |
| 天花板高度 / 4K 細節 / 畫面品質持續優化 | ⬜ 待辦 | 天花板已提高到 4.2m，其餘為長期打磨項目 |
| 窗外景色可互動/動態 | ⬜ 待辦 | 目前仍是靜態 canvas 貼圖 |
| 記憶物件精緻建模 | ⬜ 待辦 | 目前為簡單幾何體占位（星星瓶/照片框/禮物盒） |
| 行走抖動細緻度 | ⬜ 待辦 | 目前僅做房間邊界限制移動，未做家具碰撞 |

## 已知限制

- `next/image` 對使用者上傳圖片（data URL / Supabase Storage 動態網址）警告已知並保留為 `<img>`，
  因為這類來源不適合走 Next 的圖片最佳化管線。
- PWA icon 目前只有一顆 SVG（`purpose: any maskable`）。多數 Android/桌面瀏覽器可直接使用；
  若要更完整的 iOS 主屏幕圖示支援，建議之後补上 192/512 PNG。
- 本機模式（未設定 Supabase）下記憶物件/信件的圖片是以 data URL 存進 localStorage，大量大圖可能碰到
  瀏覽器 storage 配額上限；設定 Supabase 後圖片會改走 Storage bucket，沒有這個限制。
