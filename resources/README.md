# 资源文件说明

这个目录用于存放 Capacitor 应用图标和启动画面资源。

## 需要准备的文件

### 1. 应用图标 (icon.png)

- **尺寸**: 1024x1024 像素
- **格式**: PNG
- **建议内容**: 股票、图表或相关的图标
- **透明背景**: 推荐（Android 自适应图标需要）
- **设计建议**: 简洁明了，易于识别

### 2. 启动画面 (splash.png)

- **尺寸**: 2732x2732 像素（最小）或更高（如 4320x4320）
- **格式**: PNG（支持 9-patch）
- **建议内容**: 应用 Logo 或品牌名称
- **背景色**: #1890ff（与 capacitor-assets.json 中的配置一致）
- **设计建议**: 中心区域（安全区）放置 Logo，边缘留出空间

## 如何生成资源

### 方式 1: 使用在线工具

1. 使用 [MakeAppIcon](https://makeappicon.com/) 生成图标
2. 使用 [AppIconGenerator](https://appicon.co/) 生成图标
3. 使用 [App Icon Maker](https://www.appiconmaker.co/) 生成图标

### 方式 2: 使用设计工具

1. 使用 Figma/Sketch/Photoshop 设计图标
2. 导出为 PNG 格式，确保尺寸符合要求
3. 放置在 `resources/` 目录

### 方式 3: 使用命令生成

```bash
# 安装 @capacitor/assets（已安装）
pnpm add @capacitor/assets

# 生成所有平台的资源
npx cap assets
```

## 设计建议

### 应用图标设计

1. **主题**: 股票分析、数据可视化
2. **配色**: 主色调 #1890ff（蓝色），辅色 #1890ff
3. **元素**:
   - 上升趋势的折线图
   - K线图
   - 股票价格符号 ¥
   - 数据图表

### 启动画面设计

1. **背景色**: #1890ff（品牌色）
2. **中心元素**:
   - 应用图标（大尺寸）
   - 或应用名称"智能股票分析"
3. **安全区**: 中心 50% 区域（避免被系统 UI 遮挡）
4. **留白**: 四周留出足够的空白空间

## 临时方案（开发阶段）

在开发阶段，可以使用简单的占位图标：

1. 下载一个通用的股票图标或使用默认 Capacitor 图标
2. 或者暂时不生成自定义图标，使用默认图标

## 生成资源后

准备好资源文件后，运行：

```bash
# 生成所有平台资源
npx cap assets

# 仅生成 Android 资源
npx cap assets android

# 同步到项目
npx cap sync
```

## 示例

如果你暂时没有设计好的图标，可以使用这个简单的 SVG 转换为 PNG：

```svg
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#1890ff"/>
  <text x="512" y="512" font-size="400" fill="white" text-anchor="middle" dominant-baseline="middle">📈</text>
</svg>
```

使用在线工具（如 CloudConvert）将 SVG 转换为 PNG。
