param(
    [string]$TestType = "admin"  # admin, subscriber, employee
)

$adb = "$env:USERPROFILE\platform-tools\adb.exe"
$baseDir = "H:\Company\anmaat-system\anmat_mobile\e2e\baselines\physical-device"

function Dump-UI {
    & $adb shell uiautomator dump /sdcard/ui.xml 2>$null
    return & $adb shell cat /sdcard/ui.xml
}

function Get-Texts($raw) {
    [regex]::Matches($raw, 'text="([^"]*)"') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_.Length -gt 0 }
}

function Find-Bounds($raw, $text) {
    $escaped = [regex]::Escape($text)
    $patterns = @(
        "text=""$escaped""[^>]*bounds=""\[(\d+),(\d+)\]\[(\d+),(\d+)\]""",
        "bounds=""\[(\d+),(\d+)\]\[(\d+),(\d+)\]""[^>]*text=""$escaped"""
    )
    foreach ($p in $patterns) {
        $m = [regex]::Match($raw, $p)
        if ($m.Success) {
            return @{
                x1=[int]$m.Groups[1].Value; y1=[int]$m.Groups[2].Value
                x2=[int]$m.Groups[3].Value; y2=[int]$m.Groups[4].Value
                cx=[int]( ([int]$m.Groups[1].Value + [int]$m.Groups[3].Value) / 2 )
                cy=[int]( ([int]$m.Groups[2].Value + [int]$m.Groups[4].Value) / 2 )
            }
        }
    }
    return $null
}

