param(
    [Parameter(Mandatory = $true)]
    [string]$PreviewRoot,
    [int]$Port = 4199
)

$ErrorActionPreference = "Stop"
$PreviewRoot = [System.IO.Path]::GetFullPath($PreviewRoot)
$serverScript = Join-Path $PreviewRoot "server\preview-server.ps1"
$launchers = @(Get-ChildItem -LiteralPath $PreviewRoot -Filter "*.bat" -File)

if (-not (Test-Path -LiteralPath $serverScript -PathType Leaf)) {
    throw "Preview server not found: $serverScript"
}
if ($launchers.Count -ne 1) {
    throw "Expected exactly one batch launcher; found $($launchers.Count)."
}

$launcherPath = $launchers[0].FullName
$launcherBytes = [System.IO.File]::ReadAllBytes($launcherPath)
if (@($launcherBytes | Where-Object { $_ -gt 127 }).Count -gt 0) {
    throw "Batch launcher must contain ASCII bytes only."
}
$launcherText = [System.Text.Encoding]::ASCII.GetString($launcherBytes)
if ($launcherText -match "(?<!\r)\n" -or $launcherText -notmatch "\r\n") {
    throw "Batch launcher must use Windows CRLF line endings only."
}
Write-Output "PASS ASCII + CRLF batch launcher"

$job = Start-Job -ScriptBlock {
    param($LauncherPath, $ServerPort)
    & $LauncherPath -Port $ServerPort -NoBrowser
} -ArgumentList $launcherPath, $Port

try {
    $baseUrl = "http://127.0.0.1:$Port"
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $request = [System.Net.HttpWebRequest]::Create("$baseUrl/")
            $request.Proxy = $null
            $request.Timeout = 1000
            $response = $request.GetResponse()
            $response.Close()
            $ready = $true
            break
        }
        catch {
            # Retry while the background server starts.
        }
    }
    if (-not $ready) {
        throw "Preview server did not start in time."
    }

    $checks = @(
        @{ Path = "/"; ExpectedType = "text/html"; ExpectedStatus = 200 },
        @{ Path = "/zh/india-air-freight"; ExpectedType = "text/html"; ExpectedStatus = 200 },
        @{ Path = "/images/hero-air-cargo-loading.png"; ExpectedType = "image/png"; ExpectedStatus = 200 },
        @{ Path = "/missing-file.js"; ExpectedType = "text/plain"; ExpectedStatus = 404 }
    )

    foreach ($check in $checks) {
        $request = [System.Net.HttpWebRequest]::Create("$baseUrl$($check.Path)")
        $request.Proxy = $null
        $request.Timeout = 3000
        try {
            $response = $request.GetResponse()
            $status = [int]$response.StatusCode
            $contentType = $response.ContentType
            $response.Close()
        }
        catch [System.Net.WebException] {
            if ($null -eq $_.Exception.Response) { throw }
            $response = $_.Exception.Response
            $status = [int]$response.StatusCode
            $contentType = $response.ContentType
            $response.Close()
        }

        if ($status -ne $check.ExpectedStatus) {
            throw "$($check.Path) returned $status; expected $($check.ExpectedStatus)."
        }
        if (-not $contentType.StartsWith($check.ExpectedType, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "$($check.Path) returned Content-Type $contentType; expected $($check.ExpectedType)."
        }
        Write-Output "PASS $status $contentType $($check.Path)"
    }
}

finally {
    Stop-Job -Job $job -ErrorAction SilentlyContinue
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
}
