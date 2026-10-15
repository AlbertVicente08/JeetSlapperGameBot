# Creates (or refreshes) the Telegram sticker pack t.me/addstickers/jeetslapper_by_JeetSlapperGameBot
# using the bot token and admin id from .env. Usage (from the project root):
#   powershell -File brand\source\upload-stickers.ps1
$utf8 = New-Object System.Text.UTF8Encoding($false)
$envs = @{}
[IO.File]::ReadAllLines("$PWD\.env", $utf8) | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object { $k, $v = $_ -split '=', 2; $envs[$k] = $v.Trim() }
$api = "https://api.telegram.org/bot$($envs.TELEGRAM_BOT_TOKEN)"
$owner = $envs.ADMIN_TELEGRAM_ID
$name = 'jeetslapper_by_JeetSlapperGameBot'
# Emoji code points (Windows PowerShell 5.1 can't read emoji literals from a UTF-8 file without BOM)
$emojis = @(0x1F44B, 0x1F6A8, 0x1F48E, 0x1F4A5, 0x1F4C9, 0x1F680, 0x1F4A3, 0x1F40B) | ForEach-Object { [char]::ConvertFromUtf32($_) }
$dir = "$PWD\brand\stickers"

function Upload($i) {
  $out = curl.exe -s -F "user_id=$owner" -F 'sticker_format=static' -F "sticker=@$dir\sticker-$i.png" "$api/uploadStickerFile" | ConvertFrom-Json
  if (-not $out.ok) { throw "upload $i failed: $($out.description)" }
  return $out.result.file_id
}

$exists = (curl.exe -s "$api/getStickerSet?name=$name" | ConvertFrom-Json).ok
if ($exists) { Write-Output "Pack already exists: https://t.me/addstickers/$name"; exit 0 }

$stickers = @()
for ($i = 0; $i -lt 8; $i++) {
  $stickers += @{ sticker = (Upload $i); format = 'static'; emoji_list = @($emojis[$i]) }
}
$body = @{ user_id = [long]$owner; name = $name; title = 'Jeet Slapper'; stickers = $stickers } | ConvertTo-Json -Depth 5
$r = Invoke-RestMethod -Method Post -Uri "$api/createNewStickerSet" -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
if ($r.ok) { Write-Output "Created: https://t.me/addstickers/$name" } else { Write-Output "Error: $($r.description)" }
