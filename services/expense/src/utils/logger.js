const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const LOG_COLORS = {
  error: '\x1b[31m',  // Red
  warn: '\x1b[33m',   // Yellow
  info: '\x1b[36m',   // Cyan
  debug: '\x1b[37m',  // White
  reset: '\x1b[0m'    // Reset
};

class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info';
    this.currentLevel = LOG_LEVELS[this.level] || LOG_LEVELS.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const service = 'expense-service';
    
    const logObject = {
      timestamp,
      level: level.toUpperCase(),
      service,
      message,
      ...meta
    };

    // In development, use colored console output
    if (process.env.NODE_ENV === 'development') {
      const color = LOG_COLORS[level] || LOG_COLORS.reset;
      return `${color}[${timestamp}] ${level.toUpperCase()} [${service}]: ${message}${LOG_COLORS.reset}`;
    }

    // In production, use JSON format
    return JSON.stringify(logObject);
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] <= this.currentLevel) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      if (level === 'error') {
        console.error(formattedMessage);
      } else if (level === 'warn') {
        console.warn(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  error(message, meta = {}) {
    // Handle Error objects
    if (message instanceof Error) {
      meta.stack = message.stack;
      message = message.message;
    }
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Express middleware for request logging
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, ip } = req;
        const { statusCode } = res;
        
        const level = statusCode >= 400 ? 'warn' : 'info';
        
        this.log(level, `${method} ${url}`, {
          statusCode,
          duration: `${duration}ms`,
          ip,
          userAgent: req.get('User-Agent')
        });
      });
      
      next();
    };
  }
}

module.exports = new Logger();