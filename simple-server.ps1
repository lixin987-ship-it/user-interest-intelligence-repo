param(
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "HTTP服务器已启动: $prefix" -ForegroundColor Green
    Write-Host "服务目录: $PWD" -ForegroundColor Yellow
    Write-Host "访问测试页面: ${prefix}gpt-api-test.html" -ForegroundColor Cyan
    Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Red

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $requestPath = $request.Url.AbsolutePath.TrimStart('/')
        if ($requestPath -eq '') {
            $requestPath = 'gpt-api-test.html'
        }
        
        $filePath = Join-Path $PWD $requestPath
        
        # 设置CORS头
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")
        
        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($extension) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".css"  { $response.ContentType = "text/css" }
                ".txt"  { $response.ContentType = "text/plain" }
                default { $response.ContentType = "application/octet-stream" }
            }
            
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
            Write-Host "200 $requestPath" -ForegroundColor Green
        }
        else {
            $response.StatusCode = 404
            $errorMessage = "File not found: $requestPath"
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
            $response.ContentLength64 = $errorBytes.Length
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            Write-Host "404 $requestPath" -ForegroundColor Red
        }
        
        $response.Close()
    }
}
catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    Write-Host "服务器已停止" -ForegroundColor Yellow
}