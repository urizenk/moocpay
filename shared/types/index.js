// 微信转账相关类型定义

export interface TransferRecord {
  id: string;
  displayName: string; // 显示金额
  actualAmount: number; // 实际转账金额，固定为0.1元
  senderName: string; // 发送者姓名
  senderAvatar: string; // 发送者头像
  message: string; // 转账留言
  createTime: Date; // 创建时间
  receiveTime?: Date; // 收款时间
  status: 'pending' | 'received' | 'expired'; // 状态：待收款、已收款、已过期
  paymentId?: string; // 微信支付订单ID
}

export interface PaymentRequest {
  transferId: string;
  amount: number; // 固定为0.1元
  openid: string; // 微信用户openid
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  message?: string;
  prepayId?: string; // 微信预支付ID
  paySign?: string; // 支付签名
  timeStamp?: string; // 时间戳
  nonceStr?: string; // 随机字符串
  signType?: string; // 签名类型
}

export interface AdminSettings {
  defaultDisplayName: string; // 默认显示金额
  defaultSenderName: string; // 默认发送者姓名
  defaultMessage: string; // 默认转账留言
  expirationHours: number; // 转账过期时间（小时）
}