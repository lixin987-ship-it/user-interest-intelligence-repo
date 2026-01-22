param(
    [string]$Port = "8080",
    [string]$Path = "."
)

# 简单的HTTP服务器
$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "HTTP服务器已启动: $prefix" -ForegroundColor Green
Write-Host "服务目录: $(Resolve-Path $Path)" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Cyan

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # 获取请求的文件路径
        $requestPath = $request.Url.AbsolutePath
        if ($requestPath -eq '/') {
            $requestPath = '/gpt-api-test.html'
        }
        
        $filePath = Join-Path $Path $requestPath.TrimStart('/')
        
        Write-Host "请求: $requestPath -> $filePath" -ForegroundColor Gray
        
        if (Test-Path $filePath -PathType Leaf) {
            # 设置CORS头
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $response.Headers.Add("Access-Control-Allow-Headers", "*")
            
            # 获取文件扩展名并设置Content-Type
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($extension) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css; charset=utf-8" }
                ".txt"  { $response.ContentType = "text/plain; charset=utf-8" }
                ".json" { $response.ContentType = "application/json; charset=utf-8" }
                default { $response.ContentType = "application/octet-stream" }
            }
            
            # 读取并发送文件内容
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
        }
        else {
            # 404 Not Found
            $response.StatusCode = 404
            $errorMessage = "File not found: $requestPath"
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentLength64 = $errorBytes.Length
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
        }
        
        $response.Close()
    }
}
catch {
    Write-Host "服务器错误: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    $listener.Stop()
    Write-Host "HTTP服务器已停止" -ForegroundColor Yellow
}
}