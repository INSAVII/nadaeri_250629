#!/usr/bin/env python3
"""
상품명 및 키워드 생성 프로세서 - 리팩터링 버전
간소화된 API와 명확한 에러 처리를 제공합니다.
"""

import os
import pandas as pd
import requests
import random
import time
import re
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# .env 파일 로드 - 여러 위치에서 .env 파일 찾기
possible_env_paths = [
    ".env",  # 현재 디렉토리
    "../.env",  # 상위 디렉토리 (루트)
    "../../.env",  # 루트 디렉토리
    os.path.join(os.path.dirname(__file__), ".env"),  # 스크립트 디렉토리
    os.path.join(os.path.dirname(__file__), "..", ".env"),  # 상위 디렉토리
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),  # 루트 디렉토리
]

# .env 파일 찾기 및 로드
env_loaded = False
for env_path in possible_env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"환경변수 파일 로드됨: {os.path.abspath(env_path)}")
        env_loaded = True
        break

if not env_loaded:
    logger.warning("어떤 .env 파일도 찾을 수 없습니다. 기본값을 사용합니다.")
    load_dotenv()  # 기본 동작

# 환경변수 로드 완전 비활성화 (속도 최적화)
logger.info("환경변수 로드 비활성화 (속도 최적화 모드)")

# ========================================
# 🔑 API 키 직접 설정 (환경변수가 없을 때 사용)
# ========================================
# Google Gemini API 키를 여기에 직접 입력하세요
# https://makersuite.google.com/app/apikey 에서 발급
DIRECT_GEMINI_API_KEY = "AIzaSyC5g8cQks5Blwpazwq0ZyBKgJTne-lOmFs"  # ← 여기에 실제 API 키 입력

# 네이버 쇼핑 API 키를 여기에 직접 입력하세요 (선택사항)
# https://developers.naver.com/apps/#/list 에서 발급
DIRECT_NAVER_CLIENT_ID = "qFzQbNB9mYBRAETaXUfL"  # ← 여기에 실제 Client ID 입력
DIRECT_NAVER_CLIENT_SECRET = "CQA9P8Q9qO"  # ← 여기에 실제 Client Secret 입력

# ========================================
# API 키 우선순위: 환경변수 > 직접설정 > 없음
# ========================================
# 환경 변수에서 API 키 가져오기 (환경변수 우선, 코드 설정 fallback)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
    GEMINI_API_KEY = DIRECT_GEMINI_API_KEY

if not NAVER_CLIENT_ID or NAVER_CLIENT_ID == 'your_naver_client_id_here':
    NAVER_CLIENT_ID = DIRECT_NAVER_CLIENT_ID

if not NAVER_CLIENT_SECRET or NAVER_CLIENT_SECRET == 'your_naver_client_secret_here':
    NAVER_CLIENT_SECRET = DIRECT_NAVER_CLIENT_SECRET

# 환경변수 로드 완료
logger.info("환경변수 로드 완료")

# 현재 스크립트 디렉토리 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
logger.info(f"스크립트 디렉토리: {SCRIPT_DIR}")

