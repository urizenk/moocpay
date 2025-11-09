/**
 * 微信转账多主题配置
 * 基于微信官方设计规范
 */

export const THEMES = {
  // 1. 经典转账主题（橙黄色 - 微信默认转账样式）
  classic: {
    id: 'classic',
    name: '经典转账',
    icon: '💰',
    description: '微信默认转账样式，橙黄色主题',
    colors: {
      primary: '#ff7243',
      primaryLight: '#ff9e5f',
      gradient: 'linear-gradient(135deg, #ff9e5f 0%, #ff7243 100%)',
      shadow: '0 4px 12px rgba(255, 114, 67, 0.25)',
      iconBg: 'linear-gradient(135deg, #ff9e5f 0%, #ff7243 100%)',
      text: '#000000',
      textSecondary: '#888888',
      bg: '#f5f5f5',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '8px',
      cardRadius: '12px',
      iconSize: '20px'
    }
  },

  // 2. 红包主题（红色 - 喜庆热闹）
  redpacket: {
    id: 'redpacket',
    name: '红包样式',
    icon: '🧧',
    description: '喜庆红包样式，适合节日和庆祝',
    colors: {
      primary: '#f43f3b',
      primaryLight: '#ff6b6b',
      gradient: 'linear-gradient(135deg, #ff6b6b 0%, #f43f3b 100%)',
      shadow: '0 4px 12px rgba(244, 63, 59, 0.3)',
      iconBg: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
      text: '#8b4513',
      textSecondary: '#c07850',
      bg: '#fee',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '25px', // 更圆润的按钮
      cardRadius: '16px',
      iconSize: '24px',
      pattern: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L25 15L40 20L25 25L20 40L15 25L0 20L15 15Z\' fill=\'%23ffe0e0\' opacity=\'0.3\'/%3E%3C/svg%3E")' // 祥云图案
    }
  },

  // 3. 企业转账主题（蓝色 - 商务专业）
  business: {
    id: 'business',
    name: '企业转账',
    icon: '🏢',
    description: '蓝色商务风格，适合企业使用',
    colors: {
      primary: '#2b7bd6',
      primaryLight: '#4a9ff5',
      gradient: 'linear-gradient(135deg, #4a9ff5 0%, #2b7bd6 100%)',
      shadow: '0 4px 12px rgba(43, 123, 214, 0.25)',
      iconBg: 'linear-gradient(135deg, #4a9ff5 0%, #2b7bd6 100%)',
      text: '#000000',
      textSecondary: '#666666',
      bg: '#f7f8fa',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '6px', // 更方正的按钮
      cardRadius: '10px',
      iconSize: '20px'
    }
  },

  // 4. 收款码主题（绿色 - 微信支付绿）
  payment: {
    id: 'payment',
    name: '收款码',
    icon: '💚',
    description: '微信支付绿色，清新专业',
    colors: {
      primary: '#07c160',
      primaryLight: '#2aae67',
      gradient: 'linear-gradient(135deg, #2aae67 0%, #07c160 100%)',
      shadow: '0 4px 12px rgba(7, 193, 96, 0.25)',
      iconBg: 'linear-gradient(135deg, #2aae67 0%, #07c160 100%)',
      text: '#000000',
      textSecondary: '#888888',
      bg: '#f5f5f5',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '8px',
      cardRadius: '12px',
      iconSize: '20px'
    }
  },

  // 5. 零钱通主题（紫色 - 理财专属）
  wallet: {
    id: 'wallet',
    name: '零钱通',
    icon: '💜',
    description: '紫色理财风格，优雅高级',
    colors: {
      primary: '#9b59b6',
      primaryLight: '#b987d4',
      gradient: 'linear-gradient(135deg, #b987d4 0%, #9b59b6 100%)',
      shadow: '0 4px 12px rgba(155, 89, 182, 0.25)',
      iconBg: 'linear-gradient(135deg, #b987d4 0%, #9b59b6 100%)',
      text: '#000000',
      textSecondary: '#888888',
      bg: '#faf9fc',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '10px',
      cardRadius: '14px',
      iconSize: '20px'
    }
  },

  // 6. 活动奖励主题（金色 - 高端奢华）
  reward: {
    id: 'reward',
    name: '活动奖励',
    icon: '🎁',
    description: '金色奖励样式，尊贵感满满',
    colors: {
      primary: '#d4a574',
      primaryLight: '#e6c79c',
      gradient: 'linear-gradient(135deg, #e6c79c 0%, #d4a574 100%)',
      shadow: '0 4px 12px rgba(212, 165, 116, 0.3)',
      iconBg: 'linear-gradient(135deg, #ffd700 0%, #d4a574 100%)',
      text: '#5c4a2f',
      textSecondary: '#8b7355',
      bg: '#fff8f0',
      cardBg: '#ffffff'
    },
    styles: {
      buttonRadius: '12px',
      cardRadius: '16px',
      iconSize: '22px'
    }
  }
};

/**
 * 获取主题配置
 * @param {string} themeId 主题ID
 * @returns {Object} 主题配置
 */
export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.classic;
}

/**
 * 获取所有主题列表
 * @returns {Array} 主题列表
 */
export function getAllThemes() {
  return Object.values(THEMES);
}

/**
 * 应用主题到元素
 * @param {HTMLElement} element DOM元素
 * @param {string} themeId 主题ID
 */
export function applyTheme(element, themeId) {
  const theme = getTheme(themeId);
  
  if (!element) return;
  
  // 设置CSS变量
  element.style.setProperty('--theme-primary', theme.colors.primary);
  element.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
  element.style.setProperty('--theme-gradient', theme.colors.gradient);
  element.style.setProperty('--theme-shadow', theme.colors.shadow);
  element.style.setProperty('--theme-icon-bg', theme.colors.iconBg);
  element.style.setProperty('--theme-text', theme.colors.text);
  element.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
  element.style.setProperty('--theme-bg', theme.colors.bg);
  element.style.setProperty('--theme-card-bg', theme.colors.cardBg);
  
  element.style.setProperty('--theme-button-radius', theme.styles.buttonRadius);
  element.style.setProperty('--theme-card-radius', theme.styles.cardRadius);
  element.style.setProperty('--theme-icon-size', theme.styles.iconSize);
  
  // 添加主题类名
  element.setAttribute('data-theme', themeId);
}

export default {
  THEMES,
  getTheme,
  getAllThemes,
  applyTheme
};

