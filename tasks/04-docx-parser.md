# 任务 4：DOCX Viewer - 解析器

**负责人**：前端架构师 Agent  
**优先级**：🔴 高  
**依赖**：任务 2  
**预计时间**：4 天

---

## 任务目标

实现 DOCX 文档的解析器，将 XML 转换为中间模型。

---

## 任务清单

### 1. 创建 docx-viewer 包

- [ ] 初始化 `packages/docx-viewer/` 目录
- [ ] 创建 `package.json`
- [ ] 创建 `tsconfig.json`

### 2. 中间模型设计

**文件**：`packages/docx-viewer/src/model/`

- [ ] 设计 WordDocument 模型
  - [ ] 文档属性（标题、作者、主题等）
  - [ ] Sections 列表
  - [ ] Relationships 关系

- [ ] 设计 Section 模型
  - [ ] 页面设置（大小、边距、方向）
  - [ ] 页眉页脚
  - [ ] 列设置
  - [ ] Body 内容

- [ ] 设计 Paragraph 模型
  - [ ] 段落属性（对齐、缩进、间距等）
  - [ ] 段落编号
  - [ ] Runs 列表

- [ ] 设计 Run 模型
  - [ ] 文本属性（字体、大小、颜色、粗体、斜体等）
  - [ ] 文本内容
  - [ ] 换行、制表符等特殊字符
  - [ ]  Drawing 图片引用

- [ ] 设计 Table 模型
  - [ ] 表格属性
  - [ ] Rows 列表
  - [ ] Cells 列表（含合并信息）
  - [ ] Cell 内容（段落）

- [ ] 设计 Drawing 模型
  - [ ] 图片数据
  - [ ] 位置信息（锚定/行内）
  - [ ] 尺寸信息
  - [ ] 关系 ID

- [ ] 设计其他模型
  - [ ] Header/Footer
  - [ ] Bookmark
  - [ ] Comment

### 3. 实现各 XML 解析器

#### 3.1 文档解析器

**文件**：`packages/docx-viewer/src/parser/document-parser.ts`

- [ ] 解析 `document.xml`
  - [ ] 解析 Body
  - [ ] 解析 Paragraphs
  - [ ] 解析 Tables
  - [ ] 解析 Sections

#### 3.2 样式解析器

**文件**：`packages/docx-viewer/src/parser/styles-parser.ts`

- [ ] 解析 `styles.xml`
  - [ ] 解析样式定义
  - [ ] 解析默认样式
  - [ ] 继承关系处理

#### 3.3 编号解析器

**文件**：`packages/docx-viewer/src/parser/numbering-parser.ts`

- [ ] 解析 `numbering.xml`
  - [ ] 解析抽象编号定义
  - [ ] 解析编号实例
  - [ ] 多级列表支持

#### 3.4 主题解析器

**文件**：`packages/docx-viewer/src/parser/theme-parser.ts`

- [ ] 解析 `theme/theme1.xml`
  - [ ] 解析主题颜色
  - [ ] 解析主题字体
  - [ ] 解析主题格式

#### 3.5 其他解析器

- [ ] 解析 `fontTable.xml` 字体表
- [ ] 解析 `settings.xml` 设置
- [ ] 解析 Header/Footer parts
- [ ] 解析 Drawing/Media parts（图片、图表等）

### 4. 入口函数

**文件**：`packages/docx-viewer/src/parser/index.ts`

- [ ] 实现 `parseAsync` 函数
  ```typescript
  export async function parseAsync(
    data: ArrayBuffer | Blob | File,
    options?: ParseOptions
  ): Promise<WordDocument>;
  ```

- [ ] 整合所有解析器
- [ ] 加载 WordDocument 模型

### 5. 单元测试

- [ ] 中间模型测试
- [ ] 各 XML 解析器测试
- [ ] 完整文档解析测试
- [ ] 使用真实 DOCX 文件测试

---

## 交付物清单

- ✅ `packages/docx-viewer/src/model/` 完整模型定义
- ✅ `packages/docx-viewer/src/parser/` 各解析器
- ✅ `packages/docx-viewer/src/parser/index.ts` 入口
- ✅ `packages/docx-viewer/tests/` 测试文件

---

## 验收标准

- [ ] 可以完整解析 DOCX 文件
- [ ] 中间模型数据完整
- [ ] 样式、编号、主题正确解析
- [ ] 所有测试通过
- [ ] TypeScript 类型检查无错误
