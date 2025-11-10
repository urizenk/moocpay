const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Transfer = {
  // 创建转账记录
  create: async (data) => {
    const id = uuidv4();
    const now = new Date();
    
    const sql = `
      INSERT INTO transfers (
        id, displayName, actualAmount, senderName, senderAvatar, 
        message, status, accountStatus, theme, receiverOpenId, 
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      data.displayName || '100.00元',
      data.actualAmount || 0.1,
      data.senderName || '张三',
      data.senderAvatar || null,
      data.message || '',
      data.status || 'pending',
      data.accountStatus || 'available',
      data.theme || 'classic',
      data.receiverOpenId || null,
      now,
      now
    ];
    
    await query(sql, params);
    
    return {
      id,
      displayName: data.displayName || '100.00元',
      actualAmount: data.actualAmount || 0.1,
      senderName: data.senderName || '张三',
      senderAvatar: data.senderAvatar || null,
      message: data.message || '',
      status: data.status || 'pending',
      accountStatus: data.accountStatus || 'available',
      theme: data.theme || 'classic',
      receiverOpenId: data.receiverOpenId || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  },
  
  // 根据ID获取转账记录
  getById: async (id) => {
    const sql = 'SELECT * FROM transfers WHERE id = ? LIMIT 1';
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },
  
  // 更新转账记录
  update: async (id, data) => {
    const updateFields = [];
    const params = [];
    
    if (data.displayName !== undefined) {
      updateFields.push('displayName = ?');
      params.push(data.displayName);
    }
    if (data.actualAmount !== undefined) {
      updateFields.push('actualAmount = ?');
      params.push(data.actualAmount);
    }
    if (data.message !== undefined) {
      updateFields.push('message = ?');
      params.push(data.message);
    }
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    if (data.accountStatus !== undefined) {
      updateFields.push('accountStatus = ?');
      params.push(data.accountStatus);
    }
    if (data.theme !== undefined) {
      updateFields.push('theme = ?');
      params.push(data.theme);
    }
    if (data.receivedAt !== undefined) {
      updateFields.push('receivedAt = ?');
      params.push(data.receivedAt);
    }
    
    updateFields.push('updatedAt = ?');
    params.push(new Date());
    
    params.push(id);
    
    const sql = `UPDATE transfers SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);
    
    return await Transfer.getById(id);
  },
  
  // 删除转账记录
  delete: async (id) => {
    const sql = 'DELETE FROM transfers WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
  
  // 获取所有转账记录
  getAll: async () => {
    const sql = 'SELECT * FROM transfers ORDER BY createdAt DESC';
    return await query(sql);
  },
  
  // 分页获取
  getByPage: async (page = 1, size = 10) => {
    const offset = (page - 1) * size;
    const sql = 'SELECT * FROM transfers ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    const rows = await query(sql, [size, offset]);
    
    const countSql = 'SELECT COUNT(*) as total FROM transfers';
    const countResult = await query(countSql);
    const total = countResult[0].total;
    
    return {
      list: rows,
      total,
      page,
      size
    };
  }
};

module.exports = Transfer;

