#!/usr/bin/env python3
"""
상품명 및 키워드 생성 프로세서 - 키워드 조합 최적화 버전
3개 이상 키워드를 조합하여 정확한 카테고리 분류와 상품명 생성
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

# 현재 스크립트 디렉토리 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# 로깅 설정
import logging.handlers

log_dir = os.path.join(SCRIPT_DIR, 'logs')
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, f'qname_processor_{datetime.now().strftime("%Y%m%d")}.log')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

file_handler = logging.handlers.TimedRotatingFileHandler(
    log_file, 
    when='midnight', 
    interval=1, 
    backupCount=7,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

logger.addHandler(file_handler)
logger.addHandler(console_handler)

logger.info("QName Processor (키워드 조합 버전) 로깅 시스템 초기화 완료")

# .env 파일 로드
possible_env_paths = [
    ".env", "../.env", "../../.env",
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(__file__), "..", ".env"),
    os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
]

env_loaded = False
for env_path in possible_env_paths:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        logger.info(f"환경변수 파일 로드됨: {os.path.abspath(env_path)}")
        env_loaded = True
        break

if not env_loaded:
    logger.warning("어떤 .env 파일도 찾을 수 없습니다. 기본값을 사용합니다.")
    load_dotenv()

# API 키 설정
DIRECT_GEMINI_API_KEY = ""
DIRECT_NAVER_CLIENT_ID = ""
DIRECT_NAVER_CLIENT_SECRET = ""

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

if not GEMINI_API_KEY:
    GEMINI_API_KEY = DIRECT_GEMINI_API_KEY
if not NAVER_CLIENT_ID:
    NAVER_CLIENT_ID = DIRECT_NAVER_CLIENT_ID
if not NAVER_CLIENT_SECRET:
    NAVER_CLIENT_SECRET = DIRECT_NAVER_CLIENT_SECRET

logger.info("환경변수 로드 완료")

class CombinedQNameProcessor:
    """QName 처리기 - 키워드 조합 최적화 버전"""
    
    def __init__(self, batch_size=10, max_concurrent=5, min_keywords=3, max_keywords=5):
        self.naver_url = "https://openapi.naver.com/v1/search/shop.json"
        self.category_mapper = CategoryMapper()
        self.batch_size = batch_size
        self.max_concurrent = max_concurrent
        self.min_keywords = min_keywords
        self.max_keywords = max_keywords
        
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
    
    def create_keyword_combinations(self, keywords: List[str]) -> List[Dict]:
        """키워드들을 조합하여 더 구체적인 검색어 생성"""
        combinations = []
        
        # 키워드가 3개 미만이면 기본 조합 생성
        if len(keywords) < self.min_keywords:
            # 부족한 키워드를 기본값으로 채움
            default_keywords = ['주방용품', '가정용', '실용적인']
            while len(keywords) < self.min_keywords:
                keywords.append(random.choice(default_keywords))
        
        # 슬라이딩 윈도우로 키워드 조합 생성
        for i in range(len(keywords) - self.min_keywords + 1):
            for j in range(self.min_keywords, min(self.max_keywords + 1, len(keywords) - i + 1)):
                keyword_group = keywords[i:i+j]
                combined_keyword = ' '.join(keyword_group)
                
                combination = {
                    'original_keywords': keyword_group,
                    'combined_keyword': combined_keyword,
                    'start_index': i,
                    'end_index': i + j
                }
                combinations.append(combination)
        
        logger.info(f"키워드 조합 생성: {len(keywords)}개 → {len(combinations)}개 조합")
        return combinations
    
    def process_excel_file(self, file_path: str) -> dict:
        """엑셀 파일을 처리하고 결과를 반환 - 키워드 조합 방식"""
        try:
            logger.info(f"파일 처리 시작: {file_path}")
            
            # 엑셀 파일 읽기
            df = pd.read_excel(file_path)
            logger.info(f"총 처리할 행 수: {len(df)}")
            
            if '메인키워드' not in df.columns:
                raise ValueError("'메인키워드' 컬럼이 없습니다.")
            
            # 키워드 추출 및 조합 생성
            keywords = df['메인키워드'].tolist()
            keyword_combinations = self.create_keyword_combinations(keywords)
            
            # 비동기 처리 실행
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
            output_file = f"output_combined_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
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
            logger.error(f"파일 처리 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'total_processed': 0,
                'success_count': 0,
                'error_count': len(df) if 'df' in locals() else 0
            }
    
    async def process_combined_keywords_async(self, keyword_combinations: List[Dict]) -> List[Dict]:
        """조합된 키워드들을 배치 단위로 비동기 처리"""
        logger.info(f"조합 키워드 비동기 배치 처리 시작: {len(keyword_combinations)}개 조합")
        
        # 배치로 분할
        batches = [keyword_combinations[i:i + self.batch_size] 
                  for i in range(0, len(keyword_combinations), self.batch_size)]
        logger.info(f"총 {len(batches)}개 배치로 분할")
        
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            for batch_idx, batch in enumerate(batches):
                logger.info(f"배치 {batch_idx + 1}/{len(batches)} 처리 시작: {len(batch)}개 조합")
                
                # 조합된 키워드들로 API 호출
                combined_keywords = [item['combined_keyword'] for item in batch]
                
                # 1단계: 네이버 API 배치 호출 (조합된 키워드로)
                naver_results = await self.batch_naver_api(session, combined_keywords)
                
                # 2단계: 카테고리 정보 추출
                category_infos = [self._extract_category_info(result) for result in naver_results]
                
                # 3단계: 상품명 생성 배치 호출
                product_names = await self.batch_gemini_product(session, combined_keywords, category_infos)
                
                # 4단계: 연관검색어 생성 배치 호출
                related_keywords = await self.batch_gemini_related(session, combined_keywords, product_names)
                
                # 5단계: 결과 통합
                batch_results = []
                for i, combination in enumerate(batch):
                    category_format, core_keyword = category_infos[i]
                    category_code, is_suspicious = self.category_mapper.find_category_code(category_format)
                    
                    result = {
                        'original_keywords': combination['original_keywords'],
                        'combined_keyword': combination['combined_keyword'],
                        'naver_code': category_code,
                        'category_format': f"{'X' if is_suspicious else ''}{category_format}",
                        'product_name': product_names[i],
                        'related_keywords': related_keywords[i],
                        'used_combination': combination['combined_keyword'],
                        'status': '완료'
                    }
                    batch_results.append(result)
                
                all_results.extend(batch_results)
                
                # 배치 간 딜레이
                if batch_idx < len(batches) - 1:
                    await asyncio.sleep(0.5)
        
        logger.info(f"조합 키워드 비동기 배치 처리 완료: {len(all_results)}개 결과")
        return all_results
    
    async def batch_naver_api(self, session: aiohttp.ClientSession, combined_keywords: List[str]) -> List[Dict]:
        """조합된 키워드로 네이버 API 배치 호출"""
        if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
            logger.warning("네이버 API 키가 설정되지 않음 - 기본 카테고리 사용")
            return [self._create_default_category(keyword) for keyword in combined_keywords]
        
        headers = {
            "X-Naver-Client-Id": NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": NAVER_CLIENT_SECRET
        }
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def fetch_naver_data(combined_keyword: str) -> Dict:
            async with semaphore:
                try:
                    params = {"query": combined_keyword, "display": 1}
                    async with session.get(self.naver_url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=3)) as response:
                        if response.status == 200:
                            result = await response.json()
                            if 'items' in result and result['items']:
                                logger.info(f"네이버 API 성공 (조합): {combined_keyword}")
                                return result
                            else:
                                logger.warning(f"네이버 API 응답에 상품 없음 (조합): {combined_keyword}")
                                return self._create_default_category(combined_keyword)
                        else:
                            logger.error(f"네이버 API HTTP 오류: {response.status} - {combined_keyword}")
                            return self._create_default_category(combined_keyword)
                except Exception as e:
                    logger.error(f"네이버 API 오류: {str(e)} - {combined_keyword}")
                    return self._create_default_category(combined_keyword)
        
        tasks = [fetch_naver_data(keyword) for keyword in combined_keywords]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"네이버 API 예외: {str(result)} - {combined_keywords[i]}")
                processed_results.append(self._create_default_category(combined_keywords[i]))
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def batch_gemini_product(self, session: aiohttp.ClientSession, combined_keywords: List[str], category_infos: List[Tuple]) -> List[str]:
        """조합된 키워드로 Gemini API 배치 호출 - 상품명 생성"""
        if not self.model:
            return [self._generate_basic_product_name(kw, cat[0], cat[1]) for kw, cat in zip(combined_keywords, category_infos)]
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def generate_product_name(combined_keyword: str, category_format: str, core_keyword: str) -> str:
            async with semaphore:
                try:
                    loop = asyncio.get_event_loop()
                    with ThreadPoolExecutor() as executor:
                        result = await loop.run_in_executor(
                            executor,
                            self._generate_product_name_sync,
                            combined_keyword, category_format, core_keyword
                        )
                    return result
                except Exception as e:
                    logger.error(f"상품명 생성 오류: {str(e)} - {combined_keyword}")
                    return self._generate_basic_product_name(combined_keyword, category_format, core_keyword)
        
        tasks = [generate_product_name(kw, cat[0], cat[1]) for kw, cat in zip(combined_keywords, category_infos)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"상품명 생성 예외: {str(result)} - {combined_keywords[i]}")
                processed_results.append(self._generate_basic_product_name(combined_keywords[i], category_infos[i][0], category_infos[i][1]))
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def batch_gemini_related(self, session: aiohttp.ClientSession, combined_keywords: List[str], product_names: List[str]) -> List[str]:
        """조합된 키워드로 Gemini API 배치 호출 - 연관검색어 생성"""
        if not self.model:
            return [','.join(self._get_basic_related_keywords(kw)) for kw in combined_keywords]
        
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def generate_related_keywords(combined_keyword: str, product_name: str) -> str:
            async with semaphore:
                try:
                    loop = asyncio.get_event_loop()
                    with ThreadPoolExecutor() as executor:
                        result = await loop.run_in_executor(
                            executor,
                            self._get_related_keywords_sync,
                            combined_keyword, product_name
                        )
                    return result
                except Exception as e:
                    logger.error(f"연관검색어 생성 오류: {str(e)} - {combined_keyword}")
                    return ','.join(self._get_basic_related_keywords(combined_keyword))
        
        tasks = [generate_related_keywords(kw, pn) for kw, pn in zip(combined_keywords, product_names)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 예외 처리
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"연관검색어 생성 예외: {str(result)} - {combined_keywords[i]}")
                processed_results.append(','.join(self._get_basic_related_keywords(combined_keywords[i])))
            else:
                processed_results.append(result)
        
        return processed_results
    
    def _generate_product_name_sync(self, combined_keyword: str, category_format: str, core_keyword: str) -> str:
        """조합된 키워드로 동기 상품명 생성"""
        try:
            # 조합된 키워드를 활용한 프롬프트
            prompt = (
                f"다음 조합된 키워드를 기반으로 정확한 상품명을 생성해주세요:\n"
                f"조합된 키워드: {combined_keyword}\n"
                f"카테분류형식: {category_format}\n"
                f"Core keyword: {core_keyword}\n\n"
                f"규칙:\n"
                f"1. 조합된 키워드의 모든 단어를 활용하여 구체적인 상품명 생성\n"
                f"2. 25자 이상 35자 이내로 생성\n"
                f"3. 중복단어 사용금지\n"
                f"4. 특수문자, 영어, 기호 사용금지\n"
                f"5. 브랜드명 제외\n"
                f"6. 옵션(용량, 색상, 크기) 제외\n\n"
                f"상품명:"
            )

            try:
                response = self.model.generate_content(prompt)
                product_name = response.text.strip()
                product_name = self._trim_product_name(product_name, min_len=25, max_len=35)
                product_name = self._clean_product_name(product_name)
                
                if len(product_name) < 25:
                    logger.warning(f"생성된 상품명이 25자 미만입니다. ({product_name})")
                    
            except Exception as api_error:
                logger.error(f"상품명 생성 API 오류: {str(api_error)}")
                product_name = f"{combined_keyword} 고급 품질 상품"
            
            return product_name
            
        except Exception as e:
            logger.error(f"상품명 생성 오류: {str(e)}")
            return self._generate_basic_product_name(combined_keyword, category_format, core_keyword)
    
    def _get_related_keywords_sync(self, combined_keyword: str, product_name: str) -> str:
        """조합된 키워드로 동기 연관검색어 생성"""
        try:
            prompt = f"""
            다음 조합된 키워드와 상품명을 기반으로 연관검색어 20개를 생성해주세요:
            조합된 키워드: {combined_keyword}
            생성된 상품명: {product_name}

            규칙:
            1. 조합된 키워드의 모든 단어를 고려하여 관련성 높은 검색어 생성
            2. 브랜드 표현 단어 사용금지
            3. 중복단어 사용금지
            4. 상품명에 포함된 단어 재사용금지
            5. 목적, 기능, 대상, 편의성, 소재, 구조 강조
            6. 검색량이 높은 순서로 배치
            7. 콤마로 구분하여 20개만 반환

            형식: 태그1,태그2,태그3,...
            """

            response = self.model.generate_content(prompt)
            tags = response.text.strip().split(',')
            cleaned_tags = self._remove_duplicates(tags)
            
            return ','.join(cleaned_tags[:20])

        except Exception as e:
            logger.error(f"연관검색어 생성 API 오류: {str(e)}")
            return ','.join(self._get_basic_related_keywords(combined_keyword))
    
    def _get_basic_related_keywords(self, combined_keyword: str) -> List[str]:
        """조합된 키워드 기반 기본 연관검색어"""
        words = combined_keyword.split()
        base_keywords = []
        
        for word in words:
            base_keywords.extend([
                f"{word} 용품", f"{word} 제품", f"{word} 세트",
                f"{word} 정리", f"{word} 보관", f"{word} 청소",
                f"{word} 관리", f"{word} 도구", f"{word} 장비"
            ])
        
        return self._remove_duplicates(base_keywords)
    
    def _create_default_category(self, combined_keyword: str) -> dict:
        """조합된 키워드 기반 기본 카테고리 생성"""
        words = combined_keyword.lower().split()
        
        # 키워드 조합에 따른 카테고리 추정
        if any(word in words for word in ['양말', '신발', '운동화']):
            category = '패션의류>신발/가방>양말'
        elif any(word in words for word in ['텀블러', '커피', '보온병']):
            category = '주방용품>커피용품>텀블러'
        elif any(word in words for word in ['식기', '그릇', '접시']):
            category = '주방용품>식기류>식기'
        elif any(word in words for word in ['캠핑', '등산', '아웃도어']):
            category = '스포츠/레저>캠핑용품>캠핑용품'
        elif any(word in words for word in ['청소', '정리', '보관']):
            category = '주방용품>청소용품>청소용품'
        else:
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
    
    def _generate_basic_product_name(self, combined_keyword: str, category_format: str, core_keyword: str) -> str:
        """조합된 키워드 기반 기본 상품명 생성"""
        words = combined_keyword.split()
        prefix = '고급'
        
        # 조합된 키워드에서 적합한 prefix 찾기
        prefix_map = {
            '텀블러': '휴대용', '커피': '주방', '보온병': '보온',
            '식기': '주방', '그릇': '주방', '캠핑': '캠핑',
            '청소': '실용적인', '정리': '편리한', '보관': '깔끔한'
        }
        
        for word in words:
            if word in prefix_map:
                prefix = prefix_map[word]
                break
        
        # 조합된 키워드를 활용한 상품명 생성
        product_name = f"{prefix} {combined_keyword} {core_keyword}"
        product_name = self._trim_product_name(product_name, min_len=25, max_len=35)
        product_name = self._clean_product_name(product_name)
        
        return product_name
    
    def _trim_product_name(self, product_name, min_len=25, max_len=35):
        """상품명 길이 조정"""
        if len(product_name) <= max_len:
            return product_name
        
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
        cleaned = re.sub(r'[^\w\s가-힣]', '', product_name)
        cleaned = re.sub(r'\s+', ' ', cleaned)
        cleaned = cleaned.strip()
        return cleaned
    
    def _remove_duplicates(self, keywords):
        """연관검색어에서 중복 제거"""
        if not keywords:
            return []
        
        cleaned_keywords = []
        for keyword in keywords:
            cleaned = keyword.strip()
            if cleaned and len(cleaned) > 0:
                cleaned_keywords.append(cleaned)
        
        seen = set()
        unique_keywords = []
        for keyword in cleaned_keywords:
            keyword_lower = keyword.lower()
            if keyword_lower not in seen:
                seen.add(keyword_lower)
                unique_keywords.append(keyword)
        
        return unique_keywords

# CategoryMapper 클래스는 기존과 동일
class CategoryMapper:
    """카테고리 매핑 클래스 - 벡터화 기반 유사도 매칭"""
    
    def __init__(self):
        self.category_map = {}
        self.vectorized_data = None
        self.cache_file = os.path.join(SCRIPT_DIR, 'data', 'category_vector_cache.pkl')
        self.cache_expiry_days = 7
        
    def load_category_data(self):
        """naver.xlsx 파일에서 카테고리 데이터 로드 및 벡터화"""
        try:
            if self._load_cached_data():
                logger.info("캐시된 벡터화 데이터를 사용합니다.")
                return True
            
            naver_file = os.path.join(SCRIPT_DIR, "data", "naver.xlsx")
            logger.info(f"카테고리 파일 경로: {naver_file}")
            
            if not os.path.exists(naver_file):
                logger.warning(f"naver.xlsx 파일이 없습니다: {naver_file}")
                return False
            
            df = pd.read_excel(naver_file)
            
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
            
            self.category_map = dict(zip(df['카테고리분류형식'], df['catecode']))
            self.vectorized_data = self._vectorize_categories(df)
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
            if category_format in self.category_map:
                return self.category_map[category_format], False
            
            if self.vectorized_data:
                try:
                    from sklearn.metrics.pairwise import cosine_similarity
                    
                    input_vector = self.vectorized_data['vectorizer'].transform([category_format])
                    similarities = cosine_similarity(input_vector, self.vectorized_data['vectors']).flatten()
                    
                    best_match_idx = similarities.argmax()
                    best_similarity = similarities[best_match_idx]
                    
                    if best_similarity > 0.7:
                        best_category = self.vectorized_data['categories'][best_match_idx]
                        best_code = self.vectorized_data['codes'][best_match_idx]
                        logger.info(f"유사도 매칭 성공: {category_format} → {best_category} (유사도: {best_similarity:.3f})")
                        return best_code, True
                    else:
                        logger.warning(f"유사도가 낮음: {category_format} (최고 유사도: {best_similarity:.3f})")
                        return '00000000', True
                        
                except Exception as e:
                    logger.error(f"벡터화 매칭 오류: {str(e)}")
                    return '00000000', True
            
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

def process_file(file_path: str) -> dict:
    """파일 처리 메인 함수"""
    try:
        logger.info(f"=== 키워드 조합 방식 파일 처리 시작 ===")
        logger.info(f"파일 경로: {file_path}")
        logger.info(f"현재 시간: {datetime.now().isoformat()}")
        
        # API 키 확인
        api_status = check_api_keys()
        logger.info(f"API 키 상태: {api_status}")
        
        # 프로세서 초기화 (키워드 조합 방식)
        processor = CombinedQNameProcessor(batch_size=10, max_concurrent=5, min_keywords=3, max_keywords=5)
        
        # 파일 처리
        result = processor.process_excel_file(file_path)
        
        logger.info(f"=== 파일 처리 완료 ===")
        logger.info(f"처리 결과: {result}")
        
        return result
        
    except Exception as e:
        logger.error(f"파일 처리 중 오류 발생: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'total_processed': 0,
            'success_count': 0,
            'error_count': 0
        }

if __name__ == "__main__":
    # 테스트 실행
    check_api_keys() 