import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

// Иконка ленты (сетка)
export const FeedIcon = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Rect x="3" y="3" width="7" height="7" />
    <Rect x="14" y="3" width="7" height="7" />
    <Rect x="14" y="14" width="7" height="7" />
    <Rect x="3" y="14" width="7" height="7" />
  </Svg>
);

// Иконка профиля (человек)
export const ProfileIcon = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// Иконка плюс (добавить)
export const PlusIcon = ({ width = 28, height = 28, color = 'white', strokeWidth = 2.5 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

// Иконка подтверждения (щит с галочкой)
export const VerifyIcon = ({ width = 18, height = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Polyline points="9 12 11 14 15 10" />
  </Svg>
);

// Иконка fake (круг с крестом)
export const FakeIcon = ({ width = 18, height = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="15" y1="9" x2="9" y2="15" />
    <Line x1="9" y1="9" x2="15" y2="15" />
  </Svg>
);

// Иконка меню (три точки)
export const MenuIcon = ({ width = 18, height = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="12" cy="12" r="1" />
    <Circle cx="12" cy="5" r="1" />
    <Circle cx="12" cy="19" r="1" />
  </Svg>
);

// Иконка таймера (часы)
export const TimerIcon = ({ width = 16, height = 16, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

// Иконка звезды (рейтинг)
export const StarIcon = ({ width = 20, height = 20, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
);

// Иконка настроек (шестерёнка)
export const SettingsIcon = ({ width = 22, height = 22, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Иконка назад (стрелка)
export const BackIcon = ({ width = 24, height = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </Svg>
);

// Иконка уведомлений (колокольчик)
export const BellIcon = ({ width = 22, height = 22, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);

// Иконка одной галочки (для активной цели)
export const CheckIcon = ({ width = 20, height = 20, color = '#10b981', strokeWidth = 2.5 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Иконка двойной галочки (для выполненной цели) - с увеличенным расстоянием
export const DoubleCheckIcon = ({ width = 20, height = 20, color = '#10b981', strokeWidth = 2.5 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Polyline points="16 6 5 17 1 13" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="23 6 12 17" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Иконка крестика (для проваленной цели)
export const XIcon = ({ width = 20, height = 20, color = '#ef4444', strokeWidth = 2.5 }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
    <Line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
