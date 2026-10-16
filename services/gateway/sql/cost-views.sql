-- SQL Views for AI Usage and Observability Costs
-- Domain: ai_calls aggregation
-- Non-negotiable Privacy Guarantee:
-- Strictly aggregates metadata (job, model, status, tokens, latency).
-- ZERO message text, transcripts, or prompts are queried.

-- 1. Daily AI Costs View
CREATE OR REPLACE VIEW public.daily_ai_costs AS
SELECT
  date_trunc('day', created_at)::date AS call_date,
  job,
  model,
  status,
  count(*)::integer AS total_calls,
  coalesce(sum((token_counts->>'prompt_tokens')::integer), 0)::integer AS total_prompt_tokens,
  coalesce(sum((token_counts->>'completion_tokens')::integer), 0)::integer AS total_completion_tokens,
  coalesce(sum(
    coalesce((token_counts->>'total_tokens')::integer,
      coalesce((token_counts->>'prompt_tokens')::integer, 0) + coalesce((token_counts->>'completion_tokens')::integer, 0)
    )
  ), 0)::integer AS total_tokens,
  round(avg(latency_ms), 2) AS avg_latency_ms,
  round(
    sum(
      (
        coalesce((token_counts->>'prompt_tokens')::numeric, 0) * (
          CASE
            WHEN model LIKE '%70b%' THEN 0.0007 / 1000
            WHEN model LIKE '%safety%' OR model LIKE '%guard%' THEN 0.0002 / 1000
            WHEN model LIKE '%vision%' THEN 0.00035 / 1000
            ELSE 0.0003 / 1000
          END
        )
      ) +
      (
        coalesce((token_counts->>'completion_tokens')::numeric, 0) * (
          CASE
            WHEN model LIKE '%70b%' THEN 0.0008 / 1000
            WHEN model LIKE '%safety%' OR model LIKE '%guard%' THEN 0.0002 / 1000
            WHEN model LIKE '%vision%' THEN 0.00045 / 1000
            ELSE 0.0004 / 1000
          END
        )
      )
    ),
    6
  ) AS estimated_cost_usd
FROM public.ai_calls
GROUP BY 1, 2, 3, 4;

-- 2. Monthly AI Costs View
CREATE OR REPLACE VIEW public.monthly_ai_costs AS
SELECT
  to_char(date_trunc('month', created_at), 'YYYY-MM') AS call_month,
  job,
  model,
  count(*)::integer AS total_calls,
  coalesce(sum((token_counts->>'prompt_tokens')::integer), 0)::integer AS total_prompt_tokens,
  coalesce(sum((token_counts->>'completion_tokens')::integer), 0)::integer AS total_completion_tokens,
  coalesce(sum(
    coalesce((token_counts->>'total_tokens')::integer,
      coalesce((token_counts->>'prompt_tokens')::integer, 0) + coalesce((token_counts->>'completion_tokens')::integer, 0)
    )
  ), 0)::integer AS total_tokens,
  round(avg(latency_ms), 2) AS avg_latency_ms,
  round(
    sum(
      (
        coalesce((token_counts->>'prompt_tokens')::numeric, 0) * (
          CASE
            WHEN model LIKE '%70b%' THEN 0.0007 / 1000
            WHEN model LIKE '%safety%' OR model LIKE '%guard%' THEN 0.0002 / 1000
            WHEN model LIKE '%vision%' THEN 0.00035 / 1000
            ELSE 0.0003 / 1000
          END
        )
      ) +
      (
        coalesce((token_counts->>'completion_tokens')::numeric, 0) * (
          CASE
            WHEN model LIKE '%70b%' THEN 0.0008 / 1000
            WHEN model LIKE '%safety%' OR model LIKE '%guard%' THEN 0.0002 / 1000
            WHEN model LIKE '%vision%' THEN 0.00045 / 1000
            ELSE 0.0004 / 1000
          END
        )
      )
    ),
    6
  ) AS estimated_cost_usd
FROM public.ai_calls
GROUP BY 1, 2, 3;
