# TypeScript 纯前端 Office 渲染引擎 - 多任务开发计划

## 项目介绍

这是一个 TypeScript 实现的纯前端 Office 文档渲染引擎，支持 6 种格式：
- **📄 DOC / DOCX**: Word 文档查看
- **📊 XLS / XLSX**: Excel 表格查看（支持虚拟滚动）
- **📽️ PPT / PPTX**: PowerPoint 演示文稿查看

## 项目结构

```
office-viewer/
├── packages/
│   ├── core/              # 容器层：格式识别、ZIP/CFB 解析
│   ├── msdoc-viewer/      # .doc 老格式查看
│   ├── docx-viewer/       # DOCX 查看
│   ├── ppt-viewer/        # .ppt 老格式查看
│   ├── pptx-viewer/       # PPTX 查看
│   └── excel-viewer/      # Excel 查看（含虚拟滚动）
├── demo/                  # Demo 项目
├── agents/                # Trae 多 Agent 配置
├── tasks/                 # 任务计划
└── plan.md                # 总体计划
```

## 快速开始

### 1. 安装依赖

```bash
# 请确保已安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 2. 启动 Demo

```bash
pnpm dev
```

### 3. 构建项目

```bash
pnpm build
```

## 使用说明

### 安装到您的项目

```bash
pnpm install @office-viewer/docx-viewer
pnpm install @office-viewer/excel-viewer
# ... 其他包
```

### DOCX 查看

```typescript
import { parseAsync, renderAsync } from '@office-viewer/docx-viewer';

async function viewDocx(file: File, container: HTMLElement) {
  const doc = await parseAsync(file);
  await renderAsync(file, container);
}
```

### Excel 查看

```typescript
import { parseExcelWorkbook, mountExcel } from '@office-viewer/excel-viewer';

async function viewExcel(file: File, container: HTMLElement) {
  const buffer = await file.arrayBuffer();
  const workbook = parseExcelWorkbook(buffer);
  mountExcel(container, workbook);
}
```

## 任务进度

| 任务 | 状态 | 负责人 |
|------|------|--------|
| 任务 1：项目初始化与架构搭建 | ✅ 完成 | 架构师 |
| 任务 2：容器层 - 格式识别与 ZIP 解析 | ✅ 完成 | 后端架构师 |
| 任务 3：容器层 - CFB 解析与 WASM 校验 | ✅ 完成 | 后端架构师 |
| 任务 4：DOCX Viewer - 解析器 | ✅ 完成 | 前端架构师 |
| 任务 5：DOCX Viewer - 布局与渲染 | ✅ 完成 | 前端架构师 |
| 任务 6/7：完善 .doc 老格式查看器 | ✅ 完成 | 后端架构师 |
| 任务 8：Excel Viewer - 数据解析 | ✅ 完成 | 前端架构师 |
| 任务 9：Excel Viewer - 表格渲染与虚拟滚动 | ✅ 完成 | 前端 + 性能专家 |
| 任务 11/12：完善 PowerPoint 查看器 | ✅ 完成 | 前端架构师 |
| 任务 13：Demo 界面开发 | ✅ 完成 | UI 设计师 + 前端 |

## License

MIT
