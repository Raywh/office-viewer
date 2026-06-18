# Office Viewer 并行开发任务总计划

## 📊 项目概述

基于 `README.md` 中的开发计划，将项目拆分为**12 个可并行的子任务**，由不同 Agent 分工协作完成。

---

## 🎯 并行任务拆分与分工

### 任务组 A：基础设施与核心（必须先完成）

#### 任务 1：项目初始化与架构搭建
**负责人**：架构师 Agent
**优先级**：🔴 高
**依赖**：无

**任务清单**：
- [ ] 初始化 monorepo 项目结构（pnpm workspaces / turborepo）
- [ ] 配置 TypeScript
- [ ] 配置 ESLint + Prettier
- [ ] 配置 Vitest 测试框架
- [ ] 配置 Vite / Rollup 打包
- [ ] 创建目录结构
- [ ] 编写项目级 README

**交付物**：
- 完整初始化的项目仓库
- `.github/` 配置（可选）
- `package.json` 根配置
- `tsconfig.json`
- `.eslintrc.js` / `.prettierrc`

---

#### 任务 2：容器层 - 格式识别与 ZIP 解析
**负责人**：后端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 1

**任务清单**：
- [ ] 创建 `packages/core/` 包
- [ ] 实现 `format-detector.ts`（魔数检测 + MIME 识别）
- [ ] 实现 `zip-parser.ts`（Open Packaging Convention）
- [ ] 实现关系索引解析
- [ ] 编写单元测试

**交付物**：
- `packages/core/src/format-detector.ts`
- `packages/core/src/zip-parser.ts`
- `packages/core/tests/` 测试文件

---

#### 任务 3：容器层 - CFB 解析与 WASM 校验
**负责人**：后端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 1

**任务清单**：
- [ ] 实现 `cfb-parser.ts`（Compound File Binary）
- [ ] 实现 FAT 表读取
- [ ] 实现目录流遍历
- [ ] 实现 Stream 内容提取
- [ ] 实现 `wasm-validator.ts`
- [ ] 编写单元测试

**交付物**：
- `packages/core/src/cfb-parser.ts`
- `packages/core/src/wasm-validator.ts`
- `packages/core/tests/` 测试文件

---

### 任务组 B：Word 格式（可并行开发）

#### 任务 4：DOCX Viewer - 解析器
**负责人**：前端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 2

**任务清单**：
- [ ] 创建 `packages/docx-viewer/` 包
- [ ] 实现 `document.xml` 解析
- [ ] 实现 `styles.xml` 解析
- [ ] 实现 `numbering.xml` 解析
- [ ] 实现 `theme/theme1.xml` 解析
- [ ] 实现 `fontTable.xml` 解析
- [ ] 实现 `settings.xml` 解析
- [ ] 实现 Header/Footer parts 解析
- [ ] 实现 Drawing/Media parts 解析
- [ ] 设计中间模型（WordDocument/Paragraph/Table/Drawing/Section）
- [ ] 编写单元测试

**交付物**：
- `packages/docx-viewer/src/parser/` 解析器模块
- `packages/docx-viewer/src/model/` 模型定义
- 单元测试

---

#### 任务 5：DOCX Viewer - 布局与渲染
**负责人**：前端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 4

**任务清单**：
- [ ] 实现流式布局引擎
- [ ] 实现显式分页处理
- [ ] 实现表格布局
- [ ] 实现图片锚定（drawing anchor）
- [ ] 实现页眉页脚布局
- [ ] 实现 DOM 渲染器（HTML + CSS）
- [ ] 实现 `awaitLayout` 机制
- [ ] 修复图片锚定错位
- [ ] 实现表格图片跟随
- [ ] 实现标题编号样式同步
- [ ] 导出 `parseAsync`, `renderDocument`, `renderAsync` API
- [ ] 编写测试

**交付物**：
- `packages/docx-viewer/src/layout/` 布局模块
- `packages/docx-viewer/src/render/` 渲染模块
- `packages/docx-viewer/src/index.ts` 入口文件
- 完整测试

---

#### 任务 6：DOC Viewer - 二进制解析
**负责人**：后端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 3

