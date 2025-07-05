import os
import pandas as pd
import requests
import random
from datetime import datetime, timedelta
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
import google.generativeai as genai
import re
import time

# .env 파일 로드
load_dotenv()

# 환경 변수에서 API 키 가져오기
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
NAVER_CLIENT_ID = os.getenv('NAVER_CLIENT_ID')
NAVER_CLIENT_SECRET = os.getenv('NAVER_CLIENT_SECRET')

# API 키 확인 함수
def check_api_keys():
    """API 키 설정 확인"""
    if not GEMINI_API_KEY:
        print("Gemini API 키가 설정되지 않았습니다.")
        print(".env 파일에 GEMINI_API_KEY를 입력해주세요.")
        return False
    
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        print("네이버 API 키가 설정되지 않았습니다.")
        print(".env 파일에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 입력해주세요.")
        return False
    
    return True

class CategoryMapper:
    def __init__(self):
        self.category_map = {}
        self.vectorized_data = None
        self.cache_file = 'category_vector_cache.pkl'
        self.cache_expiry_days = 7  # 캐시 유효 기간 (일)
        
    def load_category_data(self, excel_path):
        """엑셀 파일에서 카테고리 데이터 로드 및 벡터화 (캐시 활용)"""
        try:
            # 캐시된 벡터화 데이터 확인
            if self._load_cached_data():
                print("캐시된 벡터화 데이터를 사용합니다.")
                return True
            
            # 엑셀 파일에서 데이터 읽기
            df = pd.read_excel(excel_path)
            
            # '카테고리분류형식' 열을 직접 생성
            df['카테고리분류형식'] = df.apply(
                lambda row: '>'.join(
                    [str(row['1차분류']), str(row['2차분류']), str(row['3차분류']), str(row['4차분류'])]
                    if not pd.isnull(row['4차분류']) else
                    [str(row['1차분류']), str(row['2차분류']), str(row['3차분류'])]
                ),
                axis=1
            )
            
            # 카테고리 매핑 딕셔너리 생성
            self.category_map = dict(zip(df['카테고리분류형식'], df['catecode']))
            
            # 벡터화 수행
            self.vectorized_data = self._vectorize_categories(df)
            
            # 벡터화된 데이터 캐시 저장
            self._save_cached_data()
            
            return True
            
        except Exception as e:
            print(f"카테고리 데이터 로드 오류: {str(e)}")
            return False

    def _vectorize_categories(self, df):
        """카테고리 데이터 벡터화"""
        vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 3))
        vectors = vectorizer.fit_transform(df['카테고리분류형식'])
        
        return {
            'vectors': vectors,
            'vectorizer': vectorizer,
            'categories': df['카테고리분류형식'].tolist(),
            'codes': df['catecode'].tolist(),
            'last_updated': datetime.now()
        }

    def _save_cached_data(self):
        """벡터화된 데이터를 파일로 저장"""
        try:
            cache_data = {
                'category_map': self.category_map,
                'vectorized_data': self.vectorized_data,
                'timestamp': datetime.now()
            }
            
            with open(self.cache_file, 'wb') as f:
                pickle.dump(cache_data, f)
            
            print("벡터화된 데이터가 캐시에 저장되었습니다.")
            
        except Exception as e:
            print(f"캐시 저장 오류: {str(e)}")

    def _load_cached_data(self):
        """캐시된 벡터화 데이터 로드"""
        try:
            if not os.path.exists(self.cache_file):
                return False
            
            # 캐시 파일의 수정 시간 확인
            cache_time = datetime.fromtimestamp(os.path.getmtime(self.cache_file))
            if datetime.now() - cache_time > timedelta(days=self.cache_expiry_days):
                print("캐시가 만료되었습니다. 새로운 데이터를 로드합니다.")
                return False
            
            with open(self.cache_file, 'rb') as f:
                cache_data = pickle.load(f)
            
            self.category_map = cache_data['category_map']
            self.vectorized_data = cache_data['vectorized_data']
            
            return True
            
        except Exception as e:
            print(f"캐시 로드 오류: {str(e)}")
            return False

    def find_matching_category(self, category_format):
        """카테고리 분류형식에 매칭되는 코드 찾기"""
        try:
            # 정확한 매칭 시도
            if category_format in self.category_map:
                return self.category_map[category_format]
            
            # 벡터화된 데이터를 사용한 유사도 매칭
            if self.vectorized_data:
                input_vector = self.vectorized_data['vectorizer'].transform([category_format])
                similarities = cosine_similarity(input_vector, self.vectorized_data['vectors'])
                
                most_similar_idx = similarities.argmax()
                if similarities[0][most_similar_idx] > 0.8:
                    return self.vectorized_data['codes'][most_similar_idx]
            
            return None
            
        except Exception as e:
            print(f"카테고리 매칭 오류: {str(e)}")
            return None

