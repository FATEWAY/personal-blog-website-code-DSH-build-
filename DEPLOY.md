# fateway.cn 迁移部署包

这个目录是一个**可直接迁移到新服务器**的快照，包含源码、SQLite 数据库、上传图片、生产环境模板和部署配置。

> 生成时间：2026-10-24（Asia/Shanghai）
> 数据库：`data/fateway.db`，完整性检查通过，已清除登录会话
> 管理员账户：`user`（密码是交付时随机生成的新密码，不包含在迁移包内）
> 当前数据：4 篇文章、3 个项目、2 张照片墙图片、1 个管理员

## 目录内容

```text
fateway-deploy/
├─ src/                       应用源码
├─ migrations/                SQL 迁移（0001–0003，已全部应用）
├─ scripts/                   管理员初始化、迁移、备份、重置脚本
├─ seed/                      示例内容（数据库已包含，部署时不要执行 seed）
├─ public/                    静态资源
├─ docs/                      截图
├─ tests/ e2e/                测试与端到端验证（运行时可忽略）
├─ package.json / package-lock.json
├─ next.config.ts
├─ data/fateway.db            数据库快照（含文章、项目、照片墙、设置、管理员）
├─ storage/uploads/           上传的图片（头像、照片墙）
├─ server.js                  宝塔 PM2 / Node 项目启动入口
├─ .env.production.example    生产环境变量模板
├─ deploy/
│  ├─ nginx.conf.example
│  ├─ fateway-blog.service
│  └─ backup.sh
├─ MANIFEST.txt
├─ checksums.sha256
└─ DEPLOY.md                  本文件
```

**不包含**：`node_modules`、`.next`、`.env.local`、测试截图缓存。新服务器需要重新安装依赖并构建。

> 迁移包里有个人资料、照片和管理员密码哈希，请通过 SSH/SCP 传输并妥善保管，不要上传到公开仓库或网盘。

---

## 1. 服务器准备（Ubuntu 24.04）

建议 Node.js 22 LTS（最低 20.9），使用独立系统用户运行。

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx sqlite3 curl

# Node.js 22（NodeSource 示例）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

sudo useradd --system --create-home --shell /bin/bash fateway
```

如果使用 nvm 安装 Node，请把 systemd 里的 `ExecStart` 改成实际的 npm 绝对路径（`which npm`）。生产环境不建议依赖交互式 nvm 环境。

---

## 2. 上传迁移包

从 Windows PowerShell（需要 OpenSSH 客户端）：

```powershell
scp -r ".\fateway-deploy" fateway@YOUR_SERVER_IP:/srv/fateway-deploy
```

或者先打包再上传：

```powershell
scp ".\fateway-deploy-2026-10-23.tar.gz" fateway@YOUR_SERVER_IP:/srv/
```

服务器上：

```bash
sudo mv /srv/fateway-deploy /srv/fateway-blog
sudo chown -R fateway:fateway /srv/fateway-blog
cd /srv/fateway-blog

# 若上传的是压缩包：
# sudo tar -xzf /srv/fateway-deploy-2026-10-23.tar.gz -C /srv
# sudo mv /srv/fateway-deploy /srv/fateway-blog
```

文件的校验值在 `checksums.sha256`，可在服务器上执行：

```bash
cd /srv/fateway-blog
sha256sum -c checksums.sha256
```

---

## 3. 配置生产环境

```bash
cd /srv/fateway-blog
sudo -u fateway cp .env.production.example .env.production
sudo -u fateway nano .env.production
sudo chmod 600 .env.production
```

至少确认：

```ini
NODE_ENV=production
SITE_URL=https://fateway.cn
ADMIN_PATH=/admin
DATABASE_PATH=./data/fateway.db
UPLOAD_DIR=./storage/uploads
TRUST_PROXY=true
```

`ADMIN_PATH` 会写入构建后的路由配置，修改后必须重新执行 `npm run build`。

---

## 4. 安装依赖、迁移与构建

以 `fateway` 用户执行。先安装**包含 devDependencies** 的依赖，再加载生产环境变量：

```bash
sudo -u fateway bash
cd /srv/fateway-blog

npm ci --include=dev

set -a
source .env.production
set +a

