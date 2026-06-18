# TypeScript 纯前端 Office 渲染引擎 - 多任务开发计划

## 项目概述

从零用 TypeScript 实现 Office 纯前端渲染，支持 DOC、DOCX、PPT、PPTX、XLS、XLSX 六种格式，文件字节进入浏览器，解析、建模、布局、渲染都在前端完成。

## 核心目标

- ✅ 文件不上传到第三方服务
- ✅ 纯前端渲染，不依赖 iframe
- ✅ 高还原度：表格、图片、页眉页脚、字体、批注、图表、合并单元格
- ✅ 支持新旧格式（.doc/.docx/.ppt/.pptx/.xls/.xlsx）

---

## 任务分解与多 Agent 协作计划

### 阶段一：项目架构设计

**负责人**：架构师 Agent

**任务清单**：

1. **技术栈选型**
   - 核心语言：TypeScript
   - 不依赖 React/Vue/jQuery 等 UI 框架
   - 打包工具：Vite / Rollup
   - 测试框架：Vitest
   - 代码规范：ESLint + Prettier

2. **目录结构设计**
   ```
   office-viewer/
   ├── packages/
   │   ├── msdoc-viewer/      # .doc 格式解析渲染
   │   ├── docx-viewer/       # .docx 格式解析渲染
   │   ├── ppt-viewer/        # .ppt 格式解析渲染
   │   ├── pptx-viewer/       # .pptx 格式解析渲染
   │   ├── excel-viewer/      # .xls/.xlsx 格式解析渲染
   │   └── core/              # 公共工具、容器层
   ├── demo/                  # 演示页面
   └── docs/                  # 文档
   ```

3. **分层架构设计**
   - 容器层：识别 ZIP / CFB / 加密 / 媒体资源
   - 解析层：把 XML/二进制记录转成中间模型
   - 布局层：计算页、表格、文本、图片、锚点
   - 渲染层：输出 DOM / SVG / CSS / Canvas

4. **API 接口设计**
   - 统一入口：`renderByFormat(format, bytes, options)`
   - 各 viewer 独立导出：parse、render、mount

**交付物**：
- 项目目录结构
- 技术选型文档
- API 设计文档
- 架构图

---

### 阶段二：容器层开发

**负责人**：后端架构师 Agent

**任务清单**：

1. **格式识别模块**
   - 文件魔数检测
   - 扩展名验证
   - MIME 类型识别

2. **ZIP 解析器**（用于 .docx/.pptx/.xlsx）
   - 支持 Open Packaging Convention
   - 关系索引解析
   - Part 内容读取

3. **CFB 解析器**（用于 .doc/.ppt/.xls）
   - Compound File Binary 格式解析
   - FAT 表读取
   - 目录流遍历
   - Stream 内容提取

4. **WASM 安全校验**
   - 来源验证
   - 完整性校验
   - 沙箱执行

**交付物**：
- `core/format-detector.ts`
- `core/zip-parser.ts`
- `core/cfb-parser.ts`
- `core/wasm-validator.ts`

---

### 阶段三：DOCX Viewer 开发

**负责人**：前端架构师 Agent

**任务清单**：

1. **解析器**
   - `document.xml` 解析
   - `styles.xml` 样式解析
   - `numbering.xml` 编号解析
   - `theme/theme1.xml` 主题解析
   - `fontTable.xml` 字体表解析
   - `settings.xml` 设置解析
   - Header/Footer parts 解析
   - Drawing/Media parts 解析

2. **中间模型设计**
   - WordDocument 模型
   - Paragraph 模型
   - Table 模型
   - Drawing 模型
   - Section 模型

3. **布局引擎**
   - 流式布局
   - 分页处理（显式分页）
   - 表格布局
   - 图片锚定（drawing anchor）
   - 页眉页脚布局

4. **DOM 渲染器**
   - HTML 生成
   - CSS 样式注入
   - 字体加载等待
   - 图片加载等待
   - `awaitLayout` 机制

**关键增强点**：
- 图片锚定错位修复
- 表格图片跟随单元格
- 标题编号样式同步
- 字体图片未加载完就测量的问题

