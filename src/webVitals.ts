/**
 * Web Vitals 工具类
 * 用于收集和分析关键性能指标
 */

export interface WebVitalsMetrics {
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  CLS: number | null; // Cumulative Layout Shift
  FID: number | null; // First Input Delay
  TTI: number | null; // Time to Interactive
  TBT: number | null; // Total Blocking Time
  TTFB: number | null; // Time to First Byte
}

export interface WebVitalsResult {
  url: string;
  metrics: WebVitalsMetrics;
  timestamp: string;
  device: string;
}

/**
 * 从Lighthouse结果中提取Web Vitals指标
 */
export function extractWebVitals(lhr: any): WebVitalsMetrics {
  const audits = lhr.audits || {};
  
  return {
    FCP: getMetricValue(audits['first-contentful-paint']),
    LCP: getMetricValue(audits['largest-contentful-paint']),
    CLS: getMetricValue(audits['cumulative-layout-shift']),
    FID: getMetricValue(audits['max-potential-fid']),
    TTI: getMetricValue(audits['interactive']),
    TBT: getMetricValue(audits['total-blocking-time']),
    TTFB: getMetricValue(audits['server-response-time'])
  };
}

/**
 * 从审计项中提取指标值（毫秒）
 */
function getMetricValue(audit: any): number | null {
  if (!audit || audit.score === null) return null;
  
  // 有些指标使用numericValue，有些使用numericUnit
  if (audit.numericValue !== undefined) {
    return audit.numericValue;
  }
  
  return null;
}

/**
 * 生成Web Vitals指标的评估结果
 */
export function evaluateWebVitals(metrics: WebVitalsMetrics): Record<string, string> {
  const evaluations: Record<string, string> = {};
  
  // FCP评估 (First Contentful Paint)
  if (metrics.FCP !== null) {
    if (metrics.FCP < 1800) {
      evaluations.FCP = '良好';
    } else if (metrics.FCP < 3000) {
      evaluations.FCP = '需要改进';
    } else {
      evaluations.FCP = '较差';
    }
  }
  
  // LCP评估 (Largest Contentful Paint)
  if (metrics.LCP !== null) {
    if (metrics.LCP < 2500) {
      evaluations.LCP = '良好';
    } else if (metrics.LCP < 4000) {
      evaluations.LCP = '需要改进';
    } else {
      evaluations.LCP = '较差';
    }
  }
  
  // CLS评估 (Cumulative Layout Shift)
  if (metrics.CLS !== null) {
    if (metrics.CLS < 0.1) {
      evaluations.CLS = '良好';
    } else if (metrics.CLS < 0.25) {
      evaluations.CLS = '需要改进';
    } else {
      evaluations.CLS = '较差';
    }
  }
  
  // FID评估 (First Input Delay)
  if (metrics.FID !== null) {
    if (metrics.FID < 100) {
      evaluations.FID = '良好';
    } else if (metrics.FID < 300) {
      evaluations.FID = '需要改进';
    } else {
      evaluations.FID = '较差';
    }
  }
  
  // TTI评估 (Time to Interactive)
  if (metrics.TTI !== null) {
    if (metrics.TTI < 3800) {
      evaluations.TTI = '良好';
    } else if (metrics.TTI < 7300) {
      evaluations.TTI = '需要改进';
    } else {
      evaluations.TTI = '较差';
    }
  }
  
  // TBT评估 (Total Blocking Time)
  if (metrics.TBT !== null) {
    if (metrics.TBT < 200) {
      evaluations.TBT = '良好';
    } else if (metrics.TBT < 600) {
      evaluations.TBT = '需要改进';
    } else {
      evaluations.TBT = '较差';
    }
  }
  
  // TTFB评估 (Time to First Byte)
  if (metrics.TTFB !== null) {
    if (metrics.TTFB < 800) {
      evaluations.TTFB = '良好';
    } else if (metrics.TTFB < 1800) {
      evaluations.TTFB = '需要改进';
    } else {
      evaluations.TTFB = '较差';
    }
  }
  
  return evaluations;
}

/**
 * 生成Web Vitals指标的改进建议
 */
export function generateWebVitalsRecommendations(metrics: WebVitalsMetrics, evaluations: Record<string, string>): Record<string, string[]> {
  const recommendations: Record<string, string[]> = {};
  
  // FCP建议
  if (metrics.FCP !== null && evaluations.FCP !== '良好') {
    recommendations.FCP = [
      '优化服务器响应时间',
      '移除阻塞渲染的资源',
      '优化关键渲染路径'
    ];
  }
  
  // LCP建议
  if (metrics.LCP !== null && evaluations.LCP !== '良好') {
    recommendations.LCP = [
      '优化最大内容元素的加载',
      '使用图片懒加载',
      '优化服务器响应时间',
      '预加载关键资源'
    ];
  }
  
  // CLS建议
  if (metrics.CLS !== null && evaluations.CLS !== '良好') {
    recommendations.CLS = [
      '为图片和视频元素设置明确的宽高',
      '避免在已有内容上方插入内容',
      '使用transform动画代替影响布局的属性'
    ];
  }
  
  // FID建议
  if (metrics.FID !== null && evaluations.FID !== '良好') {
    recommendations.FID = [
      '减少JavaScript执行时间',
      '拆分长任务',
      '优化事件处理程序'
    ];
  }
  
  // TTI建议
  if (metrics.TTI !== null && evaluations.TTI !== '良好') {
    recommendations.TTI = [
      '减少JavaScript的体积',
      '移除未使用的JavaScript',
      '使用代码分割',
      '延迟加载非关键JavaScript'
    ];
  }
  
  // TBT建议
  if (metrics.TBT !== null && evaluations.TBT !== '良好') {
    recommendations.TBT = [
      '减少主线程工作',
      '减少JavaScript执行时间',
      '优化第三方脚本的影响'
    ];
  }
  
  // TTFB建议
  if (metrics.TTFB !== null && evaluations.TTFB !== '良好') {
    recommendations.TTFB = [
      '优化服务器处理时间',
      '使用CDN',
      '预连接到所需的源',
      '使用缓存'
    ];
  }
  
  return recommendations;
}