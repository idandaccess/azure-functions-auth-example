# idandaccess--azure-functions-auth-example

## No parallel manual renewals

### token-renewer/host.json

```
"http": {
  "maxOutstandingRequests": 1,
  "maxConcurrentRequests": 1
}
```

see: <https://docs.microsoft.com/en-us/azure/azure-functions/functions-host-json#http>

### token-renewer/App settings

`"WEBSITE_MAX_DYNAMIC_APPLICATION_SCALE_OUT": 1`

see: <https://docs.microsoft.com/en-gb/azure/azure-functions/functions-app-settings#website_max_dynamic_application_scale_out>

### Implication

TODO:

1. Clients calling the entpoint to trigger a manual renewal must handle 429 (too many requests) status codes ... and wait for a while after 429 then retry (either the original operation or renewing again).
2. ???

## Only renew token if token exists in KeyVault and last renew not younger than 5 minutes

Store `lastRenewalTime` in in-memory function app instance singleton.
As not more than one function app instance can run at any given time (`WEBSITE_MAX_DYNAMIC_APPLICATION_SCALE_OUT`), this should be safe to rely on.

### Possible alternative

Clients calling the entpoint to trigger a manual renewal might get blocked by the endpoint which renews only for the first request and blocks others while renewing .. based on a (function app instance singleton) reader-writer-lock.

Currently this is just a thought and was not implemented because - given enough scale out - clients would have to deal with 429s anyways.

## Global Dev Dependencies

- azure-function-core-tools
- dotenv-cli

`dotenv -e ./../../.env sh deploy-func.sh`