**任务清单**：
- [ ] 创建 `packages/msdoc-viewer/` 包
- [ ] 实现 WordDocument stream 读取
- [ ] 实现 0Table / 1Table stream 处理
- [ ] 实现 FIB 解析
- [ ] 实现 CLX / Piece Table 处理
- [ ] 实现 CHPX / PAPX 解析
- [ ] 实现 SPRM 属性解码
- [ ] 实现段落/表格/图片/页眉页脚/节属性提取
- [ ] 编写单元测试

**交付物**：
- `packages/msdoc-viewer/src/parser/` 解析模块
- `packages/msdoc-viewer/src/model/` 模型定义
- 单元测试

---

#### 任务 7：DOC Viewer - 渲染与运行时
**负责人**：后端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 6

**任务清单**：
- [ ] 实现 EMF/WMF 转 SVG（`convertMetafileToSvg`）
- [ ] 实现 DIB 处理
- [ ] 实现 OLE 对象处理
- [ ] 实现分页视图
- [ ] 实现文档流视图
- [ ] 实现浮动对象处理
- [ ] 实现页面标记
- [ ] 实现 `mountMsDoc` 挂载函数
- [ ] 导出完整 API
- [ ] 编写测试

**交付物**：
- `packages/msdoc-viewer/src/render/` 渲染模块
- `packages/msdoc-viewer/src/viewer.ts`
- `packages/msdoc-viewer/src/index.ts`
- 完整测试

---

### 任务组 C：Excel 格式（可并行开发）

#### 任务 8：Excel Viewer - 数据解析
**负责人**：前端架构师 Agent
**优先级**：🔴 高
**依赖**：任务 2, 3

**任务清单**：
- [ ] 创建 `packages/excel-viewer/` 包
- [ ] 实现 Workbook 解析
- [ ] 实现 Worksheet 解析
- [ ] 实现 Cell 数据解析
- [ ] 实现样式解析
- [ ] 实现列宽/行高度量转换
- [ ] 设计中间模型
- [ ] 编写单元测试

**交付物**：
- `packages/excel-viewer/src/parser/` 解析模块
- `packages/excel-viewer/src/model/` 模型定义
- 单元测试

---

#### 任务 9：Excel Viewer - 表格渲染与虚拟滚动
**负责人**：前端架构师 Agent + 性能优化专家 Agent
**优先级**：🔴 高
**依赖**：任务 8

**任务清单**：
- [ ] 实现合并单元格渲染
- [ ] 实现边框处理
- [ ] 实现颜色填充
- [ ] 实现冻结窗格
- [ ] 实现图片锚点定位
- [ ] 实现 `isOverflowTextCell()` 函数
- [ ] 实现文字溢出处理（内容层/背景层/边框层）
- [ ] 实现 `getVirtualViewportRange()` 函数
- [ ] 实现虚拟窗口渲染
- [ ] 实现滚动性能优化
- [ ] 导出 `parseExcelWorkbook`, `renderExcelHtml` API
- [ ] 编写测试

**交付物**：
- `packages/excel-viewer/src/render/` 渲染模块
- `packages/excel-viewer/src/virtual-scroll/` 虚拟滚动模块
- `packages/excel-viewer/src/index.ts`
- 完整测试

---

#### 任务 10：Excel Viewer - Worker 解析与最终整合
**负责人**：性能优化专家 Agent
**优先级**：🟡 中
**依赖**：任务 9

**任务清单**：
- [ ] 实现 Worker 客户端
- [ ] 实现大文件异步解析
- [ ] 实现进度回调
- [ ] 实现 `mountExcel` 挂载函数
- [ ] 实现 `syncExcelOverlays`
- [ ] 导出 `createExcelWorkerClient`, `loadExcelWorkbookInWorker`
- [ ] 整合完整功能
- [ ] 编写集成测试

**交付物**：
- `packages/excel-viewer/src/worker/` Worker 模块
- `packages/excel-viewer/src/controller.ts`
- `packages/excel-viewer/src/index.ts` 最终入口
- 集成测试

---

