# Build VAJRA CryptoTrace APK
Write-Host "=== 1. Copying Web Dist to Android Assets ==="
Copy-Item -Path "dist\*" -Destination "android\app\src\main\assets\public" -Recurse -Force

Write-Host "=== 2. Configuring local.properties ==="
"sdk.dir=C:\\Users\\NIKHIL\\AppData\\Local\\Android\\Sdk" | Out-File -FilePath "android\local.properties" -Encoding ascii

Write-Host "=== 3. Setting Environment Variables ==="
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
$env:ANDROID_HOME = "C:\Users\NIKHIL\AppData\Local\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "=== 4. Executing Gradle assembleDebug ==="
& ".\android\gradlew.bat" -p android assembleDebug --stacktrace

Write-Host "=== 5. Locating Output APK ==="
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Copy-Item -Path $apkPath -Destination "VAJRA-CryptoTrace.apk" -Force
    $size = (Get-Item "VAJRA-CryptoTrace.apk").Length / 1MB
    Write-Host "SUCCESS: APK created at VAJRA-CryptoTrace.apk ($([Math]::Round($size, 2)) MB)"
} else {
    Write-Host "ERROR: APK not found at $apkPath"
}
