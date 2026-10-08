# Dear V · 海港的家

一個私人的 3D 回憶之家：維港景觀的高層公寓，可以走動、開燈關燈、拉窗簾、看日夜變化，
在書房讀信寫信、換牆上的照片、拆禮物、坐在沙發上聽黑膠。

> **2026-10 重做**：舊版（Next.js + R3F 的程序化方塊房間，以及 42 MB 的 Godot Web 匯出）畫質和效能都不理想，
> 已整個換成「**Blender 建模 + Cycles 烘焙光照 → three.js 互動**」的新管線，程式碼在 `blender/` 和 `web/`。
> 舊版程式碼暫時保留在原位（`app/`、`components/`、`game/`、`site/` 等），確認新版沒問題後可以刪掉。

## 新架構

```
blender/            Blender 5.2 腳本（可用 `pip install bpy==5.2.2` 免安裝 Blender 直接跑）
  textures.py       程序化無縫 PBR 貼圖（橡木地板、大理石、胡桃木、布料、水磨石、城市立面…）
  lib.py            幾何/材質工具：倒角方塊、軟墊、管線、擠出、碰撞盒登記
  apartment.py      公寓本體：客廳 L 型沙發、餐廳、廚房中島、臥室、衣櫃、回憶書房、陽台、燈具、互動物件
  exterior.py       窗外：對岸天際線（退台高樓）、山脊、岸線、近景大樓
  bake.py           自製光照貼圖 UV 打包、Cycles 輻照度烘焙、OIDN 降噪、sqrt 編碼
  main.py           一鍵：建模 → 白天/夜晚兩套光照貼圖 → 匯出 GLB + scene.json
web/                Vite + TypeScript + three.js（r185）
  src/world.ts      載入 GLB、套用兩套光照貼圖（shader 內白天/黃昏/夜晚混合）、合併靜態網格
  src/environment.ts 天空（日/昏/夜、星星、月亮）、Water 反射海面、船、航空燈、城市夜景窗光
  src/controls.ts   第一人稱：拖動看、WASD、點地板走過去、手機左半邊浮動搖桿、碰撞
  src/interact.ts   所有互動：門、衣櫃、冰箱、燈、窗簾、電視投影、黑膠唱機、水龍頭、禮物、相框、坐下
  src/ui.ts / store.ts 信件、相框、禮物卡片 UI；資料存在 localStorage
  public/assets/    烘焙好的成品（apartment.glb、city.glb、lightmaps/*.webp、scene.json）
```

### 為什麼這樣做

- **光照全部在 Blender 裡用 Cycles 路徑追蹤烘焙**（每個表面都有柔和的間接光、接觸陰影、燈光在地板上的光暈），
  three.js 只需要讀貼圖，所以手機也跑得動，而且畫質是即時打光做不到的。
- 白天（太陽＋天光從海港那側進來）和夜晚（所有燈具）各烘一套，shader 內插值出黃昏，
  關燈時用白天的光分佈乘月光色調。
- 窗外是真的 3D 城市和反射海面，夜晚大樓窗戶會亮、船會開過去、樓頂航空燈會閃。

## 重新生成場景（改了 Blender 腳本之後）

```bash
python3 -m venv .venv && .venv/bin/pip install bpy==5.2.2 pillow
# 需要 libEGL（OIDN 降噪用的 compositor）：sudo apt-get install libegl1
.venv/bin/python blender/main.py --out web/public/assets            # 完整品質（4 核 CPU 約 40 分鐘）
.venv/bin/python blender/main.py --out web/public/assets --quick    # 預覽品質（約 3 分鐘）
.venv/bin/python blender/main.py --out /tmp/x --no-bake             # 只匯出幾何（測試用）
```

也可以在一般 Blender 裡跑：`blender -b -P blender/main.py -- --out web/public/assets`。
加 `--blend out.blend` 可以把整個場景存成 .blend 用 Blender 打開編輯。

## 跑網頁

```bash
cd web
npm install
npm run dev          # http://localhost:5173
npm run build        # 輸出到 web/dist（相對路徑，可放在任何子路徑，例如 GitHub Pages）
```

網址參數（方便分享特定畫面）：`?enter=1` 跳過進門畫面、`t=day|dusk|night`、`at=living|window|kitchen|bedroom|study`。

### 操作

| 桌面 | 手機 |
|---|---|
| 拖動滑鼠看四周、WASD / 方向鍵走路（Shift 跑） | 左半邊按住拖動 = 搖桿走路，右半邊拖動 = 看四周 |
| 點地板 → 走過去；點物件 → 走近並互動 | 點地板 / 點物件同左 |
| 底部列：白天/黃昏/夜晚、總燈光、窗簾、信件、快速走到各房間 | 同左 |

---

# 舊版說明（保留待刪）

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
  AuthGate.tsx            進門後的 Supabase Email/密碼登入（未設定時可走本機模式）
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

## 部署到 GitHub Pages

這個 App 完全是前端渲染（沒有 server component / API route），所以可以直接以純靜態網站的形式跑在
GitHub Pages 上，不需要另外申請 Vercel 之類的服務。專案已經內建：

- `next.config.mjs`：`GITHUB_PAGES=true` 時會自動加上 `/dearv-2027` 這個 basePath（其他情況維持根目錄，
  本機開發、Vercel 等其他託管都不受影響）
- `.github/workflows/deploy-pages.yml`：build 完自動上傳並部署到 GitHub Pages
- manifest / icon / service worker 的路徑都已改成相對路徑，不管部署在根目錄還是子路徑都能正確運作

**啟用步驟（只需要做一次）：**

1. 到這個 repo 的 **Settings → Pages**，「Build and deployment → Source」選擇 **GitHub Actions**。
2. 之後只要：
   - Push 到 `main`（例如 PR 合併後），或
   - 到 **Actions** 分頁手動點 `Deploy to GitHub Pages` → `Run workflow`（可以選任何分支，不用等 PR 合併）
   就會自動 build 並部署。
3. 完成後網址是 `https://hosoning.github.io/dearv-2027/`。
4. 若要讓部署版本也有雲端同步，到 **Settings → Secrets and variables → Actions** 補上
   `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 兩個 Repository secrets，重新跑一次
   workflow 即可；沒設定的話網站一樣能開，只是走本機 localStorage 模式。

## 設定 Supabase（跨裝置同步）

1. 建立 Supabase 專案（或用 `supabase start` 起本機實例）。
2. 在 SQL Editor 執行 `supabase/schema.sql`，會建立四張表、RLS 政策，以及 `memory-house` Storage bucket。
3. 於 Supabase Dashboard → Authentication，確認 Email 登入已啟用。
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
