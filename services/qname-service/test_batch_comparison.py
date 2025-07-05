#!/usr/bin/env python3
"""
배치 크기별 성능 비교 테스트
"""

import pandas as pd
import time
from datetime import datetime
from processor import OptimizedQNameProcessor, check_api_keys

def create_test_file(count=20):
    """테스트용 엑셀 파일 생성"""
    test_data = {
        '상품코드': [f'TEST{i:03d}' for i in range(1, count + 1)],
        '메인키워드': [
            '텀블러', '커피잔', '보온병', '식기세트', '그릇',
            '캠핑용품', '청소도구', '정리함', '보관용품', '주방용품',
            '커피머신', '믹서기', '토스터', '전자레인지', '식기세척기',
            '냉장고', '가스레인지', '오븐', '에어프라이어', '블렌더'
        ][:count]
    }
    
    df = pd.DataFrame(test_data)
    test_file = f"test_batch_{count}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    df.to_excel(test_file, index=False)
    print(f"테스트 파일 생성: {test_file} ({count}개 키워드)")
    return test_file

def test_batch_performance(batch_size, max_concurrent, test_file):
    """특정 배치 크기로 성능 테스트"""
    print(f"\n=== 배치 크기 {batch_size}, 동시 요청 {max_concurrent} 테스트 ===")
    
    # 프로세서 초기화
    processor = OptimizedQNameProcessor(batch_size=batch_size, max_concurrent=max_concurrent)
    
    # 처리 시작
    start_time = time.time()
    print(f"처리 시작: {datetime.now().isoformat()}")
    
    try:
        result = processor.process_excel_file(test_file)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"총 소요 시간: {total_time:.2f}초")
        print(f"성공 여부: {result['success']}")
        print(f"총 처리 수: {result['total_processed']}")
        print(f"성공 수: {result['success_count']}")
        print(f"실패 수: {result['error_count']}")
        
        if result['success']:
            print(f"출력 파일: {result['output_file']}")
        
        return {
            'batch_size': batch_size,
            'max_concurrent': max_concurrent,
            'total_time': total_time,
            'success': result['success'],
            'total_processed': result['total_processed'],
            'success_count': result['success_count'],
            'error_count': result['error_count']
        }
        
    except Exception as e:
        print(f"처리 중 오류 발생: {str(e)}")
        return None

def compare_batch_sizes():
    """배치 크기별 성능 비교"""
    print("=== 배치 크기별 성능 비교 테스트 ===")
    
    # API 키 확인
    api_status = check_api_keys()
    print(f"API 키 상태: {api_status}")
    
    # 20개 키워드로 테스트
    test_file = create_test_file(20)
    
    # 다양한 배치 크기로 테스트
    test_configs = [
        (5, 3),   # 배치 5개, 동시 요청 3개
        (10, 5),  # 배치 10개, 동시 요청 5개
        (20, 8),  # 배치 20개, 동시 요청 8개
    ]
    
    results = []
    
    for batch_size, max_concurrent in test_configs:
        result = test_batch_performance(batch_size, max_concurrent, test_file)
        if result:
            results.append(result)
    
    # 결과 비교
    print("\n" + "="*60)
    print("=== 성능 비교 결과 ===")
    print("="*60)
    
    for result in results:
        print(f"배치 {result['batch_size']}개, 동시 {result['max_concurrent']}개:")
        print(f"  - 처리 시간: {result['total_time']:.2f}초")
        print(f"  - 성공률: {result['success_count']}/{result['total_processed']} ({result['success_count']/result['total_processed']*100:.1f}%)")
        print()
    
    # 최적 설정 찾기
    if results:
        best_result = min(results, key=lambda x: x['total_time'])
        print(f"🏆 최적 설정: 배치 {best_result['batch_size']}개, 동시 {best_result['max_concurrent']}개")
        print(f"   처리 시간: {best_result['total_time']:.2f}초")

if __name__ == "__main__":
    compare_batch_sizes() 