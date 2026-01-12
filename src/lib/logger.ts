import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // Standard console output for development
    if (process.env.NODE_ENV === 'development') {
      const color = this.getColor(level);
      console.log(`%c[${level.toUpperCase()}] ${message}`, color, context || '');
    }

    // Sentry integration for errors and warnings
    if (level === 'error') {
      Sentry.captureException(new Error(message), { extra: context });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, { level: 'warning', extra: context });
    }

    // In a production environment, you would also send this to Axiom or similar
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToAxiom(logData);
    // }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'info': return 'color: #3b82f6';
      case 'warn': return 'color: #f59e0b';
      case 'error': return 'color: #ef4444';
      case 'debug': return 'color: #6b7280';
      default: return 'color: inherit';
    }
  }

  public info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  public debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = Logger.getInstance();
