# Adds a "Catching Days Toad" shortcut to the Start menu (and nothing else).
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe  = Join-Path $here 'node_modules\electron\dist\electron.exe'
$menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Catching Days Toad.lnk'
$icon = Join-Path (Split-Path -Parent $here) 'catching-days.ico'
$sh = New-Object -ComObject WScript.Shell
$lnk = $sh.CreateShortcut($menu)
$lnk.TargetPath = $exe
$lnk.Arguments = '"' + $here + '"'
$lnk.WorkingDirectory = $here
$lnk.Description = 'A toad from Catching Days, on your desktop'
if (Test-Path $icon) { $lnk.IconLocation = $icon }
$lnk.Save()
Write-Host "  Added 'Catching Days Toad' to your Start menu."
