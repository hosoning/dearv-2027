# Dear V · 海港的家

一個私人的 3D 回憶之家：維港景觀的高層公寓，可以走動、開燈關燈、拉窗簾、看日夜變化，
在書房讀信寫信、換牆上的照片、拆禮物、坐在沙發上聽黑膠。

> **2026-10 重做**：舊版（Next.js + R3F 的程序化方塊房間，以及 42 MB 的 Godot Web 匯出）畫質和效能都不理想，
> 已整個換成「**Blender 建模 + Cycles 烘焙光照 → three.js 互動**」的新管線，程式碼在 `blender/` 和 `web/`。
> 舊版程式碼已移除（需要時可以在 git 歷史裡找回）。

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
npm run build        # 輸出到 web/dist（相對路徑，可放在任何子路徑）
npm run publish      # build 並複製到根目錄的 site/ —— GitHub Pages 從預設分支根目錄發布，根目錄 index.html 會轉到 site/
```

網址參數（方便分享特定畫面）：`?enter=1` 跳過進門畫面、`t=day|dusk|night`、`at=living|window|kitchen|bedroom|study`。

### 操作

| 桌面 | 手機 |
|---|---|
| 拖動滑鼠看四周、WASD / 方向鍵走路（Shift 跑） | 左半邊按住拖動 = 搖桿走路，右半邊拖動 = 看四周 |
| 點地板 → 走過去；點物件 → 走近並互動 | 點地板 / 點物件同左 |
| 底部列：白天/黃昏/夜晚、總燈光、窗簾、信件、快速走到各房間 | 同左 |

---
