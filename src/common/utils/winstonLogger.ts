import { LoggerService } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

interface ILogInfo extends winston.Logform.TransformableInfo {
  context?: string | Record<string, unknown>;
  timestamp?: string;
  ms?: string;
}

const rejectSystemLogs = winston.format(
  (
    info: winston.Logform.TransformableInfo,
  ): winston.Logform.TransformableInfo | false => {
    const rejectedContext = [
      'InstanceLoader',
      'RoutesResolver',
      'RouterExplorer',
    ];

    return rejectedContext.includes(info.context as string) ? false : info;
  },
);

const createPrintfFormatter = (appName: string): winston.Logform.Format =>
  winston.format.printf((info: ILogInfo): string => {
    const { timestamp, level, message, context, ms } = info;
    let contextStr = '';
    let metadataStr = '';

    if (context) {
      if (typeof context === 'string') {
        contextStr = `[${context}]`;
      } else if (typeof context === 'object') {
        contextStr = '[Service]';
        metadataStr = ` - ${JSON.stringify(context, null, 2)}`;
      }
    }

    return `[ListAmBot.${appName}] ${process.pid}   ${timestamp || ''}    ${level.toUpperCase()} ${contextStr} ${JSON.stringify(message, null, 2)}${metadataStr} ${ms || ''}`;
  });

const createCommonFormat = (appName: string): winston.Logform.Format =>
  winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    createPrintfFormatter(appName),
    rejectSystemLogs(),
  );

export const makeLogger = (appName: string): LoggerService => {
  const commonFormat = createCommonFormat(appName);
  const consoleFormat = winston.format.combine(
    commonFormat,
    winston.format.uncolorize(),
  );

  return WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new DailyRotateFile({
        filename: `logs/${appName}/%DATE%-combined.log`,
        format: commonFormat,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxFiles: '30d',
      }),
      new DailyRotateFile({
        filename: `logs/${appName}/%DATE%-error.log`,
        level: 'error',
        format: commonFormat,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxFiles: '30d',
      }),
    ],
  });
};
