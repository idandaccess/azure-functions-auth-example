import * as pulumi from "@pulumi/pulumi"
import * as azure from "@pulumi/azure"

import { Values as catSettings } from "./fn-serverless-cat/local.settings.json"
import { Values as dogSettings } from "./fn-serviceful-dog/local.settings.json"
import { Values as tokenRenewerSettings } from "./fn-token-renewer/local.settings.json"

const FUNCTIONS_WORKER_RUNTIME = "node"
const WEBSITE_NODE_DEFAULT_VERSION = "10.14.1"

const config = new pulumi.Config()
const resourceGroupName = config.get("rgName")
const appNameDog = config.get("appNameDog")
const appNameCat = config.get("appNameCat")
const tokenRenewerAppName = config.get("tokenRenewerAppName")
const dogKeyVaultAccessTokensName = config.get("dogKeyVaultAccessTokensName")
const tokenRenewerKeyVaultClientSecretsName = config.get(
  "tokenRenewerKeyVaultClientSecretsName"
)

const clientConfig = azure.core.getClientConfig({})
const tenantId = clientConfig.tenantId
const currentPrincipal = clientConfig.objectId

const resourceGroup = new azure.core.ResourceGroup(
  "idandaccess--azure-functions-auth-example",
  {
    name: resourceGroupName,
  }
)

///////////////////////////////////////////////////////////////////////////////
// Serverless Cat
///////////////////////////////////////////////////////////////////////////////

const catAccount = new azure.storage.Account("catstorage", {
  resourceGroupName: resourceGroup.name,
  accountTier: "Standard",
  accountReplicationType: "LRS",
})

const catPlan = new azure.appservice.Plan("cat-asp", {
  resourceGroupName: resourceGroup.name,
  kind: "FunctionApp",
  sku: {
    tier: "Dynamic",
    size: "Y1",
  },
})

const catAppInsights = new azure.appinsights.Insights(`${appNameCat}-ai`, {
  resourceGroupName: resourceGroup.name,
  name: `${appNameCat}-ai`,
  applicationType: "Web",
})
// const catApp = new azure.appservice.FunctionApp("cat-fn", {
//   name: appNameCat,
//   resourceGroupName: resourceGroup.name,
//   appServicePlanId: catPlan.id,
//   storageConnectionString: catAccount.primaryConnectionString,
//   version: "~2",
//   appSettings: {
//     FUNCTIONS_WORKER_RUNTIME,
//     WEBSITE_NODE_DEFAULT_VERSION,
//     WEBSITE_RUN_FROM_PACKAGE: "1",
//   },
// })

const catApp = new azure.appservice.ArchiveFunctionApp("cat-fn", {
  resourceGroup,
  archive: new pulumi.asset.FileArchive("./fn-serverless-cat"),
  name: appNameCat,
  plan: catPlan,
  account: catAccount,
  appSettings: {
    FUNCTIONS_WORKER_RUNTIME: FUNCTIONS_WORKER_RUNTIME,
    APPINSIGHTS_INSTRUMENTATIONKEY: catAppInsights.instrumentationKey,
    AUTH_ISSUER_PUBKEY_AUTH0: catSettings.AUTH_ISSUER_PUBKEY_AUTH0,
    AUTH_ISSUER_DOMAIN_AUTH0: catSettings.AUTH_ISSUER_DOMAIN_AUTH0,
    CAT_API_ID: catSettings.CAT_API_ID,
  },
  nodeVersion: WEBSITE_NODE_DEFAULT_VERSION,
  httpsOnly: true,
  identity: {
    type: "SystemAssigned",
  },
})

// export const catEndpoint = pulumi.interpolate`${catApp.endpoint}`
export const catEndpoint = catApp.functionApp.defaultHostname.apply(
  v => `https://${v}/`
)

// catApp.functionApp.getFunctionKeys

///////////////////////////////////////////////////////////////////////////////
// Serviceful Dog
///////////////////////////////////////////////////////////////////////////////

const dogAccount = new azure.storage.Account("dogstorage", {
  resourceGroupName: resourceGroup.name,
  accountTier: "Standard",
  accountReplicationType: "LRS",
})

const dogPlan = new azure.appservice.Plan("dog-asp", {
  resourceGroupName: resourceGroup.name,
  kind: "FunctionApp",
  sku: {
    tier: "Dynamic",
    size: "Y1",
  },
})

