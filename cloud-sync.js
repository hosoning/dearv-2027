+   1 // 雲端同步模組
+   2 // 這個模組處理本地數據與雲端的同步
+   3 
+   4 class CloudSync {
+   5     constructor() {
+   6         this.apiEndpoint = 'YOUR_API_ENDPOINT'; // 需要替換為實際的 API 端點
+   7         this.userId = null;
+   8         this.syncInterval = 5 * 60 * 1000; // 5分鐘同步一次
+   9         this.lastSyncTime = null;
+  10         this.syncTimer = null;
+  11     }
+  12 
+  13     // 初始化
+  14     async init(userId) {
+  15         this.userId = userId;
+  16         
+  17         // 從本地存儲加載數據
+  18         await this.loadLocalData();
+  19         
+  20         // 嘗試從雲端同步
+  21         await this.syncFromCloud();
+  22         
+  23         // 啟動自動同步
+  24         this.startAutoSync();
+  25         
+  26         // 監聽頁面關閉事件，保存數據
+  27         window.addEventListener('beforeunload', () => {
+  28             this.syncToCloud();
+  29         });
+  30 
+  31         // 監聽網絡狀態變化
+  32         window.addEventListener('online', () => {
+  33             console.log('網絡已連接，開始同步...');
+  34             this.syncToCloud();
+  35         });
+  36     }
+  37 
+  38     // 從本地存儲加載數據
+  39     async loadLocalData() {
+  40         try {
+  41             const data = localStorage.getItem('memoryHouseData');
+  42             if (data) {
+  43                 const parsed = JSON.parse(data);
+  44                 this.applyData(parsed);
+  45             }
+  46         } catch (error) {
+  47             console.error('加載本地數據失敗:', error);
+  48         }
+  49     }
+  50 
+  51     // 保存到本地存儲
+  52     saveLocalData(data) {
+  53         try {
+  54             localStorage.setItem('memoryHouseData', JSON.stringify(data));
+  55             localStorage.setItem('lastSaveTime', new Date().toISOString());
+  56         } catch (error) {
+  57             console.error('保存本地數據失敗:', error);
+  58         }
+  59     }
+  60 
+  61     // 從雲端同步數據
+  62     async syncFromCloud() {
+  63         if (!navigator.onLine) {
+  64             console.log('離線模式，跳過雲端同步');
+  65             return;
+  66         }
+  67 
+  68         try {
+  69             // 這裡需要實現實際的 API 調用
+  70             // 示例代碼：
+  71             /*
+  72             const response = await fetch(`${this.apiEndpoint}/user/${this.userId}/data`, {
+  73                 method: 'GET',
+  74                 headers: {
+  75                     'Content-Type': 'application/json',
+  76                     'Authorization': `Bearer ${this.getAuthToken()}`
+  77                 }
+  78             });
+  79 
+  80             if (response.ok) {
+  81                 const cloudData = await response.json();
+  82                 
+  83                 // 比較時間戳，決定是否覆蓋本地數據
+  84                 const localTime = localStorage.getItem('lastSaveTime');
+  85                 if (!localTime || new Date(cloudData.updatedAt) > new Date(localTime)) {
+  86                     this.applyData(cloudData);
+  87                     this.saveLocalData(cloudData);
+  88                 }
+  89                 
+  90                 this.lastSyncTime = new Date();
+  91             }
+  92             */
+  93             
+  94             console.log('從雲端同步完成');
+  95         } catch (error) {
+  96             console.error('雲端同步失敗:', error);
+  97         }
+  98     }
+  99 
+ 100     // 同步到雲端
+ 101     async syncToCloud() {
+ 102         if (!navigator.onLine) {
+ 103             console.log('離線模式，數據已保存到本地');
+ 104             return;
+ 105         }
+ 106 
+ 107         try {
+ 108             const data = this.collectData();
+ 109             
+ 110             // 先保存到本地
+ 111             this.saveLocalData(data);
+ 112 
+ 113             // 這裡需要實現實際的 API 調用
+ 114             // 示例代碼：
+ 115             /*
+ 116             const response = await fetch(`${this.apiEndpoint}/user/${this.userId}/data`, {
+ 117                 method: 'POST',
+ 118                 headers: {
+ 119                     'Content-Type': 'application/json',
+ 120                     'Authorization': `Bearer ${this.getAuthToken()}`
+ 121                 },
+ 122                 body: JSON.stringify({
+ 123                     ...data,
+ 124                     updatedAt: new Date().toISOString()
+ 125                 })
+ 126             });
+ 127 
+ 128             if (response.ok) {
+ 129                 console.log('數據已同步到雲端');
+ 130                 this.lastSyncTime = new Date();
+ 131             }
+ 132             */
+ 133             
+ 134             console.log('數據已保存');
+ 135         } catch (error) {
+ 136             console.error('同步到雲端失敗:', error);
+ 137         }
+ 138     }
+ 139 
+ 140     // 收集當前數據
+ 141     collectData() {
+ 142         return {
+ 143             items: itemDatabase,
+ 144             decorations: [], // 裝飾品數據
+ 145             settings: {
+ 146                 // 用戶設置
+ 147             },
+ 148             progress: {
+ 149                 // 遊戲進度
+ 150             }
+ 151         };
+ 152     }
+ 153 
+ 154     // 應用數據到當前狀態
+ 155     applyData(data) {
+ 156         if (data.items) {
+ 157             // 更新物品數據庫
+ 158             Object.assign(itemDatabase, data.items);
+ 159         }
+ 160         
+ 161         if (data.decorations) {
+ 162             // 更新裝飾品
+ 163             // 這裡需要實現裝飾品的應用邏輯
+ 164         }
+ 165     }
+ 166 
+ 167     // 開始自動同步
+ 168     startAutoSync() {
+ 169         this.syncTimer = setInterval(() => {
+ 170             this.syncToCloud();
+ 171         }, this.syncInterval);
+ 172     }
+ 173 
+ 174     // 停止自動同步
+ 175     stopAutoSync() {
+ 176         if (this.syncTimer) {
+ 177             clearInterval(this.syncTimer);
+ 178             this.syncTimer = null;
+ 179         }
+ 180     }
+ 181 
+ 182     // 獲取認證令牌（需要實現）
+ 183     getAuthToken() {
+ 184         return localStorage.getItem('authToken') || '';
+ 185     }
+ 186 
+ 187     // 添加新物品
+ 188     async addItem(category, item) {
+ 189         if (!itemDatabase[category]) {
+ 190             itemDatabase[category] = [];
+ 191         }
+ 192         
+ 193         itemDatabase[category].push({
+ 194             ...item,
+ 195             id: Date.now().toString(),
+ 196             createdAt: new Date().toISOString()
+ 197         });
+ 198         
+ 199         // 立即同步
+ 200         await this.syncToCloud();
+ 201     }
+ 202 
+ 203     // 刪除物品
+ 204     async deleteItem(category, itemId) {
+ 205         if (itemDatabase[category]) {
+ 206             itemDatabase[category] = itemDatabase[category].filter(
+ 207                 item => item.id !== itemId
+ 208             );
+ 209             
+ 210             // 立即同步
+ 211             await this.syncToCloud();
+ 212         }
+ 213     }
+ 214 
+ 215     // 更新物品
+ 216     async updateItem(category, itemId, updates) {
+ 217         if (itemDatabase[category]) {
+ 218             const index = itemDatabase[category].findIndex(
+ 219                 item => item.id === itemId
+ 220             );
+ 221             
+ 222             if (index !== -1) {
+ 223                 itemDatabase[category][index] = {
+ 224                     ...itemDatabase[category][index],
+ 225                     ...updates,
+ 226                     updatedAt: new Date().toISOString()
+ 227                 };
+ 228                 
+ 229                 // 立即同步
+ 230                 await this.syncToCloud();
+ 231             }
+ 232         }
+ 233     }
+ 234 }
+ 235 
+ 236 // 導出單例
+ 237 const cloudSync = new CloudSync();
+ 238 
+ 239 // 如果在瀏覽器環境中，自動初始化
+ 240 if (typeof window !== 'undefined') {
+ 241     window.cloudSync = cloudSync;
+ 242     
+ 243     // 可以在這裡添加用戶登錄後的初始化邏輯
+ 244     // 例如：cloudSync.init('user123');
+ 245 }
