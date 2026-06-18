# 任务 5：DOCX Viewer - 布局与渲染

**负责人**：前端架构师 Agent  
**优先级**：🔴 高  
**依赖**：任务 4  
**预计时间**：4 天

---

## 任务目标

实现 DOCX 布局引擎和 DOM 渲染器，生成可显示的 HTML。

---

## 任务清单

### 1. 布局引擎

**文件**：`packages/docx-viewer/src/layout/`

#### 1.1 流式布局
- [ ] 实现流式布局引擎
- [ ] 处理段落流
- [ ] 处理表格布局
- [ ] 处理文本换行

#### 1.2 分页处理
- [ ] 实现显式分页识别
- [ ] 计算分页位置
- [ ] 处理跨页表格
- [ ] 支持分页视图和流式视图切换

#### 1.3 高级布局
- [ ] 实现图片锚定（drawing anchor）
  - [ ] 绝对位置定位
  - [ ] 相对位置定位
  - [ ] 锚点修复，解决错位问题
- [ ] 实现页眉页脚布局
  - [ ] 首页不同
  - [ ] 奇偶页不同
  - [ ] 边距计算
- [ ] 实现表格图片跟随单元格
  - [ ] 表格内图片定位
  - [ ] 行内图片布局

### 2. DOM 渲染器

**文件**：`packages/docx-viewer/src/render/`

#### 2.1 HTML 生成
- [ ] 实现 Paragraph 渲染
  - [ ] 文本样式应用
  - [ ] 段落样式应用
  - [ ] 编号渲染
  - [ ] 标题编号样式同步

- [ ] 实现 Table 渲染
  - [ ] 表格边框
  - [ ] 单元格合并
  - [ ] 单元格样式

- [ ] 实现 Drawing 渲染
  - [ ] 图片渲染
  - [ ] SVG 渲染
  - [ ] 图表处理（可选）

#### 2.2 CSS 样式
- [ ] 生成样式表
- [ ] 支持主题颜色
- [ ] 支持自定义样式

#### 2.3 awaitLayout 机制
- [ ] 实现字体加载等待
  - [ ] 检测字体是否加载
  - [ ] Font Face Observer 集成（可选）

- [ ] 实现图片加载等待
  - [ ] 图片预加载
  - [ ] 加载进度回调

- [ ] 实现布局测量等待
  - [ ] DOM 渲染后测量
  - [ ] 确保渲染完成

### 3. 入口 API

**文件**：`packages/docx-viewer/src/index.ts`

- [ ] 实现 `renderDocument` 函数
  ```typescript
  export async function renderDocument(
    doc: WordDocument,
    options?: RenderOptions
  ): Promise<RenderResult>;
  ```

- [ ] 实现 `renderAsync` 函数
  ```typescript
  export async function renderAsync(
    data: ArrayBuffer | Blob | File,
    container: HTMLElement,
    styleContainer?: HTMLElement,
    options?: RenderOptions
  ): Promise<void>;
  ```

### 4. 测试
- [ ] 布局引擎测试
- [ ] 渲染器测试
- [ ] 集成测试（使用真实文件）

---

## 交付物清单

- ✅ `packages/docx-viewer/src/layout/` 布局模块
- ✅ `packages/docx-viewer/src/render/` 渲染模块
- ✅ `packages/docx-viewer/src/index.ts` 入口文件
- ✅ `packages/docx-viewer/tests/` 测试文件

---

## 验收标准

- [ ] 可以正常渲染 DOCX 文档
- [ ] 表格、图片、样式显示正确
- [ ] 图片锚定无错位
- [ ] 标题编号样式同步正确
- [ ] 支持分页/流式视图切换
- [ ] 所有测试通过
