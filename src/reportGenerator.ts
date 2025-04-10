/**
 * 报告生成器
 * 用于生成详细的HTML报告，包括性能指标可视化和趋势分析
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { WebVitalsMetrics, WebVitalsResult, evaluateWebVitals, generateWebVitalsRecommendations } from './webVitals';

interface ReportData {
  url: string;
  timestamp: string;
  device: string;
  scores: {
    performance: number;
    accessibility: number;
    'best-practices': number;
    seo: number;
    [key: string]: number;
  };
  webVitals: WebVitalsMetrics;
  evaluations: Record<string, string>;
  recommendations: Record<string, string[]>;
}

/**
 * 生成详细的HTML报告
 */
export async function generateDetailedReport(results: any, webVitalsResults: WebVitalsResult[], outputDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(outputDir, `detailed-report-${timestamp}.html`);
  
  // 准备报告数据
  const reportData: ReportData = {
    url: results.url,
    timestamp: new Date().toLocaleString('zh-CN'),
    device: results.device,
    scores: results.scores,
    webVitals: webVitalsResults[webVitalsResults.length - 1].metrics,
    evaluations: evaluateWebVitals(webVitalsResults[webVitalsResults.length - 1].metrics),
    recommendations: generateWebVitalsRecommendations(
      webVitalsResults[webVitalsResults.length - 1].metrics,
      evaluateWebVitals(webVitalsResults[webVitalsResults.length - 1].metrics)
    )
  };
  
  // 生成HTML内容
  const htmlContent = generateHtmlReport(reportData, webVitalsResults);
  
  // 写入文件
  await fs.writeFile(reportPath, htmlContent);
  
  return reportPath;
}

/**
 * 生成HTML报告内容
 */