### 任务组 D：PPT 格式（可并行开发）

#### 任务 11：PPTX Viewer
**负责人**：前端架构师 Agent
**优先级**：🟡 中
**依赖**：任务 2

**任务清单**：
- [ ] 创建 `packages/pptx-viewer/` 包
- [ ] 实现 Presentation 解析
- [ ] 实现 Slide 解析
- [ ] 实现 Master/Layout 解析
- [ ] 实现 Theme 解析
- [ ] 实现 Shape 树处理
- [ ] 实现 Text Body 处理
- [ ] 实现 Chart/Table 解析
- [ ] 实现 Group Transform 处理
- [ ] 实现 Image/Media 处理
- [ ] 实现坐标系系统
- [ ] 实现虚拟渲染（按需渲染 + 虚拟列表）
- [ ] 实现 `scheduleTextLayout` 文字排版修正
- [ ] 导出完整 API
- [ ] 编写测试

**交付物**：
- `packages/pptx-viewer/` 完整包
- 单元测试 + 集成测试

---

#### 任务 12：PPT Viewer
**负责人**：后端架构师 Agent
**优先级**：🟡 中
**依赖**：任务 3

**任务清单**：
- [ ] 创建 `packages/ppt-viewer/` 包
- [ ] 实现 PowerPoint 记录解析
- [ ] 实现 Persist Directory 处理
- [ ] 实现 User Edit Atom 处理
- [ ] 实现 EMF/WMF 图片处理
- [ ] 实现 DIB 处理
- [ ] 实现 OLE 对象处理
- [ ] 实现逐页渐进渲染
- [ ] 实现 `yieldToBrowserPaint` 机制
- [ ] 实现进度显示
- [ ] 导出完整 API
- [ ] 编写测试

**交付物**：
- `packages/ppt-viewer/` 完整包
- 单元测试 + 集成测试

---

### 任务组 E：Demo 与优化（依赖 Viewer 完成）

#### 任务 13：Demo 界面开发
**负责人**：UI Designer Agent + 前端架构师 Agent
**优先级**：🟡 中
**依赖**：任务 5, 7, 10, 11, 12（至少完成部分 Viewer）

**任务清单**：
- [ ] 创建 `demo/` 目录
- [ ] 实现文件上传组件（拖拽 + 点击）
- [ ] 实现格式选择器
- [ ] 实现 `loadViewerModule()` 动态加载
- [ ] 实现预览容器（DOM 挂载 + 视图切换 + 缩放）
- [ ] 实现诊断面板（耗时 + 统计 + 错误）
- [ ] 实现 `renderByFormat()` 统一入口
- [ ] 实现错误处理
- [ ] 编写 Demo 样式

**交付物**：
- `demo/` 完整演示应用
- 可运行的本地 Demo

---

#### 任务 14：性能优化与测试
**负责人**：性能优化专家 Agent + API Test Pro Agent
**优先级**：🟡 中
**依赖**：任务 13

**任务清单**：

**性能优化**：
- [ ] 实现按需加载优化
- [ ] 实现 Promise 缓存
- [ ] 实现模块懒加载
- [ ] 实现渐进式渲染
- [ ] 实现 DOM 操作优化
- [ ] 性能测试与调优
- [ ] 生成性能测试报告

**测试**：
- [ ] 编写单元测试（全模块覆盖）
- [ ] 编写集成测试（端到端）
- [ ] 性能测试（渲染耗时 + 内存 + 首屏）
- [ ] 浏览器兼容性测试
- [ ] 收集测试文件集合
- [ ] 生成测试报告
- [ ] 生成兼容性矩阵

**交付物**：
- 完整测试套件
- 性能测试报告
- 兼容性矩阵
- 优化后的代码

---

## 👥 Agent 分工总览

