+  1 @echo off
+  2 echo.
+  3 echo 🏠 正在啟動 3D 回憶小屋...
+  4 echo.
+  5 echo 服務器將運行在: http://localhost:8000
+  6 echo 請在瀏覽器中打開上述地址
+  7 echo.
+  8 echo 按 Ctrl+C 停止服務器
+  9 echo.
+ 10 
+ 11 python -m http.server 8000
+ 12 
+ 13 if errorlevel 1 (
+ 14     echo.
+ 15     echo 錯誤: 未找到 Python
+ 16     echo 請安裝 Python 或使用其他方式運行 HTTP 服務器
+ 17     pause
+ 18 )
