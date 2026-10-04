param(
    [int]$Port = 4173,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Write-HttpResponse {
    param(
        [System.Net.Sockets.NetworkStream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body,
        [bool]$SendBody = $true
    )

    $header = @(
        "HTTP/1.1 $StatusCode $StatusText"
        "Content-Type: $ContentType"
        "Content-Length: $($Body.Length)"
        "Cache-Control: no-cache"
        "X-Content-Type-Options: nosniff"
        "Connection: close"
        ""
        ""
    ) -join "`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if ($SendBody -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

function Get-ContentType {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".css"  { return "text/css; charset=utf-8" }
        ".js"   { return "text/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".webp" { return "image/webp" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }
        ".woff" { return "font/woff" }
        ".woff2" { return "font/woff2" }
        default  { return "application/octet-stream" }
    }
}

$wwwRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\www"))
$rootPrefix = $wwwRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$indexPath = Join-Path $wwwRoot "index.html"

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw "Website files are missing: $indexPath. Extract the complete preview package and try again."
}

$listener = $null
$selectedPort = $Port
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    $candidatePort = $Port + $attempt
    $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
    try {
        $candidate.Start()
        $listener = $candidate
        $selectedPort = $candidatePort
        break
    }
    catch [System.Net.Sockets.SocketException] {
        $candidate.Stop()
    }
}

if ($null -eq $listener) {
    throw "No local port is available. Tried $Port through $($Port + 19)."
}

$url = "http://127.0.0.1:$selectedPort/"
Write-Host ""
Write-Host "EVER FLAME LOGISTICS local preview is running." -ForegroundColor Green
Write-Host "URL: $url"
Write-Host "Close this window or press Ctrl+C to stop."
Write-Host ""

if (-not $NoBrowser) {
    try {
        Start-Process $url -ErrorAction Stop
    }
    catch {
        Write-Warning "The default browser could not be opened automatically."
        Write-Host "Open this URL manually: $url" -ForegroundColor Yellow
    }
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        $stream = $null
        $reader = $null
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new(
                $stream,
                [System.Text.Encoding]::ASCII,
                $false,
                4096,
                $true
            )

            $requestLine = $reader.ReadLine()
            while (($headerLine = $reader.ReadLine()) -ne $null -and $headerLine -ne "") {
                # Drain request headers before responding.
            }

            if ([string]::IsNullOrWhiteSpace($requestLine) -or
                $requestLine -notmatch "^(GET|HEAD)\s+(\S+)\s+HTTP/\d(?:\.\d)?$") {
                $badBody = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
                Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText "Bad Request" -ContentType "text/plain; charset=utf-8" -Body $badBody
                continue
            }

            $method = $Matches[1]
            $rawTarget = $Matches[2]
            $pathOnly = $rawTarget.Split("?", 2)[0]

            try {
                $decodedPath = [System.Uri]::UnescapeDataString($pathOnly)
            }
            catch {
                $badBody = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
                Write-HttpResponse -Stream $stream -StatusCode 400 -StatusText "Bad Request" -ContentType "text/plain; charset=utf-8" -Body $badBody
                continue
            }

            $relativePath = $decodedPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $wwwRoot $relativePath))
            $insideRoot = $candidatePath.Equals($wwwRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
                $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)

            if (-not $insideRoot) {
                $forbiddenBody = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
                Write-HttpResponse -Stream $stream -StatusCode 403 -StatusText "Forbidden" -ContentType "text/plain; charset=utf-8" -Body $forbiddenBody -SendBody ($method -eq "GET")
                continue
            }

            if (Test-Path -LiteralPath $candidatePath -PathType Container) {
                $candidatePath = Join-Path $candidatePath "index.html"
            }

            if (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
                $hasExtension = -not [string]::IsNullOrEmpty([System.IO.Path]::GetExtension($candidatePath))
                if (-not $hasExtension) {
                    $candidatePath = $indexPath
                }
                else {
                    $notFoundBody = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
                    Write-HttpResponse -Stream $stream -StatusCode 404 -StatusText "Not Found" -ContentType "text/plain; charset=utf-8" -Body $notFoundBody -SendBody ($method -eq "GET")
                    continue
                }
            }

            $body = [System.IO.File]::ReadAllBytes($candidatePath)
            Write-HttpResponse -Stream $stream -StatusCode 200 -StatusText "OK" -ContentType (Get-ContentType -Path $candidatePath) -Body $body -SendBody ($method -eq "GET")
        }
        catch {
            try {
                if ($null -ne $stream) {
                    $errorBody = [System.Text.Encoding]::UTF8.GetBytes("Internal Server Error")
                    Write-HttpResponse -Stream $stream -StatusCode 500 -StatusText "Internal Server Error" -ContentType "text/plain; charset=utf-8" -Body $errorBody
                }
            }
            catch {
                # The client may have disconnected; keep the preview server alive.
            }
        }
        finally {
            if ($null -ne $reader) { $reader.Dispose() }
            if ($null -ne $stream) { $stream.Dispose() }
            $client.Close()
        }
    }
}
finally {
    $listener.Stop()
}
