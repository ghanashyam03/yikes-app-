import type { FastifyError, FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';

/**
 * Sentry Scrubber & Fastify Plugin for yikes! Gateway.
 *
 * Guarantees that:
 * 1. Gateway error payloads, stack traces, and request context strictly scrub message text, prompt text, and transcripts.
 * 2. Sentry events emitted by the gateway strip sensitive request bodies and parameters.
 */

export interface GatewaySentryBreadcrumb {
  message?: string | undefined;
  category?: string | undefined;
  level?: string | undefined;
  data?: Record<string, unknown> | undefined;
  timestamp?: number | undefined;
}

export interface GatewaySentryException {
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

export interface GatewaySentryEvent {
  event_id?: string | undefined;
  message?: string | undefined;
  breadcrumbs?: GatewaySentryBreadcrumb[] | undefined;
  exception?: {
    values?: GatewaySentryException[] | undefined;
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
 * Recursively redacts sensitive keys from an object or array.
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
 * Sanitizes free-text substrings from an error string or breadcrumb message.
 */
export function scrubString(text?: string): string | undefined {
  if (!text) {
    return text;
  }

  let scrubbed = text;
  scrubbed = scrubbed.replace(SENSITIVE_URL_PARAM_REGEX, '$1[REDACTED]');
  scrubbed = scrubbed.replace(
    /(prompt|message|content|transcript|thought|reply|quote)s?[^"'\r\n]{0,40}["'`][^"'`]+["'`]/gi,
    '$1: "[REDACTED]"'
  );
  scrubbed = scrubbed.replace(
    /(user|partner|coach)\s*:\s*["'`][^"'`]+["'`]/gi,
    '$1: "[REDACTED]"'
  );

  return scrubbed;
}

/**
 * Sentry beforeSend scrubber hook for gateway server events.
 */
export function scrubGatewaySentryEvent(event: GatewaySentryEvent): GatewaySentryEvent {
  const result: GatewaySentryEvent = { ...event };

  if (result.message) {
    result.message = scrubString(result.message);
  }

  if (result.exception?.values) {
    result.exception = {
      ...result.exception,
      values: result.exception.values.map((exc) => {
        const cleaned: GatewaySentryException = {
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

  if (result.breadcrumbs) {
    result.breadcrumbs = result.breadcrumbs.map((b) => ({
      ...b,
      message: scrubString(b.message),
      data: b.data ? scrubSensitiveData(b.data) : undefined,
    }));
  }

  if (result.extra) {
    result.extra = scrubSensitiveData(result.extra);
  }

  if (result.contexts) {
    const cleanedCtx: Record<string, Record<string, unknown>> = {};
    for (const [k, v] of Object.entries(result.contexts)) {
      cleanedCtx[k] = scrubSensitiveData(v);
    }
    result.contexts = cleanedCtx;
  }

  if (result.request) {
    const req = { ...result.request };
    if (req.url) {
      req.url = req.url.replace(SENSITIVE_URL_PARAM_REGEX, '$1[REDACTED]');
    }
    if (req.headers) {
      req.headers = scrubSensitiveData(req.headers) as Record<string, string>;
    }
    // Sensitive request payloads (e.g. chat turns, messages, prompts) are redacted
    if (req.data) {
      req.data = scrubSensitiveData(req.data);
    }
    result.request = req;
  }

  return result;
}

export interface SentryPluginOptions {
  captureException?: (error: unknown, context?: Record<string, unknown>) => void;
  beforeSendScrubber?: (event: GatewaySentryEvent) => GatewaySentryEvent;
}

/**
 * Fastify Sentry Plugin with built-in privacy scrubber.
 */
export const sentryFastifyPlugin: FastifyPluginAsync<SentryPluginOptions> = async (
  fastify: FastifyInstance,
  options: SentryPluginOptions = {}
): Promise<void> => {
  const scrubber = options.beforeSendScrubber ?? scrubGatewaySentryEvent;

  fastify.addHook('onError', async (request: FastifyRequest, _reply, error: FastifyError) => {
    // Sanitize any message text in error message or stack before Sentry capture
    const scrubbedMessage = scrubString(error.message);

    const errorEvent: GatewaySentryEvent = {
      message: scrubbedMessage,
      exception: {
        values: [
          {
            type: error.name || 'FastifyError',
            value: scrubbedMessage,
          },
        ],
      },
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers as Record<string, string>,
        data: request.body,
      },
    };

    const sanitizedEvent = scrubber(errorEvent);

    if (options.captureException) {
      options.captureException(sanitizedEvent);
    }
  });
};

(sentryFastifyPlugin as unknown as Record<symbol, boolean>)[Symbol.for('skip-override')] = true;
