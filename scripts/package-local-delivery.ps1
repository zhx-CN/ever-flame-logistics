param(
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot ".."))
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $workspaceRoot "deliverables"
}
$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)

$buildRoot = Join-Path $projectRoot "dist\client"
$buildIndex = Join-Path $buildRoot "index.html"
$launcherTemplate = Join-Path $projectRoot "packaging\windows-preview"

if (-not (Test-Path -LiteralPath $buildIndex -PathType Leaf)) {
    throw "Production build not found: $buildIndex. Run npm.cmd run build first."
}
if (-not (Test-Path -LiteralPath $launcherTemplate -PathType Container)) {
    throw "Windows preview template not found: $launcherTemplate"
}

New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

$baseName = "EVER-FLAME-LOGISTICS-delivery-$(Get-Date -Format 'yyyyMMdd')"
$deliveryRoot = Join-Path $OutputRoot $baseName
$suffix = 2
while (Test-Path -LiteralPath $deliveryRoot) {
    $deliveryRoot = Join-Path $OutputRoot ("{0}-{1:D2}" -f $baseName, $suffix)
    $suffix++
}

$previewRoot = Join-Path $deliveryRoot "EVER-FLAME-LOGISTICS-preview-windows"
$previewWww = Join-Path $previewRoot "www"
$sourceStage = Join-Path $deliveryRoot ".source-stage"
$sourceRoot = Join-Path $sourceStage "EVER-FLAME-LOGISTICS-source"

New-Item -ItemType Directory -Path $previewWww -Force | Out-Null
Copy-Item -Path (Join-Path $launcherTemplate "*") -Destination $previewRoot -Recurse
Copy-Item -Path (Join-Path $buildRoot "*") -Destination $previewWww -Recurse

# cmd.exe is not reliable with UTF-8/LF-only batch files. The launcher is
# intentionally ASCII-only and is normalized to native Windows CRLF here.
$launchers = @(Get-ChildItem -LiteralPath $previewRoot -Filter "*.bat" -File)
if ($launchers.Count -ne 1) {
    throw "Expected exactly one batch launcher; found $($launchers.Count)."
}
$launcherText = [System.IO.File]::ReadAllText($launchers[0].FullName, [System.Text.Encoding]::UTF8)
$launcherText = [System.Text.RegularExpressions.Regex]::Replace($launcherText, "\r?\n", "`r`n")
[System.IO.File]::WriteAllText($launchers[0].FullName, $launcherText, [System.Text.ASCIIEncoding]::new())

$previewZip = Join-Path $deliveryRoot "EVER-FLAME-LOGISTICS-preview-windows.zip"
Compress-Archive -Path (Join-Path $previewRoot "*") -DestinationPath $previewZip -CompressionLevel Optimal

New-Item -ItemType Directory -Path $sourceRoot -Force | Out-Null
$sourceDirectories = @(
    ".github",
    ".openai",
    "design",
    "docs",
    "packaging",
    "public",
    "scripts",
    "src",
    "tests",
    "worker"
)
$sourceFiles = @(
    ".gitignore",
    ".npmrc",
    "AGENTS.md",
    "design-qa.md",
    "index.html",
    "package-lock.json",
    "package.json",
    "README.md",
    "vite.config.mjs"
)

foreach ($directory in $sourceDirectories) {
    $sourcePath = Join-Path $projectRoot $directory
    if (Test-Path -LiteralPath $sourcePath -PathType Container) {
        Copy-Item -LiteralPath $sourcePath -Destination $sourceRoot -Recurse
    }
}
foreach ($file in $sourceFiles) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
        Copy-Item -LiteralPath $sourcePath -Destination $sourceRoot
    }
}

# ZIP timestamps cannot predate 1980. Normalize any legacy template timestamps
# in the disposable source staging directory before creating the archive.
$zipEpoch = [System.DateTime]::new(1980, 1, 1, 0, 0, 0, [System.DateTimeKind]::Local)
Get-ChildItem -LiteralPath $sourceRoot -Recurse -File | ForEach-Object {
    if ($_.LastWriteTime -lt $zipEpoch) {
        $_.LastWriteTime = $zipEpoch
    }
}

$sourceZip = Join-Path $deliveryRoot "EVER-FLAME-LOGISTICS-source.zip"
Compress-Archive -Path (Join-Path $sourceRoot "*") -DestinationPath $sourceZip -CompressionLevel Optimal

Remove-Item -LiteralPath $sourceStage -Recurse -Force

$hashLines = @()
foreach ($archive in @($previewZip, $sourceZip)) {
    $hash = Get-FileHash -LiteralPath $archive -Algorithm SHA256
    $hashLines += "$($hash.Hash)  $([System.IO.Path]::GetFileName($archive))"
}
$hashPath = Join-Path $deliveryRoot "SHA256SUMS.txt"
[System.IO.File]::WriteAllLines($hashPath, $hashLines, [System.Text.UTF8Encoding]::new($false))

$deliveryNotes = Join-Path $projectRoot "packaging\DELIVERY-NOTES.md"
Copy-Item -LiteralPath $deliveryNotes -Destination $deliveryRoot

Write-Output $deliveryRoot
