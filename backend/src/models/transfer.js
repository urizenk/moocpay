const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 数据存储路径
const dataDir = path.join(__dirname, '../../data');
const transfersFile = path.join(dataDir, 'transfers.json');

// 确保数据目录存在
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 读取转账记录
async function readTransfers() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(transfersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 保存转账记录
async function saveTransfers(transfers) {
  await ensureDataDir();
  await fs.writeFile(transfersFile, JSON.stringify(transfers, null, 2));
}

const Transfer = {
  // 创建转账记录
  create: async (data) => {
    const transfers = await readTransfers();
    const newTransfer = {
      id: uuidv4(),
      displayName: data.displayName || '100.00元',
      actualAmount: data.actualAmount || 0.1,
      senderName: data.senderName || '张三',
      senderAvatar: data.senderAvatar || 'https://via.placeholder.com/50x50?text=张三',
      message: data.message || '恭喜发财，大吉大利',
      status: data.status || 'pending', // pending: 待收款, received: 已收款, expired: 已过期
      accountStatus: data.accountStatus || 'available', // available: 可用, frozen: 冻结
      theme: data.theme || 'classic', // classic: 经典转账, redpacket: 红包, business: 企业, payment: 收款码, wallet: 零钱通, reward: 活动奖励
      receiverOpenId: data.receiverOpenId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    transfers.push(newTransfer);
    await saveTransfers(transfers);

    return newTransfer;
  },

  // 根据ID获取转账记录
  getById: async (id) => {
    const transfers = await readTransfers();
    return transfers.find(t => t.id === id) || null;
  },

  // 更新转账记录
  update: async (id, data) => {
    const transfers = await readTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
      return null;
    }

    transfers[index] = {
      ...transfers[index],
      ...data,
      updatedAt: new Date().toISOString()
    };

    await saveTransfers(transfers);
    return transfers[index];
  },

  // 删除转账记录
  delete: async (id) => {
    const transfers = await readTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
      return false;
    }

    transfers.splice(index, 1);
    await saveTransfers(transfers);
    return true;
  },

  // 获取所有转账记录
  getAll: async () => {
    return await readTransfers();
  }
};

module.exports = Transfer;