# 任务 13：Demo 界面开发

**负责人**：UI Designer Agent + 前端架构师 Agent  
**优先级**：🟡 中  
**依赖**：任务 5, 7, 10, 11, 12（至少完成部分 Viewer）  
**预计时间**：3 天

---

## 任务目标

创建演示应用，展示 Office Viewer 的完整功能。

---

## 任务清单

### 1. 初始化 Demo 项目

- [ ] 创建 `demo/` 目录
- [ ] 使用 Vite 初始化（可选，或纯 HTML/CSS/JS）
- [ ] 配置依赖（引用本地 packages）
- [ ] 基础 HTML 结构

### 2. 文件上传组件

**文件**：`demo/src/components/FileUploader.ts`

- [ ] 实现拖拽上传
  - [ ] 拖拽区域 UI
  - [ ] 拖拽视觉反馈
  - [ ] 文件获取

- [ ] 实现点击上传
  - [ ] 文件选择按钮
  - [ ] 多文件支持（可选）

- [ ] 文件验证
  - [ ] 文件类型检查
  - [ ] 文件大小限制（可选）

### 3. 格式切换与 Viewer 加载

**文件**：`demo/src/loader.ts`

- [ ] 实现格式选择器
  - [ ] 下拉菜单或按钮组
  - [ ] 显示当前格式

- [ ] 实现 `loadViewerModule` 函数
  ```typescript
  async function loadViewerModule(format: FileFormat): Promise<any> {
    // 动态 import 对应 Viewer
  }
  ```
  - [ ] 动态 import
  - [ ] Promise 缓存
  - [ ] 懒加载

- [ ] 实现 `renderByFormat` 统一入口
  ```typescript
  async function renderByFormat(
    format: FileFormat,
    data: ArrayBuffer,
    container: HTMLElement
  ): Promise<RenderSummary>;
  ```
  - [ ] 格式分发到对应 Viewer
  - [ ] 错误处理
  - [ ] 返回渲染摘要

### 4. 预览容器

**文件**：`demo/src/components/PreviewContainer.ts`

- [ ] DOM 挂载区域
  - [ ] 预览容器样式
  - [ ] 响应式布局

- [ ] 视图切换
  - [ ] Word：分页视图 / 文档流视图切换
  - [ ] PPT：单页 / 缩略图 / 大纲（可选）
  - [ ] Excel：正常视图

- [ ] 缩放控制
  - [ ] 缩放滑块/按钮
  - [ ] 100% / 适应宽度 / 适应高度

### 5. 诊断面板

**文件**：`demo/src/components/DiagnosticPanel.ts`

- [ ] 耗时统计
  - [ ] 解析时间
  - [ ] 渲染时间
  - [ ] 总时间

- [ ] 资源统计
  - [ ] 页数（Word/PPT）
  - [ ] 幻灯片数（PPT）
  - [ ] 工作表数（Excel）
  - [ ] 图片数量
  - [ ] 表格数量

- [ ] 错误信息
  - [ ] 错误提示显示
  - [ ] 错误详情（可选）

- [ ] WASM 校验状态

### 6. 界面布局与样式

**文件**：`demo/src/style.css`

- [ ] 整体布局
  - [ ] 顶部导航/工具栏
  - [ ] 左侧文件/设置（可选）
  - [ ] 主预览区域
  - [ ] 右侧诊断面板

- [ ] UI 设计
  - [ ] 现代化界面风格
  - [ ] 响应式设计
  - [ ] 深色/浅色主题（可选）

### 7. Demo 状态管理

**文件**：`demo/src/state.ts`

- [ ] 当前文件状态
- [ ] 当前格式
- [ ] 渲染结果
- [ ] 视图模式
- [ ] 缩放比例
- [ ] 诊断信息

### 8. 集成测试

- [ ] 端到端测试（上传 → 渲染 → 验证）
- [ ] 使用示例文件测试

---

## 交付物清单

- ✅ `demo/` 完整演示应用
- ✅ `demo/index.html`
- ✅ `demo/src/` 所有源文件
- ✅ 可运行的本地 Demo
- ✅ 部署说明

---

## 验收标准

- [ ] 可以上传 Office 文件
- [ ] 可以渲染 6 种格式
- [ ] 界面美观、易用
- [ ] 诊断信息显示正确
- [ ] Demo 可以正常构建和运行
