# Model Endpoint Swap Checklist

1. **Review Terms**: Read the provider's current terms of service regarding data privacy and zero-data-retention policies.
2. **Update Environment Variables**: Set `NVIDIA_BASE_URL` (or target provider URL) and production API keys in Supabase / Fly.io secrets.
3. **Verify Model IDs**: Update model mapping configuration in the gateway to point to production tier models (e.g. enterprise endpoints).
4. **Run Smoke Test**: Execute `pnpm --filter gateway smoke` to ensure all models respond correctly and latency is within acceptable thresholds.
5. **Monitor Logs**: Check gateway logs and error rates for 24 hours post-swap.
