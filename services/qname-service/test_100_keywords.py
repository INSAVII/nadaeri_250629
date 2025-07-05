#!/usr/bin/env python3
"""
100개 키워드 처리 성능 테스트
"""

import pandas as pd
import time
from datetime import datetime
from processor import OptimizedQNameProcessor, check_api_keys

def create_100_keywords_file():
    """100개 키워드 테스트 파일 생성"""
    # 다양한 키워드 패턴 (단일 단어, 복합 단어)
    keywords = [
        # 단일 단어 키워드
        '텀블러', '커피잔', '보온병', '그릇', '접시', '컵', '수저', '포크', '나이프', '스푼',
        '냄비', '프라이팬', '주전자', '믹서기', '토스터', '커피머신', '전자레인지', '식기세척기',
        '냉장고', '가스레인지', '오븐', '에어프라이어', '블렌더', '청소기', '세탁기', '건조기',
        '선풍기', '에어컨', '히터', '가습기', '제습기', '공기청정기', '정수기', '정화기',
        
        # 복합 단어 키워드 (2-3개 단어)
        '주방용품 청소도구', '캠핑용품 텀블러', '커피용품 세트', '식기류 정리함', '보관용품 박스',
        '정리함 다용도', '청소도구 세트', '주방가전 믹서기', '커피머신 캡슐', '전자레인지 대용량',
        '식기세척기 스탠드형', '냉장고 김치냉장고', '가스레인지 5구', '오븐 토스터기능', '에어프라이어 대용량',
        '블렌더 믹서기', '청소기 무선', '세탁기 드럼형', '건조기 히트펌프', '선풍기 스탠드형',
        '에어컨 벽걸이형', '히터 전기히터', '가습기 초음파', '제습기 대용량', '공기청정기 HEPA',
        '정수기 RO방식', '정화기 역삼투압',
        
        # 추가 키워드 (100개까지)
        '양념통', '조미료', '소금통', '후추통', '설탕통', '밀가루통', '쌀통', '곡물통',
        '밀폐용기', '보관용기', '정리용기', '밀폐박스', '보관박스', '정리박스', '밀폐봉투',
        '보관봉투', '정리봉투', '밀폐지퍼', '보관지퍼', '정리지퍼', '밀폐클립', '보관클립',
        '정리클립', '밀폐테이프', '보관테이프', '정리테이프', '밀폐고무밴드', '보관고무밴드',
        '정리고무밴드', '밀폐끈', '보관끈', '정리끈', '밀폐줄', '보관줄', '정리줄',
        '밀폐고리', '보관고리', '정리고리', '밀폐후크', '보관후크', '정리후크', '밀폐바퀴',
        '보관바퀴', '정리바퀴', '밀폐손잡이', '보관손잡이', '정리손잡이', '밀폐경첩', '보관경첩',
        '정리경첩', '밀폐나사', '보관나사', '정리나사', '밀폐볼트', '보관볼트', '정리볼트',
        '밀폐너트', '보관너트', '정리너트', '밀폐와셔', '보관와셔', '정리와셔', '밀폐스프링',
        '보관스프링', '정리스프링', '밀폐베어링', '보관베어링', '정리베어링', '밀폐모터',
        '보관모터', '정리모터', '밀폐전선', '보관전선', '정리전선', '밀폐플러그', '보관플러그',
        '정리플러그', '밀폐스위치', '보관스위치', '정리스위치', '밀폐릴레이', '보관릴레이',
        '정리릴레이', '밀폐퓨즈', '보관퓨즈', '정리퓨즈', '밀폐콘덴서', '보관콘덴서', '정리콘덴서',
        '밀폐저항', '보관저항', '정리저항', '밀폐다이오드', '보관다이오드', '정리다이오드',
        '밀폐트랜지스터', '보관트랜지스터', '정리트랜지스터', '밀폐IC', '보관IC', '정리IC',
        '밀폐PCB', '보관PCB', '정리PCB', '밀폐케이스', '보관케이스', '정리케이스'
    ]
    
    # 100개로 제한
    keywords = keywords[:100]
    
    test_data = {
        '상품코드': [f'TEST{i:03d}' for i in range(1, 101)],
        '메인키워드': keywords
    }
    
    df = pd.DataFrame(test_data)
    test_file = f"test_100_keywords_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    df.to_excel(test_file, index=False)
    
    print(f"100개 키워드 테스트 파일 생성: {test_file}")
    print(f"키워드 예시:")
    for i, keyword in enumerate(keywords[:10]):
        print(f"  {i+1:2d}. {keyword}")
    print(f"  ... (총 {len(keywords)}개)")
    
    return test_file

def test_100_keywords_performance():
    """100개 키워드 처리 성능 테스트"""
    print("=== 100개 키워드 처리 성능 테스트 ===")
    
    # API 키 확인
    api_status = check_api_keys()
    print(f"API 키 상태: {api_status}")
    
    # 100개 키워드 테스트 파일 생성
    test_file = create_100_keywords_file()
    
    # 최적 설정으로 프로세서 초기화
    processor = OptimizedQNameProcessor(batch_size=20, max_concurrent=8)
    
    # 처리 시작
    start_time = time.time()
    print(f"\n처리 시작: {datetime.now().isoformat()}")
    
    try:
        result = processor.process_excel_file(test_file)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        print(f"\n=== 처리 완료 ===")
        print(f"총 소요 시간: {total_time:.2f}초 ({total_time/60:.1f}분)")
        print(f"성공 여부: {result['success']}")
        print(f"총 처리 수: {result['total_processed']}")
        print(f"성공 수: {result['success_count']}")
        print(f"실패 수: {result['error_count']}")
        print(f"성공률: {result['success_count']/result['total_processed']*100:.1f}%")
        
        if result['success']:
            print(f"출력 파일: {result['output_file']}")
            
            # 결과 미리보기
            output_df = pd.read_excel(result['output_file'])
            print(f"\n=== 결과 미리보기 (처음 5개) ===")
            print(output_df[['메인키워드', 'SEO상품명', '가공결과']].head())
            
            # 키워드 길이별 분석
            keyword_lengths = output_df['메인키워드'].str.len()
            print(f"\n=== 키워드 길이 분석 ===")
            print(f"평균 길이: {keyword_lengths.mean():.1f}자")
            print(f"최소 길이: {keyword_lengths.min()}자")
            print(f"최대 길이: {keyword_lengths.max()}자")
            print(f"1단어 키워드: {(keyword_lengths <= 5).sum()}개")
            print(f"복합 키워드: {(keyword_lengths > 5).sum()}개")
        
        return result
        
    except Exception as e:
        print(f"처리 중 오류 발생: {str(e)}")
        return None

if __name__ == "__main__":
    test_100_keywords_performance() 