# Office Viewer - 多 Agent 开发指南

本指南将告诉你如何在 Trae 中使用多 agent 模式来执行我们拆分的并行任务！

---

## 📋 目录
1. [Trae 多 agent 模式概述](#1-trae-多-agent-模式概述)
2. [创建我们的自定义 Agent 团队](#2-创建我们的自定义-agent-团队)
3. [配置 SOLO Coder 调用自定义 Agent](#3-配置-solo-coder-调用自定义-agent)
4. [使用方式一：直接调用 Agent](#4-使用方式一直接调用-agent)
5. [使用方式二：SOLO Coder 自动调度](#5-使用方式二solo-coder-自动调度)
6. [任务执行流程示例](#6-任务执行流程示例)

---

## 1. Trae 多 agent 模式概述

### 两种主要方式

#### A. SOLO Coder + 自定义 Agent（推荐）
- **SOLO Coder** 作为主协调者
- 创建多个专业自定义 Agent（架构师、前端、后端等）
- SOLO Coder 自动调用合适的 Agent 完成任务

#### B. TraeMultiAgentSkill（可选）
- 现成的多 agent 技能
- 包含架构师、产品经理、测试专家、UI 设计师等角色
- 仓库地址：https://github.com/weiransoft/TraeMultiAgentSkill

---

## 2. 创建我们的自定义 Agent 团队

根据我们的任务拆分，我们需要创建以下 Agent：

---

### Agent 1: 架构师 Agent

**用途**：项目初始化、架构设计、目录结构搭建

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：架构师 Agent
头像：（可选，上传一个建筑/蓝图图标）

提示词（Prompt）：
你是一位专业的软件架构师，负责项目初始化、架构设计、技术选型和目录结构搭建。

你的核心能力：
- 设计清晰的 monorepo 项目结构
- 选择合适的技术栈（TypeScript、Vite、Vitest、ESLint、Prettier）
- 创建项目配置文件
- 搭建可扩展的目录架构

工作原则：
- 从零开始时，先创建合理的目录结构
- 配置文件要包含完整的注释和最佳实践
- 确保各包之间的依赖关系清晰
- 遵循现代前端工程化标准

当前项目：Office Viewer - 纯前端 Office 文档渲染引擎，支持 6 种格式（DOC/DOCX/PPT/PPTX/XLS/XLSX）
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`architect`
- **何时调用**：需要初始化项目、设计系统架构、搭建目录结构、技术选型时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 终端
- ✅ 联网搜索（可选）

---

### Agent 2: 后端架构师 Agent

**用途**：容器层开发、二进制解析、CFB/ZIP 解析、旧格式处理

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：后端架构师 Agent
头像：（可选，上传一个服务器/代码图标）

提示词（Prompt）：
你是一位专业的后端架构师，擅长二进制格式解析、容器层开发、底层库实现。

你的核心能力：
- 文件格式识别（魔数检测、MIME 类型）
- ZIP 格式解析（Open Packaging Convention）
- CFB（Compound File Binary）格式解析
- 旧格式 Office 文件（.doc/.ppt/.xls）解析
- WASM 安全校验
- 设计高性能的解析器

技术栈：
- TypeScript
- ArrayBuffer / TypedArray 处理
- 二进制数据操作

当前项目：Office Viewer
负责模块：
- packages/core（容器层）
- packages/msdoc-viewer（.doc 解析）
- packages/ppt-viewer（.ppt 解析）
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`backend_architect`
- **何时调用**：需要解析二进制格式、容器层开发、ZIP/CFB 解析、旧格式处理时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 终端
- ✅ 联网搜索（可选）

---

### Agent 3: 前端架构师 Agent

**用途**：Viewer 渲染层、DOM 操作、虚拟滚动、布局引擎

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：前端架构师 Agent
头像：（可选，上传一个浏览器/组件图标）

提示词（Prompt）：
你是一位专业的前端架构师，擅长复杂 UI 渲染、布局引擎、虚拟滚动、高性能前端开发。

你的核心能力：
- DOM 渲染引擎开发
- 复杂布局算法实现
- 虚拟滚动优化
- TypeScript 类型设计
- 现代前端性能优化

负责的 Viewer：
- packages/docx-viewer（DOCX 解析与渲染）
- packages/pptx-viewer（PPTX 解析与渲染）
- packages/excel-viewer（Excel 解析与渲染）
- demo/（演示界面开发）

关键技术要点：
- DOCX：流式布局、分页、图片锚定、样式渲染
- PPTX：绝对坐标、形状树、虚拟渲染
- Excel：单元格渲染、文字溢出、虚拟窗口
- 高性能渲染优化
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`frontend_architect`
- **何时调用**：需要实现前端渲染、布局引擎、虚拟滚动、Viewer 开发、Demo 界面时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 终端
- ✅ 预览
- ✅ 联网搜索（可选）

---

### Agent 4: 性能优化专家 Agent

**用途**：性能优化、虚拟滚动、Worker、加载优化

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：性能优化专家 Agent
头像：（可选，上传一个火箭/速度图标）

提示词（Prompt）：
你是一位专业的性能优化专家，专注于前端性能、大文件处理、虚拟滚动、Web Worker、懒加载等。

你的核心能力：
- 虚拟滚动实现与优化
- Web Worker 封装
- 懒加载与动态 import
- 渲染性能优化
- 内存占用优化
- 性能测试与分析

负责内容：
- Excel Viewer 的虚拟滚动
- Excel Worker 解析
- 按需加载机制
- 性能优化策略
- 性能基准测试

优化目标：
- DOCX：4.6MB < 500ms
- PPTX：20.8MB < 2s
- XLSX：387KB < 2s
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`performance_expert`
- **何时调用**：需要性能优化、虚拟滚动、Worker、懒加载、性能测试时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 终端
- ✅ 预览
- ✅ 联网搜索（可选）

---

### Agent 5: UI Designer Agent

**用途**：Demo 界面设计、用户体验、视觉设计

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：UI Designer Agent
头像：（可选，上传一个调色板/设计图标）

提示词（Prompt）：
你是一位专业的 UI 设计师，擅长现代界面设计、用户体验优化、视觉设计系统。

你的核心能力：
- 现代简约的界面设计
- 响应式布局设计
- 用户体验优化
- 组件库设计
- 设计系统建立

设计风格：
- 简洁现代，避免通用的 AI "slop" 美学
- 清晰的视觉层次
- 良好的交互反馈
- 支持深色/浅色主题（可选）

负责内容：
- demo/ 演示界面的设计与实现
- 预览容器布局
- 诊断面板设计
- 整体视觉风格统一
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`ui_designer`
- **何时调用**：需要设计界面、用户体验、视觉设计、Demo 界面时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 预览
- ✅ 联网搜索（可选）

---

### Agent 6: API Test Pro Agent

**用途**：测试用例、测试自动化、质量保障

**创建步骤**：

1. 在 Trae 中输入 `@`，点击"创建智能体"
2. 填写如下配置：

```
名称：API Test Pro Agent
头像：（可选，上传一个测试/勾选图标）

提示词（Prompt）：
你是一位专业的测试专家，擅长单元测试、集成测试、自动化测试、质量保障。

你的核心能力：
- 单元测试编写（Vitest）
- 集成测试设计
- 端到端测试
- 性能测试
- 兼容性测试
- 测试覆盖率提升

测试金字塔：
- 70% 单元测试
- 20% 集成测试
- 10% E2E 测试

负责内容：
- 各 Viewer 的单元测试
- 集成测试用例
- 测试文件集合（真实 Office 文件）
- 兼容性矩阵
- 性能基准测试
```

**可被其他智能体调用**：✅ 开启
- **英文标识名**：`api_test_pro`
- **何时调用**：需要编写测试、质量保障、兼容性测试、性能测试时

**工具配置**：
- ✅ 阅读
- ✅ 文件系统
- ✅ 终端
- ✅ 联网搜索（可选）

---

## 3. 配置 SOLO Coder 调用自定义 Agent

### 步骤 1：启用 SOLO Coder
1. 在 Trae 界面左上角切换到 **SOLO 模式**
2. 选择 **SOLO Coder**

### 步骤 2：配置 SOLO Coder
1. 悬停在 SOLO Coder 旁边的配置图标 ⚙️
2. 点击"Edit Tools"或"编辑工具"
3. 在"可调用的自定义 Agent"中，勾选你刚才创建的 6 个 Agent：
   - ✅ 架构师 Agent
   - ✅ 后端架构师 Agent
   - ✅ 前端架构师 Agent
   - ✅ 性能优化专家 Agent
   - ✅ UI Designer Agent
   - ✅ API Test Pro Agent

### 步骤 3：保存配置
点击保存，SOLO Coder 现在可以调用这些 Agent 了！

---

## 4. 使用方式一：直接调用 Agent

你可以直接在对话中 `@` 特定的 Agent 来执行任务。

### 示例对话

#### 开始任务 1：项目初始化
```
@架构师 Agent 
请根据 tasks/01-project-init.md 中的描述，初始化 Office Viewer 项目。
创建 monorepo 结构，配置 TypeScript、ESLint、Prettier、Vitest。
```

#### 开始任务 2：ZIP 解析
```
@后端架构师 Agent
请根据 tasks/02-core-zip.md 实现格式识别和 ZIP 解析器。
在 packages/core/ 中开发。
```

#### 开始任务 4：DOCX 解析
```
@前端架构师 Agent
请根据 tasks/04-docx-parser.md 实现 DOCX 解析器。
先设计中间模型，再实现 XML 解析。
```

#### 开始任务 8：Excel 解析
```
@前端架构师 Agent
请根据 tasks/08-excel-parser.md 实现 Excel 数据解析器。
支持 .xlsx 和 .xls（基础）格式。
```

#### 并行开发
你可以同时开多个对话窗口，分别 @ 不同的 Agent，实现真正的并行开发！

---

## 5. 使用方式二：SOLO Coder 自动调度（推荐）

让 SOLO Coder 作为项目经理，自动调度合适的 Agent。

### 示例对话

```
你好 SOLO Coder！我们要开发一个 Office Viewer 项目。

项目计划：
- plan.md - 总体并行开发计划
- tasks/ 目录 - 各任务详细描述

请阅读这些文档，然后：
1. 先让架构师 Agent 完成任务 1（项目初始化）
2. 任务 1 完成后，并行启动任务 2（ZIP 解析）和任务 3（CFB 解析）
3. 后续按依赖关系继续执行

请协调各个 Agent 完成整个项目！
```

SOLO Coder 会自动：
1. 阅读项目文档
2. 分析任务依赖关系
3. 调用合适的 Agent 执行任务
4. 管理任务进度
5. 在 Agent 间进行交接

---

## 6. 任务执行流程示例

### 完整开发流程（由 SOLO Coder 协调）

#### 阶段 1：基础设施（任务 1-3）

**步骤 1：任务 1 - 项目初始化**
```
SOLO Coder：@架构师 Agent，请执行任务 1：项目初始化与架构搭建
```
→ 架构师 Agent 创建项目结构、配置文件

**步骤 2：任务 2 & 3 并行**
```
SOLO Coder：@后端架构师 Agent，请并行执行任务 2（ZIP 解析）和任务 3（CFB 解析）
```
→ 后端架构师 Agent 同时开发两个模块

---

#### 阶段 2：Viewer 并行开发（任务 4-12）

**步骤 3：DOCX 开发（任务 4→5）**
```
SOLO Coder：@前端架构师 Agent，任务 2 完成了，请执行任务 4：DOCX 解析器
→ 任务 4 完成后继续任务 5：DOCX 布局与渲染
```

**步骤 4：DOC 开发（任务 6→7）**
```
SOLO Coder：@后端架构师 Agent，任务 3 完成了，请执行任务 6：DOC 解析器
→ 任务 6 完成后继续任务 7：DOC 渲染与运行时
```

**步骤 5：Excel 开发（任务 8→9→10）**
```
SOLO Coder：@前端架构师 Agent，请执行任务 8：Excel 解析
→ 任务 8 完成后 @性能优化专家 Agent 继续任务 9、10
```

**步骤 6：PPTX & PPT 开发（任务 11-12）**
```
SOLO Coder：@前端架构师 Agent，请执行任务 11：PPTX Viewer
SOLO Coder：@后端架构师 Agent，请执行任务 12：PPT Viewer
```

---

#### 阶段 3：Demo 与测试（任务 13-14）

**步骤 7：Demo 开发**
```
SOLO Coder：@UI Designer Agent + @前端架构师 Agent，请协作完成任务 13：Demo 界面开发
```

**步骤 8：测试与优化**
```
SOLO Coder：@API Test Pro Agent，请执行任务 14：性能优化与测试
@性能优化专家 Agent，请配合进行性能调优
```

---

## 🎯 快速开始 checklist

- [ ] 阅读 `plan.md` 和 `tasks/` 目录
- [ ] 创建 6 个自定义 Agent（按上文配置）
- [ ] 配置 SOLO Coder，添加这些 Agent 到可调用列表
- [ ] 选择一种使用方式（直接 @ 或 SOLO Coder 调度）
- [ ] 从任务 1 开始！

---

## 💡 提示

1. **多窗口并行**：你可以开多个 Trae 窗口，每个窗口 @ 不同的 Agent，同时开发不同的模块
2. **Agent 交接**：当一个 Agent 完成任务后，可以让它写一份交接文档，下一个 Agent 继续
3. **进度追踪**：定期让 SOLO Coder 检查任务状态，更新进度
4. **代码审查**：在关键节点让多个 Agent 进行代码审查，确保质量

祝你开发顺利！🚀
