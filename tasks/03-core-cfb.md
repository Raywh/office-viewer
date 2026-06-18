# 任务 3：容器层 - CFB 解析与 WASM 校验

**负责人**：后端架构师 Agent  
**优先级**：🔴 高  
**依赖**：任务 1  
**预计时间**：3 天

---

## 任务目标

实现 CFB（Compound File Binary）解析器用于旧格式 .doc/.ppt/.xls，以及 WASM 安全校验。

---

## 任务清单

### 1. CFB 解析器

**文件**：`packages/core/src/cfb-parser.ts`

#### 1.1 CFB 基础结构解析
- [ ] 解析 Header
  - [ ] 签名验证（`D0 CF 11 E0 A1 B1 1A E1`）
  - [ ] 读取扇区大小、Mini 扇区大小
  - [ ] 读取 FAT 扇区链
  - [ ] 读取 Mini FAT 扇区链
  - [ ] 读取目录流起始位置

- [ ] 解析 FAT（File Allocation Table）
  - [ ] 读取 FAT 扇区
  - [ ] 构建扇区链
  - [ ] 支持自由、结束、FAT、DIFAT 等特殊扇区类型

- [ ] 解析目录流
  - [ ] 读取目录条目
  - [ ] 解析红黑树结构
  - [ ] 支持根、用户流、存储等类型

#### 1.2 Stream 读取
- [ ] 实现 Stream 内容提取
  - [ ] 读取普通 Stream（使用 FAT）
  - [ ] 读取 Mini Stream（使用 Mini FAT）
  - [ ] 处理截断流
  - [ ] 流式读取大文件

- [ ] 导出 API：
  ```typescript
  export class CfbPackage {
    constructor(data: ArrayBuffer);
    getStream(path: string): Promise<ArrayBuffer | null>;
    getStream(name: string, parent?: string): Promise<ArrayBuffer | null>;
    listStreams(): string[];
  }
  ```

### 2. WASM 安全校验

**文件**：`packages/core/src/wasm-validator.ts`

- [ ] 实现来源验证
  - [ ] 检查 WASM 来源 URL
  - [ ] 白名单验证（可选）

- [ ] 实现完整性校验
  - [ ] 支持 SHA-256 哈希校验
  - [ ] 支持签名验证（可选）

- [ ] 实现沙箱执行
  - [ ] 内存限制
  - [ ] 执行时间限制
  - [ ] 导入函数限制

- [ ] 导出 API：
  ```typescript
  export class WasmValidator {
    validateSource(source: string | URL): Promise<boolean>;
    validateIntegrity(data: ArrayBuffer, hash: string): Promise<boolean>;
    createSandboxedInstance(
      module: WebAssembly.Module,
      options?: SandboxOptions
    ): Promise<WebAssembly.Instance>;
  }
  ```

### 3. 单元测试

- [ ] CFB 解析测试
  - [ ] Header 解析测试
  - [ ] FAT 解析测试
  - [ ] 目录流解析测试
  - [ ] Stream 读取测试

- [ ] WASM 校验测试
  - [ ] 来源验证测试
  - [ ] 完整性校验测试
  - [ ] 沙箱执行测试

---

## 交付物清单

- ✅ `packages/core/src/cfb-parser.ts`
- ✅ `packages/core/src/wasm-validator.ts`
- ✅ `packages/core/src/index.ts`（更新导出）
- ✅ `packages/core/tests/cfb-parser.test.ts`
- ✅ `packages/core/tests/wasm-validator.test.ts`

---

## 验收标准

- [ ] 可以解析 CFB 格式的 Office 文件
- [ ] 可以正确读取 Stream 内容
- [ ] WASM 安全校验功能正常
- [ ] 所有测试通过
- [ ] TypeScript 类型检查无错误
