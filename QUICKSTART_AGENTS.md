# 🚀 多 Agent 快速参考卡

## 第一步：创建你的 Agent 团队（5分钟）

### 1️⃣ 架构师 Agent
- **@名称**：`@架构师 Agent`
- **英文标识**：`architect`
- **负责**：任务 1（项目初始化）
- **触发词**：架构、初始化、目录结构、技术选型

### 2️⃣ 后端架构师 Agent
- **@名称**：`@后端架构师 Agent`
- **英文标识**：`backend_architect`
- **负责**：任务 2, 3, 6, 7, 12
- **触发词**：ZIP、CFB、二进制、.doc、.ppt、旧格式

### 3️⃣ 前端架构师 Agent
- **@名称**：`@前端架构师 Agent`
- **英文标识**：`frontend_architect`
- **负责**：任务 4, 5, 8, 9, 11, 13
- **触发词**：DOCX、PPTX、Excel、渲染、布局、Demo

### 4️⃣ 性能优化专家 Agent
- **@名称**：`@性能优化专家 Agent`
- **英文标识**：`performance_expert`
- **负责**：任务 9, 10, 14
- **触发词**：虚拟滚动、Worker、性能优化、懒加载

### 5️⃣ UI Designer Agent
- **@名称**：`@UI Designer Agent`
- **英文标识**：`ui_designer`
- **负责**：任务 13
- **触发词**：界面、Demo、UI、设计、用户体验

### 6️⃣ API Test Pro Agent
- **@名称**：`@API Test Pro Agent`
- **英文标识**：`api_test_pro`
- **负责**：任务 14
- **触发词**：测试、单元测试、集成测试、质量保障

---

## 第二步：配置 SOLO Coder（3分钟）

1. 切换到 **SOLO 模式**
2. 选择 **SOLO Coder**
3. 悬停配置图标 ⚙️ → Edit Tools
4. 勾选刚才创建的 6 个 Agent ✅✅✅✅✅✅
5. 保存！

---

## 第三步：开始开发！

### 方式 A：直接 @（适合单任务）

```
@架构师 Agent 
请根据 tasks/01-project-init.md 初始化项目
```

```
@后端架构师 Agent
请实现 tasks/02-core-zip.md 中的 ZIP 解析器
```

### 方式 B：SOLO Coder 调度（推荐，适合多任务）

```
@SOLO Coder
请阅读 plan.md 和 tasks/ 目录，然后协调各个 Agent 执行任务。
从任务 1 开始，按依赖关系并行开发！
```

---

## 🔥 并行开发示例

开 3 个 Trae 窗口，同时进行：

| 窗口 1 | 窗口 2 | 窗口 3 |
|--------|--------|--------|
| `@前端架构师 Agent` → 任务 4 (DOCX) | `@后端架构师 Agent` → 任务 2 (ZIP) | `@后端架构师 Agent` → 任务 3 (CFB) |

---

## 📂 相关文档

| 文档 | 说明 |
|------|------|
| `README.md` | 原始需求计划 |
| `plan.md` | 并行任务总计划 |
| `tasks/README.md` | 任务目录索引 |
| `tasks/01-project-init.md` | 任务 1 详情 |
| `tasks/02-core-zip.md` | 任务 2 详情 |
| `MULTI_AGENT_GUIDE.md` | 完整多 agent 指南（本文） |

---

## 💡 提示

- 🎯 先完成 **任务 1**，再并行其他
- 🤝 Agent 之间可以用交接文档传递上下文
- 📊 定期让 SOLO Coder 检查进度
- 🔍 关键节点多 Agent 代码审查

准备好了吗？从 `@架构师 Agent` 开始！🚀