**交付物**：
- `packages/docx-viewer/` 完整包
- 导出 API：`parseAsync`, `renderDocument`, `renderAsync`

---

### 阶段四：DOC Viewer 开发

**负责人**：后端架构师 Agent

**任务清单**：

1. **复合二进制解析**
   - WordDocument stream 读取
   - 0Table / 1Table stream 处理
   - FIB（File Information Block）解析
   - CLX / Piece Table 处理
   - CHPX / PAPX 字符/段落属性
   - SPRM 属性解码

2. **内容提取**
   - 段落提取
   - 表格提取
   - 图片提取
   - 页眉页脚提取
   - 节属性提取

3. **向量图转换**
   - EMF/WMF 转 SVG
   - DIB 处理
   - OLE 对象处理

4. **布局运行时**
   - 分页视图
   - 文档流视图
   - 浮动对象处理
   - 页面标记

**交付物**：
- `packages/msdoc-viewer/` 完整包
- 导出 API：`parseMsDoc`, `renderMsDoc`, `mountMsDoc`, `convertMetafileToSvg`

---

### 阶段五：PPTX Viewer 开发

**负责人**：前端架构师 Agent

**任务清单**：

1. **幻灯片解析**
   - Presentation 解析
   - Slide 解析
   - Master/Layout 解析
   - Theme 解析

2. **形状树处理**
   - Shape 解析
   - Text Body 处理
   - Chart/Table 解析
   - Group Transform 处理
   - Image/Media 处理

3. **坐标系系统**
   - Slide Size 处理
   - 绝对坐标定位
   - 形状变换

4. **虚拟渲染**
   - 按需渲染
   - 虚拟列表
   - 提前渲染（rootMargin）
   - 文字排版修正

**交付物**：
- `packages/pptx-viewer/` 完整包
- 导出 API：`parsePptx`, `renderPresentationToHtml`, `renderPresentationToElement`

---

### 阶段六：PPT Viewer 开发

**负责人**：后端架构师 Agent

**任务清单**：

1. **二进制解析**
   - PowerPoint 记录解析
   - Persist Directory 处理
   - User Edit Atom 处理

2. **资源处理**
   - EMF/WMF 图片处理
   - DIB 处理
   - OLE 对象处理

3. **渐进渲染**
   - 逐页渲染
   - `yieldToBrowserPaint` 机制
   - 进度显示

**交付物**：
- `packages/ppt-viewer/` 完整包

---

### 阶段七：Excel Viewer 开发

**负责人**：前端架构师 Agent + 性能优化专家 Agent

**任务清单**：

1. **数据解析**
   - Workbook 解析
   - Worksheet 解析
   - Cell 数据解析
   - 样式解析
   - 公式解析（可选）

2. **度量转换**
   - 列宽（字符宽度 → px）
   - 行高（pt → px）

3. **表格渲染细节**
   - 合并单元格
   - 边框处理
   - 颜色填充
   - 冻结窗格
   - 图片锚点定位

4. **文字溢出处理**
   - 可溢出文本单元格识别
   - 内容层超出处理
   - 背景层隔离
   - 边框层避让

5. **虚拟滚动**
   - 可视范围计算
   - 虚拟窗口渲染
   - 滚动性能优化

6. **Worker 解析**
   - Worker 客户端
   - 大文件异步解析
   - 进度回调

**关键函数**：
- `isOverflowTextCell()` - 判断可溢出文本单元格
- `getVirtualViewportRange()` - 计算可视范围

**交付物**：
- `packages/excel-viewer/` 完整包
- 导出 API：`parseExcelWorkbook`, `renderExcelHtml`, `mountExcel`, `createExcelWorkerClient`

---

### 阶段八：性能优化

**负责人**：性能优化专家 Agent

**任务清单**：

1. **按需加载**
   - 动态 import
   - Promise 缓存
   - 模块懒加载

2. **Worker 解析**
   - Excel Worker
   - DOC Worker（可选）
   - 进度事件

3. **虚拟渲染**
   - PPT 虚拟列表
   - Excel 虚拟窗口
   - 提前预加载

4. **渲染优化**
   - 渐进式渲染
   - `yieldToBrowserPaint`
   - DOM 操作优化

