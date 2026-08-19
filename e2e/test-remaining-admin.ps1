param(
    [string[]]$Screens = @("Plans", "Money Receiving Methods", "Translations", "Notifications", "Support Tickets", "Settings")
)

$adb = "$env:USERPROFILE\platform-tools\adb.exe"
$baseDir = "H:\Company\anmaat-system\anmat_mobile\e2e\baselines\physical-device"
$results = @()

function Get-UITexts {
    & $adb shell uiautomator dump /sdcard/ui.xml 2>$null
    $raw = & $adb shell cat /sdcard/ui.xml
    return $raw
}

function Extract-Texts($raw) {
    [regex]::Matches($raw, 'text="([^"]*)"') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_.Length -gt 0 }
}

function Find-Bounds($raw, $text) {
    $escaped = [regex]::Escape($text)
    $match = [regex]::Match($raw, "text=""$escaped""[^/]*bounds=""\[(\d+),(\d+)\]\[(\d+),(\d+)\]""")
    if (-not $match.Success) {
        $match = [regex]::Match($raw, "bounds=""\[(\d+),(\d+)\]\[(\d+),(\d+)\]""[^>]*text=""$escaped""")
    }
    if ($match.Success) {
        return @{
            x1=[int]$match.Groups[1].Value; y1=[int]$match.Groups[2].Value
            x2=[int]$match.Groups[3].Value; y2=[int]$match.Groups[4].Value
        }
    }
    return $null
}

function Count-NegDims($raw) {
    $pattern = 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    $all = [regex]::Matches($raw, $pattern)
    $neg = 0
    foreach ($m in $all) {
        $w = [int]$m.Groups[3].Value - [int]$m.Groups[1].Value
        $h = [int]$m.Groups[4].Value - [int]$m.Groups[2].Value
        if ($w -lt 0 -or $h -lt 0) { $neg++ }
    }
    return $neg
}

function Open-Sidebar {
    & $adb shell input tap 107 163
    Start-Sleep -Seconds 2
}

function Close-Sidebar {
    & $adb shell input tap 600 1200
    Start-Sleep -Seconds 1
}

function Scroll-SidebarTo($targetText) {
    $maxAttempts = 6
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        $raw = Get-UITexts
        $b = Find-Bounds $raw $targetText
        if ($b) {
            $cy = [int](($b.y1 + $b.y2) / 2)
            $cx = [int](($b.x1 + $b.x2) / 2)
            if ($cy -ge 100 -and $cy -le 2205) {
                Write-Host "  Found '$targetText' at ($cx,$cy)"
                return @{ cx=$cx; cy=$cy; found=$true }
            }
        }
        Write-Host "  Scrolling sidebar... (attempt $($i+1))"
        & $adb shell input swipe 140 1800 140 600 500
        Start-Sleep -Seconds 1
    }
    return @{ found=$false }
}

function Go-ToDashboard {
    # Press back multiple times to get to dashboard
    for ($i = 0; $i -lt 3; $i++) {
        & $adb shell input keyevent 4
        Start-Sleep -Seconds 1
    }
    Start-Sleep -Seconds 2
    
    # Check if we're on dashboard or Expo Go
    $raw = Get-UITexts
    $texts = Extract-Texts $raw
    $first = $texts | Select-Object -First 3
    Write-Host "  State after back: $($first -join ' | ')"
    
    if ($first -contains 'Development servers') {
        Write-Host "  On Expo Go - going back to app"
        & $adb shell input tap 585 1570
        Start-Sleep -Seconds 12
        $raw = Get-UITexts
        $texts = Extract-Texts $raw
        $first = $texts | Select-Object -First 3
        Write-Host "  State: $($first -join ' | ')"
    }
}

# Main test loop
Write-Host "=== Testing remaining admin screens ==="
Write-Host ""

foreach ($screen in $Screens) {
    Write-Host "--- Testing: $screen ---"
    
    # Go to dashboard first
    Go-ToDashboard
    
    # Check if sidebar is already open
    $raw = Get-UITexts
    $sidebarVisible = $false
    $subscribersB = Find-Bounds $raw "Subscribers"
    if ($subscribersB) { $sidebarVisible = $true }
    
    if (-not $sidebarVisible) {
        Open-Sidebar
    }
    
    # Scroll sidebar to find the screen
    $result = Scroll-SidebarTo $screen
    if ($result.found) {
        & $adb shell input tap $result.cx $result.cy
        Start-Sleep -Seconds 3
        
        # Close sidebar if still open
        Close-Sidebar
        
        # Dump and check
        $raw2 = Get-UITexts
        $texts = Extract-Texts $raw2
        $screenTexts = $texts | Select-Object -First 15
        Write-Host "  Screen content:"
        $screenTexts | ForEach-Object { Write-Host "    $_" }
        
        $negCount = Count-NegDims $raw2
        $status = if ($negCount -eq 0) { "OK" } else { "ISSUES($negCount)" }
        Write-Host "  Status: $status"
        
        # Screenshot
        $safeName = $screen.ToLower().Replace(' ', '-')
        & $adb shell screencap -p /sdcard/screen.png
        & $adb pull /sdcard/screen.png "$baseDir\admin-$safeName-screen.png" 2>$null
        
        $results += [PSCustomObject]@{
            Screen = $screen
            Status = $status
            NegDims = $negCount
        }
    } else {
        Write-Host "  ERROR: Could not find '$screen' in sidebar"
        $results += [PSCustomObject]@{
            Screen = $screen
            Status = "NOT_FOUND"
            NegDims = 0
        }
    }
    Write-Host ""
}

Write-Host "=== RESULTS ==="
$results | Format-Table -AutoSize
