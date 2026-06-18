# 🚀 多 Agent 快速上手

## 3 步开启多 Agent 协作

### 第一步：创建自定义 Agent（10分钟）
在 Trae 中打开对话，输入 `@` 并点击「创建智能体」，按照 `agents/` 目录下的 6 个配置文件，依次创建：
1. `架构师 Agent`
2. `后端架构师 Agent`
3. `前端架构师 Agent`
4. `性能优化专家 Agent`
5. `UI Designer Agent`
6. `API Test Pro Agent`

### 第二步：配置 SOLO Coder
1. 切换到 SOLO 模式
2. 配置 SOLO Coder，勾选所有 6 个自定义 Agent

### 第三步：开始
```
@SOLO Coder 
请阅读 plan.md 和 tasks/，开始协调各 Agent 开发！
```

---

## 可选：并行开发模式

如果不想配置 SOLO Coder，也可以直接：
```
@后端架构师 Agent  → 开发任务 2
@后端架构师 Agent  → 开发任务 3 （另一个窗口）
@前端架构师 Agent  → 开发任务 4
```
---

## 需要参考？
- 详细配置步骤：`SOLO-CODER-SETUP.md`
- 各 Agent 完整提示词：`agents/` 目录下的各文件
- 任务说明：`tasks/` 目录
