#!/usr/bin/env python3
"""
테스트용 엑셀 파일 생성 스크립트
"""

import pandas as pd
import os

def create_test_file():
    # 테스트 데이터 생성
    test_data = {
        '상품코드': ['TEST001', 'TEST002', 'TEST003', 'TEST004', 'TEST005'],
        '메인키워드': ['텀블러', '커피잔', '보온병', '식기세트', '캠핑용품'],
        'NAVERCODE': ['', '', '', '', ''],
        '카테분류형식': ['', '', '', '', ''],
        'SEO상품명': ['', '', '', '', ''],
        '연관검색어': ['', '', '', '', ''],
        '네이버태그': ['', '', '', '', '']
    }

    # DataFrame 생성
    df = pd.DataFrame(test_data)

    # Excel 파일로 저장
    output_file = 'test_simple.xlsx'
    df.to_excel(output_file, index=False)

    print(f"테스트 파일 생성 완료: {output_file}")
    print(f"총 {len(df)}행의 데이터가 포함되었습니다.")
    print(f"파일 크기: {os.path.getsize(output_file)} bytes")
    
    # 데이터 미리보기
    print("\n데이터 미리보기:")
    print(df.head())

if __name__ == "__main__":
    create_test_file() 