const dogAppInsights = new azure.appinsights.Insights(`${appNameDog}-ai`, {
  resourceGroupName: resourceGroup.name,
  name: `${appNameDog}-ai`,
  applicationType: "Web",
})

const dogApp = new azure.appservice.ArchiveFunctionApp("dog-fn", {
  resourceGroup,
  archive: new pulumi.asset.FileArchive("./fn-serviceful-dog"),
  name: appNameDog,
  plan: dogPlan,
  account: dogAccount,
  appSettings: {
    FUNCTIONS_WORKER_RUNTIME: FUNCTIONS_WORKER_RUNTIME,
    APPINSIGHTS_INSTRUMENTATIONKEY: dogAppInsights.instrumentationKey,
    AUTH_ISSUER_PUBKEY_AUTH0: dogSettings.AUTH_ISSUER_PUBKEY_AUTH0,
    AUTH_ISSUER_DOMAIN_AUTH0: dogSettings.AUTH_ISSUER_DOMAIN_AUTH0,
    CAT_API_URL: catEndpoint,
    DOG_API_ID: dogSettings.DOG_API_ID,
    DOG_KEY_VAULT_ACCESS_TOKENS_URI:
      dogSettings.DOG_KEY_VAULT_ACCESS_TOKENS_URI,
    CAT_API_ACCESS_TOKEN_NAME: dogSettings.CAT_API_ACCESS_TOKEN_NAME,
    CAT_API_FUNC_KEY: dogSettings.CAT_API_FUNC_KEY,
  },
  nodeVersion: WEBSITE_NODE_DEFAULT_VERSION,
  httpsOnly: true,
  identity: {
    type: "SystemAssigned",
  },
})

export const dogEndpoint = dogApp.functionApp.defaultHostname.apply(
  v => `https://${v}/`
)
// dogApp.functionApp.getFunctionKeys

// Export the connection string for the storage account
// export const connectionString = account.primaryConnectionString
// export const appName = app.name
// export const hostname = app.defaultHostname
// export const endpoint1 = app.defaultHostname.apply(
//   v => `https://${v}/api/hello`
// )
// export const endpoint2 = pulumi.interpolate`https://${app.defaultHostname}/api/hello`

///////////////////////////////////////////////////////////////////////////////
// Token Renewer
///////////////////////////////////////////////////////////////////////////////

const tokenRenewerAccount = new azure.storage.Account("trstorage", {
  resourceGroupName: resourceGroup.name,
  accountTier: "Standard",
  accountReplicationType: "LRS",
})

const tokenRenewerPlan = new azure.appservice.Plan("token-renewer-asp", {
  resourceGroupName: resourceGroup.name,
  kind: "FunctionApp",
  sku: {
    tier: "Dynamic",
    size: "Y1",
  },
})

const tokenRenewerAppInsights = new azure.appinsights.Insights(
  `${tokenRenewerAppName}-ai`,
  {
    resourceGroupName: resourceGroup.name,
    name: `${tokenRenewerAppName}-ai`,
    applicationType: "Web",
  }
)

const tokenRenewerApp = new azure.appservice.ArchiveFunctionApp(
  "token-renewer-fn",
  {
    resourceGroup,
    archive: new pulumi.asset.FileArchive("./fn-token-renewer"),
    name: tokenRenewerAppName,
    plan: tokenRenewerPlan,
    account: tokenRenewerAccount,
    appSettings: {
      FUNCTIONS_WORKER_RUNTIME: FUNCTIONS_WORKER_RUNTIME,
      APPINSIGHTS_INSTRUMENTATIONKEY:
        tokenRenewerAppInsights.instrumentationKey,
      IDP_TOKEN_ENDPOINT: tokenRenewerSettings.IDP_TOKEN_ENDPOINT,
      CAT_API_ID: tokenRenewerSettings.CAT_API_ID,
      DOG_CLIENT_ID: tokenRenewerSettings.DOG_CLIENT_ID,
      TOKEN_RENEWER_KEY_VAULT_URI:
        tokenRenewerSettings.TOKEN_RENEWER_KEY_VAULT_URI,
      DOG_CLIENT_SECRET_NAME: tokenRenewerSettings.DOG_CLIENT_SECRET_NAME,
      DOG_KEY_VAULT_ACCESS_TOKENS_URI:
        tokenRenewerSettings.DOG_KEY_VAULT_ACCESS_TOKENS_URI,
      CAT_API_ACCESS_TOKEN_NAME: tokenRenewerSettings.CAT_API_ACCESS_TOKEN_NAME,
    },
    nodeVersion: WEBSITE_NODE_DEFAULT_VERSION,
    httpsOnly: true,
    identity: {
      type: "SystemAssigned",
    },
  }
)

