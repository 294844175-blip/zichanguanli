# 园区资产可视化管理系统

基于 React + Node.js + SQLite 的园区资产可视化管理系统，采用 Monorepo 架构。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design + Konva.js
- **后端**: Node.js + Express + TypeScript + Prisma + JWT
- **数据库**: SQLite (本地文件存储，无需安装)
- **架构**: Monorepo (apps/frontend + apps/backend)

## 环境要求

- **Node.js**: v20.x (必须)
- **npm**: v10.x

## 快速开始

### 1. 安装 Node.js

如果你的电脑还没有安装 Node.js：
1. 下载: [https://nodejs.org/dist/v20.11.0/node-v20.11.0.pkg](https://nodejs.org/dist/v20.11.0/node-v20.11.0.pkg)
2. 双击安装包，一路点击"继续"完成安装
3. 安装完成后，**关闭所有终端窗口，重新打开一个新的**

### 2. 安装依赖并启动

打开新终端，依次运行：

```bash
# 进入项目目录
cd "/Users/joncjing/Documents/园区资产管理系统"

# 安装后端依赖
cd apps/backend && npm install && cd ../..

# 安装前端依赖
cd apps/frontend && npm install && cd ../..

# 初始化数据库 (创建 SQLite 数据库文件和数据表)
cd apps/backend && npx prisma migrate dev --name init && cd ../..

# 启动后端服务 (端口 8000)
cd apps/backend && npm run dev &

# 启动前端服务 (端口 3000)
cd apps/frontend && npm run dev
```

### 3. 访问项目

- **前端界面**: http://localhost:3000
- **后端 API**: http://localhost:8000

## 项目结构

```
├── apps/
│   ├── frontend/           # React 前端
│   │   └── src/
│   │       ├── api/        # API 请求层
│   │       ├── components/ # 组件库
│   │       │   └── AssetSliceEditor/  # 资产切片编辑器 (Konva)
│   │       ├── pages/      # 页面
│   │       └── types/      # TypeScript 类型
│   └── backend/            # Node.js 后端
│       ├── prisma/
│       │   └── dev.db      # SQLite 数据库文件 (自动生成)
│       └── src/
│           ├── config/     # 配置
│           ├── controllers/# 控制器
│           ├── middleware/ # 中间件 (auth, rbac, dataScope)
│           ├── routes/     # 路由
│           ├── services/   # 业务逻辑
│           └── utils/      # 工具函数
└── packages/
    └── types/              # 共享类型
```

## 核心功能

### 运营端
- 资产切片可视化仪表盘（Konva.js 拖拽编辑）
- 经营概览与目标管理
- 多维度数据统计
- 客户管理（租赁客户 + 潜客）
- 资产管理（园区资产 + 空间资产）

### 中台端
- 全局资产总览
- 多园区经营汇总

### 管理端
- 用户管理
- 角色权限管理（RBAC + 数据权限）
- 组织架构管理

## API 文档

| 模块 | 路由前缀 |
|------|----------|
| 认证 | `/api/auth` |
| 资产 | `/api/assets` |
| 园区 | `/api/parks` |
| 客户 | `/api/customers` |
| 租赁 | `/api/leases` |
| 概览 | `/api/dashboard` |
| 预警 | `/api/alerts` |
| 用户 | `/api/users` |
| 角色 | `/api/roles` |
| 组织 | `/api/organizations` |
