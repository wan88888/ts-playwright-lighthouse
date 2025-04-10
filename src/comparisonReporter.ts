/**
 * 对比报告生成器
 * 用于比较不同网站或同一网站不同版本的性能指标
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { WebVitalsMetrics } from './webVitals';

interface ComparisonData {
  baseline: {
    url: string;
    timestamp: string;
    device: string;
    scores: Record<string, number>;
    webVitals: WebVitalsMetrics;
  };
  current: {
    url: string;
    timestamp: string;
    device: string;
    scores: Record<string, number>;
    webVitals: WebVitalsMetrics;
  };
}

/**
 * 生成性能对比报告
 */
export async function generateComparisonReport(baselineResults: any, currentResults: any, outputDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(outputDir, `comparison-report-${timestamp}.html`);
  
  // 准备对比数据
  const comparisonData: ComparisonData = {
    baseline: {
      url: baselineResults.url,
      timestamp: baselineResults.timestamp || new Date().toLocaleString('zh-CN'),
      device: baselineResults.device,
      scores: baselineResults.scores,
      webVitals: baselineResults.webVitals
    },
    current: {
      url: currentResults.url,
      timestamp: currentResults.timestamp || new Date().toLocaleString('zh-CN'),
      device: currentResults.device,
      scores: currentResults.scores,
      webVitals: currentResults.webVitals
    }
  };
  
  // 生成HTML内容
  const htmlContent = generateComparisonHtml(comparisonData);
  
  // 写入文件
  await fs.writeFile(reportPath, htmlContent);
  
  return reportPath;
}

/**
 * 生成对比报告HTML
 */
