import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SignupFormData {
  userId: string;
  password: string;
  confirmPassword: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  age: string;
  gender: string;
  workType: string;
  hasBusiness: boolean;
  businessNumber: string;
  agreePrivacy: boolean;
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    email: '',
    phone: '',
    region: '',
    age: '',
    gender: '',
    workType: '',
    hasBusiness: false,
    businessNumber: '',
    agreePrivacy: false
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // 실시간 유효성 검사
    validateField(name, type === 'checkbox' ? checked : value);
  };

  // 개별 필드 유효성 검사
  const validateField = (name: string, value: any) => {
    const errors = { ...validationErrors };

    switch (name) {
      case 'userId':
        if (!value) {
          errors.userId = 'ID는 필수항목입니다.';
        } else if (!/^[a-zA-Z0-9_]{4,20}$/.test(value)) {
          errors.userId = 'ID는 영문, 숫자, 언더스코어 4-20자여야 합니다.';
        } else {
          delete errors.userId;
        }
        break;

      case 'password':
        if (!value) {
          errors.password = '비밀번호는 필수항목입니다.';
        } else if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{5,}$/.test(value)) {
          errors.password = '비밀번호는 영문, 숫자, 특수문자 조합 5자 이상이어야 합니다.';
        } else {
          delete errors.password;
        }
        break;

      case 'confirmPassword':
        if (value !== formData.password) {
          errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
        } else {
          delete errors.confirmPassword;
        }
        break;

      case 'name':
        if (!value) {
          errors.name = '이름은 필수항목입니다.';
        } else if (!/^[가-힣a-zA-Z\s]{2,20}$/.test(value)) {
          errors.name = '이름은 한글 또는 영문 2-20자여야 합니다.';
        } else {
          delete errors.name;
        }
        break;

      case 'email':
        if (!value) {
          errors.email = '이메일은 필수항목입니다.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = '유효한 이메일 형식이 아닙니다.';
        } else {
          delete errors.email;
        }
        break;

      case 'phone':
        if (!value) {
          errors.phone = '휴대전화번호는 필수항목입니다.';
        } else if (!/^01[0-9]{8,9}$/.test(value)) {
          errors.phone = '휴대전화번호는 숫자만 10~11자리로 입력하세요.';
        } else {
          delete errors.phone;
        }
        break;

      case 'age':
        if (value && (isNaN(Number(value)) || Number(value) < 14)) {
          errors.age = '나이는 14세 이상의 숫자여야 합니다.';
        } else {
          delete errors.age;
        }
        break;

      case 'businessNumber':
        if (formData.hasBusiness && value && !/^\d{3}-\d{2}-\d{5}$/.test(value)) {
          errors.businessNumber = '사업자번호는 000-00-00000 형식이어야 합니다.';
        } else {
          delete errors.businessNumber;
        }
        break;

      case 'agreePrivacy':
        if (!value) {
          errors.agreePrivacy = '개인정보처리동의는 필수항목입니다.';
        } else {
          delete errors.agreePrivacy;
        }
        break;
    }

    setValidationErrors(errors);
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 모든 필수 필드 검증
    const requiredFields = ['userId', 'password', 'name', 'email', 'phone', 'agreePrivacy'];
    let hasErrors = false;

    requiredFields.forEach(field => {
      if (!formData[field as keyof SignupFormData]) {
        validateField(field, '');
        hasErrors = true;
      }
    });

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: '비밀번호가 일치하지 않습니다.'
      }));
      hasErrors = true;
    }

    if (hasErrors || Object.keys(validationErrors).length > 0) {
      setError('입력 정보를 확인해주세요.');
      return;
    }

    try {
      const success = await signup(formData);
      if (success) {
        navigate('/login', {
          state: {
            message: `🎉 회원가입이 완료되었습니다!
            
🎁 신규 가입 혜택이 자동으로 지급되었습니다:
• 예치금 10,000원
• 무료 프로그램 다운로드 권한

로그인 후 바로 서비스를 이용하실 수 있습니다.`
          }
        });
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    }
  };
  return (
    <div className="qc-container py-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-center text-gray-800">회원가입</h1>

        {/* 🎁 신규 가입 혜택 안내 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-2xl mr-2">🎁</span>
            <h2 className="text-lg font-semibold text-blue-800">신규 가입 혜택</h2>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>예치금 10,000원</strong> 자동 지급</p>
            <p>• <strong>무료 프로그램 다운로드 권한</strong> 즉시 부여</p>
            <p>• 가입 즉시 모든 서비스 이용 가능</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border rounded-lg p-8 shadow-sm bg-white">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* ID (필수) */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">
                ID <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="영문, 숫자, 언더스코어 4-20자"
                  required
                />
                {validationErrors.userId && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.userId}</p>
                )}
              </div>
            </div>

            {/* 비밀번호 (필수) */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="영문, 숫자, 특수문자 조합 5자 이상"
                  required
                />
                {validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.password}</p>
                )}
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">비밀번호 확인</label>
              <div className="flex-1">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* 이름 (필수) */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="실명을 입력하세요"
                  required
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.name}</p>
                )}
              </div>
            </div>

            {/* 이메일 (필수) */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                  required
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.email}</p>
                )}
              </div>
            </div>

            {/* 휴대전화번호 (필수) */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">
                휴대전화 <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01012345678"
                  required
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* 거주지역 */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">거주지역</label>
              <div className="flex-1">
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">선택하세요</option>
                  <option value="서울특별시">서울특별시</option>
                  <option value="부산광역시">부산광역시</option>
                  <option value="대구광역시">대구광역시</option>
                  <option value="인천광역시">인천광역시</option>
                  <option value="광주광역시">광주광역시</option>
                  <option value="대전광역시">대전광역시</option>
                  <option value="울산광역시">울산광역시</option>
                  <option value="세종특별자치시">세종특별자치시</option>
                  <option value="경기도">경기도</option>
                  <option value="강원도">강원도</option>
                  <option value="충청북도">충청북도</option>
                  <option value="충청남도">충청남도</option>
                  <option value="전라북도">전라북도</option>
                  <option value="전라남도">전라남도</option>
                  <option value="경상북도">경상북도</option>
                  <option value="경상남도">경상남도</option>
                  <option value="제주특별자치도">제주특별자치도</option>
                </select>
              </div>
            </div>

            {/* 나이 */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">나이</label>
              <div className="flex-1">
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="14세 이상"
                  min="14"
                  max="100"
                />
                {validationErrors.age && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.age}</p>
                )}
              </div>
            </div>

            {/* 성별 */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">성별</label>
              <div className="flex-1 flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">남성</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">여성</span>
                </label>
              </div>
            </div>

            {/* 사업자등록번호 */}
            <div className="flex items-center">
              <label className="w-28 text-sm font-medium text-gray-700 text-right mr-4">사업자등록번호</label>
              <div className="flex-1">
                <input
                  type="text"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000-00-00000"
                />
                {validationErrors.businessNumber && (
                  <p className="text-red-500 text-xs mt-1 font-medium">{validationErrors.businessNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* 개인정보처리동의 */}
          <div className="mt-8 flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="agreePrivacy"
                checked={formData.agreePrivacy}
                onChange={(e) => setFormData({
                  ...formData,
                  agreePrivacy: e.target.checked
                })}
                className="mr-3"
                required
              />
              <span className="text-sm font-medium text-gray-700">
                <span className="text-red-500">*</span> 개인정보처리방침에 동의합니다
              </span>
            </label>
            {validationErrors.agreePrivacy && (
              <p className="text-red-500 text-xs ml-3 font-medium">{validationErrors.agreePrivacy}</p>
            )}
          </div>

          {/* 비밀번호 조건 안내 */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 font-medium">
              <span className="text-red-500">*</span> 비밀번호는 영문, 숫자, 특수문자 조합 5자 이상이어야 합니다.
            </p>
          </div>

          {/* 제출 버튼 */}
          <div className="mt-8 text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-lg px-20 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
