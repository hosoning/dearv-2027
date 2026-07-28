# dearv-2027
Happy Birthday My Dear V

+   1 # 3D 回憶小屋
+   2 
+   3 一個基於 Three.js 的第一人稱 3D 互動空間應用，用於珍藏和回顧珍貴的回憶。
+   4 
+   5 ## 功能特點
+   6 
+   7 ### 核心功能
+   8 - ✨ **第一人稱 3D 探索**：自由在 3D 空間中走動
+   9 - 🏠 **多房間布局**：根據平面圖生成的現代簡約大平層
+  10 - 🪑 **家具互動**：點擊書架、櫃子等查看分類回憶
+  11 - 👤 **透明人陪伴**：邊緣發光的玻璃折射效果，會自行走動
+  12 - 💬 **對話系統**：可選字卡模式或 AI 模式
+  13 - 📱 **PWA 支持**：可安裝到手機和電腦
+  14 - ☁️ **雲端同步**：數據自動同步到雲端
+  15 
+  16 ### 控制方式
+  17 
+  18 #### 移動端
+  19 - **左下搖桿**：控制視角（上下左右）
+  20 - **右下搖桿**：控制移動（前後左右）
+  21 - **點擊物品**：查看回憶內容
+  22 - **點擊透明人**：開始對話
+  23 
+  24 #### PC端
+  25 - **WASD**：移動
+  26 - **鼠標**：控制視角
+  27 - **左鍵點擊**：互動
+  28 
+  29 ## 技術棧
+  30 
+  31 - **Three.js** - 3D 渲染引擎
+  32 - **原生 JavaScript** - 無框架依賴
+  33 - **PWA** - 漸進式網頁應用
+  34 - **Service Worker** - 離線支持
+  35 
+  36 ## 快速開始
+  37 
+  38 ### 本地運行
+  39 
+  40 1. 使用任何 HTTP 服務器運行項目：
+  41 
+  42 ```bash
+  43 # 使用 Python
+  44 python -m http.server 8000
+  45 
+  46 # 或使用 Node.js http-server
+  47 npx http-server
+  48 ```
+  49 
+  50 2. 在瀏覽器中打開 `http://localhost:8000`
+  51 
+  52 ### 部署
+  53 
+  54 將以下文件部署到任何靜態網站托管服務：
+  55 - `index.html`
+  56 - `app.js`
+  57 - `cloud-sync.js`
+  58 - `manifest.json`
+  59 - `sw.js`
+  60 - 圖標文件（需要自行創建）
+  61 
+  62 推薦服務：
+  63 - Vercel
+  64 - Netlify
+  65 - GitHub Pages
+  66 - Cloudflare Pages
+  67 
+  68 ## 雲端同步設置
+  69 
+  70 ### 後端 API 要求
+  71 
+  72 需要實現以下 API 端點：
+  73 
+  74 ```
+  75 GET  /api/user/{userId}/data       - 獲取用戶數據
+  76 POST /api/user/{userId}/data       - 保存用戶數據
+  77 PUT  /api/user/{userId}/items      - 更新物品
+  78 ```
+  79 
+  80 ### 數據格式
+  81 
+  82 ```json
+  83 {
+  84   "items": {
+  85     "bookshelf": [
+  86       {
+  87         "id": "1",
+  88         "title": "第一封信",
+  89         "type": "letter",
+  90         "content": "...",
+  91         "createdAt": "2024-01-01T00:00:00Z"
+  92       }
+  93     ]
+  94   },
+  95   "decorations": [],
+  96   "settings": {},
+  97   "updatedAt": "2024-01-01T00:00:00Z"
+  98 }
+  99 ```
+ 100 
+ 101 ### 配置
+ 102 
+ 103 在 `cloud-sync.js` 中修改：
+ 104 
+ 105 ```javascript
+ 106 this.apiEndpoint = 'YOUR_API_ENDPOINT'; // 替換為你的 API 端點
+ 107 ```
+ 108 
+ 109 並實現認證邏輯：
+ 110 
+ 111 ```javascript
+ 112 getAuthToken() {
+ 113     return localStorage.getItem('authToken') || '';
+ 114 }
+ 115 ```
+ 116 
+ 117 ## 自定義
+ 118 
+ 119 ### 添加新家具
+ 120 
+ 121 在 `app.js` 的 `createFurniture()` 函數中添加：
+ 122 
+ 123 ```javascript
+ 124 const furniture = new THREE.Mesh(geometry, material);
+ 125 furniture.userData = {
+ 126     type: 'furniture',
+ 127     name: '家具名稱',
+ 128     itemType: 'category_name',
+ 129     interactive: true
+ 130 };
+ 131 scene.add(furniture);
+ 132 interactiveObjects.push(furniture);
+ 133 ```
+ 134 
+ 135 ### 添加新物品類別
+ 136 
+ 137 在 `app.js` 的 `itemDatabase` 中添加：
+ 138 
+ 139 ```javascript
+ 140 const itemDatabase = {
+ 141     your_category: [
+ 142         {
+ 143             title: "標題",
+ 144             type: "類型",
+ 145             content: "內容"
+ 146         }
+ 147     ]
+ 148 };
+ 149 ```
+ 150 
+ 151 ### 修改房間布局
+ 152 
+ 153 在 `app.js` 的 `createRoom()` 函數中修改牆壁位置和尺寸。
+ 154 
+ 155 ### 接入 AI 對話
+ 156 
+ 157 在 `app.js` 的 `handleDialogOption()` 函數中添加 API 調用：
+ 158 
+ 159 ```javascript
+ 160 async function handleDialogOption(option) {
+ 161     try {
+ 162         const response = await fetch('YOUR_AI_API', {
+ 163             method: 'POST',
+ 164             headers: { 'Content-Type': 'application/json' },
+ 165             body: JSON.stringify({ message: option })
+ 166         });
+ 167         const data = await response.json();
+ 168         document.getElementById('dialog-content').textContent = data.reply;
+ 169     } catch (error) {
+ 170         console.error('AI API 調用失敗:', error);
+ 171     }
+ 172 }
+ 173 ```
+ 174 
+ 175 ## 性能優化建議
+ 176 
+ 177 1. **模型優化**：使用簡化的 3D 模型，減少面數
+ 178 2. **紋理壓縮**：使用壓縮格式的紋理（如 KTX2）
+ 179 3. **按需加載**：使用 Three.js 的 GLTFLoader 實現資源懶加載
+ 180 4. **陰影優化**：限制投影物體數量，使用較低的陰影貼圖分辨率
+ 181 5. **移動端優化**：降低渲染分辨率，使用 `setPixelRatio(Math.min(2, window.devicePixelRatio))`
+ 182 
+ 183 ## 未來功能計劃
+ 184 
+ 185 - [ ] 更多家具和裝飾品
+ 186 - [ ] 自定義房間布局編輯器
+ 187 - [ ] 照片上傳和展示
+ 188 - [ ] 背景音樂和環境音效
+ 189 - [ ] 多語言支持
+ 190 - [ ] VR 支持
+ 191 - [ ] 社交分享功能
+ 192 - [ ] 更豐富的 AI 對話模式
+ 193 
+ 194 ## 瀏覽器支持
+ 195 
+ 196 - Chrome/Edge 90+
+ 197 - Safari 14+
+ 198 - Firefox 88+
+ 199 - 移動端瀏覽器（iOS Safari 14+, Chrome Mobile）
+ 200 
+ 201 ## 授權
+ 202 
+ 203 MIT License
+ 204 
+ 205 ## 貢獻
+ 206 
+ 207 歡迎提交 Issue 和 Pull Request！
+ 208 
+ 209 ## 聯繫方式
+ 210 
+ 211 如有問題或建議，請通過 Issue 聯繫。
