const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据存储路径
const dataDir = path.join(__dirname, '../../data');
const paymentsFile = path.join(dataDir, 'payments.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取支付记录
async function readPayments() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(paymentsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 保存支付记录
async function savePayments(payments) {
  await ensureDataDir();
  await fs.writeFile(paymentsFile, JSON.stringify(payments, null, 2));
}

const Payment = {
  // 创建支付记录
  create: async (data) => {
    const payments = await readPayments();
    const newPayment = {
      id: uuidv4(),
      transferId: data.transferId,
      amount: data.amount,
      description: data.description || '微信转账',
      status: data.status || 'pending',
      orderId: data.orderId || null,
      prepayId: data.prepayId || null,
      transactionId: data.transactionId || null,
      error: data.error || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paidAt: data.paidAt || null
    };
    
    payments.push(newPayment);
    await savePayments(payments);
    
    return newPayment;
  },
  
  // 根据ID获取支付记录
  getById: async (id) => {
    const payments = await readPayments();
    return payments.find(p => p.id === id) || null;
  },
  
  // 根据订单ID获取支付记录
  getByOrderId: async (orderId) => {
    const payments = await readPayments();
    return payments.find(p => p.orderId === orderId) || null;
  },
  
  // 更新支付记录
  update: async (id, data) => {
    const payments = await readPayments();
    const index = payments.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }
    
    payments[index] = {
      ...payments[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await savePayments(payments);
    return payments[index];
  },
  
  // 删除支付记录
  delete: async (id) => {
    const payments = await readPayments();
    const index = payments.findIndex(p => p.id === id);
    
    if (index === -1) {
      return false;
    }
    
    payments.splice(index, 1);
    await savePayments(payments);
    return true;
  },
  
  // 获取所有支付记录
  getAll: async () => {
    return await readPayments();
  }
};

module.exports = Payment;