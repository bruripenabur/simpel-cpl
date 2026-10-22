import React, { useState } from 'react';

interface UnpattiLogoProps {
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

export const UnpattiLogo: React.FC<UnpattiLogoProps> = ({
  className = 'w-10 h-10',
  size,
  style,
}) => {
  const [imageError, setImageError] = useState(false);

  const customStyle: React.CSSProperties = {
    ...style,
    ...(size ? { width: size, height: size } : {}),
  };

  if (!imageError) {
    return (
      <img
        src="/logo_unpatti.png"
        alt="Logo Universitas Pattimura (UNPATTI)"
        className={`object-contain ${className}`}
        style={customStyle}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      style={customStyle}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo Universitas Pattimura (UNPATTI)"
    >
      <defs>
        <linearGradient id="unpattiGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>

        <linearGradient id="unpattiBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="60%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="unpattiFlame" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="45%" stopColor="#EA580C" />
          <stop offset="85%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>
      </defs>

      {/* Outer Pentagon Shield */}
      <polygon
        points="100,6 190,70 156,182 44,182 10,70"
        fill="url(#unpattiGold)"
        stroke="#996515"
        strokeWidth="2.5"
      />
      <polygon points="100,12 184,72 152,176 48,176 16,72" fill="#FFFFFF" />
      <polygon points="100,16 180,74 149,172 51,172 20,74" fill="url(#unpattiBlue)" />
      {/* Star */}
      <polygon
        points="100,22 104,33 116,33 106,40 110,51 100,44 90,51 94,40 84,33 96,33"
        fill="url(#unpattiGold)"
      />
      {/* Parang & Salawaku */}
      <path
        d="M60,140 Q85,100 135,68 Q140,65 142,67 Q140,73 130,82 Q85,115 68,144 Z"
        fill="#E2E8F0"
        stroke="#475569"
        strokeWidth="1.2"
      />
      <path
        d="M135,138 C144,115 130,95 125,78 C120,95 106,115 115,138 C120,132 130,132 135,138 Z"
        fill="#334155"
        stroke="url(#unpattiGold)"
        strokeWidth="1.5"
      />
      {/* Torch */}
      <path d="M96,145 L104,145 L102,112 L98,112 Z" fill="url(#unpattiGold)" />
      <path
        d="M100,56 C106,70 114,80 110,95 C107,104 100,108 97,108 C93,108 88,103 89,94 C90,83 96,72 100,56 Z"
        fill="url(#unpattiFlame)"
      />
      {/* Banner */}
      <path
        d="M26,182 L50,172 L150,172 L174,182 L158,198 L100,192 L42,198 Z"
        fill="url(#unpattiGold)"
        stroke="#854D0E"
        strokeWidth="1.2"
      />
      <text
        x="100"
        y="186"
        textAnchor="middle"
        fill="#1E293B"
        fontSize="9"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        UNIVERSITAS PATTIMURA
      </text>
    </svg>
  );
};
