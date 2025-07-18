#!/usr/bin/env python3
"""
상품명 및 키워드 생성 프로세서 - 병렬 처리 최적화 버전
배치 처리와 비동기 API 호출로 성능을 대폭 향상시킵니다.
"""

import os
import pandas as pd
import requests
import random
import time
import re
import asyncio
import aiohttp
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Tuple, Any

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

class OptimizedQNameProcessor:
    """QName 처리기 - 병렬 처리 최적화 버전"""
    
    def __init__(self, batch_size=10, max_concurrent=5):
        self.naver_url = "https://openapi.naver.com/v1/search/shop.json"
        self.category_mapper = CategoryMapper()
        self.batch_size = batch_size
        self.max_concurrent = max_concurrent
        
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
    
    def calculate_optimal_batch_size(self, total_count: int) -> int:
        """총 개수에 따른 최적 배치 크기 계산"""
        if total_count <= 10:
            return total_count
        elif total_count <= 50:
            return 10
        elif total_count <= 100:
            return 15
        else:
            return 20
    
    async def process_excel_file(self, file_path: str) -> dict:
        """엑셀 파일을 처리하고 결과를 반환 - 비동기 환경 호환 (서버/CLI 모두 지원)"""
        try:
            logger.info(f"파일 처리 시작: {file_path}")
            
            # 엑셀 파일 읽기
            df = pd.read_excel(file_path)
            logger.info(f"총 처리할 행 수: {len(df)}")
            
            if '메인키워드' not in df.columns:
                raise ValueError("'메인키워드' 컬럼이 없습니다.")
            
            # B열 한 줄 전체를 하나의 키워드로 간주 (조합/슬라이싱 없이)
            keywords = df['메인키워드'].astype(str).tolist()
            
            # 최적 배치 크기 계산
            optimal_batch_size = self.calculate_optimal_batch_size(len(keywords))
            logger.info(f"최적 배치 크기: {optimal_batch_size}")
            
            # 비동기 처리 실행
            results = await self.process_keywords_async(keywords, optimal_batch_size)
            
            # 결과를 DataFrame에 적용
            for i, result in enumerate(results):
                if i < len(df):
                    df.at[i, 'NAVERCODE'] = result.get('naver_code', '')
                    df.at[i, '카테분류형식'] = result.get('category_format', '')
                    df.at[i, 'SEO상품명'] = result.get('product_name', '')
                    df.at[i, '연관검색어'] = result.get('related_keywords', '')
                    df.at[i, '네이버태그'] = result.get('naver_tags', '')
                    df.at[i, '가공결과'] = result.get('status', '실패')
            
            # 결과 파일 저장
            output_file = f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            df.to_excel(output_file, index=False)
            
            success_count = sum(1 for r in results if r.get('status') == '완료')
            error_count = len(results) - success_count
            
            return {
                'success': True,
                'total_processed': len(results),
                'success_count': success_count,
                'error_count': error_count,
                'output_file': output_file
            }
            
        except Exception as e:
            logger.error(f"파일 처리 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'total_processed': 0,
                'success_count': 0,
                'error_count': len(df) if 'df' in locals() else 0
            }
    
    async def process_keywords_async(self, keywords: List[str], batch_size: int) -> List[Dict]:
        """키워드들을 배치 단위로 비동기 처리"""
        logger.info(f"비동기 배치 처리 시작: {len(keywords)}개 키워드, 배치 크기: {batch_size}")
        
        # 배치로 분할
        batches = [keywords[i:i + batch_size] for i in range(0, len(keywords), batch_size)]
        logger.info(f"총 {len(batches)}개 배치로 분할")
        
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            for batch_idx, batch in enumerate(batches):
                logger.info(f"배치 {batch_idx + 1}/{len(batches)} 처리 시작: {len(batch)}개 키워드")
                
                # 1단계: 네이버 API 배치 호출
                naver_results = await self.batch_naver_api(session, batch)
                
                # 2단계: 카테고리 정보 추출
                category_infos = [self._extract_category_info(result) for result in naver_results]
                
                # 3단계: 상품명 생성 배치 호출
                product_names = await self.batch_gemini_product(session, batch, category_infos)
                
                # 4단계: 연관검색어 생성 배치 호출
                related_keywords = await self.batch_gemini_related(session, batch, product_names)
                
                # 5단계: 결과 통합
                batch_results = []
                for i, keyword in enumerate(batch):
                    category_format, core_keyword = category_infos[i]
                    category_code, is_suspicious = self.category_mapper.find_category_code(category_format)
                    
                    # 네이버태그 생성: 연관검색어에서 10개 랜덤 선택
                    import random
                    related_keywords_list = related_keywords[i].split(',') if related_keywords[i] else []
                    naver_tags = random.sample(related_keywords_list, min(10, len(related_keywords_list))) if related_keywords_list else []
                    
                    result = {
                        'keyword': keyword,
                        'naver_code': category_code,
                        'category_format': f"{'X' if is_suspicious else ''}{category_format}",
                        'product_name': product_names[i],
                        'related_keywords': related_keywords[i],
                        'naver_tags': ','.join(naver_tags),
                        'status': '완료'
                    }
                    batch_results.append(result)
                
                all_results.extend(batch_results)
                
                # 배치 간 딜레이 (API 레이트 리밋 고려)
                if batch_idx < len(batches) - 1:
                    await asyncio.sleep(0.5)
        
        logger.info(f"비동기 배치 처리 완료: {len(all_results)}개 결과")
        return all_results
    
    async def batch_naver_api(self, session: aiohttp.ClientSession, keywords: List[str]) -> List[Dict]:
        """네이버 API 배치 호출"""
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            logger.warning("네이버 API 키가 설정되지 않음 - 기본 카테고리 사용")
            return [self._create_default_category(keyword) for keyword in keywords]
        
        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def fetch_naver_data(keyword: str) -> Dict:
            async with semaphore:
                try:
                    params = {"query": keyword, "display": 1}
                    async with session.get(self.naver_url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=3)) as response:
                        if response.status == 200:
                            result = await response.json()
                            if 'items' in result and result['items']:
                                logger.info(f"네이버 API 성공: {keyword}")
                                return result
                            else:
                                logger.warning(f"네이버 API 응답에 상품 없음: {keyword}")
                                return self._create_default_category(keyword)
                        else:
                            logger.error(f"네이버 API HTTP 오류: {response.status} - {keyword}")
                            return self._create_default_category(keyword)
                except Exception as e:
                    logger.error(f"네이버 API 오류: {str(e)} - {keyword}")
                    return self._create_default_category(keyword)
        
        tasks = [fetch_naver_data(keyword) for keyword in keywords]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"네이버 API 예외: {str(result)} - {keywords[i]}")
                processed_results.append(self._create_default_category(keywords[i]))
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def batch_gemini_product(self, session: aiohttp.ClientSession, keywords: List[str], category_infos: List[Tuple]) -> List[str]:
        """Gemini API 배치 호출 - 상품명 생성"""
        if not self.model:
            return [self._generate_basic_product_name(kw, cat[0], cat[1]) for kw, cat in zip(keywords, category_infos)]
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def generate_product_name(keyword: str, category_format: str, core_keyword: str) -> str:
            async with semaphore:
                try:
                    # ThreadPoolExecutor를 사용하여 동기 Gemini API를 비동기로 래핑
                    loop = asyncio.get_event_loop()
                    with ThreadPoolExecutor() as executor:
                        result = await loop.run_in_executor(
                            executor,
                            self._generate_product_name_sync,
                            keyword, category_format, core_keyword
                        )
                    return result
                except Exception as e:
                    logger.error(f"상품명 생성 오류: {str(e)} - {keyword}")
                    return self._generate_basic_product_name(keyword, category_format, core_keyword)
        
        tasks = [generate_product_name(kw, cat[0], cat[1]) for kw, cat in zip(keywords, category_infos)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"상품명 생성 예외: {str(result)} - {keywords[i]}")
                processed_results.append(self._generate_basic_product_name(keywords[i], category_infos[i][0], category_infos[i][1]))
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def batch_gemini_related(self, session: aiohttp.ClientSession, keywords: List[str], product_names: List[str]) -> List[str]:
        """Gemini API 배치 호출 - 연관검색어 생성"""
        if not self.model:
            return [','.join(self._get_basic_related_keywords(kw)) for kw in keywords]
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def generate_related_keywords(keyword: str, product_name: str) -> str:
            async with semaphore:
                try:
                    # ThreadPoolExecutor를 사용하여 동기 Gemini API를 비동기로 래핑
                    loop = asyncio.get_event_loop()
                    with ThreadPoolExecutor() as executor:
                        result = await loop.run_in_executor(
                            executor,
                            self._get_related_keywords_sync,
                            keyword, product_name
                        )
                    return result
                except Exception as e:
                    logger.error(f"연관검색어 생성 오류: {str(e)} - {keyword}")
                    return ','.join(self._get_basic_related_keywords(keyword))
        
        tasks = [generate_related_keywords(kw, pn) for kw, pn in zip(keywords, product_names)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"연관검색어 생성 예외: {str(result)} - {keywords[i]}")
                processed_results.append(','.join(self._get_basic_related_keywords(keywords[i])))
            else:
                processed_results.append(result)
        
        return processed_results
    
    def _generate_product_name_sync(self, keyword: str, category_format: str, core_keyword: str) -> str:
        """동기 상품명 생성 (ThreadPoolExecutor용)"""
        try:
            # 1단계: prefix 추천
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

            # 2단계: 상품명 전체 생성
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
    
    def _get_related_keywords_sync(self, keyword: str, product_name: str) -> str:
        """동기 연관검색어 생성 (ThreadPoolExecutor용)"""
        try:
            prompt = f"""
            다음 상품에 대한 네이버 쇼핑 태그 20개를 생성해주세요:
            메인키워드: {keyword}
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

            response = self.model.generate_content(prompt)
            tags = response.text.strip().split(',')
            cleaned_tags = self._remove_duplicates(tags)
            
            return ','.join(cleaned_tags[:20])

        except Exception as e:
            logger.error(f"연관검색어 생성 API 오류: {str(e)}")
            return ','.join(self._get_basic_related_keywords(keyword))
    
    def _get_basic_related_keywords(self, keyword: str) -> List[str]:
        """기본 연관검색어 반환"""
        base_keywords = [
            f"{keyword} 용품", f"{keyword} 제품", f"{keyword} 세트",
            f"{keyword} 정리", f"{keyword} 보관", f"{keyword} 청소",
            f"{keyword} 관리", f"{keyword} 도구", f"{keyword} 장비",
            f"{keyword} 정리함", f"{keyword} 가방", f"{keyword} 박스",
            f"{keyword} 정리대", f"{keyword} 보관함", f"{keyword} 정리용품",
            f"{keyword} 관리용품", f"{keyword} 도구함", f"{keyword} 장비함",
            f"{keyword} 세트함", f"{keyword} 고급용품"
        ]
        return self._remove_duplicates(base_keywords)
    
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
        
        # 키워드에서 적합한 prefix 찾기
        prefix = '고급'
        for key, value in prefix_map.items():
            if key in keyword:
                prefix = value
                break
        
        # 기본 상품명 생성
        product_name = f"{prefix} {keyword} {core_keyword}"
        product_name = self._trim_product_name(product_name, min_len=25, max_len=35)
        product_name = self._clean_product_name(product_name)
        
        return product_name
    
    def _select_best_prefix_word(self, category_format, core_keyword, keyword):
        """카테고리와 키워드를 기반으로 최적의 prefix 선택"""
        prefix_options = {
            '텀블러': ['휴대용', '보온', '아이스', '캠핑'],
            '커피': ['주방', '카페', '오피스', '휴대용'],
            '보온병': ['보온', '대용량', '아이스', '캠핑'],
            '식기': ['주방', '가정용', '식당용', '고급'],
            '그릇': ['주방', '가정용', '식당용', '고급'],
            '캠핑': ['캠핑', '아웃도어', '휴대용', '가족용'],
            '청소': ['실용적인', '효과적인', '편리한', '고급'],
            '정리': ['편리한', '깔끔한', '실용적인', '고급'],
            '보관': ['깔끔한', '편리한', '실용적인', '고급']
        }
        
        # 키워드에서 적합한 prefix 찾기
        for key, options in prefix_options.items():
            if key in keyword:
                return random.choice(options)
        
        return '고급'
    
    def _trim_product_name(self, product_name, min_len=25, max_len=35):
        """상품명 길이 조정"""
        if len(product_name) <= max_len:
            return product_name
        
        # 단어 단위로 자르기
        words = product_name.split()
        trimmed = words[0]
        
        for word in words[1:]:
            if len(trimmed + ' ' + word) <= max_len:
                trimmed += ' ' + word
            else:
                break
        
        return trimmed
    
    def _clean_product_name(self, product_name):
        """상품명 정리"""
        # 특수문자 제거
        cleaned = re.sub(r'[^\w\s가-힣]', '', product_name)
        # 연속 공백 제거
        cleaned = re.sub(r'\s+', ' ', cleaned)
        # 앞뒤 공백 제거
        cleaned = cleaned.strip()
        return cleaned
    
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
        try:
            # 정확한 매칭 시도
            if category_format in self.category_map:
                return self.category_map[category_format], False
            
            # 벡터화된 데이터가 있으면 유사도 매칭
            if self.vectorized_data:
                try:
                    from sklearn.metrics.pairwise import cosine_similarity
                    
                    # 입력 카테고리 벡터화
                    input_vector = self.vectorized_data['vectorizer'].transform([category_format])
                    
                    # 유사도 계산
                    similarities = cosine_similarity(input_vector, self.vectorized_data['vectors']).flatten()
                    
                    # 가장 유사한 카테고리 찾기
                    best_match_idx = similarities.argmax()
                    best_similarity = similarities[best_match_idx]
                    best_category = self.vectorized_data['categories'][best_match_idx]
                    best_code = self.vectorized_data['codes'][best_match_idx]
                    logger.info(f"유사도 매칭 결과: {category_format} → {best_category} (유사도: {best_similarity:.3f})")
                    # 유사도 임계값 이하라도 best_code를 반환, x 표시는 별도 로직에서 처리
                    return best_code, True
                except Exception as e:
                    logger.error(f"벡터화 매칭 오류: {str(e)}")
                    return '00000000', True
            
            # 기본값 반환
            logger.warning(f"카테고리 매칭 실패: {category_format}")
            return '00000000', True
            
        except Exception as e:
            logger.error(f"카테고리 코드 찾기 오류: {str(e)}")
            return '00000000', True

def check_api_keys():
    """API 키 설정 상태 확인"""
    logger.info("=== API 키 설정 상태 확인 ===")
    
    if GEMINI_API_KEY:
        logger.info("✅ Gemini API 키가 설정되어 있습니다.")
    else:
        logger.warning("❌ Gemini API 키가 설정되지 않았습니다.")
    
    if NAVER_CLIENT_ID and NAVER_CLIENT_SECRET:
        logger.info("✅ 네이버 API 키가 설정되어 있습니다.")
    else:
        logger.warning("❌ 네이버 API 키가 설정되지 않았습니다.")
    
    return {
        'gemini_configured': bool(GEMINI_API_KEY),
        'naver_configured': bool(NAVER_CLIENT_ID and NAVER_CLIENT_SECRET)
    }

# CLI/테스트 환경에서만 사용하세요. 서버(비동기 환경)에서는 절대 asyncio.run()을 사용하지 마세요.
def process_file(file_path: str) -> dict:
    """CLI/테스트 환경에서만 사용. 서버에서는 반드시 await processor.process_excel_file 사용!"""
    from processor import OptimizedQNameProcessor
    processor = OptimizedQNameProcessor()
    return asyncio.run(processor.process_excel_file(file_path))

if __name__ == "__main__":
    # 테스트 실행
    check_api_keys() 