**交付物**：
- 性能测试报告
- 优化后的代码
- 性能监控工具

---

### 阶段九：Demo 界面开发

**负责人**：UI Designer Agent + 前端架构师 Agent

**任务清单**：

1. **文件上传**
   - 拖拽上传
   - 点击上传
   - 文件验证

2. **格式切换**
   - 格式选择器
   - Viewer 动态加载
   - `loadViewerModule()` 实现

3. **预览容器**
   - DOM 挂载
   - 视图切换（分页/流式）
   - 缩放控制

4. **诊断面板**
   - 耗时统计
   - 页数/幻灯片数/工作表数
   - 资源数量
   - 错误信息

5. **统一入口**
   - `renderByFormat()` 实现
   - 格式分发
   - 错误处理

**交付物**：
- `demo/` 完整演示页面
- 在线可访问的 Demo

---

### 阶段十：测试与集成

**负责人**：API Test Pro Agent

**任务清单**：

1. **单元测试**
   - 容器层测试
   - 解析层测试
   - 布局层测试
   - 渲染层测试

2. **集成测试**
   - 端到端渲染测试
   - 各格式兼容性测试
   - 大文件测试

3. **性能测试**
   - 渲染耗时统计
   - 内存占用分析
   - 首屏加载测试

4. **兼容性测试**
   - 浏览器兼容性
   - 各种 Office 版本文件测试

**测试文件集合**：
- DOCX：4.6 MB 样例
- PPTX：20.8 MB 样例
- XLSX：387 KB 样例
- 各种复杂文档（表格、图片、页眉页脚等）

**交付物**：
- 测试用例库
- 测试报告
- 兼容性矩阵

---

## 多 Agent 协作流程

### 完整工作流（8 阶段）

1. **需求分析** → 产品经理 Agent
2. **架构设计** → 架构师 Agent
3. **UI 设计** → UI Designer Agent
4. **测试设计** → 测试专家 Agent
5. **任务分解** → SOLO Coder（当前）
6. **开发实现** → 各专业 Agent 并行
7. **测试验证** → 测试专家 Agent
8. **发布评审** → 多角色共识

### 并行开发策略

- **高优先级并行**：DOCX、DOC、Excel Viewer 可以并行开发
- **中优先级并行**：PPTX、PPT Viewer 可以并行开发
- **依赖关系**：容器层 → 各格式 Viewer → Demo → 测试

---

## 里程碑与时间线

| 里程碑 | 任务 | 预计时间 |
|--------|------|----------|
| M1 | 项目架构 + 容器层 | 1 周 |
| M2 | DOCX Viewer | 2 周 |
| M3 | DOC Viewer | 2 周 |
| M4 | Excel Viewer | 2 周 |
| M5 | PPTX + PPT Viewer | 2 周 |
| M6 | Demo + 性能优化 | 1 周 |
| M7 | 测试 + 集成 | 1 周 |
| **总计** | | **11 周** |

---

## 风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| Office 规范过于庞大 | 高 | 分阶段实现，优先核心功能 |
| 旧二进制格式复杂 | 高 | 参考开源实现，逐步完善 |
| 性能问题 | 中 | 早期纳入性能优化专家 |
| 浏览器兼容性 | 中 | 早期测试，使用 polyfill |
| 还原度不足 | 中 | 收集用户反馈，迭代优化 |

---

## 参考资源

### 开源参考

- **docx-preview** - DOCX 路线参考和改造基础
- **SheetJS / ExcelJS** - 数据结构参考
- **Luckysheet / x-spreadsheet** - 交互参考
- **PPTXjs** - PPTX 思路参考

### 技术文档

- [Office Open XML 规范](https://www.ecma-international.org/publications-and-standards/standards/ecma-376/)
- [Compound File Binary 格式](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/)

---

## 成功标准

- ✅ DOCX：4.6 MB 文件 < 500ms 渲染完成
- ✅ PPTX：20.8 MB 文件 < 2s 渲染完成
- ✅ XLSX：387 KB 文件 < 2s 渲染完成
- ✅ 支持 6 种格式
- ✅ 高还原度：表格、图片、页眉页脚、合并单元格
- ✅ 纯前端，无第三方服务依赖
