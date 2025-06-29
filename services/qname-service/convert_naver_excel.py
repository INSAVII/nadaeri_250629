import pandas as pd
import os

def convert_naver_excel():
    """naver.xlsx 파일을 > 형식으로 변환"""
    print("=== naver.xlsx 파일 변환 시작 ===\n")
    
    input_path = "data/naver.xlsx"
    output_path = "data/naver_converted.xlsx"
    
    if not os.path.exists(input_path):
        print(f"❌ {input_path} 파일이 존재하지 않습니다.")
        return False
    
    try:
        # 원본 파일 읽기
        print(f"원본 파일 읽기: {input_path}")
        df = pd.read_excel(input_path)
        
        print(f"원본 데이터 크기: {df.shape[0]}행 x {df.shape[1]}열")
        print(f"원본 컬럼: {list(df.columns)}")
        
        # 카테고리분류형식 컬럼 생성
        print("\n카테고리분류형식 컬럼 생성 중...")
        
        def create_category_format(row):
            """행의 1~4차분류를 > 형식으로 결합"""
            parts = []
            for i in range(1, 5):  # 1차분류부터 4차분류까지
                col_name = f'{i}차분류'
                if col_name in row and pd.notna(row[col_name]):
                    parts.append(str(row[col_name]))
            
            return '>'.join(parts) if parts else ''
        
        # 카테고리분류형식 컬럼 추가
        df['카테고리분류형식'] = df.apply(create_category_format, axis=1)
        
        # 빈 카테고리분류형식 제거
        df = df[df['카테고리분류형식'] != '']
        
        # 최종 컬럼 선택 (catecode, 카테고리분류형식만)
        result_df = df[['catecode', '카테고리분류형식']].copy()
        
        print(f"변환 완료: {result_df.shape[0]}행")
        print(f"최종 컬럼: {list(result_df.columns)}")
        
        # 샘플 데이터 확인
        print("\n=== 변환된 데이터 샘플 ===")
        print(result_df.head(10))
        
        # 변환된 파일 저장
        result_df.to_excel(output_path, index=False)
        print(f"\n✅ 변환된 파일 저장: {output_path}")
        
        # 기존 파일 백업
        backup_path = "data/naver_original_backup.xlsx"
        df.to_excel(backup_path, index=False)
        print(f"✅ 원본 파일 백업: {backup_path}")
        
        # 변환된 파일로 기존 파일 교체
        os.replace(output_path, input_path)
        print(f"✅ 기존 파일 교체 완료: {input_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ 변환 중 오류 발생: {str(e)}")
        return False

if __name__ == "__main__":
    convert_naver_excel() 