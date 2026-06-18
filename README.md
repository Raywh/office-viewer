# Office Viewer

TypeScript 纯前端 Office 渲染引擎 - 支持 DOC/DOCX/PPT/PPTX/XLS/XLSX

## 特性

- ✅ 纯前端实现，无需后端服务
- 📄 支持 Word 文档 (.doc, .docx)
- 📊 支持 Excel 表格 (.xls, .xlsx)
- 🎨 支持 PowerPoint 演示文稿 (.ppt, .pptx)
- 🚀 高性能，虚拟滚动（Excel）
- 📦 Monorepo 架构，pnpm 管理

## 快速开始

### 安装

```bash
npm install -g pnpm
pnpm install
```

### 启动 Demo

```bash
pnpm dev
```

## 项目结构

```
office-viewer/
├── packages/
│   ├── core/          # 核心格式解析
│   ├── docx-viewer/   # Word 查看器
│   ├── excel-viewer/  # Excel 查看器
│   ├── pptx-viewer/   # PowerPoint 查看器
│   ├── msdoc-viewer/  # 旧格式 Word 查看器
│   └── ppt-viewer/    # 旧格式 PowerPoint 查看器
└── demo/              # 演示应用
```

## License

MIT
