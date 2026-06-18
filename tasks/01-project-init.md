# 任务 1：项目初始化与架构搭建

**负责人**：架构师 Agent  
**优先级**：🔴 高  
**依赖**：无  
**预计时间**：3 天

---

## 任务目标

初始化 monorepo 项目，搭建完整的开发基础设施。

---

## 任务清单

### 1. 项目结构初始化

- [ ] 创建 monorepo 项目结构
  - [ ] 使用 pnpm workspaces 或 turborepo
  - [ ] 创建根目录 `package.json`
  - [ ] 创建 `pnpm-workspace.yaml` 或 `turbo.json`

- [ ] 创建目录结构：
  ```
  office-viewer/
  ├── packages/
  │   ├── core/
  │   ├── msdoc-viewer/
  │   ├── docx-viewer/
  │   ├── ppt-viewer/
  │   ├── pptx-viewer/
  │   └── excel-viewer/
  ├── demo/
  ├── docs/
  └── tests/
  ```

### 2. TypeScript 配置

- [ ] 创建根目录 `tsconfig.json`
- [ ] 配置各包的 `tsconfig.json`（继承自根配置）
- [ ] 配置路径别名（`@office-viewer/*`）

### 3. 代码规范配置

- [ ] 配置 ESLint
  - [ ] `eslint.config.js`
  - [ ] 集成 TypeScript 支持
  - [ ] 配置代码规范规则

- [ ] 配置 Prettier
  - [ ] `.prettierrc`
  - [ ] `.prettierignore`
  - [ ] 与 ESLint 集成

### 4. 测试框架配置

- [ ] 配置 Vitest
  - [ ] `vitest.config.ts`
  - [ ] 测试环境设置
  - [ ] 覆盖率配置

### 5. 打包工具配置

- [ ] 配置 Vite / Rollup
  - [ ] 各包的构建配置
  - [ ] TypeScript 声明文件生成
  - [ ] 打包格式（ESM + CommonJS）

### 6. Git 配置

- [ ] 创建 `.gitignore`
- [ ] 创建 `.gitattributes`（可选）
- [ ] 初始化 Git 仓库

### 7. 文档创建

- [ ] 创建根目录 `README.md`（可复用已有内容）
- [ ] 创建 `CONTRIBUTING.md`（可选）
- [ ] 创建各包的基础 `README.md`

---

## 交付物清单

- ✅ 完整初始化的项目仓库
- ✅ `package.json`（根 + 各包）
- ✅ `tsconfig.json`（根 + 各包）
- ✅ `eslint.config.js` + `.prettierrc`
- ✅ `vitest.config.ts`
- ✅ 构建配置
- ✅ `.gitignore`
- ✅ 基础文档

---

## 验收标准

- [ ] 可以运行 `pnpm install`（或 `npm install`）
- [ ] 可以运行 `pnpm build` 构建所有包
- [ ] 可以运行 `pnpm test` 运行测试
- [ ] 可以运行 `pnpm lint` 检查代码规范
- [ ] TypeScript 类型检查无错误
