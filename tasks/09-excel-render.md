# 任务 9：Excel Viewer - 表格渲染与虚拟滚动

**负责人**：前端架构师 Agent + 性能优化专家 Agent  
**优先级**：🔴 高  
**依赖**：任务 8  
**预计时间**：4 天

---

## 任务目标

实现 Excel 表格渲染引擎，支持高还原度显示和虚拟滚动。

---

## 任务清单

### 1. 基础表格渲染

**文件**：`packages/excel-viewer/src/render/`

- [ ] 实现单元格渲染
  - [ ] 文本/数字/日期显示
  - [ ] 富文本支持
  - [ ] 公式结果显示

- [ ] 实现合并单元格
  - [ ] colspan/rowspan 计算
  - [ ] 合并单元格样式处理
  - [ ] 边框处理

- [ ] 实现样式应用
  - [ ] 字体样式
  - [ ] 背景填充
  - [ ] 边框（四边框可能不同）
  - [ ] 对齐方式
  - [ ] 数字格式

- [ ] 实现冻结窗格
  - [ ] 冻结行/列固定
  - [ ] 滚动时保持可见

- [ ] 实现图片锚点定位
  - [ ] 图片渲染
  - [ ] 相对单元格定位
  - [ ] 层级控制

### 2. 文字溢出处理

**文件**：`packages/excel-viewer/src/render/overflow.ts`

- [ ] 实现 `isOverflowTextCell` 函数
  ```typescript
  export function isOverflowTextCell(
    sheet: Worksheet,
    row: number,
    col: number,
    workbook: Workbook
  ): boolean;
  ```
  - [ ] 检查是否有可渲染内容
  - [ ] 检查是否有自动换行
  - [ ] 检查是否是数字（通常不溢出）
  - [ ] 检查是否有 checkbox

- [ ] 实现内容层溢出
  - [ ] 内容可以超出单元格宽度
  - [ ] 不截断文字

- [ ] 实现背景层隔离
  - [ ] 背景只在原单元格内
  - [ ] 不随文字延伸

- [ ] 实现边框层避让
  - [ ] 被文字覆盖的边框不显示
  - [ ] 保持视觉正确

### 3. 虚拟滚动

**文件**：`packages/excel-viewer/src/virtual-scroll/`

- [ ] 实现 `getVirtualViewportRange` 函数
  ```typescript
  export function getVirtualViewportRange(
    sheet: Worksheet,
    metrics: ViewMetrics,
    scrollState: ScrollState,
    viewport: Viewport,
    options?: Options
  ): ViewportRange;
  ```
  - [ ] 计算可见行范围
  - [ ] 计算可见列范围
  - [ ] 考虑提前渲染缓冲

- [ ] 实现虚拟窗口渲染
  - [ ] 只渲染可见区域单元格
  - [ ] 使用绝对定位
  - [ ] 实现 `ensureVirtualWindow` 确保窗口大小
  - [ ] 动态创建/移除 DOM 元素

- [ ] 实现滚动性能优化
  - [ ] 滚动防抖
  - [ ] 渲染节流
  - [ ] 缓存已渲染单元格

### 4. CSS 样式

**文件**：`packages/excel-viewer/src/view.css` 或 `render/styles.ts`

- [ ] 表格容器样式
- [ ] 单元格样式
- [ ] 文字溢出效果
- [ ] 冻结窗格固定样式
- [ ] 滚动条样式

### 5. 渲染入口

**文件**：`packages/excel-viewer/src/render/index.ts`

- [ ] 实现 `renderExcelHtml` 函数
  ```typescript
  export function renderExcelHtml(
    sheet: Worksheet,
    options?: RenderOptions
  ): RenderResult;
  ```

- [ ] 导出 API

### 6. 测试

- [ ] 渲染功能测试
- [ ] 文字溢出测试
- [ ] 虚拟滚动测试
- [ ] 性能测试

---

## 交付物清单

- ✅ `packages/excel-viewer/src/render/` 渲染模块
- ✅ `packages/excel-viewer/src/virtual-scroll/` 虚拟滚动模块
- ✅ `packages/excel-viewer/src/render/overflow.ts` 文字溢出处理
- ✅ 完整 API 导出
- ✅ 测试文件

---

## 验收标准

- [ ] 表格渲染高还原度
- [ ] 文字溢出效果正确（内容延伸但背景不延伸）
- [ ] 虚拟滚动流畅
- [ ] 大文件（10万+ 单元格）仍能流畅滚动
- [ ] 所有测试通过
