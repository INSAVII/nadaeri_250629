from processor_combined import CombinedQNameProcessor
import pandas as pd
import os

EXCEL_FILE = '테스트용엑셀파일.xlsx'  # 파일탐색기에 저장한 파일명

if not os.path.exists(EXCEL_FILE):
    print(f"[오류] 파일이 존재하지 않습니다: {EXCEL_FILE}")
    exit(1)

print(f"[실행] 엑셀 파일 처리 시작: {EXCEL_FILE}")

# B열 한 줄 전체를 하나의 상품 키워드로 간주하여 처리
class OneLinePerProductProcessor(CombinedQNameProcessor):
    def process_excel_file(self, file_path: str) -> dict:
        try:
            print(f"[INFO] 파일 처리 시작: {file_path}")
            df = pd.read_excel(file_path)
            print(f"[INFO] 총 처리할 행 수: {len(df)}")
            if '메인키워드' not in df.columns:
                raise ValueError("'메인키워드' 컬럼이 없습니다.")
            keywords = df['메인키워드'].astype(str).tolist()
            # 각 행 전체를 하나의 조합으로 만듦
            keyword_combinations = [
                {'original_keywords': [kw], 'combined_keyword': kw, 'start_index': i, 'end_index': i+1}
                for i, kw in enumerate(keywords)
            ]
            # 비동기 처리 실행
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                results = loop.run_until_complete(
                    self.process_combined_keywords_async(keyword_combinations)
                )
            finally:
                loop.close()
            # 결과를 DataFrame에 적용
            for i, result in enumerate(results):
                if i < len(df):
                    df.at[i, 'NAVERCODE'] = result.get('naver_code', '')
                    df.at[i, '카테분류형식'] = result.get('category_format', '')
                    df.at[i, 'SEO상품명'] = result.get('product_name', '')
                    df.at[i, '연관검색어'] = result.get('related_keywords', '')
                    df.at[i, '가공결과'] = result.get('status', '실패')
                    df.at[i, '사용된키워드조합'] = result.get('used_combination', '')
            # 결과 파일 저장
            output_file = f"output_oneline_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            df.to_excel(output_file, index=False)
            success_count = sum(1 for r in results if r.get('status') == '완료')
            error_count = len(results) - success_count
            return {
                'success': True,
                'total_processed': len(results),
                'success_count': success_count,
                'error_count': error_count,
                'output_file': output_file,
                'keyword_combinations': len(keyword_combinations)
            }
        except Exception as e:
            print(f"[ERROR] 파일 처리 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'total_processed': 0,
                'success_count': 0,
                'error_count': len(df) if 'df' in locals() else 0
            }

# 실제 실행
processor = OneLinePerProductProcessor(batch_size=10, max_concurrent=5)
result = processor.process_excel_file(EXCEL_FILE)
print("[통계] 처리 결과:", result)

output_file = result.get('output_file')
if output_file and os.path.exists(output_file):
    print(f"[완료] 결과 엑셀 파일: {output_file}")
    df = pd.read_excel(output_file)
    print("\n[미리보기] 상위 5개 결과:")
    print(df[['상품코드', '메인키워드', '카테분류형식', 'SEO상품명', '연관검색어']].head())
else:
    print("[오류] 결과 파일이 생성되지 않았습니다.") 