@echo off
title BIR-OBS Backend Server
echo TR: BİR-OBS Java Sunucusu Başlatılıyor...
echo EN: Starting BIR-OBS Java Backend...
echo ==========================================

:: Java Derleyicisi (javac) Nerede?
set "JAVA_PATH="

:: 1. Kontrol: PATH'te var mi?
where javac >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA_PATH=javac"
    set "JAVA_RUN=java"
    goto :Found
)

:: 2. Kontrol: Yaygin Klasorler
if exist "C:\Program Files\Java\jdk-21\bin\javac.exe" (
    set "JAVA_PATH=C:\Program Files\Java\jdk-21\bin\javac.exe"
    set "JAVA_RUN=C:\Program Files\Java\jdk-21\bin\java.exe"
    goto :Found
)
if exist "C:\Program Files\Java\jdk-17\bin\javac.exe" (
    set "JAVA_PATH=C:\Program Files\Java\jdk-17\bin\javac.exe"
    set "JAVA_RUN=C:\Program Files\Java\jdk-17\bin\java.exe"
    goto :Found
)
if exist "C:\Program Files\Java\jdk-1.8\bin\javac.exe" (
    set "JAVA_PATH=C:\Program Files\Java\jdk-1.8\bin\javac.exe"
    set "JAVA_RUN=C:\Program Files\Java\jdk-1.8\bin\java.exe"
    goto :Found
)

:: Bulunamadi
echo [HATA] Java JDK bulunamadi!
echo Lutfen Java JDK'yi kurdugunuzdan ve PATH'e eklediginizden emin olun.
echo Veya bu dosyayi (run_backend.bat) not defteri ile acip Java yolunu elle yazin.
pause
exit /b

:Found
echo [BILGI] Java bulundu: %JAVA_PATH%

if not exist "lib" mkdir lib
if not exist "backend\bin" mkdir backend\bin

if not exist "mysql-connector.jar" (
    echo [UYARI] 'mysql-connector.jar' dosyasi ana dizinde bulunamadi!
)

echo [BILGI] Derleniyor / Compiling...
"%JAVA_PATH%" -d backend/bin backend/src/*.java

if %errorlevel% neq 0 (
    echo [HATA] Derleme basarisiz!
    pause
    exit /b
)

echo [BILGI] Sunucu Baslatiliyor / Server Starting...
echo http://localhost:8080 adresine gidin.
echo.
"%JAVA_RUN%" -cp ".;backend/bin;mysql-connector.jar" com.birobs.Main
pause
