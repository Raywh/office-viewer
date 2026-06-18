# 任务 2：容器层 - 格式识别与 ZIP 解析

**负责人**：后端架构师 Agent  
**优先级**：🔴 高  
**依赖**：任务 1  
**预计时间**：3 天

---

## 任务目标

实现格式识别模块和 ZIP 解析器，用于处理 .docx/.pptx/.xlsx 等 Open XML 格式。

---

## 任务清单

### 1. 创建 core 包

- [ ] 初始化 `packages/core/` 目录
- [ ] 创建 `package.json`
- [ ] 创建 `tsconfig.json`

### 2. 格式识别模块

**文件**：`packages/core/src/format-detector.ts`

- [ ] 实现文件魔数检测
  - [ ] DOCX: `50 4B 03 04` (ZIP) + 检查内部结构
  - [ ] PPTX: 同上 ZIP 格式
  - [ ] XLSX: 同上 ZIP 格式
  - [ ] DOC: `D0 CF 11 E0` (CFB)
  - [ ] PPT: 同上 CFB 格式
  - [ ] XLS: 同上 CFB 格式

- [ ] 实现扩展名验证
  - [ ] `.doc`, `.docx`, `.ppt`, `.pptx`, `.xls`, `.xlsx`

- [ ] 实现 MIME 类型识别
  - [ ] `application/msword`
  - [ ] `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - [ ] `application/vnd.ms-powerpoint`
  - [ ] `application/vnd.openxmlformats-officedocument.presentationml.presentation`
  - [ ] `application/vnd.ms-excel`
  - [ ] `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

- [ ] 导出 API：
  ```typescript
  export function detectFormat(data: ArrayBuffer | Blob | File): FileFormat;
  export type FileFormat = 'doc' | 'docx' | 'ppt' | 'pptx' | 'xls' | 'xlsx' | 'unknown';
  ```

### 3. ZIP 解析器

**文件**：`packages/core/src/zip-parser.ts`

- [ ] 实现 ZIP 文件读取
  - [ ] 解析 Local File Header
  - [ ] 解析 Central Directory
  - [ ] 解析 End of Central Directory

- [ ] 实现 Open Packaging Convention (OPC) 支持
  - [ ] 读取 `_rels/.rels` 关系文件
  - [ ] 读取 `[Content_Types].xml`
  - [ ] 解析 package relationships

- [ ] 实现 Part 内容读取
  - [ ] 按路径读取 Part
  - [ ] 按关系类型读取 Part
  - [ ] 流式读取大文件

- [ ] 导出 API：
  ```typescript
  export class ZipPackage {
    constructor(data: ArrayBuffer);
    getPart(path: string): Promise<ZipPart | null>;
    getPartsByContentType(contentType: string): Promise<ZipPart[]>;
    getRelationships(partPath?: string): Promise<PackageRelationship[]>;
  }

  export interface ZipPart {
    path: string;
    contentType: string;
    data: ArrayBuffer;
    getText(): string;
    getXml(): Document;
  }
  ```

### 4. 单元测试

- [ ] 格式识别测试
  - [ ] 魔数检测测试
  - [ ] 扩展名验证测试
  - [ ] MIME 类型测试

- [ ] ZIP 解析测试
  - [ ] 基础 ZIP 读取测试
  - [ ] OPC 关系解析测试
  - [ ] Part 内容读取测试

---

## 交付物清单

- ✅ `packages/core/src/format-detector.ts`
- ✅ `packages/core/src/zip-parser.ts`
- ✅ `packages/core/src/index.ts`（导出）
- ✅ `packages/core/tests/format-detector.test.ts`
- ✅ `packages/core/tests/zip-parser.test.ts`

---

## 验收标准

- [ ] 可以正确识别 6 种 Office 文件格式
- [ ] 可以解析 ZIP 格式的 Office 文件
- [ ] 可以读取 OPC 关系和 Part 内容
- [ ] 所有测试通过
- [ ] TypeScript 类型检查无错误
