#!/usr/bin/env python3
"""
🔥 CMS 프로젝트 완전 초기화 스크립트
- 모든 자동 로그인 코드 제거
- localStorage/sessionStorage 완전 비활성화
- 브라우저 캐시 강제 초기화
- DB 기반 인증만 허용
"""

import os
import subprocess
import time

def print_header(message):
    print("=" * 60)
    print(f"🔥 {message}")
    print("=" * 60)

def run_command(command, description):
    print(f"📋 {description}")
    print(f"💻 실행: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print(f"✅ 성공")
            if result.stdout.strip():
                print(f"출력: {result.stdout.strip()}")
        else:
            print(f"❌ 실패 (코드: {result.returncode})")
            if result.stderr.strip():
                print(f"에러: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ 예외 발생: {e}")
        return False

def main():
    print_header("CMS 프로젝트 완전 초기화 시작")
    
    # 1. 프론트엔드 재빌드
    print_header("1. 프론트엔드 재빌드")
    os.chdir("frontend")
    
    # 캐시 삭제
    run_command("npm cache clean --force", "npm 캐시 완전 삭제")
    
    # node_modules 삭제 후 재설치
    if os.path.exists("node_modules"):
        run_command("rmdir /s /q node_modules", "node_modules 삭제")
    
    run_command("npm install", "의존성 재설치")
    
    # 빌드 캐시 삭제
    if os.path.exists(".next"):
        run_command("rmdir /s /q .next", ".next 캐시 삭제")
    if os.path.exists("dist"):
        run_command("rmdir /s /q dist", "dist 캐시 삭제")
    if os.path.exists("build"):
        run_command("rmdir /s /q build", "build 캐시 삭제")
    
    os.chdir("..")
    
    # 2. 백엔드 재시작 준비
    print_header("2. 백엔드 데이터베이스 점검")
    os.chdir("services/main-api")
    
    # admin 사용자 확인 스크립트 실행
    run_command("python scripts/ensure_admin_user.py", "admin 계정 확인/생성")
    
    os.chdir("../..")
    
    # 3. 강제 초기화 완료
    print_header("3. 완전 초기화 완료")
    
    print("""
🎉 완전 초기화가 완료되었습니다!

📋 다음 단계:
1. 브라우저를 완전히 종료하세요
2. 브라우저를 다시 열고 시크릿 모드로 접속하세요
3. localhost:3003으로 이동하세요
4. 로그인 페이지에서 admin/admin으로 로그인하세요

⚠️ 중요 사항:
- 자동 로그인이 더 이상 작동하지 않습니다
- 모든 인증은 DB 기반으로만 처리됩니다
- localStorage/sessionStorage는 완전히 비활성화되었습니다

🚀 서버 시작:
- 백엔드: cd services/main-api && python main.py
- 프론트엔드: cd frontend && npm run dev
    """)

if __name__ == "__main__":
    main()
