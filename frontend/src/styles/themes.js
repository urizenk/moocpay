/**
 * 微信转账多主题配置
 */

export const THEMES = {
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

  redpacket: {
    id: 'redpacket',
    name: '红包样式',
    icon: '🧧',
    description: '喜庆红包样式',
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
      buttonRadius: '25px',
      cardRadius: '16px',
      iconSize: '24px'
    }
  },

  business: {
    id: 'business',
    name: '企业转账',
    icon: '🏢',
    description: '蓝色商务风格',
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
      buttonRadius: '6px',
      cardRadius: '10px',
      iconSize: '20px'
    }
  },

  payment: {
    id: 'payment',
    name: '收款码',
    icon: '💚',
    description: '微信支付绿色',
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

  wallet: {
    id: 'wallet',
    name: '零钱通',
    icon: '💜',
    description: '紫色理财风格',
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

  reward: {
    id: 'reward',
    name: '活动奖励',
    icon: '🎁',
    description: '金色奖励样式',
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

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.classic;
}

export function getAllThemes() {
  return Object.values(THEMES);
}

export default {
  THEMES,
  getTheme,
  getAllThemes
};