function generateComparisonHtml(data: ComparisonData): string {
  // 计算性能得分差异
  const scoreDiffs = calculateScoreDiffs(data.baseline.scores, data.current.scores);
  
  // 计算Web Vitals指标差异
  const webVitalsDiffs = calculateWebVitalsDiffs(data.baseline.webVitals, data.current.webVitals);
  
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能对比报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      :root {
        --primary-color: #4285f4;
        --secondary-color: #34a853;
        --warning-color: #fbbc05;
        --danger-color: #ea4335;
        --light-color: #f8f9fa;
        --dark-color: #343a40;
        --improvement-color: #34a853;
        --regression-color: #ea4335;
      }
      
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
      }
      
      .report-header {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      
      .report-title {
        color: var(--primary-color);
        margin: 0;
        font-size: 24px;
      }
      
      .report-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 10px;
        color: #666;
      }
      
      .report-section {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      
      .section-title {
        color: var(--primary-color);
        border-bottom: 2px solid var(--light-color);
        padding-bottom: 10px;
        margin-top: 0;
      }
      
      .comparison-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      
      .comparison-table th,
      .comparison-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .comparison-table th {
        background-color: var(--light-color);
        font-weight: bold;
        color: var(--dark-color);
      }
      
      .comparison-table tr:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
      
      .metric-name {
        font-weight: bold;
      }
      
      .baseline-value {
        color: #666;
      }
      
      .current-value {
        font-weight: bold;
      }
      
      .diff-value {
        font-weight: bold;
        padding: 2px 8px;
        border-radius: 4px;
      }
      
      .improvement {
        color: var(--improvement-color);
        background-color: rgba(52, 168, 83, 0.1);
      }
      
      .regression {
        color: var(--regression-color);
        background-color: rgba(234, 67, 53, 0.1);
      }
      
      .neutral {
        color: #666;
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .chart-container {
        height: 400px;
        margin-top: 20px;
      }
      
      .summary-card {
        background-color: var(--light-color);
        padding: 15px;
        border-radius: 8px;
        margin-top: 20px;
        border-left: 4px solid var(--primary-color);
      }
      
      .summary-title {
        font-weight: bold;
        margin-bottom: 10px;
        color: var(--dark-color);
      }
      
      .summary-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .summary-stat {
        padding: 8px 12px;
        border-radius: 4px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="report-header">
      <h1 class="report-title">性能对比报告</h1>
      <div class="report-meta">
        <div><strong>基准版本:</strong> ${data.baseline.url}</div>
        <div><strong>当前版本:</strong> ${data.current.url}</div>
        <div><strong>测试时间:</strong> ${data.current.timestamp}</div>
        <div><strong>设备类型:</strong> ${data.current.device}</div>
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">性能对比摘要</h2>
      <div class="summary-card">
        <div class="summary-title">总体性能变化</div>
        <div class="summary-stats">
          ${generateSummaryStats(scoreDiffs, webVitalsDiffs)}
        </div>
      </div>
      
      <div class="chart-container">
        <canvas id="scoreComparisonChart"></canvas>
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Lighthouse 得分对比</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>指标</th>
            <th>基准版本</th>
            <th>当前版本</th>
            <th>变化</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data.baseline.scores).map(([category, score]) => {
            const currentScore = data.current.scores[category] || 0;
            const diff = currentScore - score;
            const diffClass = diff > 1 ? 'improvement' : diff < -1 ? 'regression' : 'neutral';
            const diffPrefix = diff > 0 ? '+' : '';
            const categoryName = getCategoryName(category);
            
            return `
              <tr>
                <td class="metric-name">${categoryName}</td>
                <td class="baseline-value">${score.toFixed(1)}</td>
                <td class="current-value">${currentScore.toFixed(1)}</td>
                <td><span class="diff-value ${diffClass}">${diffPrefix}${diff.toFixed(1)}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Web Vitals 指标对比</h2>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>指标</th>
            <th>基准版本</th>
            <th>当前版本</th>
            <th>变化</th>
            <th>变化百分比</th>
          </tr>
        </thead>
        <tbody>
          ${generateWebVitalsComparisonRows(data.baseline.webVitals, data.current.webVitals)}
        </tbody>
      </table>
      
      <div class="chart-container">
        <canvas id="webVitalsComparisonChart"></canvas>
      </div>
    </div>
    
    <script>
      // 准备图表数据
      const baselineScores = ${JSON.stringify(data.baseline.scores)};
      const currentScores = ${JSON.stringify(data.current.scores)};
      const baselineWebVitals = ${JSON.stringify(data.baseline.webVitals)};
      const currentWebVitals = ${JSON.stringify(data.current.webVitals)};
      
      // 创建Lighthouse得分对比图表
      const scoreCtx = document.getElementById('scoreComparisonChart').getContext('2d');
      new Chart(scoreCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(baselineScores).map(key => getCategoryNameForChart(key)),
          datasets: [
            {
              label: '基准版本',
              data: Object.values(baselineScores),
              backgroundColor: 'rgba(66, 133, 244, 0.6)',
              borderColor: 'rgba(66, 133, 244, 1)',
              borderWidth: 1
            },
            {
              label: '当前版本',
              data: Object.values(currentScores),
              backgroundColor: 'rgba(52, 168, 83, 0.6)',
              borderColor: 'rgba(52, 168, 83, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: '得分'
              }
            }
          }
        }
      });
      
      // 创建Web Vitals对比图表
      const webVitalsCtx = document.getElementById('webVitalsComparisonChart').getContext('2d');
      
      // 过滤掉null值的指标
      const webVitalsKeys = Object.keys(baselineWebVitals).filter(key => 
        baselineWebVitals[key] !== null && currentWebVitals[key] !== null
      );
      
      // 计算每个指标的最大值，用于归一化
      const maxValues = {};
      webVitalsKeys.forEach(key => {
        maxValues[key] = Math.max(baselineWebVitals[key] || 0, currentWebVitals[key] || 0);
      });
      
      // 归一化数据（转换为0-100的范围，便于在同一图表中显示）
      const normalizedBaseline = {};
      const normalizedCurrent = {};
      
      webVitalsKeys.forEach(key => {
        if (key === 'CLS') {
          // CLS是越小越好，但为了图表显示一致，我们反转它的值
          normalizedBaseline[key] = 100 - (baselineWebVitals[key] / 0.25 * 100);
          normalizedCurrent[key] = 100 - (currentWebVitals[key] / 0.25 * 100);
        } else {
          // 其他指标也是越小越好
          const referenceValues = {
            FCP: 3000, // 3秒作为参考值
            LCP: 4000, // 4秒作为参考值
            TTI: 7300, // 7.3秒作为参考值
            TBT: 600,  // 600ms作为参考值
            TTFB: 1800, // 1.8秒作为参考值
            FID: 300   // 300ms作为参考值
          };
          
          const refValue = referenceValues[key] || maxValues[key];
          normalizedBaseline[key] = 100 - (baselineWebVitals[key] / refValue * 100);
          normalizedCurrent[key] = 100 - (currentWebVitals[key] / refValue * 100);
          
          // 确保值在0-100范围内
          normalizedBaseline[key] = Math.max(0, Math.min(100, normalizedBaseline[key]));
          normalizedCurrent[key] = Math.max(0, Math.min(100, normalizedCurrent[key]));
        }
      });
      
      new Chart(webVitalsCtx, {
        type: 'radar',
        data: {
          labels: webVitalsKeys,
          datasets: [
            {
              label: '基准版本',
              data: webVitalsKeys.map(key => normalizedBaseline[key]),
              backgroundColor: 'rgba(66, 133, 244, 0.2)',
              borderColor: 'rgba(66, 133, 244, 1)',
              pointBackgroundColor: 'rgba(66, 133, 244, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(66, 133, 244, 1)'
            },
            {
              label: '当前版本',
              data: webVitalsKeys.map(key => normalizedCurrent[key]),
              backgroundColor: 'rgba(52, 168, 83, 0.2)',
              borderColor: 'rgba(52, 168, 83, 1)',
              pointBackgroundColor: 'rgba(52, 168, 83, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(52, 168, 83, 1)'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100
            }
          }
        }
      });
      
      // 辅助函数：获取分类名称
      function getCategoryNameForChart(category) {
        const categoryNames = {
          'performance': '性能',
          'accessibility': '可访问性',
          'best-practices': '最佳实践',
          'seo': 'SEO'
        };
        return categoryNames[category] || category;
      }
    </script>
  </body>
  </html>
  `;
}

/**
 * 计算得分差异
 */
function calculateScoreDiffs(baselineScores: Record<string, number>, currentScores: Record<string, number>): Record<string, number> {
  const diffs: Record<string, number> = {};
  
  for (const [category, score] of Object.entries(baselineScores)) {
    const currentScore = currentScores[category] || 0;
    diffs[category] = currentScore - score;
  }
  
  return diffs;
}

/**
 * 计算Web Vitals指标差异
 */
function calculateWebVitalsDiffs(baselineWebVitals: WebVitalsMetrics, currentWebVitals: WebVitalsMetrics): Record<string, { absolute: number, percentage: number, improved: boolean }> {
  const diffs: Record<string, { absolute: number, percentage: number, improved: boolean }> = {};
  
  for (const key of Object.keys(baselineWebVitals) as Array<keyof WebVitalsMetrics>) {
    const baselineValue = baselineWebVitals[key];
    const currentValue = currentWebVitals[key];
    
    if (baselineValue !== null && currentValue !== null) {
      const absoluteDiff = currentValue - baselineValue;
      const percentageDiff = baselineValue !== 0 ? (absoluteDiff / baselineValue) * 100 : 0;
      
      // 对于所有Web Vitals指标，值越小越好
      const improved = absoluteDiff < 0;
      
      diffs[key as string] = {
        absolute: absoluteDiff,
        percentage: percentageDiff,
        improved
      };
    }
  }
  
  return diffs;
}

/**
 * 生成Web Vitals对比表格行
 */
function generateWebVitalsComparisonRows(baselineWebVitals: WebVitalsMetrics, currentWebVitals: WebVitalsMetrics): string {
  const webVitalsInfo = {
    FCP: { name: 'First Contentful Paint', unit: 'ms' },
    LCP: { name: 'Largest Contentful Paint', unit: 'ms' },
    CLS: { name: 'Cumulative Layout Shift', unit: '' },
    FID: { name: 'First Input Delay', unit: 'ms' },
    TTI: { name: 'Time to Interactive', unit: 'ms' },
    TBT: { name: 'Total Blocking Time', unit: 'ms' },
    TTFB: { name: 'Time to First Byte', unit: 'ms' }
  };
  
  let rows = '';
  
  for (const [key, info] of Object.entries(webVitalsInfo)) {
    const baselineValue = baselineWebVitals[key as keyof WebVitalsMetrics];
    const currentValue = currentWebVitals[key as keyof WebVitalsMetrics];
    
    if (baselineValue === null || currentValue === null) continue;
    
    const diff = currentValue - baselineValue;
    const percentDiff = baselineValue !== 0 ? (diff / baselineValue) * 100 : 0;
    
    // 对于所有Web Vitals指标，值越小越好
    const diffClass = diff < 0 ? 'improvement' : diff > 0 ? 'regression' : 'neutral';
    const diffPrefix = diff < 0 ? '' : '+';
    
    // 格式化显示值
    let baselineDisplay, currentDisplay, diffDisplay;
    if (key === 'CLS') {
      baselineDisplay = baselineValue.toFixed(3);
      currentDisplay = currentValue.toFixed(3);
      diffDisplay = `${diffPrefix}${diff.toFixed(3)}`;
    } else {
      baselineDisplay = `${Math.round(baselineValue)}${info.unit}`;
      currentDisplay = `${Math.round(currentValue)}${info.unit}`;
      diffDisplay = `${diffPrefix}${Math.round(diff)}${info.unit}`;
    }
    
    rows += `
      <tr>
        <td class="metric-name">${key} (${info.name})</td>
        <td class="baseline-value">${baselineDisplay}</td>
        <td class="current-value">${currentDisplay}</td>
        <td><span class="diff-value ${diffClass}">${diffDisplay}</span></td>
        <td><span class="diff-value ${diffClass}">${diffPrefix}${percentDiff.toFixed(1)}%</span></td>
      </tr>
    `;
  }
  
  return rows;
}

/**
 * 生成摘要统计信息
 */
function generateSummaryStats(scoreDiffs: Record<string, number>, webVitalsDiffs: Record<string, { absolute: number, percentage: number, improved: boolean }>): string {
  // 计算改进和退化的指标数量
  let improvedScores = 0;
  let regressedScores = 0;
  
  for (const diff of Object.values(scoreDiffs)) {
    if (diff > 1) improvedScores++;
    else if (diff < -1) regressedScores++;
  }
  
  let improvedWebVitals = 0;
  let regressedWebVitals = 0;
  
  for (const diff of Object.values(webVitalsDiffs)) {
    if (diff.improved) improvedWebVitals++;
    else if (!diff.improved && Math.abs(diff.percentage) > 1) regressedWebVitals++;
  }
  
  // 计算总体性能变化
  const totalImproved = improvedScores + improvedWebVitals;
  const totalRegressed = regressedScores + regressedWebVitals;
  
  // 生成HTML
  return `
    <div class="summary-stat improvement">${improvedScores} 项Lighthouse得分改进</div>
    <div class="summary-stat regression">${regressedScores} 项Lighthouse得分退化</div>
    <div class="summary-stat improvement">${improvedWebVitals} 项Web Vitals指标改进</div>
    <div class="summary-stat regression">${regressedWebVitals} 项Web Vitals指标退化</div>
  `;
}

/**
 * 获取分类名称的中文显示
 */
function getCategoryName(category: string): string {
  const categoryNames: Record<string, string> = {
    'performance': '性能',
    'accessibility': '可访问性',
    'best-practices': '最佳实践',
    'seo': 'SEO'
  };
  return categoryNames[category] || category;
}