| Agent | 负责任务 | 主要职责 |
|-------|----------|----------|
| **架构师 Agent** | 1 | 项目初始化、架构搭建、目录结构 |
| **后端架构师 Agent** | 2, 3, 6, 7, 12 | 容器层、DOC/PPT 旧格式解析、CFB/ZIP |
| **前端架构师 Agent** | 4, 5, 8, 9, 11, 13 | DOCX/PPTX/Excel Viewer、解析/布局/渲染、Demo |
| **性能优化专家 Agent** | 9, 10, 14 | Excel 虚拟滚动、Worker、性能优化 |
| **UI Designer Agent** | 13 | Demo 界面、用户体验 |
| **API Test Pro Agent** | 14 | 测试用例、测试报告、兼容性 |

---

## 📅 并行开发时间线（甘特图模式）

```
第 1 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [任务 1: 项目初始化] ✅
        [任务 2: 容器层 - 格式识别/ZIP] 🔄
        [任务 3: 容器层 - CFB/WASM] 🔄

第 2-3 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          [任务 2] ✅
          [任务 3] ✅
          [任务 4: DOCX 解析器] 🔄
          [任务 6: DOC 解析器] 🔄
          [任务 8: Excel 解析] 🔄
          [任务 11: PPTX Viewer] 🔄 (并行)
          [任务 12: PPT Viewer] 🔄 (并行)

第 4-5 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          [任务 4] ✅ → [任务 5: DOCX 布局渲染] 🔄
          [任务 6] ✅ → [任务 7: DOC 渲染] 🔄
          [任务 8] ✅ → [任务 9: Excel 渲染] 🔄
          [任务 11] 🔄
          [任务 12] 🔄

第 6-7 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          [任务 5] ✅
          [任务 7] ✅
          [任务 9] ✅ → [任务 10: Excel Worker] 🔄
          [任务 11] ✅
          [任务 12] ✅
          [任务 13: Demo 开发] 🔄 (可开始)

第 8 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [任务 10] ✅
        [任务 13] ✅
        [任务 14: 性能优化 + 测试] 🔄

第 9 周  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        [任务 14] ✅
        🏁 项目完成！
```

---

## 🔗 依赖关系图

```
任务 1 (项目初始化)
├─→ 任务 2 (ZIP 解析) ──→ 任务 4 (DOCX 解析) ──→ 任务 5 (DOCX 渲染)
├─→ 任务 3 (CFB 解析) ──→ 任务 6 (DOC 解析) ──→ 任务 7 (DOC 渲染)
│                     └─→ 任务 12 (PPT Viewer)
├─→ 任务 2 + 3 ──────→ 任务 8 (Excel 解析) ──→ 任务 9 (Excel 渲染) ──→ 任务 10 (Excel Worker)
└─→ 任务 2 ─────────→ 任务 11 (PPTX Viewer)

任务 5, 7, 10, 11, 12 ──→ 任务 13 (Demo) ──→ 任务 14 (测试优化)
```

---

## 🚀 启动顺序建议

### 第一阶段：立即启动（第 1 周）
- ✅ 任务 1：项目初始化（架构师 Agent）
- 🔄 任务 2：容器层 - 格式识别/ZIP（后端架构师 Agent）
- 🔄 任务 3：容器层 - CFB/WASM（后端架构师 Agent）

### 第二阶段：并行开发（第 2-5 周）
- 🔄 任务 4：DOCX 解析器（前端架构师 Agent）
- 🔄 任务 6：DOC 解析器（后端架构师 Agent）
- 🔄 任务 8：Excel 解析（前端架构师 Agent）
- 🔄 任务 11：PPTX Viewer（前端架构师 Agent）
- 🔄 任务 12：PPT Viewer（后端架构师 Agent）

### 第三阶段：后续开发（第 6-9 周）
- 🔄 任务 5, 7, 9, 10：各 Viewer 后续开发
- 🔄 任务 13：Demo 开发
- 🔄 任务 14：测试与优化

---

## 📝 各任务详细文档

每个子任务的详细说明，请参考：
- [README.md](./README.md) - 原始完整开发计划
- 各 `packages/*/README.md` - 各包的具体文档（待创建）

---

## ✅ 成功标志

所有 14 个任务完成，并满足：
- DOCX：4.6MB < 500ms
- PPTX：20.8MB < 2s
- XLSX：387KB < 2s
- 支持所有 6 种格式
- 高还原度
- 纯前端无第三方依赖
