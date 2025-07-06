import requests
import json
import os
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        # 카카오 비즈니스 채널 설정
        self.kakao_access_token = os.getenv("KAKAO_ACCESS_TOKEN", "")
        self.kakao_template_id = os.getenv("KAKAO_TEMPLATE_ID", "")
        self.kakao_sender_key = os.getenv("KAKAO_SENDER_KEY", "")
        
        # SMS 발송 활성화 여부
        self.sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
        
        if not self.sms_enabled:
            logger.info("카카오 알림톡 서비스가 비활성화되어 있습니다. (SMS_ENABLED=false)")
    
    def send_kakao_alimtalk(self, to_number: str, template_data: dict) -> bool:
        """카카오 알림톡 발송"""
        if not self.sms_enabled:
            logger.info(f"카카오 알림톡 발송 (비활성화): {to_number} - {str(template_data)[:50]}...")
            return True
        
        try:
            # 카카오 비즈니스 API 호출
            url = "https://kakaoapi.aligo.in/akv10/alimtalk/send/"
            
            headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "apikey": self.kakao_access_token,
                "userid": "your_user_id",  # 카카오 비즈니스 사용자 ID
                "token": self.kakao_access_token,
                "senderkey": self.kakao_sender_key,
                "tpl_code": self.kakao_template_id,
                "sender": "010-5904-2213",  # 발신번호
                "receiver_1": to_number.replace("-", ""),
                "subject_1": "나대리que 입금 신청",
                "message_1": json.dumps(template_data, ensure_ascii=False),
                "testMode": "N"  # Y: 테스트, N: 실제 발송
            }
            
            response = requests.post(url, headers=headers, data=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("result_code") == "1":
                    logger.info(f"카카오 알림톡 발송 성공: {to_number}")
                    return True
                else:
                    logger.error(f"카카오 알림톡 발송 실패: {result}")
                    return False
            else:
                logger.error(f"카카오 알림톡 API 호출 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"카카오 알림톡 발송 중 오류: {e}")
            return False
    
    def _create_template_data(self, template_type: str, **kwargs) -> dict:
        """카카오 알림톡 템플릿 데이터 생성"""
        if template_type == "admin_notification":
            return {
                "user_name": kwargs.get("user_name", ""),
                "user_id": kwargs.get("user_id", ""),
                "depositor_name": kwargs.get("depositor_name", ""),
                "amount": f"{kwargs.get('amount', 0):,}원",
                "phone_number": kwargs.get("phone_number", ""),
                "note": kwargs.get("note", "없음"),
                "request_time": kwargs.get("request_time", "")
            }
        elif template_type == "user_confirmation":
            return {
                "user_name": kwargs.get("user_name", ""),
                "depositor_name": kwargs.get("depositor_name", ""),
                "amount": f"{kwargs.get('amount', 0):,}원",
                "account_number": kwargs.get("account_number", "[계좌번호]"),
                "deadline": "24시간 이내",
                "contact": "010-5904-2213"
            }
        else:
            return {}
    
    def send_bank_transfer_notification(self, 
                                      user_name: str, 
                                      user_id: str, 
                                      depositor_name: str, 
                                      amount: int, 
                                      phone_number: str,
                                      note: str = "") -> dict:
        """무통장 입금 신청 알림 카카오 알림톡 발송"""
        
        request_time = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        results = {
            "admin_sent": False,
            "user_sent": False,
            "admin_phone": "010-5904-2213",  # 관리자 전화번호
            "user_phone": phone_number
        }
        
        # 관리자에게 알림톡 발송
        admin_template_data = self._create_template_data(
            "admin_notification",
            user_name=user_name,
            user_id=user_id,
            depositor_name=depositor_name,
            amount=amount,
            phone_number=phone_number,
            note=note,
            request_time=request_time
        )
        
        if self.send_kakao_alimtalk(results["admin_phone"], admin_template_data):
            results["admin_sent"] = True
            logger.info(f"관리자 카카오 알림톡 발송 성공: {results['admin_phone']}")
        
        # 입금자에게 알림톡 발송
        user_template_data = self._create_template_data(
            "user_confirmation",
            user_name=user_name,
            depositor_name=depositor_name,
            amount=amount,
            account_number="[계좌번호]",
            deadline="24시간 이내",
            contact="010-5904-2213"
        )
        
        if self.send_kakao_alimtalk(results["user_phone"], user_template_data):
            results["user_sent"] = True
            logger.info(f"입금자 카카오 알림톡 발송 성공: {results['user_phone']}")
        
        return results

# 전역 SMS 서비스 인스턴스
sms_service = SMSService() 