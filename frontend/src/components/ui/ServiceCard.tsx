import React from 'react';
import { Link } from 'react-router-dom';
import ServiceIcon from './ServiceIcon';

interface ServiceCardProps {
  title: string;
  description: string;
  type: 'qcapture' | 'qtext' | 'qname';
  path: string;
  colorClass?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  type,
  path,
  colorClass = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
}) => {  return (
    <Link to={path} className="block relative">
      {/* 박스 바깥 위에 위치하는 아이콘 */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -top-10 z-10">
        <ServiceIcon type={type} size="2xl" className="drop-shadow-md" />
      </div>
      
      <div className={`
        mt-10 p-6 pt-10 border rounded-lg transition-all duration-200 
        bg-white hover:shadow-sm cursor-pointer font-light text-center
        ${colorClass}
      `}>
        {/* 제목 */}
        <h3 className="text-lg font-light text-gray-800 mt-2">{title}</h3>
        
        {/* 설명 */}
        <p className="text-sm font-light text-gray-600 leading-relaxed mb-4 line-clamp-3">
          {description}
        </p>
        
        {/* 액션 힌트 */}
        <div className="text-sm font-light text-blue-600">
          바로가기 →
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
