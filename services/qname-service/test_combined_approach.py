#!/usr/bin/env python3
"""
키워드 조합 방식 성능 테스트
"""

import pandas as pd
import time
from datetime import datetime
from processor_combined import CombinedQNameProcessor, check_api_keys

def create_test_file_with_combined_keywords():
    """키워드 조합 테스트용 엑셀 파일 생성"""
    # 실제 사용 시나리오와 유사한 키워드 조합들
    test_data = {
        '상품코드': [f'TEST{i:03d}' for i in range(1, 21)],
        '메인키워드': [
            # 단일 키워드 (부족한 경우)
            '양말',
            '텀블러',
            '커피잔',
            
            # 2개 키워드 조합
            '양말 남성용',
            '텀블러 보온',
            '커피잔 도자기',
            
            # 3개 키워드 조합 (이상적)
            '양말 남성용 긴목',
            '텀블러 보온 휴대용',
            '커피잔 도자기 홈카페',
            '청소도구 주방용 다용도',
            '정리함 보관용 깔끔한',
            '캠핑용품 아웃도어 휴대용',
            '식기류 주방용 고급',
            '보온병 아이스 대용량',
            
            # 4개 키워드 조합
            '양말 남성용 긴목 겨울',
            '텀블러 보온 휴대용 스테인리스',
            '커피잔 도자기 홈카페 티타임',
            '청소도구 주방용 다용도 실용적인',
            '정리함 보관용 깔끔한 편리한',
            '캠핑용품 아웃도어 휴대용 가족용'
        ]
    }
    
    df = pd.DataFrame(test_data)
    test_file = f"test_combined_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    df.to_excel(test_file, index=False)
    
    print(f"키워드 조합 테스트 파일 생성: {test_file}")
    print(f"키워드 예시:")
    for i, keyword in enumerate(test_data['메인키워드']):
        word_count = len(keyword.split())
        print(f"  {i+1:2d}. {keyword} ({word_count}개 단어)")
    
    return test_file

def test_combined_approach():
    """키워드 조합 방식 성능 테스트"""
    print("=== 키워드 조합 방식 성능 테스트 ===")
    
    # API 키 확인
    api_status = check_api_keys()
    print(f"API 키 상태: {api_status}")
    
    # 테스트 파일 생성
    test_file = create_test_file_with_combined_keywords()
    
    # 키워드 조합 방식 프로세서 초기화
    processor = CombinedQNameProcessor(
        batch_size=10, 
        max_concurrent=5, 
        min_keywords=3, 
        max_keywords=5
    )
    
    # 처리 시작
    start_time = time.time()
    print(f"\n처리 시작: {datetime.now().isoformat()}")
    
    try:
        result = processor.process_excel_file(test_file)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n=== 처리 완료 ===")
        print(f"총 소요 시간: {total_time:.2f}초")
        print(f"성공 여부: {result['success']}")
        print(f"총 처리 수: {result['total_processed']}")
        print(f"성공 수: {result['success_count']}")
        print(f"실패 수: {result['error_count']}")
        print(f"키워드 조합 수: {result.get('keyword_combinations', 0)}")
        
        if result['success']:
            print(f"출력 파일: {result['output_file']}")
            
            # 결과 분석
            output_df = pd.read_excel(result['output_file'])
            print(f"\n=== 결과 분석 ===")
            
            # 키워드 길이별 분석
            keyword_lengths = output_df['메인키워드'].str.split().str.len()
            print(f"키워드 길이 분석:")
            print(f"  - 평균 단어 수: {keyword_lengths.mean():.1f}개")
            print(f"  - 최소 단어 수: {keyword_lengths.min()}개")
            print(f"  - 최대 단어 수: {keyword_lengths.max()}개")
            
            # 사용된 키워드 조합 분석
            if '사용된키워드조합' in output_df.columns:
                used_combinations = output_df['사용된키워드조합'].dropna()
                print(f"\n사용된 키워드 조합 예시:")
                for i, combo in enumerate(used_combinations.head(5)):
                    print(f"  {i+1}. {combo}")
            
            # 카테고리 정확도 분석
            suspicious_count = output_df['카테분류형식'].str.startswith('X').sum()
            accurate_count = len(output_df) - suspicious_count
            print(f"\n카테고리 정확도:")
            print(f"  - 정확한 매칭: {accurate_count}개 ({accurate_count/len(output_df)*100:.1f}%)")
            print(f"  - 의심스러운 매칭: {suspicious_count}개 ({suspicious_count/len(output_df)*100:.1f}%)")
            
            # 결과 미리보기
            print(f"\n=== 결과 미리보기 ===")
            print(output_df[['메인키워드', '사용된키워드조합', 'SEO상품명', '카테분류형식']].head())
        
        return result
        
    except Exception as e:
        print(f"처리 중 오류 발생: {str(e)}")
        return None

