import winston from 'winston';
import chalk from 'chalk'; // For colored logs (optional)

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colorize log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// Format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => 
      `${info.timestamp} ${(chalk[colors[info.level as keyof typeof levels] as keyof typeof chalk] as (text: string) => string)('➤')} ${info.level.toUpperCase()}: ${info.message}`
  )
);

// Create logger instance
const Logger = winston.createLogger({
  levels,
  transports: [
    // Console transport (colored)
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    // File transport (errors only)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
  exitOnError: false,
});

export default Logger;