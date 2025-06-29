from google.cloud import vision
import cv2
import numpy as np
from dotenv import load_dotenv
import os
import io
import zipfile
from typing import List, Tuple
from google.api_core.exceptions import GoogleAPIError
import re
import tempfile
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()
import tempfile
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

def safe_filename(filename):
    """파일명에서 특수문자와 한글을 제거하고 안전한 파일명으로 변환"""
    name, ext = os.path.splitext(filename)
    # 한글, 특수문자를 영문과 숫자로 변환
    safe_name = re.sub(r'[^a-zA-Z0-9\-_]', '_', name)
    # 연속된 언더스코어를 하나로 줄임
    safe_name = re.sub(r'_+', '_', safe_name)
    # 앞뒤 언더스코어 제거
    safe_name = safe_name.strip('_')
    # 빈 이름인 경우 기본값 설정
    if not safe_name:
        safe_name = 'image'
    return safe_name + ext

def detect_text_regions_vision(image_bytes: bytes) -> List[np.ndarray]:
    """Google Vision API를 사용하여 이미지에서 텍스트 영역을 감지"""
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.text_detection(image=image)
        
        if response.error.message:
            logger.error(f"Vision API Error: {response.error.message}")
            return []
            
        logger.info(f"Vision API 응답 처리 중...")
        
        boxes = []
        for text in response.text_annotations[1:]:
            desc = text.description.strip()
            # 한글/영문/숫자/기호/특수문자 모두 포함
            if desc:  # 빈 문자열 제외
                vertices = text.bounding_poly.vertices
                box = np.array([[v.x, v.y] for v in vertices], dtype=np.int32)
                boxes.append(box)
        
        logger.info(f"인식된 텍스트 박스 개수: {len(boxes)}")
        return boxes
        
    except GoogleAPIError as e:
        logger.error(f"Google Cloud Vision API Error: {e}")
        return []
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return []

def expand_box(box: np.ndarray, image_shape: Tuple[int, int, int], expand_px: int = 0) -> np.ndarray:
    """텍스트 박스를 확장"""
    x_min = max(box[:,0].min() - expand_px, 0)
    x_max = min(box[:,0].max() + expand_px, image_shape[1]-1)
    y_min = max(box[:,1].min() - expand_px, 0)
    y_max = min(box[:,1].max() + expand_px, image_shape[0]-1)
    return np.array([[x_min, y_min], [x_max, y_min], [x_max, y_max], [x_min, y_max]], dtype=np.int32)

def inpaint_text_regions(image: np.ndarray, text_regions: List[np.ndarray], expand_px: int = 0) -> Tuple[np.ndarray, np.ndarray]:
    """텍스트 영역을 인페인팅으로 제거"""
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    for box in text_regions:
        expanded = expand_box(box, image.shape, expand_px)
        cv2.fillPoly(mask, [expanded], 255)
    
    # 인페인팅 적용
    result = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
    return result, mask

def process_single_image(image_bytes: bytes, filename: str) -> Tuple[bytes, bool]:
    """단일 이미지에서 텍스트를 제거하고 처리된 이미지 바이트를 반환"""
    try:
        # 바이트를 numpy 배열로 변환
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error(f"이미지 디코딩 실패: {filename}")
            return image_bytes, False
            
        logger.info(f"이미지 처리 시작: {filename}, 크기: {image.shape}")
        
        # 텍스트 영역 감지
        boxes = detect_text_regions_vision(image_bytes)
        
        if boxes:
            logger.info(f"텍스트 영역 {len(boxes)}개 감지됨")
            # 인페인팅 적용
            processed_image, mask = inpaint_text_regions(image, boxes)
            
            # 처리된 이미지를 바이트로 인코딩
            safe_name = safe_filename(filename)
            _, ext = os.path.splitext(safe_name)
            if not ext:
                ext = '.jpg'
            
            success, encoded_img = cv2.imencode(ext, processed_image)
            if success:
                logger.info(f"텍스트 제거 완료: {filename}")
                return encoded_img.tobytes(), True
            else:
                logger.error(f"이미지 인코딩 실패: {filename}")
                return image_bytes, False
        else:
            logger.info(f"텍스트가 감지되지 않음: {filename} (원본 유지)")
            return image_bytes, True
            
    except Exception as e:
        logger.error(f"이미지 처리 중 오류 발생 {filename}: {e}")
        return image_bytes, False

async def process_images_batch(image_files: List[Tuple[bytes, str]], user_info: dict = None) -> bytes:
    """여러 이미지를 처리하고 ZIP 파일로 반환"""
    try:
        # 임시 ZIP 파일 생성
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            processed_count = 0
            error_count = 0
            
            for image_bytes, filename in image_files:
                try:
                    processed_bytes, success = process_single_image(image_bytes, filename)
                    
                    if success:
                        # 원본 파일명을 안전하게 변환하여 ZIP에 추가 (접두사 없이)
                        safe_name = safe_filename(filename)
                        zip_file.writestr(safe_name, processed_bytes)
                        processed_count += 1
                        logger.info(f"ZIP에 추가됨: {safe_name}")
                    else:
                        error_count += 1
                        logger.error(f"처리 실패: {filename}")
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"파일 처리 중 오류 {filename}: {e}")
                    continue
            
            # 처리 결과 요약을 텍스트 파일로 추가
            user_name = user_info.get('name', '사용자') if user_info else '사용자'
            user_id = user_info.get('id', 'unknown') if user_info else 'unknown'
            
            summary = f"""Image Text Removal Processing Result
========================
Total Files: {len(image_files)}
Success: {processed_count}
Failed: {error_count}
Completed: {np.datetime64('now')}

서비스이용자=이름/{user_name}/id={user_id}
"""
            zip_file.writestr("processing_result.txt", summary.encode('utf-8'))
        
        zip_buffer.seek(0)
        logger.info(f"ZIP 파일 생성 완료: {processed_count}개 파일 처리됨")
        return zip_buffer.getvalue()
        
    except Exception as e:
        logger.error(f"배치 처리 중 오류 발생: {e}")
        raise

def validate_image_file(content: bytes, filename: str) -> bool:
    """이미지 파일 유효성 검사"""
    try:
        # 지원되는 확장자 확인
        supported_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff')
        if not filename.lower().endswith(supported_extensions):
            return False
            
        # 이미지 디코딩 테스트
        nparr = np.frombuffer(content, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return image is not None
        
    except Exception:
        return False

# Google Cloud 인증 확인 함수
def check_google_credentials():
    """Google Cloud 인증 설정 확인"""
    if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
        logger.error("GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다.")
        return False
    
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not os.path.exists(credentials_path):
        logger.error(f"Google Cloud 서비스 계정 키 파일이 존재하지 않습니다: {credentials_path}")
        return False
        
    logger.info("Google Cloud 인증 설정 확인 완료")
    return True