class QNameProcessor:
    """QName 처리기 - 간소화된 버전"""
    
    def __init__(self):
        self.naver_url = "https://openapi.naver.com/v1/search/shop.json"
        self.category_mapper = CategoryMapper()
        
        # Gemini API 설정
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.model = genai.GenerativeModel('models/gemini-1.5-pro-latest')
        else:
            logger.error("GEMINI_API_KEY가 설정되지 않았습니다.")
            self.model = None
    
    def process_excel_file(self, file_path: str) -> dict:
        """엑셀 파일을 처리하고 결과를 반환"""
        try:
            logger.info(f"파일 처리 시작: {file_path}")
            
            # 엑셀 파일 읽기
            df = pd.read_excel(file_path)
            logger.info(f"총 처리할 행 수: {len(df)}")
            
            if '메인키워드' not in df.columns:
                raise ValueError("'메인키워드' 컬럼이 없습니다.")
            
            processed_count = 0
            success_count = 0
            
            for index, row in df.iterrows():
                keyword = row['메인키워드']
                start_time = time.time()
                logger.info(f"행 {index+1} 처리 시작: {keyword}")
                
                try:
                    # 1. 네이버 API로 카테고리 정보 가져오기
                    step1_start = time.time()
                    category_info = self._get_naver_category(keyword)
                    step1_time = time.time() - step1_start
                    logger.info(f"  단계1(네이버API): {step1_time:.2f}초")
                    
                    # 2. 카테고리 정보 추출
                    step2_start = time.time()
                    category_format, core_keyword = self._extract_category_info(category_info)
                    step2_time = time.time() - step2_start
                    logger.info(f"  단계2(카테고리추출): {step2_time:.2f}초")
                    
                    # 3. 카테고리 코드 매핑
                    step3_start = time.time()
                    category_code = self.category_mapper.find_category_code(category_format)
                    step3_time = time.time() - step3_start
                    logger.info(f"  단계3(카테고리매핑): {step3_time:.2f}초")
                    
                    # 4. 상품명과 연관검색어를 한 번에 생성 (API 호출 최적화)
                    step4_start = time.time()
                    product_name, related_keywords = self._generate_product_and_keywords(keyword, category_format, core_keyword)
                    step4_time = time.time() - step4_start
                    logger.info(f"  단계4(상품명/키워드생성): {step4_time:.2f}초")
                    
                    naver_tags = random.sample(related_keywords, min(10, len(related_keywords)))
                    
                    # 5. 결과 저장
                    step5_start = time.time()
                    df.at[index, 'NAVERCODE'] = category_code
                    df.at[index, '카테분류형식'] = category_format
                    df.at[index, 'SEO상품명'] = product_name
                    df.at[index, '연관검색어'] = ','.join(related_keywords)
                    df.at[index, '네이버태그'] = ','.join(naver_tags)
                    df.at[index, '가공결과'] = '완료'
                    step5_time = time.time() - step5_start
                    logger.info(f"  단계5(결과저장): {step5_time:.2f}초")
                    
                    success_count += 1
                    total_time = time.time() - start_time
                    logger.info(f"완료: {product_name} (총 소요시간: {total_time:.2f}초)")
                    
                except Exception as e:
                    logger.error(f"행 {index+1} 처리 실패: {str(e)}")
                    df.at[index, '가공결과'] = f'오류: {str(e)}'
                
                processed_count += 1
                # time.sleep(0.1)  # API 호출 간격 조절 제거 - 속도 최적화
            
            # 결과 파일 저장
            output_file = os.path.join(SCRIPT_DIR, f"가공완료_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx")
            df.to_excel(output_file, index=False)
            
            logger.info(f"처리 완료: {processed_count}행 중 {success_count}행 성공")
            logger.info(f"결과 파일 저장: {output_file}")
            
            return {
                'success': True,
                'output_file': output_file,
                'total_processed': processed_count,
                'success_count': success_count,
                'error_count': processed_count - success_count
            }
            
        except Exception as e:
            logger.error(f"파일 처리 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_naver_category(self, keyword: str) -> dict:
        """네이버 쇼핑 API로 카테고리 정보 가져오기"""
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            logger.warning("네이버 API 키가 설정되지 않음 - 기본 카테고리 사용")
            return self._create_default_category(keyword)
        
        # 기본 카테고리 매핑이 가능한 키워드는 API 호출 생략
        default_categories = {
            '텀블러': '주방용품>커피용품>텀블러',
            '커피': '주방용품>커피용품>커피용품',
            '보온병': '주방용품>보온용품>보온병',
            '식기': '주방용품>식기류>식기',
            '그릇': '주방용품>식기류>그릇',
            '캠핑': '스포츠/레저>캠핑용품>캠핑용품',
            '청소': '주방용품>청소용품>청소용품',
            '정리': '주방용품>정리용품>정리용품',
            '보관': '주방용품>보관용품>보관용품'
        }
        
        for key, category in default_categories.items():
            if key in keyword:
                logger.info(f"기본 카테고리 사용: {keyword} → {category}")
                return self._create_default_category(keyword)
        
        # API 호출이 필요한 경우에만 실행
        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
        params = {"query": keyword, "display": 1}
        
        try:
            response = requests.get(self.naver_url, headers=headers, params=params, timeout=3)  # 타임아웃 3초로 단축
            
            if response.status_code == 200:
                result = response.json()
                if 'items' in result and result['items']:
                    return result
                else:
                    return self._create_default_category(keyword)
            else:
                logger.warning(f"네이버 API 오류: {response.status_code}")
                return self._create_default_category(keyword)
                
        except Exception as e:
            logger.warning(f"네이버 API 호출 실패: {str(e)}")
            return self._create_default_category(keyword)
    
    def _create_default_category(self, keyword: str) -> dict:
        """기본 카테고리 정보 생성"""
        default_categories = {
            '텀블러': '주방용품>커피용품>텀블러',
            '커피': '주방용품>커피용품>커피용품',
            '보온병': '주방용품>보온용품>보온병',
            '식기': '주방용품>식기류>식기',
            '그릇': '주방용품>식기류>그릇',
            '캠핑': '스포츠/레저>캠핑용품>캠핑용품'
        }
        
        for key, category in default_categories.items():
            if key in keyword:
                categories = category.split('>')
                return {
                    'items': [{
                        'category1': categories[0] if len(categories) > 0 else '주방용품',
                        'category2': categories[1] if len(categories) > 1 else '주방용품',
                        'category3': categories[2] if len(categories) > 2 else '주방용품',
                        'category4': categories[3] if len(categories) > 3 else '주방용품'
                    }]
                }
        
        return {
            'items': [{
                'category1': '주방용품',
                'category2': '주방용품',
                'category3': '주방용품',
                'category4': '주방용품'
            }]
        }
    
    def _extract_category_info(self, category_info: dict) -> tuple:
        """카테고리 정보에서 형식과 핵심 키워드 추출"""
        try:
            items = category_info.get('items', [])
            if not items:
                return '주방용품>주방용품>주방용품', '주방용품'
            
            item = items[0]
            categories = []
            for i in range(1, 5):
                category = item.get(f'category{i}')
                if category:
                    categories.append(category)
            
            category_format = '>'.join(categories)
            core_keyword = categories[-1] if categories else '주방용품'
            
            return category_format, core_keyword
            
        except Exception as e:
            logger.error(f"카테고리 정보 추출 오류: {str(e)}")
            return '주방용품>주방용품>주방용품', '주방용품'
    
    def _generate_product_and_keywords(self, keyword: str, category_format: str, core_keyword: str) -> tuple:
        """Gemini API로 상품명과 연관검색어를 한 번에 생성"""
        if not self.model:
            # 기본 모드: 키워드 기반 상품명 생성
            prefix_map = {
                '텀블러': '휴대용',
                '커피': '주방',
                '보온병': '보온',
                '식기': '주방',
                '그릇': '주방',
                '캠핑': '캠핑',
                '청소': '실용적인',
                '정리': '편리한',
                '보관': '깔끔한'
            }
            
            prefix = '실용적인'
            for key, value in prefix_map.items():
                if key in keyword or key in core_keyword:
                    prefix = value
                    break
            
            # 기본 상품명 생성 로직 개선
            base_name = f"{prefix}{keyword}"
            if len(base_name) < 20:
                base_name = f"{base_name} 고급스러운 주방용품"
            elif len(base_name) > 40:
                base_name = base_name[:40]
            
            # 연관검색어 생성
            related_keywords = [
                f"{core_keyword} 용품", f"{core_keyword} 제품", f"{core_keyword} 세트",
                f"{core_keyword} 정리", f"{core_keyword} 보관", f"{core_keyword} 청소",
                f"{core_keyword} 관리", f"{core_keyword} 도구", f"{core_keyword} 장비",
                f"{core_keyword} 정리함", f"{core_keyword} 가방", f"{core_keyword} 박스",
                f"{core_keyword} 정리대", f"{core_keyword} 보관함", f"{core_keyword} 정리용품",
                f"{core_keyword} 관리용품", f"{core_keyword} 도구함", f"{core_keyword} 장비함",
                f"{core_keyword} 세트함", f"{core_keyword} 고급용품"
            ]
            
            return base_name, related_keywords
        
        try:
            prefix_map = {
                '텀블러': '휴대용',
                '커피': '주방',
                '보온병': '보온',
                '식기': '주방',
                '그릇': '주방',
                '캠핑': '캠핑'
            }
            
            prefix = '실용적인'
            for key, value in prefix_map.items():
                if key in keyword or key in core_keyword:
                    prefix = value
                    break
        
            prompt = f"""
            다음 정보를 바탕으로 30-40자 길이의 상품명을 생성해주세요.
            
            키워드: {keyword}
            카테고리: {category_format}
            핵심 키워드: {core_keyword}
            접두사: {prefix}
            
            규칙:
            1. {prefix}로 시작하세요
            2. 30-40자 길이로 맞춰주세요
            3. 한글로만 작성하세요
            4. 특수문자나 영어는 사용하지 마세요
            5. 브랜드명은 포함하지 마세요
            6. 자연스럽고 매력적인 상품명으로 만들어주세요
            
            상품명:
            """

            response = self.model.generate_content(prompt)
            product_name = response.text.strip()
            
            # 길이 조정
            if len(product_name) < 30:
                product_name = f"{product_name} 실용적인 고급스러운 용품"
            elif len(product_name) > 40:
                product_name = product_name[:40]
            
            # 연관검색어 생성
            related_keywords = [
                f"{core_keyword} 용품", f"{core_keyword} 제품", f"{core_keyword} 세트",
                f"{core_keyword} 정리", f"{core_keyword} 보관", f"{core_keyword} 청소",
                f"{core_keyword} 관리", f"{core_keyword} 도구", f"{core_keyword} 장비",
                f"{core_keyword} 정리함", f"{core_keyword} 가방", f"{core_keyword} 박스",
                f"{core_keyword} 정리대", f"{core_keyword} 보관함", f"{core_keyword} 정리용품",
                f"{core_keyword} 관리용품", f"{core_keyword} 도구함", f"{core_keyword} 장비함",
                f"{core_keyword} 세트함", f"{core_keyword} 고급용품"
            ]
            
            return product_name, related_keywords
            
        except Exception as e:
            logger.error(f"상품명 생성 오류: {str(e)}")
            # API 오류 시 기본 모드로 fallback
            return self._generate_product_and_keywords(keyword, category_format, core_keyword)

class CategoryMapper:
    """카테고리 매핑 클래스"""
    
    def __init__(self):
        self.category_map = {}
        self.load_category_data()
    
    def load_category_data(self):
        """naver.xlsx 파일에서 카테고리 데이터 로드"""
        try:
            # 절대 경로로 변경
            naver_file = os.path.join(SCRIPT_DIR, "data", "naver.xlsx")
            logger.info(f"카테고리 파일 경로: {naver_file}")
            
            if not os.path.exists(naver_file):
                logger.warning(f"naver.xlsx 파일이 없습니다: {naver_file}")
                return False
            
            df = pd.read_excel(naver_file)
            if '카테고리분류형식' not in df.columns or 'catecode' not in df.columns:
                logger.warning("naver.xlsx 파일에 필요한 컬럼이 없습니다.")
                return False
            
            # 카테고리 맵 생성
            self.category_map = dict(zip(df['카테고리분류형식'], df['catecode']))
            logger.info(f"카테고리 데이터 로드 완료: {len(self.category_map)}개")
            return True
            
        except Exception as e:
            logger.error(f"카테고리 데이터 로드 오류: {str(e)}")
            return False
    
    def find_category_code(self, category_format: str) -> str:
        """카테고리 형식에 해당하는 코드 찾기"""
        if not category_format:
            return '50000000'
        
        # 1. 정확한 매칭
        if category_format in self.category_map:
            return self.category_map[category_format]
        
        # 2. 부분 매칭
        for stored_format, code in self.category_map.items():
            if category_format in stored_format or stored_format in category_format:
                return code
        
        # 3. 키워드 기반 기본값
        default_codes = {
            '텀블러': '50000000',
            '커피': '50000000',
            '보온병': '50000000',
            '식기': '50000000',
            '그릇': '50000000',
            '캠핑': '50000000',
            '주방': '50000000',
            '보온': '50000000',
            '보냉': '50000000'
        }
        
        for keyword, default_code in default_codes.items():
            if keyword in category_format:
                return default_code
        
        # 4. 완전히 매칭되지 않으면 일반 주방용품 코드
        return '50000000'

def check_api_keys():
    """API 키 설정 확인"""
    logger.info("=== API 키 확인 중 ===")
    logger.info(f"스크립트 디렉토리: {SCRIPT_DIR}")
    logger.info(f"현재 작업 디렉토리: {os.getcwd()}")
    
    # .env 파일 존재 확인
    env_file = os.path.join(SCRIPT_DIR, ".env")
    if os.path.exists(env_file):
        logger.info(f".env 파일 존재: {env_file}")
    else:
        logger.info(f".env 파일이 없습니다: {env_file}")
        logger.info("   → 코드 내 직접 설정 방식 사용")
    
    api_keys_status = {
        'gemini': False,
        'naver': False
    }
    
    # Gemini API 키 확인
    if not GEMINI_API_KEY or GEMINI_API_KEY == 'your_gemini_api_key_here':
        logger.warning("❌ Gemini API 키가 설정되지 않았습니다.")
        logger.info("   해결 방법:")
        logger.info("   1. 환경변수: .env 파일에 GEMINI_API_KEY 설정")
        logger.info("   2. 직접설정: processor.py의 DIRECT_GEMINI_API_KEY 변수에 입력")
        logger.info("   https://makersuite.google.com/app/apikey 에서 발급")
        logger.warning("   → 기본 상품명 생성 모드로 동작합니다.")
    else:
        logger.info(f"✅ Gemini API 키 확인됨: {GEMINI_API_KEY[:10]}...")
        api_keys_status['gemini'] = True
    
    # 네이버 API 키 확인
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET or NAVER_CLIENT_ID == 'your_naver_client_id_here':
        logger.warning("❌ 네이버 API 키가 설정되지 않았습니다.")
        logger.info("   해결 방법:")
        logger.info("   1. 환경변수: .env 파일에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 설정")
        logger.info("   2. 직접설정: processor.py의 DIRECT_NAVER_CLIENT_ID, DIRECT_NAVER_CLIENT_SECRET 변수에 입력")
        logger.info("   https://developers.naver.com/apps/#/list 에서 발급")
        logger.warning("   → 기본 카테고리 모드로 동작합니다.")
    else:
        logger.info(f"✅ 네이버 API 키 확인됨: Client ID: {NAVER_CLIENT_ID[:10]}...")
        api_keys_status['naver'] = True
    
    if api_keys_status['gemini'] and api_keys_status['naver']:
        logger.info("✅ 모든 API 키가 정상적으로 설정되었습니다!")
        logger.info("   → AI 기반 고품질 상품명 생성 모드로 동작합니다.")
    elif api_keys_status['gemini']:
        logger.info("✅ Gemini API 키만 설정됨")
        logger.info("   → AI 기반 상품명 생성 + 기본 카테고리 모드로 동작합니다.")
    else:
        logger.warning("⚠️  API 키가 없어 기본 모드로 동작합니다.")
        logger.info("   → 빠른 처리 (API 호출 없음) + 기본 템플릿 상품명")
    
    return api_keys_status['gemini'] and api_keys_status['naver']

# 전역 프로세서 인스턴스
qname_processor = QNameProcessor()

def process_file(file_path: str) -> dict:
    """파일 처리 메인 함수 - 간소화된 인터페이스"""
    return qname_processor.process_excel_file(file_path)

if __name__ == "__main__":
    logger.info("상품명 및 키워드 생성 프로세서 시작")
    logger.info("=" * 50)
    
    # API 키 확인
    check_api_keys()
    
    # 입력 파일 찾기
    excel_files = [f for f in os.listdir('.') if f.endswith('.xlsx') and not f.startswith('가공완료')]
    
    if not excel_files:
        logger.error("처리할 엑셀 파일을 찾을 수 없습니다.")
        logger.info("   현재 폴더에 엑셀 파일을 넣어주세요.")
        exit(1)
    
    input_file = excel_files[0]
    logger.info(f"처리할 파일: {input_file}")
    
    # 파일 처리 실행
    result = process_file(input_file)
    
    if result['success']:
        logger.info(f"처리 완료: {result['output_file']}")
        logger.info(f"성공: {result['success_count']}행, 실패: {result['error_count']}행")
    else:
        logger.error(f"처리 실패: {result['error']}")
        exit(1) 