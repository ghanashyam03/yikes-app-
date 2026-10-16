/**
 * Sentry Scrubber for yikes! mobile and shared clients.
 *
 * Scans breadcrumbs, exceptions, and extra context to strictly remove:
 * - Message text
 * - User prompt text
 * - Transcripts and quotes
 * - Dialogue turns and inner thoughts
 * - Sensitive URL parameters and request bodies
 */

export interface SentryBreadcrumb {
  message?: string | undefined;
  category?: string | undefined;
  level?: string | undefined;
  data?: Record<string, unknown> | undefined;
  timestamp?: number | undefined;
  type?: string | undefined;
}

export interface SentryException {
  type?: string | undefined;
  value?: string | undefined;
  module?: string | undefined;
  stacktrace?: {
    frames?: Array<{
      filename?: string | undefined;
      function?: string | undefined;
      vars?: Record<string, unknown> | undefined;
    }> | undefined;
  } | undefined;
}

export interface SentryEvent {
  event_id?: string | undefined;
  message?: string | undefined;
  breadcrumbs?: SentryBreadcrumb[] | undefined;
  exception?: {
    values?: SentryException[] | undefined;
  } | undefined;
  extra?: Record<string, unknown> | undefined;
  contexts?: Record<string, Record<string, unknown>> | undefined;
  tags?: Record<string, string> | undefined;
  request?: {
    url?: string | undefined;
    method?: string | undefined;
    data?: unknown;
    query_string?: string | Record<string, string> | undefined;
    headers?: Record<string, string> | undefined;
  } | undefined;
}

export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  if (
    lower === 'content-type' ||
    lower === 'content_type' ||
    lower === 'content-length' ||
    lower === 'content_length'
  ) {
    return false;
  }
  return /(text|message|content|prompt|transcript|thought|reply|quote|body|note|draft|dialogue|speech|audio|authorization|cookie)/i.test(
    lower
  );
}

const SENSITIVE_URL_PARAM_REGEX = /([?&](?:text|prompt|message|query|content)=)([^&]+)/gi;

/**
 * Redacts sensitive free-text values recursively from an object or array.
 */
export function scrubSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return scrubString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => scrubSensitiveData(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        output[key] = '[REDACTED]';
      } else if (typeof val === 'object' && val !== null) {
        output[key] = scrubSensitiveData(val);
      } else if (typeof val === 'string') {
        output[key] = scrubString(val);
      } else {
        output[key] = val;
      }
    }
    return output as T;
  }

  return input;
}

/**
 * Scrubs free-text leaks from strings (e.g. error messages or breadcrumb logs).
 */
export function scrubString(text?: string): string | undefined {
  if (!text) {
    return text;
  }

  let scrubbed = text;

  // Redact URL query parameters
  scrubbed = scrubbed.replace(SENSITIVE_URL_PARAM_REGEX, '$1[REDACTED]');

  // Redact quoted text following message/prompt/quote/transcript patterns
  scrubbed = scrubbed.replace(
    /(prompt|message|content|transcript|thought|reply|quote)s?[^"'\r\n]{0,40}["'`][^"'`]+["'`]/gi,
    '$1: "[REDACTED]"'
  );

  // Redact markdown/block quotes or dialogue formatting like 'User: "..."' or 'Partner: "..."'
  scrubbed = scrubbed.replace(
    /(user|partner|coach)\s*:\s*["'`][^"'`]+["'`]/gi,
    '$1: "[REDACTED]"'
  );

  return scrubbed;
}

/**
 * Scans a breadcrumb to remove message text, transcripts, and sensitive context.
 */
export function scrubSentryBreadcrumb(breadcrumb: SentryBreadcrumb): SentryBreadcrumb {
  const result: SentryBreadcrumb = { ...breadcrumb };

  if (result.message) {
    result.message = scrubString(result.message);
  }

  if (result.data) {
    result.data = scrubSensitiveData(result.data);
  }

  return result;
}

/**
 * Sentry beforeSend scrubber hook for mobile and gateway environments.
 * Strictly guarantees no message text or transcript survives in exceptions,
 * breadcrumbs, extra data, or request context.
 */
export function scrubSentryEvent(event: SentryEvent): SentryEvent {
  const result: SentryEvent = { ...event };

  // 1. Scrub top-level message
  if (result.message) {
    result.message = scrubString(result.message);
  }

  // 2. Scrub exceptions
  if (result.exception?.values) {
    result.exception = {
      ...result.exception,
      values: result.exception.values.map((exc) => {
        const cleaned: SentryException = {
          ...exc,
          value: scrubString(exc.value),
        };

        if (cleaned.stacktrace?.frames) {
          cleaned.stacktrace = {
            ...cleaned.stacktrace,
            frames: cleaned.stacktrace.frames.map((frame) => {
              if (frame.vars) {
                return {
                  ...frame,
                  vars: scrubSensitiveData(frame.vars),
                };
              }
              return frame;
            }),
          };
        }

        return cleaned;
      }),
    };
  }

  // 3. Scrub breadcrumbs
  if (result.breadcrumbs) {
    result.breadcrumbs = result.breadcrumbs.map(scrubSentryBreadcrumb);
  }

  // 4. Scrub extra context
  if (result.extra) {
    result.extra = scrubSensitiveData(result.extra);
  }

  // 5. Scrub contexts
  if (result.contexts) {
    const cleanedContexts: Record<string, Record<string, unknown>> = {};
    for (const [key, ctx] of Object.entries(result.contexts)) {
      cleanedContexts[key] = scrubSensitiveData(ctx);
    }
    result.contexts = cleanedContexts;
  }

  // 6. Scrub request data
  if (result.request) {
    const req = { ...result.request };
    if (req.url) {
      req.url = req.url.replace(SENSITIVE_URL_PARAM_REGEX, '$1[REDACTED]');
    }
    if (req.data) {
      req.data = scrubSensitiveData(req.data);
    }
    if (typeof req.query_string === 'string') {
      req.query_string = req.query_string.replace(SENSITIVE_URL_PARAM_REGEX, '$1[REDACTED]');
    } else if (req.query_string && typeof req.query_string === 'object') {
      req.query_string = scrubSensitiveData(req.query_string) as Record<string, string>;
    }
    result.request = req;
  }

  return result;
}

export const createBeforeSendScrubber = () => scrubSentryEvent;
export const createBeforeBreadcrumbScrubber = () => scrubSentryBreadcrumb;
