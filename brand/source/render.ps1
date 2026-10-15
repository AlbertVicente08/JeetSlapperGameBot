# Renders the brand assets (stickers, memes, banner) with headless Chrome.
# Usage (from the project root):  powershell -File brand\source\render.ps1
$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw 'Chrome or Edge not found' }

$src = (Resolve-Path "$PSScriptRoot\render.html").Path
$url = 'file:///' + $src.Replace('\', '/')
$out = Resolve-Path "$PSScriptRoot\.."
New-Item -ItemType Directory -Force "$out\stickers", "$out\memes" | Out-Null

function Render($hash, $w, $h, $file, $transparent) {
  $args = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--virtual-time-budget=4000', "--window-size=$w,$h", "--screenshot=$file")
  if ($transparent) { $args += '--default-background-color=00000000' }
  $args += "`"$url#$hash`""
  $tmp = "$env:TEMP\jslap-render-$PID"
  $args += "--user-data-dir=`"$tmp`""
  Start-Process -FilePath $chrome -ArgumentList $args -Wait -WindowStyle Hidden
  Write-Output "  $file"
}

for ($i = 0; $i -lt 8; $i++) { Render "sticker-$i" 512 512 "$out\stickers\sticker-$i.png" $true }
for ($i = 0; $i -lt 5; $i++) { Render "meme-$i" 1200 675 "$out\memes\meme-$i.png" $false }
Render 'banner' 1500 500 "$out\banner-1500x500.png" $false