npm run db:migrate
npm run build
```

`npm run build` 这一步才会生成 `.next` 生产构建产物。`next start` 和 `server.js` 只负责启动，**不会自动构建**。

> 注意：不要先 `export NODE_ENV=production` 再直接 `npm ci`，npm 可能省略 devDependencies（TypeScript、Tailwind 等），导致 `next build` 失败。使用 `npm ci --include=dev`，或先安装再加载环境变量。

构建完成后确认：

```bash
ls -la .next/BUILD_ID
```

这个文件存在，才说明生产构建产物已生成。

预期迁移输出：已是最新状态（数据库快照中已包含 0001–0003）。

如果 `better-sqlite3` 或 `sharp` 安装失败：

```bash
sudo apt install -y build-essential python3
npm rebuild better-sqlite3 sharp
```

> npm 11 可能提示 `install scripts not yet covered by allowScripts`。迁移包的 `package.json`
> 已经包含 `allowScripts` 白名单；如果仍然出现，在项目目录执行：
>
> ```bash
> npm install-scripts approve better-sqlite3 esbuild sharp unrs-resolver
> npm rebuild better-sqlite3 esbuild sharp unrs-resolver
> ```

**不要执行** `npm run db:seed` 或 `npm run db:reset`——数据库已经包含真实内容，reset 会清空它。seed 在已有文章时会跳过，但也没有必要。

设置权限：

```bash
exit
sudo chmod 600 /srv/fateway-blog/data/fateway.db
sudo chmod 700 /srv/fateway-blog/storage/uploads
sudo find /srv/fateway-blog/storage/uploads -type d -exec chmod 750 {} \;
sudo find /srv/fateway-blog/storage/uploads -type f -exec chmod 640 {} \;
```

---

## 5. 先手动试运行

```bash
sudo -u fateway bash -lc 'cd /srv/fateway-blog && set -a && source .env.production && set +a && npm start'
```

另开一个终端：

```bash
curl -I http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/api/health
```

健康检查应返回 `{"status":"ok","database":"ok",...}`。确认后按 `Ctrl+C` 停止，再配置 systemd。

---

## 6. systemd

```bash
sudo cp /srv/fateway-blog/deploy/fateway-blog.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now fateway-blog
sudo systemctl status fateway-blog --no-pager
sudo journalctl -u fateway-blog -f
```

如果 npm 路径不是 `/usr/bin/npm`，先修改 service 中的 `ExecStart`。

---

## 7. Nginx 与 HTTPS

```bash
sudo cp /srv/fateway-blog/deploy/nginx.conf.example /etc/nginx/sites-available/fateway.cn
sudo ln -s /etc/nginx/sites-available/fateway.cn /etc/nginx/sites-enabled/fateway.cn
sudo nginx -t
sudo systemctl reload nginx
```

先把域名 `fateway.cn` / `www.fateway.cn` 的 DNS A/AAAA 记录指向服务器，然后申请证书：

```bash
sudo certbot --nginx -d fateway.cn -d www.fateway.cn
sudo certbot renew --dry-run
```

Certbot 会自动把 80 端口配置改成跳转 HTTPS，并生成证书。完成后：

```bash
curl -I https://fateway.cn/
```

浏览器打开 `https://fateway.cn` 应显示锁形图标。`SITE_URL` 必须是 `https://...`，否则 canonical、Open Graph 和 Cookie 行为会不正确。

---

## 8. 上线后验证

```bash
curl -I https://fateway.cn/
curl -s https://fateway.cn/api/health
curl -s https://fateway.cn/sitemap.xml | head
curl -s https://fateway.cn/rss.xml | head
```

浏览器检查：

1. 首页、关于、项目、照片墙、博客、联系均能打开
2. `/admin` 跳转到登录页
3. 使用 `fateway` + 你本地设置的密码登录
4. 后台仪表盘、文章列表、照片墙正常
5. 上传一张图片，确认 `/media/...` 能显示
6. HTTPS 锁形图标正常

如果登录成功但刷新后掉线，检查 HTTPS、`SITE_URL`、Cookie 的 `Secure` 属性与系统时间。

---

## 9. 管理员账户

- 账户已包含在数据库里：用户名 `user`
- 密码是交付时随机生成的新密码（不在迁移包中）
- 登录后建议立即在「账户安全」中修改密码
- 如果忘记密码，在服务器上重置：

```bash
sudo -u fateway bash -lc 'cd /srv/fateway-blog && npm run admin:create -- --force --username user'
```

重置会注销全部旧会话。

---

## 10. 备份

```bash
sudo chmod +x /srv/fateway-blog/deploy/backup.sh
sudo -u fateway APP_DIR=/srv/fateway-blog /srv/fateway-blog/deploy/backup.sh
```

建议每天 cron 执行，并把 `storage/backups` 复制到另一台机器或对象存储：

```cron
30 3 * * * fateway APP_DIR=/srv/fateway-blog /srv/fateway-blog/deploy/backup.sh >> /var/log/fateway-backup.log 2>&1
```

恢复流程：

1. 停止 systemd 服务
2. 用备份的 `.db` 替换 `data/fateway.db`
3. 解压对应的 uploads 备份到 `storage/uploads`
4. 修正属主与权限
5. 启动服务，检查 `/api/health`

---

## 11. 后续更新代码

```bash
# 先在本地/新版本完成构建验证
sudo -u fateway bash
cd /srv/fateway-blog
set -a; source .env.production; set +a

# 备份
npm run db:backup

# 替换 src、migrations、package.json、package-lock.json、next.config.ts 等源码
# 不要覆盖 data/、storage/uploads/、.env.production
npm ci --include=dev
npm run db:migrate
npm run build
exit
sudo systemctl restart fateway-blog
```

修改了 `ADMIN_PATH`、`SITE_URL` 后也必须重新构建。不要同时运行 `npm run dev` 和 systemd 服务，SQLite 写入和 `.next` 目录会互相干扰。

---

## 12. 安全清单