function Count-NegDims($raw) {
    $all = [regex]::Matches($raw, 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"')
    $neg = 0
    foreach ($m in $all) {
        $w = [int]$m.Groups[3].Value - [int]$m.Groups[1].Value
        $h = [int]$m.Groups[4].Value - [int]$m.Groups[2].Value
        if ($w -lt 0 -or $h -lt 0) { $neg++ }
    }
    return $neg
}

function Tap-ByBounds($b) {
    & $adb shell input tap $b.cx $b.cy
    Start-Sleep -Seconds 3
}

function Login-Admin {
    $raw = Dump-UI
    $texts = Get-Texts $raw
    if ($texts -contains "Admin Sign In") {
        Write-Host "On login page, logging in as admin..."
        # Tap email field
        & $adb shell input tap 540 650
        Start-Sleep -Seconds 1
        & $adb shell input text "admin@anmat.test"
        Start-Sleep -Seconds 1
        # Tap password field
        & $adb shell input tap 540 850
        Start-Sleep -Seconds 1
        & $adb shell input text "anmatAdmin123"
        Start-Sleep -Seconds 1
        # Tap Login
        & $adb shell input tap 540 1100
        Start-Sleep -Seconds 5
        return $true
    } elseif ($texts -contains "Dashboard Overview") {
        Write-Host "Already logged in"
        return $true
    } else {
        Write-Host "Unknown state"
        return $false
    }
}

function Login-Subscriber {
    $raw = Dump-UI
    $texts = Get-Texts $raw
    if ($texts -match "Login" -or $texts -match "Sign In") {
        Write-Host "On login page, logging in as subscriber..."
        # Need to go back to regular login first
        & $adb shell input tap 540 1200
        Start-Sleep -Seconds 2
        $raw = Dump-UI
        $texts = Get-Texts $raw
        if ($texts -contains "Login") {
            & $adb shell input tap 540 650
            Start-Sleep -Seconds 1
            & $adb shell input text "nextsub1@anmat.test"
            Start-Sleep -Seconds 1
            & $adb shell input tap 540 850
            Start-Sleep -Seconds 1
            & $adb shell input text "aA@123456"
            Start-Sleep -Seconds 1
            & $adb shell input tap 540 1100
            Start-Sleep -Seconds 5
        }
        return $true
    } elseif ($texts -match "Dashboard") {
        Write-Host "Already logged in"
        return $true
    }
    return $false
}

function Login-Employee {
    $raw = Dump-UI
    $texts = Get-Texts $raw
    if ($texts -match "Login" -or $texts -match "Sign In") {
        Write-Host "On login page, logging in as employee..."
        & $adb shell input tap 540 1200
        Start-Sleep -Seconds 2
        & $adb shell input tap 540 650
        Start-Sleep -Seconds 1
        & $adb shell input text "org1emp1@anmat.test"
        Start-Sleep -Seconds 1
        & $adb shell input tap 540 850
        Start-Sleep -Seconds 1
        & $adb shell input text "aA@123456"
        Start-Sleep -Seconds 1
        & $adb shell input tap 540 1100
        Start-Sleep -Seconds 5
        return $true
    } elseif ($texts -match "Dashboard") {
        Write-Host "Already logged in"
        return $true
    }
    return $false
}

function Navigate-ToScreen($screenName) {
    # Open sidebar
    & $adb shell input tap 107 163
    Start-Sleep -Seconds 2
    
    # Scroll to find and tap
    for ($i = 0; $i -lt 8; $i++) {
        $raw = Dump-UI
        $b = Find-Bounds $raw $screenName
        if ($b -and $b.cy -ge 100 -and $b.cy -le 2205) {
            Tap-ByBounds $b
            
            # If this item has children (like Plans), wait and check
            Start-Sleep -Seconds 1
            $raw2 = Dump-UI
            $texts2 = Get-Texts $raw2
            
            # If children appeared (like "Subscription Plans"), tap the first child
            if ($screenName -eq "Plans" -and ($texts2 -contains "Subscription Plans")) {
                Start-Sleep -Seconds 1
                $b2 = Find-Bounds $raw2 "Subscription Plans"
                if ($b2 -and $b2.cy -ge 100 -and $b2.cy -le 2205) {
                    Tap-ByBounds $b2
                }
            }
            
            Start-Sleep -Seconds 2
            return $true
        }
        & $adb shell input swipe 140 1800 140 600 500
        Start-Sleep -Seconds 1
    }
    return $false
}

function Close-Sidebar {
    # Try close button first
    $raw = Dump-UI
    $closeBtn = Find-Bounds $raw ""
    # Try tapping X button (close button in sidebar header)
    & $adb shell input tap 200 230
    Start-Sleep -Seconds 1
}

function Test-ScreenContent($screenName, $safeName) {
    $raw = Dump-UI
    $texts = (Get-Texts $raw | Select-Object -First 20) -join " | "
    
    # Check if sidebar is still visible (we're looking for sidebar items like "Dashboard", "Analytics")
    $isSidebarOpen = $false
    if ($raw -match 'text="OVERVIEW"' -or $raw -match 'text="SYSTEM ADMINISTRATION"') {
        $isSidebarOpen = $true
    }
    
    # Filter out sidebar items to see actual screen content
    $sidebarSections = @("OVERVIEW", "INTERNAL COMMUNICATION", "REPORTS &amp; ANALYTICS", "SMART TOOLS", 
        "SYSTEM ADMINISTRATION", "SUBSCRIPTIONS &amp; PAYMENTS", "SUPPORT", "SETTINGS",
        "EMPLOYEES &amp; HR", "PROJECTS &amp; TASKS", "ORGANIZATION", "COMMUNICATION")
    $contentTexts = Get-Texts $raw | Where-Object { $_ -notin $sidebarSections -and $_.Length -gt 0 } | Select-Object -First 15
    
    $negCount = Count-NegDims $raw
    
    Write-Host "  Content: $($contentTexts -join ' | ')"
    Write-Host "  Sidebar: $isSidebarOpen | NegDims: $negCount"
    
    $status = if ($negCount -eq 0) { "OK" } else { "ISSUES($negCount)" }
    
    & $adb shell screencap -p /sdcard/screen.png
    & $adb pull /sdcard/screen.png "$baseDir\$safeName.png" 2>$null
    
    return [PSCustomObject]@{
        Screen = $screenName
        Status = $status
        NegDims = $negCount
        Content = ($contentTexts -join " | ")
    }
}

# ═══════════════════════════════════════
# MAIN TEST EXECUTION
# ═══════════════════════════════════════
Write-Host "══════════════════════════════════════"
Write-Host "  Testing: $TestType dashboard"
Write-Host "══════════════════════════════════════"

# Define screens per test type
$screens = switch ($TestType) {
    "admin" {
        @(
            @{ Name = "Conversations"; Safe = "admin-conversations" },
            @{ Name = "Analytics"; Safe = "admin-analytics" },
            @{ Name = "AI Assistant"; Safe = "admin-ai-assistant" },
            @{ Name = "System Admins"; Safe = "admin-system-admins" },
            @{ Name = "Roles"; Safe = "admin-roles" },
            @{ Name = "Permissions"; Safe = "admin-permissions" },
            @{ Name = "Industries"; Safe = "admin-industries" },
            @{ Name = "Subscribers"; Safe = "admin-subscribers" },
            @{ Name = "Plans"; Safe = "admin-plans" },
            @{ Name = "Money Receiving Methods"; Safe = "admin-money-receiving" },
            @{ Name = "Translations"; Safe = "admin-translations" },
            @{ Name = "Notifications"; Safe = "admin-notifications" },
            @{ Name = "Support Tickets"; Safe = "admin-support-tickets" },
            @{ Name = "Settings"; Safe = "admin-settings" }
        )
    }
    "subscriber" {
        @(
            @{ Name = "Conversations"; Safe = "sub-conversations" },
            @{ Name = "Analytics"; Safe = "sub-analytics" },
            @{ Name = "AI Assistant"; Safe = "sub-ai-assistant" },
            @{ Name = "Roles"; Safe = "sub-roles" },
            @{ Name = "Permissions"; Safe = "sub-permissions" },
            @{ Name = "Notifications"; Safe = "sub-notifications" },
            @{ Name = "Support Tickets"; Safe = "sub-support-tickets" },
            @{ Name = "Settings"; Safe = "sub-settings" }
        )
    }
    "employee" {
        @(
            @{ Name = "Conversations"; Safe = "emp-conversations" },
            @{ Name = "Analytics"; Safe = "emp-analytics" },
            @{ Name = "AI Assistant"; Safe = "emp-ai-assistant" },
            @{ Name = "Notifications"; Safe = "emp-notifications" },
            @{ Name = "Support Tickets"; Safe = "emp-support-tickets" },
            @{ Name = "Settings"; Safe = "emp-settings" }
        )
    }
}

# Login
$loginOk = switch ($TestType) {
    "admin" { Login-Admin }
    "subscriber" { Login-Subscriber }
    "employee" { Login-Employee }
}

if (-not $loginOk) {
    Write-Host "Login failed!"
    exit 1
}

Start-Sleep -Seconds 3

# Verify we're on dashboard
$raw = Dump-UI
$texts = Get-Texts $raw
Write-Host "Post-login state: $($texts | Select-Object -First 5 | Out-String)"

# Test each screen
$results = @()
foreach ($screen in $screens) {
    Write-Host "`n--- $($screen.Name) ---"
    $navOk = Navigate-ToScreen $screen.Name
    if ($navOk) {
        # Close sidebar if still open
        Close-Sidebar
        Start-Sleep -Seconds 1
        $result = Test-ScreenContent $screen.Name $screen.Safe
        $results += $result
    } else {
        Write-Host "  NOT FOUND in sidebar"
        $results += [PSCustomObject]@{
            Screen = $screen.Name
            Status = "NOT_FOUND"
            NegDims = 0
            Content = ""
        }
    }
}

# Print results
Write-Host "`n══════════════════════════════════════"
Write-Host "  RESULTS: $TestType dashboard"
Write-Host "══════════════════════════════════════"
$results | Format-Table -AutoSize

# Save results
$results | ConvertTo-Json | Out-File "$baseDir\$TestType-results-v2.json"
Write-Host "Results saved to $baseDir\$TestType-results-v2.json"
