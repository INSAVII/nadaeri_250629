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
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# 현재 스크립트 디렉토리 경로 (먼저 정의)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 로깅 설정 - 파일과 콘솔 모두 출력
import logging.handlers

# 로그 디렉토리 생성
log_dir = os.path.join(SCRIPT_DIR, 'logs')
os.makedirs(log_dir, exist_ok=True)

# 로그 파일 설정
log_file = os.path.join(log_dir, f'qname_processor_{datetime.now().strftime("%Y%m%d")}.log')

# 로거 설정
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 파일 핸들러 (일별 로그 파일)
file_handler = logging.handlers.TimedRotatingFileHandler(
    log_file, 
    when='midnight', 
    interval=1, 
    backupCount=7,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)

# 콘솔 핸들러
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# 포맷터
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# 핸들러 추가
logger.addHandler(file_handler)
logger.addHandler(console_handler)

logger.info("QName Processor 로깅 시스템 초기화 완료")

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
# 🔑 API 키 설정 (환경변수 우선, 직접설정은 개발용)
# ========================================
# ⚠️  보안 주의: 실제 API 키는 .env 파일에만 저장하세요!
# 개발/테스트용 기본값 (실제 배포 시에는 반드시 환경변수 사용)
DIRECT_GEMINI_API_KEY = ""  # ← .env 파일에 GEMINI_API_KEY 설정
DIRECT_NAVER_CLIENT_ID = ""  # ← .env 파일에 NAVER_CLIENT_ID 설정  
DIRECT_NAVER_CLIENT_SECRET = ""  # ← .env 파일에 NAVER_CLIENT_SECRET 설정

# ========================================
# API 키 우선순위: 환경변수 > 직접설정 > 없음
# ========================================
# 환경 변수에서 API 키 가져오기 (환경변수 우선, 코드 설정 fallback)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# 환경변수가 없을 때만 직접설정 사용 (개발용)
if not GEMINI_API_KEY:
    GEMINI_API_KEY = DIRECT_GEMINI_API_KEY

if not NAVER_CLIENT_ID:
    NAVER_CLIENT_ID = DIRECT_NAVER_CLIENT_ID

if not NAVER_CLIENT_SECRET:
    NAVER_CLIENT_SECRET = DIRECT_NAVER_CLIENT_SECRET

# 환경변수 로드 완료
logger.info("환경변수 로드 완료")
logger.info(f"스크립트 디렉토리: {SCRIPT_DIR}")

