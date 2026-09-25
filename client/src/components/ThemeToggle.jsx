import { useTheme } from '../context/ThemeContext';
import { IconMoon, IconSun } from './icons';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={toggleTheme}
      title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      aria-label="Đổi chế độ sáng/tối"
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </button>
  );
}
