// @ts-nocheck 忽略整个文件的类型检查问题
import { chromium, devices } from '@playwright/test';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { extractWebVitals, WebVitalsResult } from './webVitals';
import { generateDetailedReport, generateTrendReport } from './reportGenerator';
import { generateComparisonReport } from './comparisonReporter';
import { createCLI, LogLevel, formatScore, formatWebVital } from './cli';

// Lighthouse结果类型定义
interface LighthouseResult {
  report: string;
  lhr: {
    categories: {
      [key: string]: {
        score: number;
      };
    };
    audits: {
      [key: string]: {
        id: string;
        title: string;
        description: string;
        score: number | null;
        displayValue?: string;
        details?: any;
      };
    };
  };
}

// 测试配置
interface TestConfig {
  url: string;
  testCount: number;
  categories: string[];
  device?: string;
  throttling?: {
    cpuSlowdownMultiplier: number;
    downloadThroughputKbps: number;
    uploadThroughputKbps: number;
    rttMs: number;
  };
  compareUrl?: string; // 用于对比的URL
  saveHistory?: boolean; // 是否保存历史数据用于趋势分析
}

async function runLighthouseTest() {
  // 创建CLI界面
  const { logger, progress } = createCLI();
  
  // 解析命令行参数
  const parser = yargs
    .command('$0', '运行Lighthouse测试')
    .option('url', {
      alias: 'u',
      type: 'string',
      description: '要测试的网站URL',
      default: 'https://playwright.dev'
    })
    .option('count', {
      alias: 'c',
      type: 'number',
      description: '测试次数',
      default: 5
    })
    .option('device', {
      alias: 'd',
      type: 'string',
      description: '模拟设备类型',
      choices: ['Mobile', 'Desktop'],
      default: 'Desktop'
    })
    .option('config', {
      type: 'string',
      description: '配置文件路径'
    })
    .option('compare', {
      type: 'string',
      description: '用于对比的URL'
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: '显示详细日志',
      default: false
    })
    .option('save-history', {
      type: 'boolean',
      description: '保存历史数据用于趋势分析',
      default: true
    })
    .help();
  
  const argv = await parser.parse(hideBin(process.argv));
  
  // 设置日志级别
  logger.setLevel(argv.verbose ? LogLevel.DEBUG : LogLevel.INFO);

  // 从配置文件加载配置（如果指定）
  let fileConfig = {};
  if (argv.config) {
    try {
      const configPath = path.resolve(process.cwd(), argv.config);
      if (fs.existsSync(configPath)) {
        fileConfig = await fs.readJSON(configPath);
        logger.info(`已从 ${configPath} 加载配置`);
      }
    } catch (error) {
      logger.error('读取配置文件失败:', error);
    }
  }

  // 合并配置
  const config: TestConfig = {
    url: argv.url || 'https://playwright.dev',
    testCount: argv.count || 5,
    categories: ['performance', 'accessibility', 'best-practices', 'seo'],
    device: argv.device || 'Desktop',
    // 设置网络节流配置
    throttling: {
      cpuSlowdownMultiplier: 4,
      downloadThroughputKbps: 1638.4, // 模拟3G网络
      uploadThroughputKbps: 768,
      rttMs: 150 // 往返延迟
    },
    compareUrl: argv.compare,
    saveHistory: argv['save-history'] !== undefined ? argv['save-history'] : true,
    ...fileConfig
  };
  
  logger.title(`Lighthouse 性能测试工具`);
  logger.info(`将对 ${config.url} 进行 ${config.testCount} 次测试并计算平均值...`);
  
  // 启动Chrome浏览器
  logger.info('启动Chrome浏览器...');
  
  // 启动Chrome浏览器
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  // 设置设备模拟
  const deviceSettings = config.device === 'Mobile' ? devices['Pixel 5'] : devices['Desktop Chrome'];
  
  try {
    logger.subtitle(`测试网站: ${config.url}`);
    
    // 设置Lighthouse选项
    const options: {
      logLevel: string;
      output: string;
      onlyCategories: string[];
      port: number;
      formFactor: string;
      screenEmulation: {
        mobile: boolean;
        width: number;
        height: number;
        deviceScaleFactor: number;
      };
      throttling: {
        cpuSlowdownMultiplier: number;
        downloadThroughputKbps: number;
        uploadThroughputKbps: number;
        rttMs: number;
      };
    } = {
      logLevel: 'info',
      output: 'html',
      onlyCategories: config.categories,
      port: chrome.port,
      formFactor: config.device === 'Mobile' ? 'mobile' : 'desktop',
      screenEmulation: {
        mobile: config.device === 'Mobile',
        width: deviceSettings.viewport?.width || 1920,
        height: deviceSettings.viewport?.height || 1080,
        deviceScaleFactor: config.device === 'Mobile' ? 2.75 : 1
      },
      throttling: config.throttling || {
        cpuSlowdownMultiplier: 4,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 768,
        rttMs: 150
      }
    };
    
    // 用于存储多次测试的得分
    type CategoryScores = Record<string, number[]>;
    const scores: CategoryScores = {
      performance: [],
      accessibility: [],
      'best-practices': [],
      seo: []
    };
    
    // 确保输出目录存在
    const outputDir = path.join(__dirname, '../reports');
    await fs.ensureDir(outputDir);
    
    // 创建可访问性问题分析目录
    const accessibilityDir = path.join(outputDir, 'accessibility-issues');
    await fs.ensureDir(accessibilityDir);
    
    // 创建Web Vitals数据目录
    const webVitalsDir = path.join(outputDir, 'web-vitals');
    await fs.ensureDir(webVitalsDir);
    
    // 创建历史数据目录
    const historyDir = path.join(outputDir, 'history');
    await fs.ensureDir(historyDir);
    
    // 存储Web Vitals结果
    const webVitalsResults: WebVitalsResult[] = [];
    
    // 创建进度条
    const progressBar = progress(config.testCount);
    
    // 多次运行测试
    for (let i = 1; i <= config.testCount; i++) {
      logger.info(`\n运行第 ${i}/${config.testCount} 次Lighthouse测试...`);
      progressBar.update(i - 1, `测试中...`);
      
      // 使用lighthouse API
      const runnerResult = await lighthouse(config.url, options) as LighthouseResult;
      
      // 保存每次测试的HTML报告
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const reportHtml = runnerResult.report;
      const reportPath = path.join(outputDir, `lighthouse-report-${i}-${timestamp}.html`);
      await fs.writeFile(reportPath, reportHtml);
      logger.debug(`第 ${i} 次测试报告已保存至: ${reportPath}`);
      
      // 提取Web Vitals指标
      const webVitalsMetrics = extractWebVitals(runnerResult.lhr);
      const webVitalsResult: WebVitalsResult = {
        url: config.url,
        metrics: webVitalsMetrics,
        timestamp: new Date().toISOString(),
        device: config.device
      };
      
      webVitalsResults.push(webVitalsResult);
      
      // 保存Web Vitals数据
      const webVitalsPath = path.join(webVitalsDir, `web-vitals-${i}-${timestamp}.json`);
      await fs.writeJSON(webVitalsPath, webVitalsResult, { spaces: 2 });
      
      // 分析并保存可访问性问题
      if (runnerResult.lhr.audits) {
        const accessibilityIssues = [];
        for (const [id, audit] of Object.entries(runnerResult.lhr.audits)) {
          // 只关注可访问性相关的审计项且得分不是满分或null
          if (id.startsWith('accessibility/') && audit.score !== 1 && audit.score !== null) {
            accessibilityIssues.push({
              id: audit.id,
              title: audit.title,
              description: audit.description,
              score: audit.score,
              details: audit.details,
              displayValue: audit.displayValue || ''
            });
          }
        }
        
        if (accessibilityIssues.length > 0) {
          const issuesPath = path.join(accessibilityDir, `accessibility-issues-${i}-${timestamp}.json`);
          await fs.writeJSON(issuesPath, accessibilityIssues, { spaces: 2 });
          logger.debug(`发现 ${accessibilityIssues.length} 个可访问性问题，已保存至: ${issuesPath}`);
          
          // 输出可访问性问题摘要
          logger.group('可访问性问题摘要:', () => {
            accessibilityIssues.slice(0, 5).forEach((issue, index) => {
              logger.warning(`${index + 1}. ${issue.title} - ${issue.displayValue}`);
            });
            if (accessibilityIssues.length > 5) {
              logger.info(`...以及其他 ${accessibilityIssues.length - 5} 个问题`);
            }
          });
          logger.info('改进建议: 请查看详细报告以获取完整的可访问性问题列表和修复建议。');
        } else {
          logger.success('未发现可访问性问题，太棒了！');
        }
      }
      
      // 收集每次测试的得分
      if (runnerResult.lhr.categories) {
        for (const category of config.categories) {
          if (runnerResult.lhr.categories[category]) {
            scores[category].push(runnerResult.lhr.categories[category].score * 100);
          }
        }
      }
      
      // 输出当前测试的得分
      logger.group(`第 ${i} 次测试得分:`, () => {
        for (const category of config.categories) {
          if (runnerResult.lhr.categories[category]) {
            const score = runnerResult.lhr.categories[category].score * 100;
            logger.info(`${getCategoryName(category)}: ${formatScore(score)}`);
          }
        }
      });
      
      // 输出Web Vitals指标
      logger.group('Web Vitals指标:', () => {
        for (const [key, value] of Object.entries(webVitalsMetrics)) {
          if (value !== null) {
            const unit = key === 'CLS' ? '' : 'ms';
            logger.info(formatWebVital(key, value, unit));
          }
        }
      });
      
      progressBar.update(i, `完成第${i}次测试`);
    }
    
    progressBar.complete('所有测试完成!');
    
    // 计算并输出平均得分
    logger.title(`${config.testCount}次测试平均得分`);
    const avgScores: Record<string, number> = {};
    
    for (const category of config.categories) {
      if (scores[category].length > 0) {
        const avgScore = scores[category].reduce((sum, score) => sum + score, 0) / scores[category].length;
        avgScores[category] = avgScore;
        logger.info(`${getCategoryName(category)}: ${formatScore(avgScore)}`);
      }
    }
    
    // 使用Playwright进行简单的页面截图
    logger.info('\n使用Playwright进行页面截图...');
    const browser = await chromium.launch();
    const context = await browser.newContext({
      ...deviceSettings
    });
    const page = await context.newPage();
    
    await page.goto(config.url);
    
    // 保存不同设备类型的截图
    const screenshotPath = path.join(outputDir, `screenshot-${config.device}.png`);
    await page.screenshot({ path: screenshotPath });
    logger.success(`${config.device}设备页面截图已保存至: ${screenshotPath}`);
    
    await browser.close();
    
    // 准备测试结果数据
    const testResult: TestResult = {
      url: config.url,
      device: config.device,
      timestamp: new Date().toISOString(),
      scores: avgScores,
      webVitals: webVitalsResults[webVitalsResults.length - 1].metrics
    };
    
    // 保存历史数据用于趋势分析
    if (config.saveHistory) {
      const historyPath = path.join(historyDir, `history-${new Date().toISOString().replace(/:/g, '-')}.json`);
      await fs.writeJSON(historyPath, testResult, { spaces: 2 });
      logger.info(`历史数据已保存至: ${historyPath}`);
      
      // 读取所有历史数据
      const historyFiles = await fs.readdir(historyDir);
      const historyData: TestResult[] = [];
      
      for (const file of historyFiles) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readJSON(path.join(historyDir, file));
            historyData.push(data);
          } catch (error) {
            logger.error(`读取历史数据文件 ${file} 失败:`, error);
          }
        }
      }
      
      // 按时间排序
      historyData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // 生成趋势报告
      if (historyData.length > 1) {
        const trendReportPath = await generateTrendReport(historyData, outputDir);
        logger.success(`趋势报告已生成: ${trendReportPath}`);
      }
    }
    
    // 生成详细报告
    const detailedReportPath = await generateDetailedReport(testResult, webVitalsResults, outputDir);
    logger.success(`详细报告已生成: ${detailedReportPath}`);
    
    // 如果指定了对比URL，则进行对比测试
    if (config.compareUrl) {
      logger.title(`开始对比测试: ${config.compareUrl}`);
      
      // 修改配置以测试对比URL
      const compareConfig = { ...config, url: config.compareUrl };
      
      // 运行对比测试
      const compareOptions = { ...options };
      compareOptions.port = chrome.port;
      
      const compareResult = await lighthouse(config.compareUrl, compareOptions) as LighthouseResult;
      
      // 提取对比测试的Web Vitals指标
      const compareWebVitalsMetrics = extractWebVitals(compareResult.lhr);
      
      // 计算对比测试的平均得分
      const compareScores: Record<string, number> = {};
      for (const category of config.categories) {
        if (compareResult.lhr.categories[category]) {
          compareScores[category] = compareResult.lhr.categories[category].score * 100;
        }
      }
      
      // 准备对比测试结果数据
      const compareTestResult: TestResult = {
        url: config.compareUrl,
        device: config.device,
        timestamp: new Date().toISOString(),
        scores: compareScores,
        webVitals: compareWebVitalsMetrics
      };
      
      // 生成对比报告
      const comparisonReportPath = await generateComparisonReport(testResult, compareTestResult, outputDir);
      logger.success(`对比报告已生成: ${comparisonReportPath}`);
    }
    
    logger.title('测试完成');
    logger.info(`所有报告已保存至: ${outputDir}`);
    logger.info('感谢使用Lighthouse性能测试工具！');
  } catch (error) {
    logger.error('测试过程中发生错误:', error);
  } finally {
    // 关闭Chrome
    await chrome.kill();
  }
}

// 获取分类名称的中文显示
function getCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    'performance': '性能',
    'accessibility': '可访问性',
    'best-practices': '最佳实践',
    'seo': 'SEO'
  };
  return categoryNames[category] || category;
}

// 测试结果
interface TestResult {
  url: string;
  device: string;
  timestamp: string;
  scores: Record<string, number>;
  webVitals: any;
}

// 执行测试
runLighthouseTest().catch(error => {
  console.error('程序执行失败:', error);
  process.exit(1);
});