class QNameProcessor:
    """QName 처리기 - 간소화된 버전"""
    
    def __init__(self):
        self.naver_url = "https://openapi.naver.com/v1/search/shop.json"
        self.category_mapper = CategoryMapper()
        
        # 카테고리 데이터 로드
        if not self.category_mapper.load_category_data():
            logger.warning("카테고리 데이터 로드 실패 - 기본 매핑 사용")
        
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
                    category_code, is_suspicious = self.category_mapper.find_category_code(category_format)
                    step3_time = time.time() - step3_start
                    logger.info(f"  단계3(카테고리매핑): {step3_time:.2f}초")
                    
                    # 4. 상품명 생성 (1단계)
                    step4_start = time.time()
                    product_name = self._generate_product_name(keyword, category_format, core_keyword)
                    step4_time = time.time() - step4_start
                    logger.info(f"  단계4(상품명생성): {step4_time:.2f}초")
                    
                    # 5. 상품명 결과 저장 (중간 저장)
                    step5_start = time.time()
                    df.at[index, 'NAVERCODE'] = category_code
                    df.at[index, '카테분류형식'] = f"{'X' if is_suspicious else ''}{category_format}"
                    df.at[index, 'SEO상품명'] = product_name
                    df.at[index, '가공결과'] = '상품명완료'
                    step5_time = time.time() - step5_start
                    logger.info(f"  단계5(상품명저장): {step5_time:.2f}초")
                    
                    # 6. 연관검색어 생성 (2단계 - 상품명 생성 후)
                    step6_start = time.time()
                    related_keywords = self._get_related_keywords(keyword, core_keyword, product_name)
                    step6_time = time.time() - step6_start
                    logger.info(f"  단계6(연관검색어생성): {step6_time:.2f}초")
                    
                    naver_tags = random.sample(related_keywords, min(10, len(related_keywords)))
                    
                    # 7. 연관검색어 결과 저장 (최종 저장)
                    step7_start = time.time()
                    df.at[index, '연관검색어'] = ','.join(related_keywords)
                    df.at[index, '네이버태그'] = ','.join(naver_tags)
                    df.at[index, '가공결과'] = '완료'
                    step7_time = time.time() - step7_start
                    logger.info(f"  단계7(연관검색어저장): {step7_time:.2f}초")
                    
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
        """네이버 쇼핑 API로 카테고리 정보 가져오기 - 모든 키워드 API 조회"""
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            logger.warning("네이버 API 키가 설정되지 않음 - 기본 카테고리 사용")
            return self._create_default_category(keyword)
        
        # 모든 키워드를 네이버 API로 조회 (기본 매핑 제거)
        logger.info(f"=== 네이버 API 조회 시작: {keyword} ===")
        
        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
        params = {"query": keyword, "display": 1}
        
        logger.info(f"API 요청 URL: {self.naver_url}")
        logger.info(f"API 요청 파라미터: {params}")
        
        try:
            start_time = time.time()
            response = requests.get(self.naver_url, headers=headers, params=params, timeout=3)
            response_time = time.time() - start_time
            
            logger.info(f"API 응답 시간: {response_time:.2f}초")
            logger.info(f"API 응답 상태: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"API 응답 내용: {result}")
                
                if 'items' in result and result['items']:
                    item = result['items'][0]
                    category_info = {
                        'category1': item.get('category1', 'N/A'),
                        'category2': item.get('category2', 'N/A'),
                        'category3': item.get('category3', 'N/A'),
                        'category4': item.get('category4', 'N/A')
                    }
                    logger.info(f"네이버 API 성공: {keyword} → {category_info}")
                    return result
                else:
                    logger.warning(f"네이버 API 응답에 상품 없음: {keyword}")
                    logger.warning(f"응답 내용: {result}")
                    return self._create_default_category(keyword)
            else:
                logger.error(f"네이버 API HTTP 오류: {response.status_code} - {keyword}")
                logger.error(f"응답 내용: {response.text}")
                return self._create_default_category(keyword)
                
        except requests.exceptions.Timeout:
            logger.error(f"네이버 API 타임아웃 (3초 초과): {keyword}")
            return self._create_default_category(keyword)
        except requests.exceptions.ConnectionError:
            logger.error(f"네이버 API 연결 오류: {keyword}")
            return self._create_default_category(keyword)
        except requests.exceptions.RequestException as e:
            logger.error(f"네이버 API 요청 오류: {str(e)} - {keyword}")
            return self._create_default_category(keyword)
        except Exception as e:
            logger.error(f"네이버 API 예상치 못한 오류: {str(e)} - {keyword}")
            return self._create_default_category(keyword)
    
    def _create_default_category(self, keyword: str) -> dict:
        """기본 카테고리 정보 생성 - API 실패 시에만 사용"""
        logger.warning(f"기본 카테고리 사용 (API 실패): {keyword}")
        
        # 키워드 기반으로 더 정확한 기본 카테고리 추정
        if any(word in keyword for word in ['양말', '신발', '운동화', '슬리퍼']):
            category = '패션의류>신발/가방>양말'
        elif any(word in keyword for word in ['텀블러', '커피', '보온병']):
            category = '주방용품>커피용품>텀블러'
        elif any(word in keyword for word in ['식기', '그릇', '접시']):
            category = '주방용품>식기류>식기'
        elif any(word in keyword for word in ['캠핑', '등산', '아웃도어']):
            category = '스포츠/레저>캠핑용품>캠핑용품'
        elif any(word in keyword for word in ['청소', '정리', '보관']):
            category = '주방용품>청소용품>청소용품'
        else:
            # 키워드에서 가장 적합한 카테고리 추정
            category = '주방용품>주방용품>주방용품'
        
        categories = category.split('>')
        return {
            'items': [{
                'category1': categories[0] if len(categories) > 0 else '주방용품',
                'category2': categories[1] if len(categories) > 1 else '주방용품',
                'category3': categories[2] if len(categories) > 2 else '주방용품',
                'category4': categories[3] if len(categories) > 3 else '주방용품'
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
            
            if not categories:
                return '주방용품>주방용품>주방용품', '주방용품'
            
            category_format = '>'.join(categories)
            core_keyword = categories[-1] if categories else '주방용품'
            
            return category_format, core_keyword
            
        except Exception as e:
            return '주방용품>주방용품>주방용품', '주방용품'
    
    def _generate_product_name(self, keyword: str, category_format: str, core_keyword: str) -> str:
        """Gemini API로 상품명만 생성 - 고급 2단계 프롬프트"""
        if not self.model:
            # 기본 모드: 키워드 기반 상품명 생성
            return self._generate_basic_product_name(keyword, category_format, core_keyword)
        
        try:
            # 1단계: prefix(조합단어+core keyword) 추천을 LLM이 하도록 프롬프트 구성
            prefix_prompt = (
                f"아래 정보를 참고하여 상품명 앞부분에 들어갈 가장 적합한 조합형 단어(용도, 적용, 특성, 종류 등과 core keyword의 조합)를 추천해 주세요. "
                f"실제 상품의 용도와 상황에 맞고, 혼동을 유발하지 않으며, 중복 없이 한글로만 추천해 주세요. "
                f"예시: core keyword가 '세탁솔'이고 메인키워드에 '빨래'가 있으면 '빨래세탁솔', '욕실'이 있으면 '욕실세탁솔', '홈세트'와 '도자기'가 있으면 '도자기홈세트' 등. "
                f"카테분류형식: {category_format}\nCore keyword: {core_keyword}\n메인키워드: {keyword}\n"
                f"추천 prefix(띄어쓰기 없이 한 단어로):"
            )
            
            try:
                prefix_response = self.model.generate_content(prefix_prompt)
                prefix = prefix_response.text.strip().split()[0]  # 첫 번째 단어만 사용
            except Exception as api_error:
                logger.error(f"Prefix 생성 API 오류: {str(api_error)}")
                prefix = self._select_best_prefix_word(category_format, core_keyword, keyword)

            # 2단계: 상품명 전체 프롬프트에서 prefix를 고정
            prompt = (
                f"상품명 앞부분은 '{prefix}'로 시작합니다. "
                f"이어서 상품의 종류, 목적, 특징, 용도 등을 중복 없이, 브랜드 제외, "
                f"25자 이상 30자 내외로 자연스럽게 이어붙일 단어(띄어쓰기로 구분)를 추천해 주세요. "
                f"단, '{prefix}'는 반드시 한 번만 사용하세요. "
                f"아래 규칙을 반드시 지키세요:\n"
                f"1. 중복단어 사용금지\n"
                f"2. 특수문자, 기호, 영어, 콤마, 괄호 사용금지\n"
                f"3. 단어별 한 칸 띄어쓰기 준수\n"
                f"4. 브랜드문자, 뜻이 분명하지 않은 단어, 한글로 정확한 품목에 해당하지 않는 단어 사용금지\n"
                f"5. 한글의 품목 또는 용도, 목적, 특징, 형상, 종류를 표현하는 단어 이외 사용금지\n"
                f"6. 동물용, 사람용, 어린이용, 성인용, 남성용, 여성용 등 단일상품명에 혼합 사용 금지\n"
                f"7. 인증필요 단어(예: 친환경) 사용 금지\n"
                f"8. 옵션(용량, 색상, 크기, 수량 등) 포함 금지 (예: 텀블러 500ml)\n"
                f"9. Core keyword는 최대 2회만 사용\n"
                f"최종 결과는 '{prefix}'로 시작하는 25자 이상 35자 이내의 상품명 한 줄로만 출력해 주세요. "
                f"카테분류형식: {category_format}\nCore keyword: {core_keyword}\n메인키워드: {keyword}"
            )

            try:
                response = self.model.generate_content(prompt)
                product_name = response.text.strip()
                
                # prefix가 두 번 반복되면 한 번만 남기기
                if product_name.count(prefix) > 1:
                    first = product_name.find(prefix)
                    product_name = prefix + product_name[first+len(prefix):]
                if not product_name.startswith(prefix):
                    product_name = f"{prefix} {product_name}"
                
                product_name = self._trim_product_name(product_name, min_len=25, max_len=35)
                product_name = self._clean_product_name(product_name)
                
                if len(product_name) < 25:
                    logger.warning(f"생성된 상품명이 25자 미만입니다. ({product_name})")
                    
            except Exception as api_error:
                logger.error(f"상품명 생성 API 오류: {str(api_error)}")
                product_name = f"{prefix}{keyword} 고급 품질 상품"
            
            return product_name
            
        except Exception as e:
            logger.error(f"상품명 생성 오류: {str(e)}")
            return self._generate_basic_product_name(keyword, category_format, core_keyword)

    def _generate_basic_product_name(self, keyword: str, category_format: str, core_keyword: str) -> str:
        """기본 모드: 키워드 기반 상품명 생성"""
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
        
        return base_name

    def _select_best_prefix_word(self, category_format, core_keyword, keyword):
        """카테분류형식, core keyword, 메인키워드를 참조하여 상품명 앞에 붙일 가장 적합한 용도/특성/종류 단어를 선택"""
        usage_words = [
            "휴대용", "캠핑", "선물용", "미니", "대용량", "차량용", "아이스", "손잡이", "스테인리스", "이중", "보온보냉", "홈", "주방", "식기", "거울", "세트"
        ]
        context = f"{category_format} {core_keyword} {keyword}".lower()
        for word in usage_words:
            if word in context:
                if word == "캠핑" and ("홈세트" in context or "식기" in context):
                    continue
                if word == "홈" and "캠핑" in context:
                    continue
                return word
        if "식기" in core_keyword or "그릇" in core_keyword:
            return "주방"
        if "홈세트" in core_keyword:
            return "홈"
        if "텀블러" in core_keyword:
            return "휴대용"
        return random.choice(usage_words)

    def _trim_product_name(self, product_name, min_len=25, max_len=35):
        """상품명 길이 조정"""
        words = product_name.split()
        result = ""
        for word in words:
            if len(result) + len(word) + (1 if result else 0) > max_len:
                break
            if result:
                result += " "
            result += word
        if len(result) < min_len and len(words) > len(result.split()):
            for word in words[len(result.split()):]:
                if len(result) + len(word) + 1 > max_len:
                    break
                result += " " + word
        return result

    def _clean_product_name(self, product_name):
        """상품명 정리 - 특수문자, 영어, 기호 제거"""
        # 특수문자, 영어, 기호 제거
        cleaned = re.sub(r'[^가-힣0-9 ]', '', product_name)
        # 옵션 관련 패턴 제거
        option_patterns = [
            r'\d+\s*(ml|l|리터|cc|cm|mm|인치|inch)',
            r'\d+\s*(개|세트|팩|장|벌|쌍|켤레|조)',
            r'(빨강|파랑|블랙|화이트|그레이|옐로우|핑크|민트|네이비|실버|골드|브라운|오렌지|퍼플|청록|연두|남색|회색|노랑|주황|초록|보라|분홍|청색|흰색|검정|갈색|은색|금색|청록색|연두색|남색|회색|노란색|주황색|초록색|보라색|분홍색|청색|흰색|검정색|갈색|은색|금색)'
        ]
        for pattern in option_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        # 연속된 공백을 한 칸으로
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def _get_related_keywords(self, keyword, core_keyword, product_name):
        """Gemini API를 사용하여 연관 검색어 추출 - 상품명 정보 활용"""
        if not self.model:
            # 기본 연관검색어 반환 (중복 제거 적용)
            base_keywords = [
                f"{core_keyword} 용품", f"{core_keyword} 제품", f"{core_keyword} 세트",
                f"{core_keyword} 정리", f"{core_keyword} 보관", f"{core_keyword} 청소",
                f"{core_keyword} 관리", f"{core_keyword} 도구", f"{core_keyword} 장비",
                f"{core_keyword} 정리함", f"{core_keyword} 가방", f"{core_keyword} 박스",
                f"{core_keyword} 정리대", f"{core_keyword} 보관함", f"{core_keyword} 정리용품",
                f"{core_keyword} 관리용품", f"{core_keyword} 도구함", f"{core_keyword} 장비함",
                f"{core_keyword} 세트함", f"{core_keyword} 고급용품"
            ]
            return self._remove_duplicates(base_keywords)
        
        try:
            # Gemini에 전달할 프롬프트 생성 - 상품명 정보 활용
            prompt = f"""
            다음 상품에 대한 네이버 쇼핑 태그 20개를 생성해주세요:
            메인키워드: {keyword}
            Core keyword: {core_keyword}
            생성된 상품명: {product_name}

            다음 규칙을 반드시 지키세요:
            1. 브랜드 표현 단어 사용금지
            2. 영어발음 표현한글 사용금지
            3. 중복단어 사용금지 (동일한 단어나 의미가 같은 단어 반복 금지)
            4. 상품명에 포함된 단어는 재사용금지 (상품명: {product_name})
            5. 목적,기능,대상,편의성,사이즈,디자인 요소,소재 및 구조 강조
            6. 특정사용자그룹,사용자환경,종류 중요성 포함
            7. 검색량이 높은 순서로 배치
            8. 콤마로 구분하여 20개만 반환

            형식: 태그1,태그2,태그3,...
            """

            # Gemini API 호출
            response = self.model.generate_content(prompt)
            
            # 응답에서 태그 추출 및 중복 제거
            tags = response.text.strip().split(',')
            cleaned_tags = self._remove_duplicates(tags)
            
            # 20개로 제한
            return cleaned_tags[:20]

        except Exception as e:
            logger.error(f"연관검색어 생성 API 오류: {str(e)}")
            # 오류 발생 시 기본 태그 반환 (중복 제거 적용)
            fallback_tags = [
                f"{core_keyword} 텀블러", "보온 보냉 텀블러", "대용량 텀블러",
                "손잡이 텀블러", "커피 텀블러", "아이스 텀블러", "캠핑 텀블러",
                "휴대용 텀블러", "선물용 텀블러", "보온병", "회사 텀블러",
                "차량용 텀블러", "빨대 텀블러", "미니 텀블러", "국산 텀블러",
                "예쁜 텀블러", "스텐 텀블러", "이중 텀블러", "보냉 텀블러",
                "보온 텀블러"
            ]
            return self._remove_duplicates(fallback_tags)

    def _remove_duplicates(self, keywords):
        """연관검색어에서 중복 제거"""
        if not keywords:
            return []
        
        # 공백 제거 및 정규화
        cleaned_keywords = []
        for keyword in keywords:
            cleaned = keyword.strip()
            if cleaned and len(cleaned) > 0:
                cleaned_keywords.append(cleaned)
        
        # 중복 제거 (순서 유지)
        seen = set()
        unique_keywords = []
        for keyword in cleaned_keywords:
            # 대소문자 구분 없이 중복 체크
            keyword_lower = keyword.lower()
            if keyword_lower not in seen:
                seen.add(keyword_lower)
                unique_keywords.append(keyword)
        
        return unique_keywords

class CategoryMapper:
    """카테고리 매핑 클래스 - 벡터화 기반 유사도 매칭"""
    
    def __init__(self):
        self.category_map = {}
        self.vectorized_data = None
        self.cache_file = os.path.join(SCRIPT_DIR, 'data', 'category_vector_cache.pkl')
        self.cache_expiry_days = 7  # 캐시 유효 기간 (일)
        
    def load_category_data(self):
        """naver.xlsx 파일에서 카테고리 데이터 로드 및 벡터화 (캐시 활용)"""
        try:
            # 캐시된 벡터화 데이터 확인
            if self._load_cached_data():
                logger.info("캐시된 벡터화 데이터를 사용합니다.")
                return True
            
            # 절대 경로로 변경
            naver_file = os.path.join(SCRIPT_DIR, "data", "naver.xlsx")
            logger.info(f"카테고리 파일 경로: {naver_file}")
            
            if not os.path.exists(naver_file):
                logger.warning(f"naver.xlsx 파일이 없습니다: {naver_file}")
                return False
            
            df = pd.read_excel(naver_file)
            
            # '카테고리분류형식' 열이 없으면 생성
            if '카테고리분류형식' not in df.columns:
                df['카테고리분류형식'] = df.apply(
                    lambda row: '>'.join(
                        [str(row['1차분류']), str(row['2차분류']), str(row['3차분류']), str(row['4차분류'])]
                        if not pd.isnull(row['4차분류']) else
                        [str(row['1차분류']), str(row['2차분류']), str(row['3차분류'])]
                    ),
                    axis=1
                )
            
            if '카테고리분류형식' not in df.columns or 'catecode' not in df.columns:
                logger.warning("naver.xlsx 파일에 필요한 컬럼이 없습니다.")
                return False
            
            # 카테고리 맵 생성
            self.category_map = dict(zip(df['카테고리분류형식'], df['catecode']))
            
            # 벡터화 수행
            self.vectorized_data = self._vectorize_categories(df)
            
            # 벡터화된 데이터 캐시 저장
            self._save_cached_data()
            
            logger.info(f"카테고리 데이터 로드 완료: {len(self.category_map)}개")
            return True
            
        except Exception as e:
            logger.error(f"카테고리 데이터 로드 오류: {str(e)}")
            return False

    def _vectorize_categories(self, df):
        """카테고리 데이터 벡터화"""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            
            vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 3))
            vectors = vectorizer.fit_transform(df['카테고리분류형식'])
            
            return {
                'vectors': vectors,
                'vectorizer': vectorizer,
                'categories': df['카테고리분류형식'].tolist(),
                'codes': df['catecode'].tolist(),
                'last_updated': datetime.now()
            }
        except ImportError:
            logger.warning("scikit-learn이 설치되지 않아 기본 매칭을 사용합니다.")
            return None

    def _save_cached_data(self):
        """벡터화된 데이터를 파일로 저장"""
        try:
            import pickle
            cache_data = {
                'category_map': self.category_map,
                'vectorized_data': self.vectorized_data,
                'timestamp': datetime.now()
            }
            
            os.makedirs(os.path.dirname(self.cache_file), exist_ok=True)
            with open(self.cache_file, 'wb') as f:
                pickle.dump(cache_data, f)
            
            logger.info("벡터화된 데이터가 캐시에 저장되었습니다.")
            
        except Exception as e:
            logger.error(f"캐시 저장 오류: {str(e)}")

    def _load_cached_data(self):
        """캐시된 벡터화 데이터 로드"""
        try:
            import pickle
            if not os.path.exists(self.cache_file):
                return False
            
            # 캐시 파일의 수정 시간 확인
            cache_time = datetime.fromtimestamp(os.path.getmtime(self.cache_file))
            if datetime.now() - cache_time > timedelta(days=self.cache_expiry_days):
                logger.info("캐시가 만료되었습니다. 새로운 데이터를 로드합니다.")
                return False
            
            with open(self.cache_file, 'rb') as f:
                cache_data = pickle.load(f)
            
            self.category_map = cache_data['category_map']
            self.vectorized_data = cache_data['vectorized_data']
            
            return True
            
        except Exception as e:
            logger.error(f"캐시 로드 오류: {str(e)}")
            return False
    
    def find_category_code(self, category_format: str) -> tuple:
        """카테고리 형식에 해당하는 코드 찾기"""
        if not category_format:
            return '50000000', False
        
        try:
            # 1. 정확한 매칭
            if category_format in self.category_map:
                return self.category_map[category_format], False
            
            # 2. 벡터화된 데이터를 사용한 유사도 매칭
            if self.vectorized_data:
                from sklearn.metrics.pairwise import cosine_similarity
                input_vector = self.vectorized_data['vectorizer'].transform([category_format])
                similarities = cosine_similarity(input_vector, self.vectorized_data['vectors'])
                
                most_similar_idx = similarities.argmax()
                similarity_score = similarities[0][most_similar_idx]
                
                if similarity_score > 0.95:
                    matched_code = self.vectorized_data['codes'][most_similar_idx]
                    return matched_code, False
            
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
                    return default_code, True
            
            # 4. 완전히 매칭되지 않으면 일반 주방용품 코드
            return '50000000', True
            
        except Exception as e:
            return '50000000', True

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