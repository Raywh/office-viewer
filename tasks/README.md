# 并行任务目录

本目录包含 Office Viewer 项目的所有并行开发任务。

---

## 📋 任务清单

### 任务组 A：基础设施与核心（必须先完成）

| 任务 | 文件 | 负责人 | 优先级 | 状态 |
|------|------|--------|--------|------|
| 1. 项目初始化与架构搭建 | [01-project-init.md](./01-project-init.md) | 架构师 Agent | 🔴 高 | ⏳ 待开始 |
| 2. 容器层 - 格式识别与 ZIP 解析 | [02-core-zip.md](./02-core-zip.md) | 后端架构师 Agent | 🔴 高 | ⏳ 待开始 |
| 3. 容器层 - CFB 解析与 WASM 校验 | [03-core-cfb.md](./03-core-cfb.md) | 后端架构师 Agent | 🔴 高 | ⏳ 待开始 |

### 任务组 B：Word 格式

| 任务 | 文件 | 负责人 | 优先级 | 状态 |
|------|------|--------|--------|------|
| 4. DOCX Viewer - 解析器 | [04-docx-parser.md](./04-docx-parser.md) | 前端架构师 Agent | 🔴 高 | ⏳ 待开始 |
| 5. DOCX Viewer - 布局与渲染 | [05-docx-render.md](./05-docx-render.md) | 前端架构师 Agent | 🔴 高 | ⏳ 待开始 |
| 6. DOC Viewer - 二进制解析 | [06-doc-parser.md](./06-doc-parser.md)* | 后端架构师 Agent | 🔴 高 | ⏳ 待创建 |
| 7. DOC Viewer - 渲染与运行时 | [07-doc-render.md](./07-doc-render.md)* | 后端架构师 Agent | 🔴 高 | ⏳ 待创建 |

### 任务组 C：Excel 格式

| 任务 | 文件 | 负责人 | 优先级 | 状态 |
|------|------|--------|--------|------|
| 8. Excel Viewer - 数据解析 | [08-excel-parser.md](./08-excel-parser.md) | 前端架构师 Agent | 🔴 高 | ⏳ 待开始 |
| 9. Excel Viewer - 表格渲染与虚拟滚动 | [09-excel-render.md](./09-excel-render.md) | 前端架构师 + 性能优化专家 | 🔴 高 | ⏳ 待开始 |
| 10. Excel Viewer - Worker 解析与最终整合 | [10-excel-worker.md](./10-excel-worker.md)* | 性能优化专家 Agent | 🟡 中 | ⏳ 待创建 |

### 任务组 D：PPT 格式

| 任务 | 文件 | 负责人 | 优先级 | 状态 |
|------|------|--------|--------|------|
| 11. PPTX Viewer | [11-pptx-viewer.md](./11-pptx-viewer.md)* | 前端架构师 Agent | 🟡 中 | ⏳ 待创建 |
| 12. PPT Viewer | [12-ppt-viewer.md](./12-ppt-viewer.md)* | 后端架构师 Agent | 🟡 中 | ⏳ 待创建 |

### 任务组 E：Demo 与优化

| 任务 | 文件 | 负责人 | 优先级 | 状态 |
|------|------|--------|--------|------|
| 13. Demo 界面开发 | [13-demo.md](./13-demo.md) | UI Designer + 前端架构师 | 🟡 中 | ⏳ 待开始 |
| 14. 性能优化与测试 | [14-test-optimize.md](./14-test-optimize.md)* | 性能优化专家 + API Test Pro | 🟡 中 | ⏳ 待创建 |

*待创建的任务可参考主 `plan.md` 中的描述

---

## 🚀 开始开发

### 第一阶段：立即启动
1. 任务 1：项目初始化 - [01-project-init.md](./01-project-init.md)
2. 任务 2：ZIP 解析 - [02-core-zip.md](./02-core-zip.md)
3. 任务 3：CFB 解析 - [03-core-cfb.md](./03-core-cfb.md)

### 第二阶段：并行开发
等任务 2/3 完成后，并行启动：
- 任务 4：DOCX 解析
- 任务 6：DOC 解析
- 任务 8：Excel 解析
- 任务 11：PPTX Viewer
- 任务 12：PPT Viewer

### 第三阶段：后续开发
继续各 Viewer 后续开发、Demo 开发、测试优化

---

## 📖 参考文档

- [主计划](../plan.md) - 总体开发计划
- [原始需求](../README.md) - 原始完整开发计划
