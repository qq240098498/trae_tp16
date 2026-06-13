## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["Tailwind CSS 3"]
        C["React Router DOM"]
        D["Zustand 状态管理"]
        E["Axios HTTP 客户端"]
    end

    subgraph "后端层（已有）"
        F["Express 4"]
        G["JWT 认证中间件"]
        H["RESTful API 路由"]
    end

    subgraph "数据层（已有）"
        I["JSON 文件数据库"]
        J["users.json"]
        K["products.json"]
        L["orders.json"]
        M["logistics.json"]
        N["returns.json"]
    end

    A --> E
    E --> H
    H --> G
    G --> I
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + Tailwind CSS@3 + Vite
- **初始化工具**：vite-init（react-ts 模板）
- **后端**：Express@4（已有，保留不动）
- **数据库**：JSON 文件存储（已有，保留不动）
- **状态管理**：Zustand
- **路由**：React Router DOM v6
- **HTTP 客户端**：Axios
- **图标库**：lucide-react
- **动效**：CSS transitions + Tailwind 动画类

## 3. 路由定义

| 路由路径 | 页面 | 用途 |
|----------|------|------|
| / | 首页 | 商品列表、搜索、分类 |
| /product/:id | 商品详情页 | 商品信息、购买操作 |
| /publish | 发布闲置 | 商品发布表单 |
| /login | 登录/注册 | 用户认证 |
| /orders | 订单中心 | 买家/卖家订单列表 |
| /order/:id | 订单详情 | 订单状态、物流、操作 |
| /returns | 退货管理 | 退货申请列表 |
| /return/:id | 退货详情 | 退货流程操作 |
| /return/apply/:orderId | 申请退货 | 退货申请表单 |
| /profile | 个人中心 | 用户信息、我的发布 |

## 4. API 定义

### 4.1 用户模块

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | /api/users/register | 注册 | { username, password, nickname, phone } | { token, user } |
| POST | /api/users/login | 登录 | { username, password } | { token, user } |
| GET | /api/users/profile | 获取个人信息 | — | { id, username, nickname, ... } |
| PUT | /api/users/profile | 更新个人信息 | { nickname, phone, address } | { id, username, nickname, ... } |

### 4.2 商品模块

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/products | 商品列表 | query: { category, keyword, minPrice, maxPrice, page, limit } | { total, page, limit, list } |
| GET | /api/products/categories | 分类列表 | — | string[] |
| GET | /api/products/my | 我的发布 | — | Product[] |
| GET | /api/products/:id | 商品详情 | — | Product & { seller } |
| POST | /api/products | 发布商品 | { title, category, price, ... } | Product |
| PUT | /api/products/:id | 更新商品 | { title, ... } | Product |
| DELETE | /api/products/:id | 删除商品 | — | { message } |

### 4.3 订单模块

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/orders | 订单列表 | query: { status, role } | Order[] |
| GET | /api/orders/:id | 订单详情 | — | Order & { product, seller, buyer, logistics } |
| POST | /api/orders | 创建订单 | { productId, address, phone, buyerRemark } | Order |
| POST | /api/orders/:id/pay | 支付 | — | Order |
| POST | /api/orders/:id/ship | 发货 | { trackingNo, courier } | Order |
| POST | /api/orders/:id/confirm-delivery | 确认收货 | — | Order |
| POST | /api/orders/:id/inspect | 验货 | { passed, inspectionRemark } | Order |
| POST | /api/orders/:id/complete | 确认完成 | — | Order |
| POST | /api/orders/:id/cancel | 取消订单 | — | Order |

### 4.4 退货模块

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/returns | 退货列表 | query: { status, role } | Return[] |
| GET | /api/returns/:id | 退货详情 | — | Return & { order, product } |
| POST | /api/returns/order/:orderId | 申请退货 | { reason, description } | Return |
| POST | /api/returns/:id/approve | 同意退货 | { remark } | Return |
| POST | /api/returns/:id/reject | 拒绝退货 | { reason } | Return |
| POST | /api/returns/:id/ship-back | 退回发货 | { trackingNo, courier } | Return |
| POST | /api/returns/:id/confirm-receipt | 确认签收 | — | Return |
| POST | /api/returns/:id/refund | 确认退款 | — | { message, order } |

## 5. 服务器架构图

```mermaid
flowchart LR
    A["React 前端<br/>Vite Dev Server :5173"] -->|"API 请求"| B["Express 后端<br/>:3000"]
    B --> C["auth 中间件<br/>JWT 验证"]
    C --> D["路由层<br/>users / products<br/>orders / logistics / returns"]
    D --> E["数据层<br/>db/index.js"]
    E --> F["JSON 文件<br/>data/*.json"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    users {
        number id PK
        string username
        string password
        string nickname
        string phone
        string avatar
        number balance
        string address
        string createdAt
    }
    products {
        number id PK
        string title
        string description
        number price
        number originalPrice
        string category
        string condition
        array images
        number sellerId FK
        string status
        number views
        number favorites
        string createdAt
    }
    orders {
        number id PK
        string orderNo
        number productId FK
        number sellerId FK
        number buyerId FK
        number price
        string status
        string address
        string phone
        string buyerRemark
        string paymentMethod
        string paidAt
        string shippedAt
        string deliveredAt
        string inspectedAt
        string completedAt
        string createdAt
    }
    logistics {
        number id PK
        number orderId FK
        string trackingNo
        string courier
        string status
        string currentLocation
        array trackingHistory
        string createdAt
    }
    returns {
        number id PK
        number orderId FK
        string reason
        string description
        string status
        string sellerRemark
        string returnCourier
        string returnTrackingNo
        string approvedAt
        string rejectedAt
        string shippedBackAt
        string deliveredBackAt
        string refundedAt
        string createdAt
    }
    users ||--o{ products : "发布"
    users ||--o{ orders : "买家"
    users ||--o{ orders : "卖家"
    products ||--o{ orders : "被购买"
    orders ||--o| logistics : "物流"
    orders ||--o| returns : "退货"
```

### 6.2 数据定义

已有 JSON 文件数据库，无需创建 SQL DDL。初始数据通过前端 `initSampleData` 函数自动填充。
