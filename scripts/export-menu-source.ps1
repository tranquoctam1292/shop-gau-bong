$menuFiles = Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts | Where-Object { 
    $_.FullName -notmatch '\\node_modules\\' -and 
    $_.FullName -notmatch '\\.next\\' -and 
    $_.FullName -notmatch '\\.git\\' -and 
    ($_.FullName -match 'menu' -or $_.FullName -match 'Menu') -and 
    $_.Exists 
}

$output = @()
foreach ($file in $menuFiles) {
    try {
        $relativePath = $file.FullName.Replace((Get-Location).Path + '\', '')
        $content = Get-Content $file.FullName -ErrorAction SilentlyContinue | Out-String
        if ($content) {
            $output += "`n`n--- FILE: $relativePath ---`n`n"
            $output += $content
        }
    } catch {
        Write-Host "Skipping $($file.FullName): $_"
    }
}

$output | Out-File -FilePath menu_management_source.txt -Encoding utf8
Write-Host "Created menu_management_source.txt with $($menuFiles.Count) files"

