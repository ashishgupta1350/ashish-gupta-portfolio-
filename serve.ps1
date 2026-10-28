param(
  [int]$Port = 8080,
  [string]$Root = $PSScriptRoot
)

Add-Type -AssemblyName System.Net.HttpListener -ErrorAction SilentlyContinue

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".json" = "application/json"
  ".webp" = "image/webp"
  ".xml"  = "application/xml"
  ".txt"  = "text/plain"
}

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($urlPath.EndsWith("/")) { $urlPath = $urlPath + "index.html" }
    $filePath = Join-Path $Root ($urlPath.TrimStart("/"))
    if (-not (Test-Path $filePath -PathType Leaf) -and (Test-Path ($filePath + ".html") -PathType Leaf)) {
      $filePath = $filePath + ".html"
    }

    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
      $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.ContentType = $contentType
    } else {
      $response.StatusCode = 404
      $response.ContentType = "text/html; charset=utf-8"
      $bytes = [System.IO.File]::ReadAllBytes((Join-Path $Root "404.html"))
    }
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
    $response.OutputStream.Close()
  } catch {
    Write-Host "Error: $_"
  }
}
