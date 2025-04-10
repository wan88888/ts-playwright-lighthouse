# TypeScript Playwright Lighthouse 性能测试工具

这是一个基于TypeScript、Playwright和Lighthouse的网页性能测试工具，用于自动化测量网页的性能指标、可访问性、最佳实践和SEO得分。该工具支持多次测试并计算平均值，生成详细的HTML报告，并提供趋势分析功能。

## 功能特点

- 🚀 自动化测量网页性能指标和Lighthouse得分
- 📊 生成详细的HTML报告，包括可视化图表
- 📱 支持模拟移动设备和桌面设备
- 🔄 支持多次测试并计算平均值，提高测试准确性
- 📈 提供历史数据趋势分析功能
- 🔍 详细分析Web Vitals指标（FCP、LCP、CLS、TTI等）
- ♿ 检测并报告可访问性问题
- 🔄 支持对比测试，比较不同URL的性能
- 📝 提供性能优化建议

## 安装

### 前置条件

- Node.js (v14或更高版本)
- npm或yarn

### 安装步骤

1. 克隆仓库

```bash
git clone <仓库URL>
cd ts-playwright-lighthouse
```

2. 安装依赖

```bash
npm install
```

## 使用方法

### 基本用法

运行单次测试：

```bash
npm run test -- --url=https://example.com
```

### 命令行选项

| 选项 | 别名 | 描述 | 默认值 |
|------|------|------|--------|
| `--url` | `-u` | 要测试的网站URL | https://playwright.dev |
| `--count` | `-c` | 测试次数 | 5 |
| `--device` | `-d` | 模拟设备类型 (Mobile/Desktop) | Desktop |
| `--config` | | 配置文件路径 | |
| `--compare` | | 用于对比的URL | |
| `--verbose` | `-v` | 显示详细日志 | false |
| `--save-history` | | 保存历史数据用于趋势分析 | true |
| `--help` | | 显示帮助信息 | |

### 示例

1. 使用移动设备模拟进行3次测试：

```bash
npm run test -- --url=https://example.com --count=3 --device=Mobile
```

2. 与另一个URL进行对比测试：

```bash
npm run test -- --url=https://example.com --compare=https://competitor.com
```

3. 使用配置文件：

```bash
npm run test -- --config=my-config.json
```

## 配置文件

你可以使用JSON配置文件来设置测试参数。配置文件示例：

```json
{
  "url": "https://playwright.dev",
  "testCount": 3,
  "categories": ["performance", "accessibility", "best-practices", "seo"],
  "device": "Mobile",
  "throttling": {
    "cpuSlowdownMultiplier": 4,
    "downloadThroughputKbps": 1638.4,
    "uploadThroughputKbps": 768,
    "rttMs": 150
  }
}
```

## 输出报告

测试完成后，将在`reports`目录下生成以下文件：

- HTML格式的详细报告，包含所有性能指标和图表
- 每次测试的Lighthouse HTML报告
- Web Vitals数据（JSON格式）
- 可访问性问题报告（如果有）
- 设备截图
- 历史数据（用于趋势分析）

## Web Vitals指标说明

工具会测量并报告以下关键Web Vitals指标：

- **FCP (First Contentful Paint)**: 首次内容绘制时间
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **CLS (Cumulative Layout Shift)**: 累积布局偏移
- **FID (First Input Delay)**: 首次输入延迟
- **TTI (Time to Interactive)**: 可交互时间
- **TBT (Total Blocking Time)**: 总阻塞时间
- **TTFB (Time to First Byte)**: 首字节时间

## 贡献指南

欢迎贡献代码、报告问题或提出改进建议！请遵循以下步骤：

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用ISC许可证 - 详情请参阅[LICENSE](LICENSE)文件。