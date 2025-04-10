/**
 * 命令行界面优化模块
 * 提供进度条、彩色输出和友好的用户界面
 */

import * as readline from 'readline';
// 使用require导入chalk，因为chalk v4.1.2是CommonJS模块
const chalk = require('chalk');
// 为chalk添加类型声明
type ChalkFunction = (text: string) => string;
interface Chalk extends ChalkFunction {
  green: ChalkFunction;
  red: ChalkFunction;
  yellow: ChalkFunction;
  blue: ChalkFunction;
  cyan: ChalkFunction;
  gray: ChalkFunction;
  bold: ChalkFunction;
  [key: string]: any;
}

/**
 * 进度条类
 */
export class ProgressBar {
  private bar: string;
  private barLength: number;
  private current: number;
  private total: number;
  private startTime: number;
  private stream: NodeJS.WriteStream;
  
  constructor(total: number, barLength: number = 30) {
    this.bar = '';
    this.barLength = barLength;
    this.current = 0;
    this.total = total;
    this.startTime = Date.now();
    this.stream = process.stdout;
  }
  
  /**
   * 更新进度条
   */
  update(current: number, message: string = ''): void {
    this.current = current;
    const percent = this.current / this.total;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const eta = elapsed / this.current * (this.total - this.current);
    
    const filledLength = Math.round(this.barLength * percent);
    const emptyLength = this.barLength - filledLength;
    
    const filledBar = chalk.green('█'.repeat(filledLength));
    const emptyBar = chalk.gray('░'.repeat(emptyLength));
    
    const percentText = chalk.yellow(`${(percent * 100).toFixed(1)}%`);
    const etaText = isFinite(eta) ? chalk.cyan(`ETA: ${formatTime(eta)}`) : '';
    const elapsedText = chalk.cyan(`用时: ${formatTime(elapsed)}`);
    
    this.bar = `${chalk.bold(`[${this.current}/${this.total}]`)} ${filledBar}${emptyBar} ${percentText} ${elapsedText} ${etaText} ${message}`;
    
    readline.clearLine(this.stream, 0);
    readline.cursorTo(this.stream, 0);
    this.stream.write(this.bar);
  }
  
  /**
   * 完成进度条
   */
  complete(message: string = '完成!'): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.update(this.total);
    readline.clearLine(this.stream, 0);
    readline.cursorTo(this.stream, 0);
    this.stream.write(`${chalk.green('✓')} ${chalk.bold(message)} ${chalk.gray(`(总用时: ${formatTime(elapsed)})`)}
`);
  }
}

/**
 * 格式化时间（秒）为可读格式
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARNING = 3,
  ERROR = 4
}

/**
 * 日志工具类
 */
export class Logger {
  private level: LogLevel;
  
  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }
  
  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  /**
   * 调试日志
   */
  debug(message: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[调试] ${message}`));
    }
  }
  
  /**
   * 信息日志
   */
  info(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.blue(`[信息] ${message}`));
    }
  }
  
  /**
   * 成功日志
   */
  success(message: string): void {
    if (this.level <= LogLevel.SUCCESS) {
      console.log(chalk.green(`[成功] ${message}`));
    }
  }
  
  /**
   * 警告日志
   */
  warning(message: string): void {
    if (this.level <= LogLevel.WARNING) {
      console.log(chalk.yellow(`[警告] ${message}`));
    }
  }
  
  /**
   * 错误日志
   */
  error(message: string, error?: Error): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(chalk.red(`[错误] ${message}`));
      if (error) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }
  
  /**
   * 表格输出
   */
  table(data: any[], columns?: string[]): void {
    if (this.level <= LogLevel.INFO) {
      if (columns) {
        console.log(chalk.cyan(columns.join('\t')));
        console.log(chalk.cyan('-'.repeat(columns.join('\t').length)));
      }
      
      data.forEach(row => {
        if (typeof row === 'object') {
          const values = columns ? columns.map(col => row[col]) : Object.values(row);
          console.log(values.join('\t'));
        } else {
          console.log(row);
        }
      });
    }
  }
  
  /**
   * 分组输出
   */
  group(title: string, callback: () => void): void {
    if (this.level <= LogLevel.INFO) {
      console.group(chalk.bold(title));
      callback();
      console.groupEnd();
    }
  }
  
  /**
   * 输出分隔线
   */
  divider(char: string = '-', length: number = 50): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.gray(char.repeat(length)));
    }
  }
  
  /**
   * 输出标题
   */
  title(message: string): void {
    if (this.level <= LogLevel.INFO) {
      this.divider('=');
      console.log(chalk.bold.cyan(message));
      this.divider('=');
    }
  }
  
  /**
   * 输出子标题
   */
  subtitle(message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.bold.blue(message));
      this.divider('-', 30);
    }
  }
}

/**
 * 创建交互式命令行界面
 */
export function createCLI(): { logger: Logger, progress: (total: number) => ProgressBar } {
  const logger = new Logger();
  
  return {
    logger,
    progress: (total: number) => new ProgressBar(total)
  };
}

/**
 * 格式化性能得分
 */
export function formatScore(score: number): string {
  let colorFn: ChalkFunction;
  
  if (score >= 90) {
    colorFn = chalk.green;
  } else if (score >= 50) {
    colorFn = chalk.yellow;
  } else {
    colorFn = chalk.red;
  }
  
  return colorFn(`${score.toFixed(1)}`);
}

/**
 * 格式化Web Vitals指标
 */
export function formatWebVital(name: string, value: number | null, unit: string = 'ms'): string {
  if (value === null) return chalk.gray(`${name}: N/A`);
  
  let formattedValue: string;
  let colorFn: ChalkFunction;
  
  // 根据不同指标使用不同的阈值
  switch (name) {
    case 'FCP':
      colorFn = value < 1800 ? chalk.green : value < 3000 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    case 'LCP':
      colorFn = value < 2500 ? chalk.green : value < 4000 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    case 'CLS':
      colorFn = value < 0.1 ? chalk.green : value < 0.25 ? chalk.yellow : chalk.red;
      formattedValue = value.toFixed(3);
      break;
    case 'FID':
      colorFn = value < 100 ? chalk.green : value < 300 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    case 'TTI':
      colorFn = value < 3800 ? chalk.green : value < 7300 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    case 'TBT':
      colorFn = value < 200 ? chalk.green : value < 600 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    case 'TTFB':
      colorFn = value < 800 ? chalk.green : value < 1800 ? chalk.yellow : chalk.red;
      formattedValue = `${Math.round(value)}${unit}`;
      break;
    default:
      colorFn = chalk.blue;
      formattedValue = `${value}${unit}`;
  }
  
  return `${chalk.bold(name)}: ${colorFn(formattedValue)}`;
}