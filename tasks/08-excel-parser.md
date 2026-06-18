# 任务 8：Excel Viewer - 数据解析

**负责人**：前端架构师 Agent  
**优先级**：🔴 高  
**依赖**：任务 2, 3  
**预计时间**：3 天

---

## 任务目标

实现 Excel 文件解析器，支持 .xls 和 .xlsx 格式。

---

## 任务清单

### 1. 创建 excel-viewer 包

- [ ] 初始化 `packages/excel-viewer/` 目录
- [ ] 创建 `package.json`
- [ ] 创建 `tsconfig.json`

### 2. 中间模型设计

**文件**：`packages/excel-viewer/src/model/`

- [ ] 设计 Workbook 模型
  - [ ] Workbook 属性
  - [ ] Sheets 列表
  - [ ] 样式表
  - [ ] 共享字符串
  - [ ] 主题

- [ ] 设计 Worksheet 模型
  - [ ] Sheet 名称
  - [ ] 数据区域（dimensions）
  - [ ] Cells 数据
  - [ ] 合并单元格信息
  - [ ] 列宽/行高信息
  - [ ] 冻结窗格信息
  - [ ] 图片/绘图信息

- [ ] 设计 Cell 模型
  - [ ] 单元格位置（row, col）
  - [ ] 单元格值
  - [ ] 数据类型（string/number/date/formula）
  - [ ] 样式引用
  - [ ] 富文本信息
  - [ ] Checkbox 信息

- [ ] 设计 Style 模型
  - [ ] 字体样式
  - [ ] 填充样式
  - [ ] 边框样式
  - [ ] 对齐方式
  - [ ] 数字格式

### 3. XLSX 解析（使用 ZIP 解析器）

**文件**：`packages/excel-viewer/src/parser/xlsx-parser.ts`

- [ ] 解析 Workbook
  - [ ] `xl/workbook.xml`
  - [ ] Sheet 列表
  - [ ] 关系解析

- [ ] 解析 Worksheet
  - [ ] `xl/worksheets/sheet*.xml`
  - [ ] Sheet 数据
  - [ ] 合并单元格
  - [ ] 列宽/行高
  - [ ] 冻结窗格

- [ ] 解析 Shared Strings
  - [ ] `xl/sharedStrings.xml`
  - [ ] 字符串表

- [ ] 解析 Styles
  - [ ] `xl/styles.xml`
  - [ ] 字体、填充、边框
  - [ ] 单元格样式

- [ ] 解析 Theme
  - [ ] `xl/theme/theme1.xml`
  - [ ] 主题颜色

- [ ] 解析 Drawings（图片）
  - [ ] `xl/drawings/drawing*.xml`
  - [ ] 图片关系
  - [ ] 图片锚点

### 4. XLS 解析（使用 CFB 解析器）

**文件**：`packages/excel-viewer/src/parser/xls-parser.ts`

- [ ] 解析 BIFF 格式（基础支持）
  - [ ] 读取 Workbook Stream
  - [ ] 解析 SST（Shared String Table）
  - [ ] 解析 Bound Sheet
  - [ ] 解析 Sheet 数据
  - [ ] 解析 Row/Cell 记录

### 5. 度量转换

**文件**：`packages/excel-viewer/src/parser/metric-converter.ts`

- [ ] 实现列宽转换（字符宽度 → px）
  - [ ] 基于默认字体计算
  - [ ] 支持自定义字体

- [ ] 实现行高转换（pt → px）
  - [ ] Point 到 Pixel 转换

### 6. 入口函数

**文件**：`packages/excel-viewer/src/parser/index.ts`

- [ ] 实现 `parseExcelWorkbook` 函数
  ```typescript
  export async function parseExcelWorkbook(
    data: ArrayBuffer | Blob | File,
    options?: ParseOptions
  ): Promise<Workbook>;
  ```

- [ ] 实现 `streamExcelRows` 流式解析（可选）

### 7. 单元测试

- [ ] 模型测试
- [ ] XLSX 解析测试
- [ ] XLS 解析测试
- [ ] 真实文件测试

---

## 交付物清单

- ✅ `packages/excel-viewer/src/model/` 模型定义
- ✅ `packages/excel-viewer/src/parser/xlsx-parser.ts`
- ✅ `packages/excel-viewer/src/parser/xls-parser.ts`
- ✅ `packages/excel-viewer/src/parser/metric-converter.ts`
- ✅ `packages/excel-viewer/src/parser/index.ts` 入口
- ✅ 测试文件

---

## 验收标准

- [ ] 可以解析 .xlsx 文件
- [ ] 可以解析 .xls 文件（基础支持）
- [ ] 单元格数据正确读取
- [ ] 样式信息完整
- [ ] 所有测试通过
