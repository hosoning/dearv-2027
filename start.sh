+  1 #!/bin/bash
+  2 
+  3 echo "Finding key..."
+  4 echo ""
+  5 echo "服務器將運行在: http://localhost:8000"
+  6 echo "請在瀏覽器中打開上述地址"
+  7 echo ""
+  8 echo "按 Ctrl+C 停止服務器"
+  9 echo ""
+ 10 
+ 11 # 檢測 Python 版本並啟動服務器
+ 12 if command -v python3 &> /dev/null; then
+ 13     python3 -m http.server 8000
+ 14 elif command -v python &> /dev/null; then
+ 15     python -m http.server 8000
+ 16 else
+ 17     echo "錯誤: 未找到 Python"
+ 18     echo "請安裝 Python 或使用其他方式運行 HTTP 服務器"
+ 19     exit 1
+ 20 fi
