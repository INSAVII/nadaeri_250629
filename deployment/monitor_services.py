import requests
import time
import json
from datetime import datetime
import smtplib
from email.mime.text import MIMEText

class ServiceMonitor:
    """배포된 서비스 모니터링"""
    
    def __init__(self):
        self.services = {
            "main-api": "https://qclick-main-api.railway.app/health",
            "qname-service": "https://qclick-qname.onrender.com/health",
            "qtext-service": "https://qclick-qtext.railway.app/health"
        }
        
        self.frontend = "https://qclick-app.vercel.app"
        self.timeout = 10
        
    def check_service_health(self, service_name, url):
        """개별 서비스 헬스 체크"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=self.timeout)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "response_time": round(response_time, 2),
                    "status_code": response.status_code
                }
            else:
                return {
                    "status": "unhealthy",
                    "response_time": round(response_time, 2),
                    "status_code": response.status_code,
                    "error": f"HTTP {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "status": "timeout",
                "response_time": self.timeout * 1000,
                "error": "Request timeout"
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "connection_error",
                "error": "Connection failed"
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
    
    def check_all_services(self):
        """모든 서비스 헬스 체크"""
        results = {}
        timestamp = datetime.now().isoformat()
        
        print(f"🔍 서비스 모니터링 시작: {timestamp}")
        print("=" * 50)
        
        for service_name, url in self.services.items():
            print(f"📡 {service_name} 체크 중...")
            result = self.check_service_health(service_name, url)
            results[service_name] = result
            
            if result["status"] == "healthy":
                print(f"✅ {service_name}: 정상 ({result['response_time']}ms)")
            else:
                print(f"❌ {service_name}: 문제 - {result.get('error', 'Unknown error')}")
        
        # 프론트엔드 체크
        print(f"📡 프론트엔드 체크 중...")
        frontend_result = self.check_service_health("frontend", self.frontend)
        results["frontend"] = frontend_result
        
        if frontend_result["status"] == "healthy":
            print(f"✅ 프론트엔드: 정상 ({frontend_result['response_time']}ms)")
        else:
            print(f"❌ 프론트엔드: 문제 - {frontend_result.get('error', 'Unknown error')}")
        
        print("=" * 50)
        
        # 결과 요약
        healthy_count = sum(1 for r in results.values() if r["status"] == "healthy")
        total_count = len(results)
        
        print(f"📊 요약: {healthy_count}/{total_count} 서비스 정상")
        
        if healthy_count < total_count:
            print("⚠️  일부 서비스에 문제가 있습니다!")
            self.send_alert(results)
        else:
            print("🎉 모든 서비스가 정상 작동 중입니다!")
        
        return results
    
    def send_alert(self, results):
        """알림 전송 (이메일 등)"""
        # 실제 구현에서는 이메일, Slack, Discord 등으로 알림
        print("📧 알림 전송 기능은 별도 구현 필요")
        
        # 로그 파일에 저장
        with open(f"monitoring_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    
    def continuous_monitoring(self, interval_minutes=5):
        """연속 모니터링"""
        print(f"🔄 연속 모니터링 시작 (간격: {interval_minutes}분)")
        
        try:
            while True:
                self.check_all_services()
                print(f"⏰ {interval_minutes}분 후 다시 체크합니다...")
                time.sleep(interval_minutes * 60)
                
        except KeyboardInterrupt:
            print("\n🛑 모니터링 중단됨")

if __name__ == "__main__":
    monitor = ServiceMonitor()
    
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "continuous":
        # 연속 모니터링
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        monitor.continuous_monitoring(interval)
    else:
        # 1회 체크
        monitor.check_all_services() 