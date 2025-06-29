# 안정화된 프론트엔드 설정

## 현재 구조
- **빌드 도구**: Parcel (Next.js 제거됨)
- **포트**: 3002 (고정)
- **라우팅**: React Router (src/pages/)
- **진입점**: src/index.html

## 삭제된 Next.js 파일들
- `app/` 폴더 → `nextjs_backup/app/`
- `next.config.js` → `nextjs_backup/`
- `next-env.d.ts` → `nextjs_backup/`

## 실행 명령어
```bash
cd frontend
npm run dev  # 포트 3002에서 실행
```

## 주의사항
1. **Next.js 관련 파일을 다시 생성하지 마세요**
2. **포트는 3002로 고정되어 있습니다**
3. **라우팅은 src/pages/ 폴더의 React Router를 사용합니다**
4. **변경사항은 즉시 반영됩니다**

## 문제 해결
- 포트 충돌 시: `taskkill /f /im node.exe`
- 캐시 문제 시: `npm run clean`
- 완전 재시작 시: `npm run dev-clean` 