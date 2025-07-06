import requests
import json
import os
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        # 네이버 클라우드 SENS 설정
        self.service_id = os.getenv("NAVER_SENS_SERVICE_ID", "")
        self.access_key = os.getenv("NAVER_SENS_ACCESS_KEY", "")
        self.secret_key = os.getenv("NAVER_SENS_SECRET_KEY", "")
        self.from_number = os.getenv("NAVER_SENS_FROM_NUMBER", "")
        
        # SMS 발송 활성화 여부
        self.sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"
        
        if not self.sms_enabled:
            logger.info("SMS 서비스가 비활성화되어 있습니다. (SMS_ENABLED=false)")
    
    def send_sms(self, to_number: str, message: str) -> bool:
        """SMS 발송"""
        if not self.sms_enabled:
            logger.info(f"SMS 발송 (비활성화): {to_number} - {message[:50]}...")
            return True
        
        try:
            # 네이버 클라우드 SENS API 호출
            url = f"https://sens.apigw.ntruss.com/sms/v2/services/{self.service_id}/messages"
            
            headers = {
                "Content-Type": "application/json; charset=utf-8",
                "x-ncp-apigw-timestamp": str(int(datetime.now().timestamp() * 1000)),
                "x-ncp-iam-access-key": self.access_key,
                "x-ncp-apigw-signature-v2": self._generate_signature()
            }
            
            data = {
                "type": "SMS",
                "contentType": "COMM",
                "countryCode": "82",
                "from": self.from_number,
                "content": message,
                "messages": [
                    {
                        "to": to_number.replace("-", "")
                    }
                ]
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 202:
                logger.info(f"SMS 발송 성공: {to_number}")
                return True
            else:
                logger.error(f"SMS 발송 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"SMS 발송 중 오류: {e}")
            return False
    
    def _generate_signature(self) -> str:
        """네이버 클라우드 API 서명 생성"""
        import hmac
        import hashlib
        
        timestamp = str(int(datetime.now().timestamp() * 1000))
        space = " "
        new_line = "\n"
        method = "POST"
        url = f"/sms/v2/services/{self.service_id}/messages"
        
        message = method + space + url + new_line + timestamp + new_line + self.access_key
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        return signature.hex()
    
    def send_bank_transfer_notification(self, 
                                      user_name: str, 
                                      user_id: str, 
                                      depositor_name: str, 
                                      amount: int, 
                                      phone_number: str,
                                      note: str = "") -> dict:
        """무통장 입금 신청 알림 SMS 발송"""
        
        # 관리자에게 발송할 메시지
        admin_message = f"""[나대리que] 무통장 입금 신청
사용자: {user_name}({user_id})
입금자: {depositor_name}
금액: {amount:,}원
연락처: {phone_number}
메모: {note or '없음'}
신청시간: {datetime.now().strftime('%Y-%m-%d %H:%M')}"""
        
        # 입금자에게 발송할 메시지
        user_message = f"""[나대리que] 입금 신청 완료
{user_name}님의 입금 신청이 접수되었습니다.

입금자명: {depositor_name}
신청금액: {amount:,}원
입금계좌: [계좌번호]
입금기한: 24시간 이내

입금 후 관리자 확인 시 예치금이 충전됩니다.
문의: 010-5904-2213"""
        
        results = {
            "admin_sent": False,
            "user_sent": False,
            "admin_phone": "010-5904-2213",  # 관리자 전화번호
            "user_phone": phone_number
        }
        
        # 관리자에게 SMS 발송
        if self.send_sms(results["admin_phone"], admin_message):
            results["admin_sent"] = True
            logger.info(f"관리자 SMS 발송 성공: {results['admin_phone']}")
        
        # 입금자에게 SMS 발송
        if self.send_sms(results["user_phone"], user_message):
            results["user_sent"] = True
            logger.info(f"입금자 SMS 발송 성공: {results['user_phone']}")
        
        return results

# 전역 SMS 서비스 인스턴스
sms_service = SMSService() 