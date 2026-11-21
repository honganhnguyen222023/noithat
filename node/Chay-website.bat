@echo off
REM Bam dup file nay de chay website Noi That IRIS (ban Node.js) tren Windows.
REM Website: http://localhost:3000   Quan tri: http://localhost:3000/quan-tri/
REM Muon tat: dong cua so nay (hoac bam Ctrl + C).
chcp 65001 >nul
title Noi That IRIS - website Node.js
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto chuacocnode

if not exist ".env" copy ".env.example" ".env" >nul

REM Kiem tra thu vien da cai DU chua (khong chi kiem tra thu muc node_modules,
REM vi lan cai truoc co the bi dung giua chung hoac bi diet virus xoa file).
if not exist "node_modules\.bin\prisma.cmd" goto caithuvien
if not exist "node_modules\.bin\next.cmd" goto caithuvien
if not exist "node_modules\@prisma\client" goto caithuvien
goto dacothuvien
:caithuvien
echo Dang cai thu vien, can Internet, vui long doi vai phut...
if exist "node_modules" rmdir /s /q "node_modules"
call npm install
if errorlevel 1 goto loi
if not exist "node_modules\.bin\prisma.cmd" goto loi
:dacothuvien

if not exist "prisma\noithat.db" goto taodulieu
REM Cap nhat cau truc co so du lieu (them cot moi neu co), giu nguyen du lieu.
call npm run db:push
if errorlevel 1 goto loi
goto dacodulieu
:taodulieu
echo Dang tao co so du lieu va nhap du lieu mau...
call npm run setup
if errorlevel 1 goto loi
:dacodulieu

echo.
echo ============================================================
echo  Website : http://localhost:3000
echo  Quan tri: http://localhost:3000/quan-tri/
echo  Dong cua so nay de tat website.
echo ============================================================
echo.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3000"
call npm run dev
goto :eof

:chuacocnode
echo Chua co Node.js tren may.
echo Tai Node.js 22 LTS tai https://nodejs.org , cai xong thi bam dup lai file nay.
pause
exit /b 1

:loi
echo.
echo Co loi khi cai dat. Chup man hinh cua so nay gui cho nguoi ho tro.
pause
exit /b 1
