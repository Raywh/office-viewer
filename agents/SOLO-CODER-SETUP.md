# SOLO Coder 多 Agent 配置指南

## 第一步：创建自定义 Agent（6个）

在 Trae 中依次创建以下 6 个自定义 Agent，每个都可以单独创建（按 `agents/` 目录下的说明）：

| 序号 | Agent | 英文标识名 | 任务文件 |
|-----|-------|----------|---------|
| 1 | 架构师 Agent | `architect` | `01-architect-agent.md` |
| 2 | 后端架构师 Agent | `backend_architect` | `02-backend-architect-agent.md` |
| 3 | 前端架构师 Agent | `frontend_architect` | `03-frontend-architect-agent.md` |
| 4 | 性能优化专家 Agent | `performance_expert` | `04-performance-expert-agent.md` |
| 5 | UI Designer Agent | `ui_designer` | `05-ui-designer-agent.md` |
| 6 | API Test Pro Agent | `api_test_pro` | `06-api-test-pro-agent.md` |

---

## 第二步：配置 SOLO Coder

### 1. 启用 SOLO 模式
在 Trae 界面左上角，切换到 **SOLO 模式**

### 2. 配置可调用 Agent
1. 找到 **SOLO Coder**
2. 悬停点击配置图标 ⚙️
3. 进入配置面板
4. 在「可调用自定义智能体」中，**勾选全部 6 个 Agent**
5. 保存

---

## 第三步：启动多 Agent 协作

### 方法 A：让 SOLO Coder 自动调度（推荐）

在对话中输入：
```
@SOLO Coder 
请阅读项目的 plan.md 和 tasks/ 目录，这是一个 TypeScript 纯前端 Office 渲染引擎项目。

请按照计划协调各个 Agent 执行开发任务：
1. 先从任务 2（ZIP 解析）和任务 3（CFB 解析）开始并行开发
2. 然后依次进行各 Viewer 开发
3. 最后完成 Demo 和测试

记得每个任务完成后让对应 Agent 执行 git add 和 git commit。
```

### 方法 B：直接 @ 具体 Agent

你也可以开多个对话窗口，分别 @ 不同 Agent：

**窗口 1：**
```
@后端架构师 Agent
请阅读 tasks/02-core-zip.md，开始开发 ZIP 解析器。
```

**窗口 2：**
```
@后端架构师 Agent
请阅读 tasks/03-core-cfb.md，开始开发 CFB 解析器。
```

**窗口 3：**
```
@前端架构师 Agent
请阅读 tasks/04-docx-parser.md，开始开发 DOCX 解析器。
```

---

## 第四步：跟踪进度

随时可以问 SOLO Coder：
```
@SOLO Coder 
当前项目进度如何？哪些任务完成了，哪些在进行中？
```

---

## 提示

1. **Agent 交接**：如果需要 Agent 之间交接上下文，让上一个 Agent 写一个交接说明文件
2. **Git 提交**：每个任务完成后，记得 `git add .` 和 `git commit`
3. **并行开发**：可以同时开多个对话窗口，让不同 Agent 同时工作