export const tokenRenewerEndpoint = tokenRenewerApp.functionApp.defaultHostname.apply(
  v => `https://${v}/`
)
// tokenRenewerApp.functionApp.getFunctionKeys

// Work around a preview issue https://github.com/pulumi/pulumi-azure/issues/192
const tokenRenewerAppPrincipalId = tokenRenewerApp.functionApp.identity.apply(
  id => id.principalId || "11111111-1111-1111-1111-111111111111"
)

const tokenRenewerKeyVaultClientSecrets = new azure.keyvault.KeyVault(
  "token-renewer-keyvault-client-secrets",
  {
    resourceGroupName: resourceGroup.name,
    name: tokenRenewerKeyVaultClientSecretsName,
    skuName: "standard",
    tenantId: tenantId,
    accessPolicies: [
      {
        tenantId,
        // The current principal has to be granted permissions to Key Vault so that it can actually add and then remove
        // secrets to/from the Key Vault. Otherwise, 'pulumi up' and 'pulumi destroy' operations will fail.
        objectId: currentPrincipal,
        secretPermissions: ["delete", "get", "list", "set"],
      },
      {
        tenantId,
        objectId: tokenRenewerAppPrincipalId,
        secretPermissions: ["get", "list"],
      },
    ],
  }
)

// const primarySubscription = azure.core.getSubscription();
// const testClientConfig = azure.core.getClientConfig();
const tokenRenewerAssignment = new azure.authorization.Assignment(
  "token-renewer-2-m2m-client-secrets-iam",
  {
    principalId: tokenRenewerAppPrincipalId,
    roleDefinitionName: "Reader",
    scope: tokenRenewerKeyVaultClientSecrets.id,
  }
)

///////////////////////////////////////////////////////////////////////////////
// Serviceful Dog - Access Token Key Vault
///////////////////////////////////////////////////////////////////////////////

// Work around a preview issue https://github.com/pulumi/pulumi-azure/issues/192
const dogAppPrincipalId = dogApp.functionApp.identity.apply(
  id => id.principalId || "11111111-1111-1111-1111-111111111111"
)

const dogKeyVaultAccessTokens = new azure.keyvault.KeyVault(
  "dog-keyvault-access-tokens",
  {
    resourceGroupName: resourceGroup.name,
    name: dogKeyVaultAccessTokensName,
    skuName: "standard",
    tenantId: tenantId,
    accessPolicies: [
      {
        tenantId,
        // The current principal has to be granted permissions to Key Vault so that it can actually add and then remove
        // secrets to/from the Key Vault. Otherwise, 'pulumi up' and 'pulumi destroy' operations will fail.
        objectId: currentPrincipal,
        secretPermissions: ["delete", "get", "list", "set"],
      },
      {
        tenantId,
        objectId: dogAppPrincipalId,
        secretPermissions: ["get", "list"],
      },
      {
        tenantId,
        objectId: tokenRenewerAppPrincipalId,
        secretPermissions: ["get", "list", "set"],
      },
    ],
  }
)

// // Grant App Service access to KV secrets
// const dogKeyVaultAccessTokensPolicy = new azure.keyvault.AccessPolicy(
//   "app-policy",
//   {
//     keyVaultId: dogKeyVaultAccessTokens.id,
//     tenantId: tenantId,
//     objectId: dogAppPrincipalId,
//     secretPermissions: ["get", "list"],
//   }
// )

// const dogKeyVaultAccessTokensId = dogKeyVaultAccessTokens.id
// // .apply(
// //   id => id || "11111111-1111-1111-1111-111111111111"
// // )

// const primarySubscription = azure.core.getSubscription();
// const testClientConfig = azure.core.getClientConfig();
const dogAssignment = new azure.authorization.Assignment("dog-iam", {
  principalId: dogAppPrincipalId,
  roleDefinitionName: "Reader",
  scope: dogKeyVaultAccessTokens.id,
})

const tokenRenewer2DogAccessTokensAssignment = new azure.authorization.Assignment(
  "token-renewer-2-dog-access-tokens-iam",
  {
    principalId: tokenRenewerAppPrincipalId,
    roleDefinitionName: "Contributor",
    scope: dogKeyVaultAccessTokens.id,
  }
)
