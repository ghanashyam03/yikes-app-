import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export const REDACTED_PATHS = [
  'messages',
  'messages[*].content',
  'content',
  'text',
  'prompt',
  'thought',
  'reply',
  'rawText',
  'body.text',
  'body.content',
  'body.reply',
  'body.thought',
  'body.messages',
  'body.messages[*].content',
  '*.content',
  '*.text',
  '*.prompt',
  '*.messages',
  '*.messages[*].content',
  'authorization',
  'req.headers.authorization',
  'headers.authorization',
];

export function createRedactedLogger(
  options?: LoggerOptions,
  destination?: DestinationStream
): Logger {
  const opts: LoggerOptions = {
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: REDACTED_PATHS,
      censor: '[REDACTED]',
    },
    ...options,
  };

  return destination ? pino(opts, destination) : pino(opts);
}

export const logger = createRedactedLogger();