- [x] 数据库与上传目录不在 `public/`，通过受控路由读取
- [x] 密码 scrypt 哈希；会话 token 只存 SHA-256
- [x] Cookie HttpOnly、SameSite=Lax，生产 HTTPS 自动 Secure
- [x] 管理 API 服务端鉴权 + CSRF
- [x] 登录失败限流
- [x] Markdown XSS 净化
- [x] 上传魔数校验 + 服务端重编码 WebP
- [x] 安全响应头（CSP、X-Frame-Options、HSTS 等）
- [ ] 部署后仍需你完成：域名解析、HTTPS、管理员密码轮换、备份到异地
- 不要把 `.env.production`、数据库、上传目录提交到 Git 或公开网盘
- 建议用 `ufw` 只开放 SSH/80/443，3000 端口只监听本机：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 13. 常见问题

| 现象 | 排查 |
| --- | --- |
| 502 Bad Gateway | `systemctl status fateway-blog`、`journalctl -u fateway-blog`，确认 3000 端口进程存在 |
| 登录后立刻退出 | `SITE_URL` 是否 https；Nginx 是否传 `X-Forwarded-Proto`；Cookie Secure；服务器时间 |
| 上传 413 | Nginx `client_max_body_size` 与 `MAX_UPLOAD_MB` 是否匹配 |
| 图片不显示 | `storage/uploads` 权限、`UPLOAD_DIR` 路径、`/media/*` 路由 |
| better-sqlite3 报错 | Node 版本是否 ≥20.9；`npm rebuild better-sqlite3`；安装 build-essential |
| 后台 404 | 用构建时的 `ADMIN_PATH` 访问；修改后是否重新 build |
| 页面样式缺失 | 是否完成了 `npm run build`，是否用 `npm start` 而不是直接打开源码 |
| 数据库 locked | 不要同时运行 dev 与 systemd；只允许一个应用实例写 SQLite |
| canonical 仍是 localhost | 构建时是否加载了正确的 `.env.production` |

---

## 14. 迁移包校验

```bash
cd /srv/fateway-blog
sha256sum -c checksums.sha256
sqlite3 data/fateway.db 'PRAGMA integrity_check;'
sqlite3 data/fateway.db 'SELECT COUNT(*) FROM posts; SELECT COUNT(*) FROM gallery_items;'
```

预期数据库完整性为 `ok`；文章 4 篇、照片墙 2 张（以生成时快照为准）。

---

## 15. 宝塔面板（PM2）启动

迁移包根目录已经包含 `server.js`，可直接作为宝塔“Node 项目 / PM2 项目”的启动文件。

表单建议：

| 字段 | 值 |
| --- | --- |
| 项目名称 | `fateway` |
| Node 版本 | 24 LTS（如 `v24.21.0`） |
| 启动文件 | `/www/wwwroot/fateway/server.js` |
| 运行目录 | `/www/wwwroot/fateway` |
| 负载实例数量 | `1` |
| 内存上限 | `512` MB（不够再调大） |
| 自动重载 | 关闭 |
| 包管理器 | `npm` |
| 不安装 node_module | 已执行 `npm ci --include=dev` 和 `npm run build` 后勾选 |

`server.js` 会做这些事：

1. 加载项目根目录的 `.env.production`
2. 把 `DATABASE_PATH` 解析为**项目目录下的绝对路径**
3. 检查数据库文件存在、可读、可写，以及数据库目录可写
4. 用当前 Node 启动 `next start`
5. 在 PM2 日志中打印实际使用的数据库路径

### 这种启动方式数据库能正常读取吗

可以。SQLite 是文件数据库，不需要 MySQL，也不需要宝塔“数据库”面板。只要：

```ini
DATABASE_PATH=./data/fateway.db
```

`server.js` 会把它解析成：

```text
/www/wwwroot/fateway/data/fateway.db
```

即使 PM2 的工作目录不是项目根目录，也不会读错。启动日志会显示：

```text
[startup] database: /www/wwwroot/fateway/data/fateway.db
```

数据库目录必须可写，因为 SQLite 会创建 `fateway.db-wal` 和 `fateway.db-shm`：

```bash
chown -R www:www /www/wwwroot/fateway/data
chmod 600 /www/wwwroot/fateway/data/fateway.db
chmod 750 /www/wwwroot/fateway/data
```

启动后验证：

```bash
curl -s http://127.0.0.1:3000/api/health
```

返回 `{"status":"ok","database":"ok",...}` 即数据库读取正常。

### 注意

- **负载实例数量必须是 1**，SQLite 不支持多实例同时写入。
- `server.js` 直接启动 Next，不会执行 `npm start` 的 `prestart` 迁移。迁移包中的数据库已经是最新结构；以后更新代码时，重启前手动执行：
  ```bash
  cd /www/wwwroot/fateway
  npm run db:migrate
  ```
- 构建和运行必须使用同一个 Node 大版本，否则 `better-sqlite3` / `sharp` 会出现 ABI 不匹配。
- 如果日志报 `Database is not readable/writable`，检查 `data/` 属主和 `.env.production` 中的路径。
