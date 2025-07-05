#!/usr/bin/env python3
"""
병렬 처리 최적화 버전 테스트 스크립트
"""

import pandas as pd
import time
from datetime import datetime
from processor import OptimizedQNameProcessor, check_api_keys

def create_test_file():
    """테스트용 엑셀 파일 생성"""
    test_data = {
        '상품코드': [f'TEST{i:03d}' for i in range(1, 11)],
        '메인키워드': [
            '텀블러', '커피잔', '보온병', '식기세트', '그릇',
            '캠핑용품', '청소도구', '정리함', '보관용품', '주방용품'
        ]
    }
    
    df = pd.DataFrame(test_data)
    test_file = f"test_optimized_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    df.to_excel(test_file, index=False)
    print(f"테스트 파일 생성: {test_file}")
    return test_file

def test_optimized_processor():
    """병렬 처리 최적화 버전 테스트"""
    print("=== 병렬 처리 최적화 버전 테스트 시작 ===")
    
    # API 키 확인
    api_status = check_api_keys()
    print(f"API 키 상태: {api_status}")
    
    # 테스트 파일 생성
    test_file = create_test_file()
    
    # 프로세서 초기화 (배치 크기 5, 동시 요청 3개)
    processor = OptimizedQNameProcessor(batch_size=5, max_concurrent=3)
    
    # 처리 시작
    start_time = time.time()
    print(f"처리 시작: {datetime.now().isoformat()}")
    
    try:
        result = processor.process_excel_file(test_file)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"=== 처리 완료 ===")
        print(f"총 소요 시간: {total_time:.2f}초")
        print(f"성공 여부: {result['success']}")
        print(f"총 처리 수: {result['total_processed']}")
        print(f"성공 수: {result['success_count']}")
        print(f"실패 수: {result['error_count']}")
        
        if result['success']:
            print(f"출력 파일: {result['output_file']}")
            
            # 결과 확인
            output_df = pd.read_excel(result['output_file'])
            print("\n=== 결과 미리보기 ===")
            print(output_df[['메인키워드', 'SEO상품명', '가공결과']].head())
        
        return result
        
    except Exception as e:
        print(f"처리 중 오류 발생: {str(e)}")
        return None

if __name__ == "__main__":
    test_optimized_processor() 