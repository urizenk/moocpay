const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Payment = {
  // 创建支付记录
  create: async (data) => {
    const id = uuidv4();
    const now = new Date();
    
    const sql = `
      INSERT INTO payments (
        id, transferId, amount, description, status, 
        orderId, prepayId, transactionId, error, 
        createdAt, updatedAt, paidAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      id,
      data.transferId,
      data.amount,
      data.description || '微信转账',
      data.status || 'pending',
      data.orderId || null,
      data.prepayId || null,
      data.transactionId || null,
      data.error || null,
      now,
      now,
      data.paidAt || null
    ];
    
    await query(sql, params);
    
    return {
      id,
      transferId: data.transferId,
      amount: data.amount,
      description: data.description || '微信转账',
      status: data.status || 'pending',
      orderId: data.orderId || null,
      prepayId: data.prepayId || null,
      transactionId: data.transactionId || null,
      error: data.error || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      paidAt: data.paidAt || null
    };
  },
  
  // 根据ID获取支付记录
  getById: async (id) => {
    const sql = 'SELECT * FROM payments WHERE id = ? LIMIT 1';
    const rows = await query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },
  
  // 根据订单ID获取支付记录
  getByOrderId: async (orderId) => {
    const sql = 'SELECT * FROM payments WHERE orderId = ? LIMIT 1';
    const rows = await query(sql, [orderId]);
    return rows.length > 0 ? rows[0] : null;
  },
  
  // 更新支付记录
  update: async (id, data) => {
    const updateFields = [];
    const params = [];
    
    if (data.status !== undefined) {
      updateFields.push('status = ?');
      params.push(data.status);
    }
    if (data.orderId !== undefined) {
      updateFields.push('orderId = ?');
      params.push(data.orderId);
    }
    if (data.prepayId !== undefined) {
      updateFields.push('prepayId = ?');
      params.push(data.prepayId);
    }
    if (data.transactionId !== undefined) {
      updateFields.push('transactionId = ?');
      params.push(data.transactionId);
    }
    if (data.error !== undefined) {
      updateFields.push('error = ?');
      params.push(data.error);
    }
    if (data.paidAt !== undefined) {
      updateFields.push('paidAt = ?');
      params.push(data.paidAt);
    }
    
    updateFields.push('updatedAt = ?');
    params.push(new Date());
    
    params.push(id);
    
    const sql = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(sql, params);
    
    return await Payment.getById(id);
  },
  
  // 删除支付记录
  delete: async (id) => {
    const sql = 'DELETE FROM payments WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  },
  
  // 获取所有支付记录
  getAll: async () => {
    const sql = 'SELECT * FROM payments ORDER BY createdAt DESC';
    return await query(sql);
  }
};

module.exports = Payment;