def compare_approaches():
    """기존 방식 vs 키워드 조합 방식 비교"""
    print("=== 방식별 성능 비교 ===")
    
    # 테스트 파일 생성
    test_file = create_test_file_with_combined_keywords()
    
    # 1. 기존 방식 테스트 (단일 키워드)
    print("\n1. 기존 방식 테스트 (단일 키워드)")
    from processor import OptimizedQNameProcessor as OldProcessor
    
    old_processor = OldProcessor(batch_size=10, max_concurrent=5)
    
    start_time = time.time()
    old_result = old_processor.process_excel_file(test_file)
    old_time = time.time() - start_time
    
    print(f"기존 방식 처리 시간: {old_time:.2f}초")
    print(f"기존 방식 성공률: {old_result['success_count']}/{old_result['total_processed']}")
    
    # 2. 키워드 조합 방식 테스트
    print("\n2. 키워드 조합 방식 테스트")
    
    combined_processor = CombinedQNameProcessor(
        batch_size=10, 
        max_concurrent=5, 
        min_keywords=3, 
        max_keywords=5
    )
    
    start_time = time.time()
    combined_result = combined_processor.process_excel_file(test_file)
    combined_time = time.time() - start_time
    
    print(f"조합 방식 처리 시간: {combined_time:.2f}초")
    print(f"조합 방식 성공률: {combined_result['success_count']}/{combined_result['total_processed']}")
    
    # 3. 결과 비교
    print("\n=== 성능 비교 결과 ===")
    print(f"처리 시간:")
    print(f"  - 기존 방식: {old_time:.2f}초")
    print(f"  - 조합 방식: {combined_time:.2f}초")
    print(f"  - 성능 향상: {((old_time - combined_time) / old_time * 100):.1f}%")
    
    print(f"\n성공률:")
    print(f"  - 기존 방식: {old_result['success_count']/old_result['total_processed']*100:.1f}%")
    print(f"  - 조합 방식: {combined_result['success_count']/combined_result['total_processed']*100:.1f}%")
    
    # 정확도 비교 (의심스러운 매칭 비율)
    if old_result['success'] and combined_result['success']:
        old_df = pd.read_excel(old_result['output_file'])
        combined_df = pd.read_excel(combined_result['output_file'])
        
        old_suspicious = old_df['카테분류형식'].str.startswith('X').sum()
        combined_suspicious = combined_df['카테분류형식'].str.startswith('X').sum()
        
        print(f"\n카테고리 정확도:")
        print(f"  - 기존 방식 의심 매칭: {old_suspicious}/{len(old_df)} ({old_suspicious/len(old_df)*100:.1f}%)")
        print(f"  - 조합 방식 의심 매칭: {combined_suspicious}/{len(combined_df)} ({combined_suspicious/len(combined_df)*100:.1f}%)")
        print(f"  - 정확도 향상: {((old_suspicious - combined_suspicious) / len(old_df) * 100):.1f}%")

if __name__ == "__main__":
    # 단일 테스트
    test_combined_approach()
    
    # 방식 비교 테스트
    print("\n" + "="*60)
    compare_approaches() 