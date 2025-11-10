# 🔍 服务器数据持久化问题排查

## 立即在服务器执行以下命令

### 第一步：检查数据目录

```bash
# 进入项目目录
cd /var/www/moocpay/moocpay/backend

# 检查data目录是否存在
ls -la

# 检查data目录内容
ls -la data/

# 如果data目录不存在，创建它
mkdir -p data
chmod 755 data
```

### 第二步：检查JSON文件

```bash
# 检查transfers.json是否存在
cat data/transfers.json

# 如果文件不存在或为空，创建它
echo "[]" > data/transfers.json
chmod 644 data/transfers.json

# 检查payments.json
echo "[]" > data/payments.json
chmod 644 data/payments.json
```

### 第三步：使用修复脚本（推荐）

```bash
cd /var/www/moocpay/moocpay

# 给脚本执行权限
chmod +x scripts/fix-data-permissions.sh

# 运行修复脚本
./scripts/fix-data-permissions.sh
```

### 第四步：重启服务并测试

```bash
# 重启服务
pm2 restart moocpay

# 查看日志
pm2 logs moocpay --lines 50

# 测试创建转账
# 1. 访问网站创建转账
# 2. 检查文件是否有内容
cat /var/www/moocpay/moocpay/backend/data/transfers.json

# 应该看到JSON数据，不是空的[]
```

---

## 🔍 问题排查

### 问题1：文件不存在

**症状：** 创建转账后没有保存

**检查：**
```bash
ls -la /var/www/moocpay/moocpay/backend/data/
```

**如果看不到transfers.json：**
```bash
# 手动创建
echo "[]" > /var/www/moocpay/moocpay/backend/data/transfers.json
```

### 问题2：权限不足

**症状：** 有文件但无法写入

**检查：**
```bash
ls -la /var/www/moocpay/moocpay/backend/data/transfers.json
```

**如果权限是 -rw-r--r-- root root：**
```bash
# 修改权限
chmod 666 /var/www/moocpay/moocpay/backend/data/transfers.json
# 或
chown $(whoami):$(whoami) /var/www/moocpay/moocpay/backend/data/transfers.json
```

### 问题3：Node.js进程没有写权限

**检查PM2运行用户：**
```bash
pm2 list
```

**如果是root用户运行，修改data目录所有者：**
```bash
chown -R root:root /var/www/moocpay/moocpay/backend/data
chmod -R 755 /var/www/moocpay/moocpay/backend/data
```

---

## 🎯 快速修复（一键执行）

```bash
cd /var/www/moocpay/moocpay/backend && \
mkdir -p data && \
echo "[]" > data/transfers.json && \
echo "[]" > data/payments.json && \
chmod -R 777 data && \
pm2 restart moocpay && \
echo "修复完成！现在测试创建转账..."
```

---

## ✅ 验证修复成功

创建一条转账后，执行：

```bash
cat /var/www/moocpay/moocpay/backend/data/transfers.json
```

**应该看到类似：**
```json
[
  {
    "id": "xxx-xxx-xxx",
    "displayName": "9999.00元",
    "actualAmount": 0.01,
    "senderName": "张三",
    "status": "pending",
    "theme": "classic",
    "createdAt": "2025-11-10T07:44:00.000Z",
    "updatedAt": "2025-11-10T07:44:00.000Z"
  }
]
```

**如果看到这个，说明持久化成功！** ✅

---

## 📝 常见问题

**Q: 为什么每次都是空的？**
A: 通常是权限问题，Node.js无法写入文件

**Q: 怎么看日志？**
A: `pm2 logs moocpay` 会显示保存失败的错误

**Q: 可以改用数据库吗？**
A: 可以，但先解决文件权限问题更快

---

**请立即在服务器执行"快速修复"命令！**

```bash
cd /var/www/moocpay/moocpay/backend && \
mkdir -p data && \
echo "[]" > data/transfers.json && \
echo "[]" > data/payments.json && \
chmod -R 777 data && \
pm2 restart moocpay && \
cat data/transfers.json
```

执行后应该看到 `[]`，然后创建转账测试！🚀