function generateHtmlReport(data: ReportData, webVitalsHistory: WebVitalsResult[]): string {
  // 生成Web Vitals历史数据的JSON字符串，用于图表
  const webVitalsHistoryJson = JSON.stringify(webVitalsHistory.map(result => ({
    timestamp: new Date(result.timestamp).toLocaleString('zh-CN', {hour: '2-digit', minute: '2-digit'}),
    FCP: result.metrics.FCP,
    LCP: result.metrics.LCP,
    CLS: result.metrics.CLS,
    TTI: result.metrics.TTI,
    TBT: result.metrics.TBT,
    TTFB: result.metrics.TTFB
  })));
  
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能测试详细报告 - ${data.url}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      :root {
        --primary-color: #4285f4;
        --secondary-color: #34a853;
        --warning-color: #fbbc05;
        --danger-color: #ea4335;
        --light-color: #f8f9fa;
        --dark-color: #343a40;
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
      
      .score-card {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-top: 20px;
      }
      
      .score-item {
        flex: 1;
        min-width: 200px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      
      .score-value {
        font-size: 36px;
        font-weight: bold;
        margin: 10px 0;
      }
      
      .score-label {
        font-size: 14px;
        color: #666;
      }
      
      .good {
        background-color: rgba(52, 168, 83, 0.1);
        color: var(--secondary-color);
      }
      
      .needs-improvement {
        background-color: rgba(251, 188, 5, 0.1);
        color: var(--warning-color);
      }
      
      .poor {
        background-color: rgba(234, 67, 53, 0.1);
        color: var(--danger-color);
      }
      
      .web-vitals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      
      .web-vital-card {
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .web-vital-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .web-vital-name {
        font-weight: bold;
        font-size: 18px;
      }
      
      .web-vital-value {
        font-size: 24px;
        font-weight: bold;
      }
      
      .web-vital-evaluation {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
      }
      
      .web-vital-description {
        margin-top: 10px;
        font-size: 14px;
        color: #666;
      }
      
      .recommendations {
        margin-top: 15px;
      }
      
      .recommendations h4 {
        margin-bottom: 5px;
        color: var(--dark-color);
      }
      
      .recommendations ul {
        margin-top: 5px;
        padding-left: 20px;
      }
      
      .recommendations li {
        margin-bottom: 5px;
      }
      
      .chart-container {
        height: 300px;
        margin-top: 20px;
      }
      
      @media (max-width: 768px) {
        .score-card, .web-vitals-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="report-header">
      <h1 class="report-title">性能测试详细报告</h1>
      <div class="report-meta">
        <div><strong>URL:</strong> ${data.url}</div>
        <div><strong>测试时间:</strong> ${data.timestamp}</div>
        <div><strong>设备类型:</strong> ${data.device}</div>
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Lighthouse 得分</h2>
      <div class="score-card">
        ${Object.entries(data.scores).map(([category, score]) => {
          const scoreClass = score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor';
          const categoryName = getCategoryName(category);
          return `
            <div class="score-item ${scoreClass}">
              <div class="score-label">${categoryName}</div>
              <div class="score-value">${score.toFixed(0)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Web Vitals 指标</h2>
      <div class="web-vitals-grid">
        ${generateWebVitalCards(data.webVitals, data.evaluations, data.recommendations)}
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">性能指标趋势</h2>
      <div class="chart-container">
        <canvas id="webVitalsChart"></canvas>
      </div>
    </div>
    
    <script>
      // Web Vitals历史数据
      const webVitalsHistory = ${webVitalsHistoryJson};
      
      // 创建图表
      const ctx = document.getElementById('webVitalsChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: webVitalsHistory.map(item => item.timestamp),
          datasets: [
            {
              label: 'FCP (ms)',
              data: webVitalsHistory.map(item => item.FCP),
              borderColor: '#4285f4',
              backgroundColor: 'rgba(66, 133, 244, 0.1)',
              tension: 0.1
            },
            {
              label: 'LCP (ms)',
              data: webVitalsHistory.map(item => item.LCP),
              borderColor: '#34a853',
              backgroundColor: 'rgba(52, 168, 83, 0.1)',
              tension: 0.1
            },
            {
              label: 'TTI (ms)',
              data: webVitalsHistory.map(item => item.TTI),
              borderColor: '#fbbc05',
              backgroundColor: 'rgba(251, 188, 5, 0.1)',
              tension: 0.1
            },
            {
              label: 'TBT (ms)',
              data: webVitalsHistory.map(item => item.TBT),
              borderColor: '#ea4335',
              backgroundColor: 'rgba(234, 67, 53, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '毫秒 (ms)'
              }
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
      
      // CLS单独图表（因为单位不同）
      const clsCtx = document.createElement('canvas');
      clsCtx.id = 'clsChart';
      document.querySelector('.chart-container').appendChild(clsCtx);
      
      new Chart(clsCtx.getContext('2d'), {
        type: 'line',
        data: {
          labels: webVitalsHistory.map(item => item.timestamp),
          datasets: [
            {
              label: 'CLS',
              data: webVitalsHistory.map(item => item.CLS),
              borderColor: '#673ab7',
              backgroundColor: 'rgba(103, 58, 183, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'CLS值'
              }
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
    </script>
  </body>
  </html>
  `;
}

/**
 * 生成Web Vitals指标卡片HTML
 */
function generateWebVitalCards(metrics: WebVitalsMetrics, evaluations: Record<string, string>, recommendations: Record<string, string[]>): string {
  const webVitalsInfo = {
    FCP: {
      name: 'First Contentful Paint',
      description: '首次内容绘制，测量页面从开始加载到页面内容的任何部分在屏幕上完成渲染的时间。'
    },
    LCP: {
      name: 'Largest Contentful Paint',
      description: '最大内容绘制，测量视口中最大的内容元素何时完成渲染。'
    },
    CLS: {
      name: 'Cumulative Layout Shift',
      description: '累积布局偏移，测量在页面整个生命周期中发生的所有意外布局偏移的总和。'
    },
    FID: {
      name: 'First Input Delay',
      description: '首次输入延迟，测量用户首次与页面交互到浏览器实际能够响应该交互的时间。'
    },
    TTI: {
      name: 'Time to Interactive',
      description: '可交互时间，测量页面从开始加载到完全可交互所需的时间。'
    },
    TBT: {
      name: 'Total Blocking Time',
      description: '总阻塞时间，测量FCP与TTI之间的总时间，这期间主线程被阻塞足够长的时间以防止输入响应。'
    },
    TTFB: {
      name: 'Time to First Byte',
      description: '首字节时间，测量从用户请求URL到浏览器接收到响应的第一个字节之间的时间。'
    }
  };
  
  let html = '';
  
  for (const [key, value] of Object.entries(metrics)) {
    if (value === null) continue;
    
    const info = webVitalsInfo[key as keyof typeof webVitalsInfo];
    const evaluation = evaluations[key] || '未评估';
    const recommendationList = recommendations[key] || [];
    
    let evaluationClass = '';
    if (evaluation === '良好') {
      evaluationClass = 'good';
    } else if (evaluation === '需要改进') {
      evaluationClass = 'needs-improvement';
    } else if (evaluation === '较差') {
      evaluationClass = 'poor';
    }
    
    // 格式化显示值
    let displayValue = '';
    if (key === 'CLS') {
      displayValue = value.toFixed(3);
    } else {
      displayValue = `${Math.round(value)}ms`;
    }
    
    html += `
      <div class="web-vital-card">
        <div class="web-vital-header">
          <div class="web-vital-name">${key}</div>
          <div class="web-vital-evaluation ${evaluationClass}">${evaluation}</div>
        </div>
        <div class="web-vital-value">${displayValue}</div>
        <div class="web-vital-description">
          <strong>${info.name}</strong> - ${info.description}
        </div>
        ${recommendationList.length > 0 ? `
          <div class="recommendations">
            <h4>改进建议:</h4>
            <ul>
              ${recommendationList.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  return html;
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

/**
 * 生成趋势报告
 */
export async function generateTrendReport(historyData: any[], outputDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(outputDir, `trend-report-${timestamp}.html`);
  
  // 生成HTML内容
  const htmlContent = generateTrendHtml(historyData);
  
  // 写入文件
  await fs.writeFile(reportPath, htmlContent);
  
  return reportPath;
}

/**
 * 生成趋势报告HTML
 */
function generateTrendHtml(historyData: any[]): string {
  const historyJson = JSON.stringify(historyData);
  
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能测试趋势报告</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
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
        color: #4285f4;
        margin: 0;
        font-size: 24px;
      }
      
      .report-section {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }
      
      .section-title {
        color: #4285f4;
        border-bottom: 2px solid #f8f9fa;
        padding-bottom: 10px;
        margin-top: 0;
      }
      
      .chart-container {
        height: 400px;
        margin-top: 20px;
        margin-bottom: 40px;
      }
    </style>
  </head>
  <body>
    <div class="report-header">
      <h1 class="report-title">性能测试趋势报告</h1>
      <p>显示网站性能指标随时间的变化趋势</p>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Lighthouse 得分趋势</h2>
      <div class="chart-container">
        <canvas id="scoreChart"></canvas>
      </div>
    </div>
    
    <div class="report-section">
      <h2 class="section-title">Web Vitals 指标趋势</h2>
      <div class="chart-container">
        <canvas id="fcpLcpChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="ttiTbtChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="clsChart"></canvas>
      </div>
    </div>
    
    <script>
      // 历史数据
      const historyData = ${historyJson};
      
      // 日期格式化
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + 
               date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
      };
      
      // 创建Lighthouse得分趋势图表
      const scoreCtx = document.getElementById('scoreChart').getContext('2d');
      new Chart(scoreCtx, {
        type: 'line',
        data: {
          labels: historyData.map(item => formatDate(item.timestamp)),
          datasets: [
            {
              label: '性能',
              data: historyData.map(item => item.scores.performance),
              borderColor: '#4285f4',
              backgroundColor: 'rgba(66, 133, 244, 0.1)',
              tension: 0.1
            },
            {
              label: '可访问性',
              data: historyData.map(item => item.scores.accessibility),
              borderColor: '#34a853',
              backgroundColor: 'rgba(52, 168, 83, 0.1)',
              tension: 0.1
            },
            {
              label: '最佳实践',
              data: historyData.map(item => item.scores['best-practices']),
              borderColor: '#fbbc05',
              backgroundColor: 'rgba(251, 188, 5, 0.1)',
              tension: 0.1
            },
            {
              label: 'SEO',
              data: historyData.map(item => item.scores.seo),
              borderColor: '#ea4335',
              backgroundColor: 'rgba(234, 67, 53, 0.1)',
              tension: 0.1
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
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
      
      // 创建FCP和LCP趋势图表
      const fcpLcpCtx = document.getElementById('fcpLcpChart').getContext('2d');
      new Chart(fcpLcpCtx, {
        type: 'line',
        data: {
          labels: historyData.map(item => formatDate(item.timestamp)),
          datasets: [
            {
              label: 'FCP (ms)',
              data: historyData.map(item => item.webVitals.FCP),
              borderColor: '#4285f4',
              backgroundColor: 'rgba(66, 133, 244, 0.1)',
              tension: 0.1
            },
            {
              label: 'LCP (ms)',
              data: historyData.map(item => item.webVitals.LCP),
              borderColor: '#34a853',
              backgroundColor: 'rgba(52, 168, 83, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '毫秒 (ms)'
              }
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
      
      // 创建TTI和TBT趋势图表
      const ttiTbtCtx = document.getElementById('ttiTbtChart').getContext('2d');
      new Chart(ttiTbtCtx, {
        type: 'line',
        data: {
          labels: historyData.map(item => formatDate(item.timestamp)),
          datasets: [
            {
              label: 'TTI (ms)',
              data: historyData.map(item => item.webVitals.TTI),
              borderColor: '#fbbc05',
              backgroundColor: 'rgba(251, 188, 5, 0.1)',
              tension: 0.1
            },
            {
              label: 'TBT (ms)',
              data: historyData.map(item => item.webVitals.TBT),
              borderColor: '#ea4335',
              backgroundColor: 'rgba(234, 67, 53, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '毫秒 (ms)'
              }
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
      
      // 创建CLS趋势图表
      const clsCtx = document.getElementById('clsChart').getContext('2d');
      new Chart(clsCtx, {
        type: 'line',
        data: {
          labels: historyData.map(item => formatDate(item.timestamp)),
          datasets: [
            {
              label: 'CLS',
              data: historyData.map(item => item.webVitals.CLS),
              borderColor: '#673ab7',
              backgroundColor: 'rgba(103, 58, 183, 0.1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'CLS值'
              }
            },
            x: {
              title: {
                display: true,
                text: '测试时间'
              }
            }
          }
        }
      });
    </script>
  </body>
  </html>
  `;
}

/**
 * 生成性能对比报告
 */
export async function generateComparisonReport(baselineResults: any, currentResults: any, outputDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(outputDir, `comparison-report-${timestamp}.html`);
  
  // 生成HTML内容
  const htmlContent = generateComparisonHtml(baselineResults, currentResults);
  
  // 写入文件
  await fs.writeFile(reportPath, htmlContent);
  
  return reportPath;
}

/**
 * 生成对比报告HTML
 */
function generateComparisonHtml(baselineResults: any, currentResults: any): string {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>性能对比报告</title>
  </head>
  <body>
    <h1>性能对比报告</h1>
    <p>此报告比较了两个URL的性能测试结果</p>
    <div>
      <h2>基准URL: ${baselineResults.url}</h2>
      <h2>当前URL: ${currentResults.url}</h2>
    </div>
  </body>
  </html>
  `;
}