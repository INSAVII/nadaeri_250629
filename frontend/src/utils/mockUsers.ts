// 실제 사용자 목록을 API에서 불러오는 함수 예시
import { User } from '../types/user';

export async function fetchUsersFromAPI(token: string): Promise<User[]> {
  const response = await fetch(`${process.env.REACT_APP_API_URL}/api/deposits/users?skip=0&limit=100`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('사용자 목록을 불러오지 못했습니다');
  return await response.json();
}

// 예치금, 권한 등 추가 API 유틸 함수도 필요시 여기에 작성