class ProductNameProcessor:
    def __init__(self):
        self.NAVER_API_URL = "https://openapi.naver.com/v1/search/shop.json"
        self.NAVER_CLIENT_ID = NAVER_CLIENT_ID
        self.NAVER_CLIENT_SECRET = NAVER_CLIENT_SECRET
        self.category_mapper = CategoryMapper()
        
        # Gemini API 설정
        self.GEMINI_API_KEY = GEMINI_API_KEY
        genai.configure(api_key=self.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('models/gemini-1.5-pro-latest')

    def read_excel_file(self, file_path):
        """엑셀 파일 읽기"""
        try:
            return pd.read_excel(file_path)
        except Exception as e:
            print(f"엑셀 파일 읽기 오류: {str(e)}")
            return None

    def get_naver_category(self, keyword):
        """네이버 쇼핑 API를 통해 카테고리 정보 가져오기"""
        headers = {
            "X-Naver-Client-Id": self.NAVER_CLIENT_ID,
            "X-Naver-Client-Secret": self.NAVER_CLIENT_SECRET
        }
        params = {
            "query": keyword,
            "display": 1
        }
        try:
            response = requests.get(self.NAVER_API_URL, headers=headers, params=params)
            if response.status_code == 401:
                print("인증 실패: Client ID 또는 Client Secret이 잘못되었습니다.")
            elif response.status_code == 403:
                print("권한 없음: 해당 API에 대한 접근 권한이 없습니다.")
            return response.json()
        except Exception as e:
            print(f"네이버 API 호출 오류: {str(e)}")
            return None

    def extract_category_format(self, category_info):
        """카테고리 형식 추출 및 core keyword 반환"""
        try:
            # items가 있는지 확인
            items = category_info.get('items', [])
            if not items or not isinstance(items, list):
                return None, None
            item = items[0]
            categories = []
            for i in range(1, 5):
                category = item.get(f'category{i}')
                if category:
                    categories.append(category)
            category_format = '>'.join(categories)
            core_keyword = categories[-1] if categories else None
            return category_format, core_keyword
        except Exception as e:
            print(f"카테고리 형식 추출 오류: {str(e)}")
            return None, None

    def select_best_prefix_word(self, category_format, core_keyword, keyword):
        """
        카테분류형식, core keyword, 메인키워드를 참조하여
        상품명 앞에 붙일 가장 적합한 용도/특성/종류 단어를 선택한다.
        """
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

    def trim_product_name(self, product_name, min_len=25, max_len=35):
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

    def clean_product_name(self, product_name):
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

    def generate_product_name(self, keyword, category_info):
        try:
            category_format, core_keyword = self.extract_category_format(category_info)
            if not core_keyword:
                return None

            # 1. prefix(조합단어+core keyword) 추천을 LLM이 하도록 프롬프트 구성
            prefix_prompt = (
                f"아래 정보를 참고하여 상품명 앞부분에 들어갈 가장 적합한 조합형 단어(용도, 적용, 특성, 종류 등과 core keyword의 조합)를 추천해 주세요. "
                f"실제 상품의 용도와 상황에 맞고, 혼동을 유발하지 않으며, 중복 없이 한글로만 추천해 주세요. "
                f"예시: core keyword가 '세탁솔'이고 메인키워드에 '빨래'가 있으면 '빨래세탁솔', '욕실'이 있으면 '욕실세탁솔', '홈세트'와 '도자기'가 있으면 '도자기홈세트' 등. "
                f"카테분류형식: {category_format}\nCore keyword: {core_keyword}\n메인키워드: {keyword}\n"
                f"추천 prefix(띄어쓰기 없이 한 단어로):"
            )
            prefix_response = self.model.generate_content(prefix_prompt)
            prefix = prefix_response.text.strip().split()[0]  # 첫 번째 단어만 사용

            # 2. 상품명 전체 프롬프트에서 prefix를 고정
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

            response = self.model.generate_content(prompt)
            product_name = response.text.strip()
            # prefix가 두 번 반복되면 한 번만 남기기
            if product_name.count(prefix) > 1:
                first = product_name.find(prefix)
                product_name = prefix + product_name[first+len(prefix):]
            if not product_name.startswith(prefix):
                product_name = f"{prefix} {product_name}"
            product_name = self.trim_product_name(product_name, min_len=25, max_len=35)
            if len(product_name) < 25:
                print(f"경고: 생성된 상품명이 25자 미만입니다. ({product_name})")
            return product_name
        except Exception as e:
            print(f"상품명 생성 오류: {str(e)}")
            return None

    def get_related_keywords(self, keyword, core_keyword):
        """Gemini API를 사용하여 연관 검색어 추출"""
        try:
            # Gemini에 전달할 프롬프트 생성
            prompt = f"""
            다음 상품에 대한 네이버 쇼핑 태그 20개를 생성해주세요:
            메인키워드: {keyword}
            Core keyword: {core_keyword}

            다음 규칙을 따라주세요:
            1. 브랜드 표현 단어 사용금지
            2. 영어발음 표현한글 사용금지
            3. 상품명에 포함된 단독 단어 재사용금지
            4. 목적,기능,대상,편의성,사이즈,디자인 요소,소재 및 구조 강조
            5. 특정사용자그룹,사용자환경,종류 중요성 포함
            6. 검색량이 높은 순서로 배치
            7. 콤마로 구분하여 20개만 반환

            형식: 태그1,태그2,태그3,...
            """

            # Gemini API 호출
            response = self.model.generate_content(prompt)
            
            # 응답에서 태그 추출
            tags = response.text.strip().split(',')
            
            # 20개로 제한
            return tags[:20]

        except Exception as e:
            print(f"Gemini API 호출 오류: {str(e)}")
            # 오류 발생 시 기본 태그 반환
            return [
                f"{core_keyword} 텀블러", "보온 보냉 텀블러", "대용량 텀블러",
                "손잡이 텀블러", "커피 텀블러", "아이스 텀블러", "캠핑 텀블러",
                "휴대용 텀블러", "선물용 텀블러", "보온병", "회사 텀블러",
                "차량용 텀블러", "빨대 텀블러", "미니 텀블러", "국산 텀블러",
                "예쁜 텀블러", "스텐 텀블러", "이중 텀블러", "보냉 텀블러",
                "보온 텀블러"
            ]

    def process_file(self, input_excel_path, naver_excel_path):
        """파일 처리 메인 함수"""
        try:
            if not self.category_mapper.load_category_data(naver_excel_path):
                print("카테고리 매핑 데이터 로드 실패")
                return
            df = self.read_excel_file(input_excel_path)
            if df is None:
                return
            for index, row in df.iterrows():
                keyword = row['메인키워드']
                print(f"\n[처리 중] 메인키워드: {keyword}")
                category_info = self.get_naver_category(keyword)
                print("네이버 API 응답:", category_info)
                if category_info is None:
                    continue
                category_format, core_keyword = self.extract_category_format(category_info)
                print("카테고리분류형식:", category_format, "core_keyword:", core_keyword)
                if not category_format or not core_keyword:
                    continue
                category_code = self.category_mapper.find_matching_category(category_format)
                print("매칭된 navercode:", category_code)
                product_name = self.generate_product_name(keyword, category_info)
                product_name = self.clean_product_name(product_name)  # 후처리 적용
                print("생성된 상품명:", product_name)
                related_keywords = self.get_related_keywords(keyword, core_keyword)
                print("연관검색어:", related_keywords)
                naver_tags = random.sample(related_keywords, 10)
                df.at[index, 'NAVERCODE'] = category_code
                df.at[index, '카테분류형식'] = category_format
                df.at[index, 'SEO상품명'] = product_name
                df.at[index, '연관검색어'] = ','.join(related_keywords)
                df.at[index, '네이버태그'] = ','.join(naver_tags)
                if category_code and product_name:
                    df.at[index, '가공결과'] = '완료'
                else:
                    df.at[index, '가공결과'] = '오류'
                print(f"[완료] {keyword}")
                time.sleep(0.2)  # 0.2초 대기
            input_columns = list(pd.read_excel(input_excel_path).columns)
            new_columns = ['NAVERCODE', '카테분류형식', 'SEO상품명', '연관검색어', '네이버태그', '가공결과']
            cols = input_columns + [col for col in new_columns if col not in input_columns]
            df = df[cols]
            output_path = f"output_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            df.to_excel(output_path, index=False)
            print(f"처리가 완료되었습니다. 결과가 저장되었습니다: {output_path}")
        except Exception as e:
            print(f"처리 중 오류 발생: {str(e)}")

def main():
    # API 키 확인
    if not check_api_keys():
        return
        
    # 설정값
    INPUT_EXCEL_PATH = "input.xlsx"  # 입력 엑셀 파일
    NAVER_EXCEL_PATH = "naver.xlsx"  # 카테고리 매핑 엑셀 파일
    
    # 프로세서 인스턴스 생성
    processor = ProductNameProcessor()
    
    # 파일 처리 실행
    processor.process_file(INPUT_EXCEL_PATH, NAVER_EXCEL_PATH)

if __name__ == "__main__":
    main()