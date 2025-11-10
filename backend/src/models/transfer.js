const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Transfer {
  // 初始化表
  static async initTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(36) PRIMARY KEY,
        displayName VARCHAR(100) NOT NULL,
        actualAmount DECIMAL(10, 2) NOT NULL,
        senderName VARCHAR(100) NOT NULL,
        senderAvatar VARCHAR(500),
        message TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        accountStatus VARCHAR(20) DEFAULT 'available',
        theme VARCHAR(50) DEFAULT 'classic',
        receiverOpenId VARCHAR(100),
        paymentId VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        receivedAt TIMESTAMP NULL,
        INDEX idx_status (status),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    try {
      await db.query(createTableSQL);
      console.log('✅ transfers表初始化成功');
    } catch (error) {
      console.error('❌ transfers表初始化失败:', error);
      throw error;
    }
  }

  // 创建转账记录
  static async create(data) {
    const id = uuidv4();
    const {
      displayName,
      actualAmount,
      senderName,
      senderAvatar = '/default-avatar.png',
      message = '',
      status = 'pending',
      accountStatus = 'available',
      theme = 'classic',
      receiverOpenId = null
    } = data;

    const sql = `
      INSERT INTO transfers 
      (id, displayName, actualAmount, senderName, senderAvatar, message, status, accountStatus, theme, receiverOpenId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      await db.query(sql, [
        id,
        displayName,
        actualAmount,
        senderName,
        senderAvatar,
        message,
        status,
        accountStatus,
        theme,
        receiverOpenId
      ]);

      return await this.getById(id);
    } catch (error) {
      console.error('创建转账记录失败:', error);
      throw error;
    }
  }

  // 根据ID获取转账记录
  static async getById(id) {
    const sql = 'SELECT * FROM transfers WHERE id = ?';
    
    try {
      const rows = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('获取转账记录失败:', error);
      throw error;
    }
  }

  // 更新转账记录
  static async update(id, data) {
    const allowedFields = [
      'displayName',
      'actualAmount',
      'message',
      'status',
      'accountStatus',
      'theme',
      'receiverOpenId',
      'paymentId',
      'receivedAt'
    ];

    const updates = [];
    const values = [];

    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (updates.length === 0) {
      return await this.getById(id);
    }

    values.push(id);
    const sql = `UPDATE transfers SET ${updates.join(', ')} WHERE id = ?`;

    try {
      await db.query(sql, values);
      return await this.getById(id);
    } catch (error) {
      console.error('更新转账记录失败:', error);
      throw error;
    }
  }

  // 获取所有转账记录
  static async getAll() {
    const sql = 'SELECT * FROM transfers ORDER BY createdAt DESC';
    
    try {
      const rows = await db.query(sql);
      return rows;
    } catch (error) {
      console.error('获取所有转账记录失败:', error);
      throw error;
    }
  }

  // 删除转账记录
  static async delete(id) {
    const sql = 'DELETE FROM transfers WHERE id = ?';
    
    try {
      const result = await db.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('删除转账记录失败:', error);
      throw error;
    }
  }
}

module.exports = Transfer;
