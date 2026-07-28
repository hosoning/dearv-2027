+   1 // 3D 回憶小屋 - 主應用程式
+   2 
+   3 // ========== 全局變量 ==========
+   4 let scene, camera, renderer, clock;
+   5 let player = {
+   6     position: new THREE.Vector3(0, 1.6, 0),
+   7     rotation: { x: 0, y: 0 },
+   8     velocity: new THREE.Vector3(),
+   9     speed: 3,
+  10     height: 1.6
+  11 };
+  12 
+  13 let controls = {
+  14     left: { x: 0, y: 0, active: false },
+  15     right: { x: 0, y: 0, active: false },
+  16     keys: { w: false, a: false, s: false, d: false }
+  17 };
+  18 
+  19 let raycaster, pointer;
+  20 let interactiveObjects = [];
+  21 let transparentPerson = null;
+  22 let currentItem = null;
+  23 let currentItemIndex = 0;
+  24 
+  25 // 物品數據庫
+  26 const itemDatabase = {
+  27     bookshelf: [
+  28         {
+  29             title: "第一封信",
+  30             type: "letter",
+  31             content: "親愛的：\n\n今天是我們相識的第一天，我想把這份心情記錄下來...\n\n時間：2024年春"
+  32         },
+  33         {
+  34             title: "旅行的照片",
+  35             type: "photo",
+  36             content: "那個夏天，我們一起去了海邊，陽光很好，你笑得很開心。"
+  37         },
+  38         {
+  39             title: "生日禮物",
+  40             type: "gift",
+  41             content: "這是你送我的第一份生日禮物，我一直珍藏著。"
+  42         }
+  43     ],
+  44     cabinet: [
+  45         {
+  46             title: "紀念品",
+  47             type: "item",
+  48             content: "這是我們一起收集的各種小物件，每一件都有故事。"
+  49         },
+  50         {
+  51             title: "電影票根",
+  52             type: "ticket",
+  53             content: "2024年秋天，我們一起看的那場電影，你說很感動。"
+  54         }
+  55     ]
+  56 };
+  57 
+  58 // ========== 初始化 ==========
+  59 function init() {
+  60     // 創建場景
+  61     scene = new THREE.Scene();
+  62     scene.background = new THREE.Color(0x1a1a2e);
+  63     scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
+  64 
+  65     // 創建相機（第一人稱視角）
+  66     camera = new THREE.PerspectiveCamera(
+  67         75,
+  68         window.innerWidth / window.innerHeight,
+  69         0.1,
+  70         1000
+  71     );
+  72     camera.position.copy(player.position);
+  73 
+  74     // 創建渲染器
+  75     renderer = new THREE.WebGLRenderer({ antialias: true });
+  76     renderer.setSize(window.innerWidth, window.innerHeight);
+  77     renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
+  78     renderer.shadowMap.enabled = true;
+  79     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
+  80     document.getElementById('canvas-container').appendChild(renderer.domElement);
+  81 
+  82     // 時鐘
+  83     clock = new THREE.Clock();
+  84 
+  85     // 射線檢測器
+  86     raycaster = new THREE.Raycaster();
+  87     pointer = new THREE.Vector2();
+  88 
+  89     // 創建場景
+  90     createLights();
+  91     createRoom();
+  92     createFurniture();
+  93     createTransparentPerson();
+  94 
+  95     // 設置控制
+  96     setupControls();
+  97 
+  98     // 設置事件監聽
+  99     setupEventListeners();
+ 100 
+ 101     // 開始動畫循環
+ 102     animate();
+ 103 
+ 104     // 隱藏加載畫面
+ 105     setTimeout(() => {
+ 106         document.getElementById('loading').classList.add('hidden');
+ 107     }, 1000);
+ 108 }
+ 109 
+ 110 // ========== 創建場景元素 ==========
+ 111 
+ 112 // 創建光源
+ 113 function createLights() {
+ 114     // 環境光
+ 115     const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
+ 116     scene.add(ambientLight);
+ 117 
+ 118     // 主光源（模擬窗外陽光）
+ 119     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
+ 120     directionalLight.position.set(10, 10, 5);
+ 121     directionalLight.castShadow = true;
+ 122     directionalLight.shadow.camera.left = -20;
+ 123     directionalLight.shadow.camera.right = 20;
+ 124     directionalLight.shadow.camera.top = 20;
+ 125     directionalLight.shadow.camera.bottom = -20;
+ 126     directionalLight.shadow.mapSize.width = 2048;
+ 127     directionalLight.shadow.mapSize.height = 2048;
+ 128     scene.add(directionalLight);
+ 129 
+ 130     // 點光源（室內燈光）
+ 131     const pointLight1 = new THREE.PointLight(0xffe4b5, 0.5, 10);
+ 132     pointLight1.position.set(0, 2.5, 0);
+ 133     scene.add(pointLight1);
+ 134 
+ 135     const pointLight2 = new THREE.PointLight(0xffe4b5, 0.5, 10);
+ 136     pointLight2.position.set(5, 2.5, 5);
+ 137     scene.add(pointLight2);
+ 138 }
+ 139 
+ 140 // 創建房間（根據平面圖）
+ 141 function createRoom() {
+ 142     // 地板
+ 143     const floorGeometry = new THREE.PlaneGeometry(20, 20);
+ 144     const floorMaterial = new THREE.MeshStandardMaterial({
+ 145         color: 0xf5f5f5,
+ 146         roughness: 0.8,
+ 147         metalness: 0.2
+ 148     });
+ 149     const floor = new THREE.Mesh(floorGeometry, floorMaterial);
+ 150     floor.rotation.x = -Math.PI / 2;
+ 151     floor.receiveShadow = true;
+ 152     scene.add(floor);
+ 153 
+ 154     // 天花板
+ 155     const ceilingGeometry = new THREE.PlaneGeometry(20, 20);
+ 156     const ceilingMaterial = new THREE.MeshStandardMaterial({
+ 157         color: 0xffffff,
+ 158         roughness: 0.9
+ 159     });
+ 160     const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
+ 161     ceiling.rotation.x = Math.PI / 2;
+ 162     ceiling.position.y = 3;
+ 163     scene.add(ceiling);
+ 164 
+ 165     // 牆壁材質
+ 166     const wallMaterial = new THREE.MeshStandardMaterial({
+ 167         color: 0xe8e8e8,
+ 168         roughness: 0.9
+ 169     });
+ 170 
+ 171     // 創建外牆
+ 172     createWall(0, 1.5, -10, 20, 3, 0.2, wallMaterial); // 後牆
+ 173     createWall(0, 1.5, 10, 20, 3, 0.2, wallMaterial);  // 前牆
+ 174     createWall(-10, 1.5, 0, 0.2, 3, 20, wallMaterial); // 左牆
+ 175     createWall(10, 1.5, 0, 0.2, 3, 20, wallMaterial);  // 右牆
+ 176 
+ 177     // 創建內部牆壁（根據平面圖分隔房間）
+ 178     // 主臥室牆壁
+ 179     createWall(5, 1.5, -5, 0.2, 3, 10, wallMaterial);
+ 180     createWall(0, 1.5, 0, 10, 3, 0.2, wallMaterial);
+ 181     
+ 182     // 次臥室牆壁
+ 183     createWall(5, 1.5, 5, 0.2, 3, 10, wallMaterial);
+ 184 }
+ 185 
+ 186 // 創建單面牆
+ 187 function createWall(x, y, z, width, height, depth, material) {
+ 188     const geometry = new THREE.BoxGeometry(width, height, depth);
+ 189     const wall = new THREE.Mesh(geometry, material);
+ 190     wall.position.set(x, y, z);
+ 191     wall.castShadow = true;
+ 192     wall.receiveShadow = true;
+ 193     scene.add(wall);
+ 194 }
+ 195 
+ 196 // 創建家具
+ 197 function createFurniture() {
+ 198     // 書架（可互動）
+ 199     const bookshelfGeometry = new THREE.BoxGeometry(2, 2.5, 0.5);
+ 200     const bookshelfMaterial = new THREE.MeshStandardMaterial({
+ 201         color: 0x8b4513,
+ 202         roughness: 0.7
+ 203     });
+ 204     const bookshelf = new THREE.Mesh(bookshelfGeometry, bookshelfMaterial);
+ 205     bookshelf.position.set(-8, 1.25, -9);
+ 206     bookshelf.castShadow = true;
+ 207     bookshelf.receiveShadow = true;
+ 208     bookshelf.userData = {
+ 209         type: 'furniture',
+ 210         name: '書架',
+ 211         itemType: 'bookshelf',
+ 212         interactive: true
+ 213     };
+ 214     scene.add(bookshelf);
+ 215     interactiveObjects.push(bookshelf);
+ 216 
+ 217     // 櫃子（可互動）
+ 218     const cabinetGeometry = new THREE.BoxGeometry(1.5, 1, 0.6);
+ 219     const cabinetMaterial = new THREE.MeshStandardMaterial({
+ 220         color: 0xa0522d,
+ 221         roughness: 0.6
+ 222     });
+ 223     const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
+ 224     cabinet.position.set(8, 0.5, -9);
+ 225     cabinet.castShadow = true;
+ 226     cabinet.receiveShadow = true;
+ 227     cabinet.userData = {
+ 228         type: 'furniture',
+ 229         name: '櫃子',
+ 230         itemType: 'cabinet',
+ 231         interactive: true
+ 232     };
+ 233     scene.add(cabinet);
+ 234     interactiveObjects.push(cabinet);
+ 235 
+ 236     // 沙發
+ 237     const sofaGeometry = new THREE.BoxGeometry(3, 0.8, 1.2);
+ 238     const sofaMaterial = new THREE.MeshStandardMaterial({
+ 239         color: 0x4a5568,
+ 240         roughness: 0.8
+ 241     });
+ 242     const sofa = new THREE.Mesh(sofaGeometry, sofaMaterial);
+ 243     sofa.position.set(0, 0.4, 3);
+ 244     sofa.castShadow = true;
+ 245     sofa.receiveShadow = true;
+ 246     scene.add(sofa);
+ 247 
+ 248     // 桌子
+ 249     const tableGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
+ 250     const tableMaterial = new THREE.MeshStandardMaterial({
+ 251         color: 0xdeb887,
+ 252         roughness: 0.5
+ 253     });
+ 254     const table = new THREE.Mesh(tableGeometry, tableMaterial);
+ 255     table.position.set(0, 0.5, 0);
+ 256     table.castShadow = true;
+ 257     table.receiveShadow = true;
+ 258     scene.add(table);
+ 259 
+ 260     // 桌腿
+ 261     const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
+ 262     const legMaterial = tableMaterial;
+ 263     const positions = [
+ 264         [-0.6, 0.25, -0.6],
+ 265         [0.6, 0.25, -0.6],
+ 266         [-0.6, 0.25, 0.6],
+ 267         [0.6, 0.25, 0.6]
+ 268     ];
+ 269     positions.forEach(pos => {
+ 270         const leg = new THREE.Mesh(legGeometry, legMaterial);
+ 271         leg.position.set(pos[0], pos[1], pos[2]);
+ 272         leg.castShadow = true;
+ 273         table.add(leg);
+ 274     });
+ 275 
+ 276     // 窗戶發光效果
+ 277     const windowGeometry = new THREE.PlaneGeometry(2, 2);
+ 278     const windowMaterial = new THREE.MeshBasicMaterial({
+ 279         color: 0xadd8e6,
+ 280         transparent: true,
+ 281         opacity: 0.3
+ 282     });
+ 283     const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
+ 284     window1.position.set(-9.9, 2, -5);
+ 285     window1.rotation.y = Math.PI / 2;
+ 286     scene.add(window1);
+ 287 }
+ 288 
+ 289 // 創建透明人（玻璃折射效果）
+ 290 function createTransparentPerson() {
+ 291     const group = new THREE.Group();
+ 292 
+ 293     // 身體（極低透明度玻璃效果）
+ 294     const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
+ 295     const bodyMaterial = new THREE.MeshPhysicalMaterial({
+ 296         color: 0xffffff,
+ 297         transparent: true,
+ 298         opacity: 0.05,
+ 299         roughness: 0,
+ 300         metalness: 0,
+ 301         transmission: 0.95,
+ 302         thickness: 0.5,
+ 303         envMapIntensity: 1,
+ 304         clearcoat: 1,
+ 305         clearcoatRoughness: 0
+ 306     });
+ 307     const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
+ 308     body.position.y = 1;
+ 309     group.add(body);
+ 310 
+ 311     // 頭部
+ 312     const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
+ 313     const head = new THREE.Mesh(headGeometry, bodyMaterial);
+ 314     head.position.y = 1.9;
+ 315     group.add(head);
+ 316 
+ 317     // 邊緣發光效果
+ 318     const glowGeometry = new THREE.CapsuleGeometry(0.32, 1.22, 4, 8);
+ 319     const glowMaterial = new THREE.ShaderMaterial({
+ 320         transparent: true,
+ 321         side: THREE.BackSide,
+ 322         uniforms: {
+ 323             glowColor: { value: new THREE.Color(0x88ccff) },
+ 324             time: { value: 0 }
+ 325         },
+ 326         vertexShader: `
+ 327             varying vec3 vNormal;
+ 328             varying vec3 vPosition;
+ 329             void main() {
+ 330                 vNormal = normalize(normalMatrix * normal);
+ 331                 vPosition = position;
+ 332                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
+ 333             }
+ 334         `,
+ 335         fragmentShader: `
+ 336             uniform vec3 glowColor;
+ 337             uniform float time;
+ 338             varying vec3 vNormal;
+ 339             varying vec3 vPosition;
+ 340             void main() {
+ 341                 float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
+ 342                 float pulse = sin(time * 2.0) * 0.1 + 0.9;
+ 343                 gl_FragColor = vec4(glowColor, intensity * 0.8 * pulse);
+ 344             }
+ 345         `
+ 346     });
+ 347     const glow = new THREE.Mesh(glowGeometry, glowMaterial);
+ 348     glow.position.y = 1;
+ 349     group.add(glow);
+ 350 
+ 351     const headGlow = new THREE.Mesh(
+ 352         new THREE.SphereGeometry(0.27, 16, 16),
+ 353         glowMaterial
+ 354     );
+ 355     headGlow.position.y = 1.9;
+ 356     group.add(headGlow);
+ 357 
+ 358     // 設置初始位置
+ 359     group.position.set(3, 0, -3);
+ 360     
+ 361     // 標記為可互動
+ 362     group.userData = {
+ 363         type: 'person',
+ 364         name: '他',
+ 365         interactive: true,
+ 366         glowMaterial: glowMaterial
+ 367     };
+ 368 
+ 369     scene.add(group);
+ 370     transparentPerson = group;
+ 371     interactiveObjects.push(transparentPerson);
+ 372 
+ 373     // 透明人的簡單移動動畫
+ 374     animateTransparentPerson();
+ 375 }
+ 376 
+ 377 // 透明人移動動畫
+ 378 function animateTransparentPerson() {
+ 379     if (!transparentPerson) return;
+ 380 
+ 381     const startPos = transparentPerson.position.clone();
+ 382     const targetPos = new THREE.Vector3(
+ 383         (Math.random() - 0.5) * 10,
+ 384         0,
+ 385         (Math.random() - 0.5) * 10
+ 386     );
+ 387 
+ 388     const duration = 5000 + Math.random() * 5000;
+ 389     const startTime = Date.now();
+ 390 
+ 391     function move() {
+ 392         const elapsed = Date.now() - startTime;
+ 393         const progress = Math.min(elapsed / duration, 1);
+ 394 
+ 395         // 使用緩動函數
+ 396         const eased = progress < 0.5
+ 397             ? 2 * progress * progress
+ 398             : 1 - Math.pow(-2 * progress + 2, 2) / 2;
+ 399 
+ 400         transparentPerson.position.lerpVectors(startPos, targetPos, eased);
+ 401 
+ 402         // 讓他面向移動方向
+ 403         const direction = new THREE.Vector3()
+ 404             .subVectors(targetPos, startPos)
+ 405             .normalize();
+ 406         if (direction.length() > 0) {
+ 407             transparentPerson.rotation.y = Math.atan2(direction.x, direction.z);
+ 408         }
+ 409 
+ 410         if (progress < 1) {
+ 411             requestAnimationFrame(move);
+ 412         } else {
+ 413             // 隨機決定是否繼續移動或停留
+ 414             const shouldMove = Math.random() > 0.3;
+ 415             if (shouldMove) {
+ 416                 setTimeout(() => animateTransparentPerson(), 2000 + Math.random() * 3000);
+ 417             } else {
+ 418                 setTimeout(() => animateTransparentPerson(), 5000 + Math.random() * 10000);
+ 419             }
+ 420         }
+ 421     }
+ 422 
+ 423     move();
+ 424 }
+ 425 
+ 426 // ========== 控制系統 ==========
+ 427 
+ 428 // 設置控制
+ 429 function setupControls() {
+ 430     // 左搖桿（視角控制）
+ 431     setupJoystick('joystick-left', 'stick-left', (x, y) => {
+ 432         controls.left.x = x;
+ 433         controls.left.y = y;
+ 434     });
+ 435 
+ 436     // 右搖桿（移動控制）
+ 437     setupJoystick('joystick-right', 'stick-right', (x, y) => {
+ 438         controls.right.x = x;
+ 439         controls.right.y = y;
+ 440     });
+ 441 
+ 442     // 鍵盤控制（PC）
+ 443     window.addEventListener('keydown', (e) => {
+ 444         if (e.key.toLowerCase() in controls.keys) {
+ 445             controls.keys[e.key.toLowerCase()] = true;
+ 446         }
+ 447     });
+ 448 
+ 449     window.addEventListener('keyup', (e) => {
+ 450         if (e.key.toLowerCase() in controls.keys) {
+ 451             controls.keys[e.key.toLowerCase()] = false;
+ 452         }
+ 453     });
+ 454 
+ 455     // 鼠標控制視角（PC）
+ 456     let isMouseDown = false;
+ 457     renderer.domElement.addEventListener('mousedown', () => {
+ 458         isMouseDown = true;
+ 459         renderer.domElement.requestPointerLock();
+ 460     });
+ 461 
+ 462     renderer.domElement.addEventListener('mouseup', () => {
+ 463         isMouseDown = false;
+ 464     });
+ 465 
+ 466     document.addEventListener('mousemove', (e) => {
+ 467         if (document.pointerLockElement === renderer.domElement) {
+ 468             player.rotation.y -= e.movementX * 0.002;
+ 469             player.rotation.x -= e.movementY * 0.002;
+ 470             player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
+ 471         }
+ 472     });
+ 473 }
+ 474 
+ 475 // 搖桿設置
+ 476 function setupJoystick(containerId, stickId, callback) {
+ 477     const container = document.getElementById(containerId);
+ 478     const stick = document.getElementById(stickId);
+ 479     const maxDistance = 35;
+ 480 
+ 481     let active = false;
+ 482     let startX = 0, startY = 0;
+ 483 
+ 484     function handleStart(e) {
+ 485         active = true;
+ 486         const rect = container.getBoundingClientRect();
+ 487         const touch = e.touches ? e.touches[0] : e;
+ 488         startX = rect.left + rect.width / 2;
+ 489         startY = rect.top + rect.height / 2;
+ 490         handleMove(e);
+ 491     }
+ 492 
+ 493     function handleMove(e) {
+ 494         if (!active) return;
+ 495         e.preventDefault();
+ 496 
+ 497         const touch = e.touches ? e.touches[0] : e;
+ 498         let deltaX = touch.clientX - startX;
+ 499         let deltaY = touch.clientY - startY;
+ 500 
+ 501         const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
+ 502         if (distance > maxDistance) {
+ 503             deltaX = (deltaX / distance) * maxDistance;
+ 504             deltaY = (deltaY / distance) * maxDistance;
+ 505         }
+ 506 
+ 507         stick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
+ 508 
+ 509         const normalizedX = deltaX / maxDistance;
+ 510         const normalizedY = deltaY / maxDistance;
+ 511         callback(normalizedX, normalizedY);
+ 512     }
+ 513 
+ 514     function handleEnd() {
+ 515         active = false;
+ 516         stick.style.transform = 'translate(-50%, -50%)';
+ 517         callback(0, 0);
+ 518     }
+ 519 
+ 520     container.addEventListener('touchstart', handleStart);
+ 521     container.addEventListener('touchmove', handleMove);
+ 522     container.addEventListener('touchend', handleEnd);
+ 523     container.addEventListener('mousedown', handleStart);
+ 524     document.addEventListener('mousemove', handleMove);
+ 525     document.addEventListener('mouseup', handleEnd);
+ 526 }
+ 527 
+ 528 // ========== 事件監聽 ==========
+ 529 
+ 530 function setupEventListeners() {
+ 531     // 點擊/觸摸事件
+ 532     renderer.domElement.addEventListener('click', onPointerClick);
+ 533     renderer.domElement.addEventListener('touchend', onPointerClick);
+ 534 
+ 535     // 移動事件（用於顯示互動提示）
+ 536     renderer.domElement.addEventListener('mousemove', onPointerMove);
+ 537 
+ 538     // 窗口大小調整
+ 539     window.addEventListener('resize', onWindowResize);
+ 540 
+ 541     // 對話框選項點擊
+ 542     document.getElementById('dialog-options').addEventListener('click', (e) => {
+ 543         if (e.target.classList.contains('dialog-option')) {
+ 544             if (e.target.textContent === '關閉') {
+ 545                 closeDialog();
+ 546             } else {
+ 547                 // 這裡可以接入 AI API
+ 548                 handleDialogOption(e.target.textContent);
+ 549             }
+ 550         }
+ 551     });
+ 552 
+ 553     // 點擊對話框外部關閉
+ 554     document.getElementById('dialog-box').addEventListener('click', (e) => {
+ 555         if (e.target.id === 'dialog-box') {
+ 556             closeDialog();
+ 557         }
+ 558     });
+ 559 
+ 560     // 點擊物品查看器外部關閉
+ 561     document.getElementById('item-viewer').addEventListener('click', (e) => {
+ 562         if (e.target.id === 'item-viewer') {
+ 563             closeItemViewer();
+ 564         }
+ 565     });
+ 566 }
+ 567 
+ 568 function onPointerClick(event) {
+ 569     // 計算標準化設備坐標
+ 570     const rect = renderer.domElement.getBoundingClientRect();
+ 571     pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
+ 572     pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
+ 573 
+ 574     // 射線檢測
+ 575     raycaster.setFromCamera(pointer, camera);
+ 576     const intersects = raycaster.intersectObjects(interactiveObjects, true);
+ 577 
+ 578     if (intersects.length > 0) {
+ 579         const object = intersects[0].object;
+ 580         const userData = object.userData.type ? object.userData : object.parent.userData;
+ 581 
+ 582         if (userData.interactive) {
+ 583             handleInteraction(userData);
+ 584         }
+ 585     }
+ 586 }
+ 587 
+ 588 function onPointerMove(event) {
+ 589     const rect = renderer.domElement.getBoundingClientRect();
+ 590     pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
+ 591     pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
+ 592 
+ 593     raycaster.setFromCamera(pointer, camera);
+ 594     const intersects = raycaster.intersectObjects(interactiveObjects, true);
+ 595 
+ 596     const hint = document.getElementById('interaction-hint');
+ 597     if (intersects.length > 0) {
+ 598         const object = intersects[0].object;
+ 599         const userData = object.userData.type ? object.userData : object.parent.userData;
+ 600         
+ 601         if (userData.interactive) {
+ 602             hint.textContent = `點擊查看 ${userData.name}`;
+ 603             hint.classList.add('show');
+ 604             document.body.style.cursor = 'pointer';
+ 605             return;
+ 606         }
+ 607     }
+ 608 
+ 609     hint.classList.remove('show');
+ 610     document.body.style.cursor = 'default';
+ 611 }
+ 612 
+ 613 function onWindowResize() {
+ 614     camera.aspect = window.innerWidth / window.innerHeight;
+ 615     camera.updateProjectionMatrix();
+ 616     renderer.setSize(window.innerWidth, window.innerHeight);
+ 617 }
+ 618 
+ 619 // ========== 互動處理 ==========
+ 620 
+ 621 function handleInteraction(userData) {
+ 622     if (userData.type === 'person') {
+ 623         // 打開對話框
+ 624         showDialog();
+ 625     } else if (userData.type === 'furniture') {
+ 626         // 打開物品查看器
+ 627         showItemViewer(userData.itemType);
+ 628     }
+ 629 }
+ 630 
+ 631 function showDialog() {
+ 632     const dialogBox = document.getElementById('dialog-box');
+ 633     dialogBox.classList.add('show');
+ 634 
+ 635     // 這裡可以接入 AI API 獲取對話內容
+ 636     const greetings = [
+ 637         "你回來了，今天還好嗎？",
+ 638         "歡迎回家，想聊聊天嗎？",
+ 639         "看到你回來真好。",
+ 640         "今天過得怎麼樣？"
+ 641     ];
+ 642     
+ 643     document.getElementById('dialog-content').textContent = 
+ 644         greetings[Math.floor(Math.random() * greetings.length)];
+ 645 }
+ 646 
+ 647 function closeDialog() {
+ 648     document.getElementById('dialog-box').classList.remove('show');
+ 649 }
+ 650 
+ 651 function handleDialogOption(option) {
+ 652     // 這裡可以接入 AI API
+ 653     document.getElementById('dialog-content').textContent = `你說：${option}\n\n[AI 回應將在這裡顯示]`;
+ 654 }
+ 655 
+ 656 function showItemViewer(itemType) {
+ 657     const items = itemDatabase[itemType] || [];
+ 658     if (items.length === 0) return;
+ 659 
+ 660     currentItem = itemType;
+ 661     currentItemIndex = 0;
+ 662     updateItemViewer();
+ 663 
+ 664     document.getElementById('item-viewer').classList.add('show');
+ 665 }
+ 666 
+ 667 function updateItemViewer() {
+ 668     const items = itemDatabase[currentItem];
+ 669     if (!items || items.length === 0) return;
+ 670 
+ 671     const item = items[currentItemIndex];
+ 672     document.getElementById('item-title').textContent = item.title;
+ 673     document.getElementById('item-text').textContent = item.content;
+ 674 
+ 675     // 更新導航按鈕
+ 676     document.getElementById('prev-item').disabled = currentItemIndex === 0;
+ 677     document.getElementById('next-item').disabled = currentItemIndex === items.length - 1;
+ 678 
+ 679     // 如果有圖片可以顯示
+ 680     const itemImage = document.getElementById('item-image');
+ 681     if (item.imageUrl) {
+ 682         itemImage.src = item.imageUrl;
+ 683         itemImage.style.display = 'block';
+ 684     } else {
+ 685         itemImage.style.display = 'none';
+ 686     }
+ 687 }
+ 688 
+ 689 function navigateItem(direction) {
+ 690     const items = itemDatabase[currentItem];
+ 691     currentItemIndex = Math.max(0, Math.min(items.length - 1, currentItemIndex + direction));
+ 692     updateItemViewer();
+ 693 }
+ 694 
+ 695 function closeItemViewer() {
+ 696     document.getElementById('item-viewer').classList.remove('show');
+ 697 }
+ 698 
+ 699 // ========== 遊戲循環 ==========
+ 700 
+ 701 function updatePlayer(deltaTime) {
+ 702     // 視角控制（左搖桿或鼠標）
+ 703     player.rotation.y -= controls.left.x * 2 * deltaTime;
+ 704     player.rotation.x -= controls.left.y * 1.5 * deltaTime;
+ 705     player.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.rotation.x));
+ 706 
+ 707     // 移動控制（右搖桿或鍵盤）
+ 708     const moveVector = new THREE.Vector3();
+ 709 
+ 710     if (controls.right.x !== 0 || controls.right.y !== 0) {
+ 711         moveVector.x = controls.right.x;
+ 712         moveVector.z = -controls.right.y;
+ 713     }
+ 714 
+ 715     if (controls.keys.w) moveVector.z -= 1;
+ 716     if (controls.keys.s) moveVector.z += 1;
+ 717     if (controls.keys.a) moveVector.x -= 1;
+ 718     if (controls.keys.d) moveVector.x += 1;
+ 719 
+ 720     if (moveVector.length() > 0) {
+ 721         moveVector.normalize();
+ 722 
+ 723         // 根據視角旋轉移動方向
+ 724         const rotatedMove = moveVector.clone();
+ 725         rotatedMove.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
+ 726 
+ 727         player.velocity.x = rotatedMove.x * player.speed;
+ 728         player.velocity.z = rotatedMove.z * player.speed;
+ 729     } else {
+ 730         player.velocity.x *= 0.9;
+ 731         player.velocity.z *= 0.9;
+ 732     }
+ 733 
+ 734     // 更新位置（簡單碰撞檢測）
+ 735     const newX = player.position.x + player.velocity.x * deltaTime;
+ 736     const newZ = player.position.z + player.velocity.z * deltaTime;
+ 737 
+ 738     // 限制在房間內
+ 739     if (Math.abs(newX) < 9.5) {
+ 740         player.position.x = newX;
+ 741     }
+ 742     if (Math.abs(newZ) < 9.5) {
+ 743         player.position.z = newZ;
+ 744     }
+ 745 
+ 746     // 更新相機
+ 747     camera.position.copy(player.position);
+ 748     camera.rotation.order = 'YXZ';
+ 749     camera.rotation.y = player.rotation.y;
+ 750     camera.rotation.x = player.rotation.x;
+ 751 }
+ 752 
+ 753 function animate() {
+ 754     requestAnimationFrame(animate);
+ 755 
+ 756     const deltaTime = clock.getDelta();
+ 757 
+ 758     // 更新玩家
+ 759     updatePlayer(deltaTime);
+ 760 
+ 761     // 更新透明人發光效果
+ 762     if (transparentPerson && transparentPerson.userData.glowMaterial) {
+ 763         transparentPerson.userData.glowMaterial.uniforms.time.value += deltaTime;
+ 764     }
+ 765 
+ 766     // 渲染場景
+ 767     renderer.render(scene, camera);
+ 768 }
+ 769 
+ 770 // ========== 啟動應用 ==========
+ 771 
+ 772 // PWA 註冊
+ 773 if ('serviceWorker' in navigator) {
+ 774     window.addEventListener('load', () => {
+ 775         navigator.serviceWorker.register('sw.js')
+ 776             .then(reg => console.log('Service Worker 註冊成功'))
+ 777             .catch(err => console.log('Service Worker 註冊失敗:', err));
+ 778     });
+ 779 }
+ 780 
+ 781 // 初始化
+ 782 window.addEventListener('load', init);
