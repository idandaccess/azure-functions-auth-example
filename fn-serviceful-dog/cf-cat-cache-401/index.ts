const env = process.env
import { AzureFunction, Context } from "@azure/functions"
// import * as rp from "request-promise"
// // const atob = require("atob")
// const msRestAzure = require("ms-rest-azure")
// const KeyVault = require("azure-keyvault")

// const apiUrl = env.API_URL_CAT
// const tokenEndpoint = env.AUTH_TOKEN_ENDPOINT_AUTH0
// const audience = env.API_ID
// const clientId = env.AUTH_M2M_CLIENT_ID_AUTH0
// const clientSecret = env.AUTH_M2M_CLIENT_SECRET_AUTH0

// const KEY_VAULT_URI = env.KEY_VAULT_URI
// const tokenSecretName = env.AUTH_ACCESS_TOKEN_NAME_AUTH0

const main: AzureFunction = async function(
  context: Context,
  req: any
): Promise<object> {
  return new Promise(resolve => {
    resolve({ body: "cat-cache-401 was called." })
  })

  // if (req.user) {
  //   let keyVaultClient

  //   return initializeKeyVault()
  //     .then(client => {
  //       keyVaultClient = client
  //       return getCachedToken(context, keyVaultClient)
  //     })
  //     .then(accessToken => {
  //       const options = {
  //         uri: apiUrl,
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       }
  //       return rp(options).catch(err => {
  //         // ☝ check for expired token
  //         if (err.statusCode && err.statusCode === 401) {
  //           context.log(
  //             `401 requesting "${apiUrl}". Retrying with a renewed access_token ...`
  //           )

  //           return (
  //             getAndCacheNewToken(context, keyVaultClient)
  //               .then(newAccessToken => {
  //                 // ☝ retry with fresh access_token
  //                 options.headers.Authorization = `Bearer ${newAccessToken}`
  //                 return rp(options)
  //               })
  //               // ... business as usual
  //               .catch(err => {
  //                 context.log(err)
  //                 throw new Error(
  //                   `an error occured requesting "${apiUrl}" with a renewed access_token.`
  //                 )
  //               })
  //           )
  //         }
  //         context.log(err)
  //         throw new Error(`an error occured requesting "${apiUrl}".`)
  //       })
  //     })
  //     .catch(err => {
  //       const errorId = "<some errorId>"
  //       context.log(
  //         "a severe error occured. it was logged to the central logging facility."
  //       )
  //       context.log(err)

  //       return {
  //         status: 400,
  //         body: `an error occured. please ask the service provider for help. errorId:"${errorId}".`,
  //       }
  //     })
  // } else {
  //   return {
  //     status: 400,
  //     body: {
  //       message: "Arrgh 👎 Something is wrong with the Authorization token",
  //     },
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   }
  // }
}

export default main

// function getKeyVaultCredentials() {
//   return msRestAzure.loginWithAppServiceMSI({
//     resource: "https://vault.azure.net",
//   })
// }

// function getSecret(client, secretName) {
//   return client.getSecret(KEY_VAULT_URI, secretName, "")
// }

// function getNewToken(context) {
//   const options = {
//     method: "POST",
//     url: tokenEndpoint,
//     headers: { "content-type": "application/json" },
//     body:
//       `{"client_id":"${clientId}","client_secret":"${clientSecret}"` +
//       `,"audience":"${audience}","grant_type":"client_credentials"}`,
//   }

//   return rp(options)
//     .then(res => JSON.parse(res)["access_token"])
//     .catch(err => {
//       context.log(err)
//       throw new Error(
//         `an error occured while getting a new access_token for client ${clientId}.`
//       )
//     })
// }

// function cacheToken(context, keyVaultClient, token) {
//   return keyVaultClient
//     .setSecret(KEY_VAULT_URI, tokenSecretName, token, { contentType: audience })
//     .then(() => token)
//     .catch(err => {
//       context.log(err)
//       throw new Error(
//         `an error occured while saving a secret to Azure Key Vault.`
//       )
//     })
// }

// function getAndCacheNewToken(context, keyVaultClient) {
//   return getNewToken(context).then(newAccessToken => {
//     return cacheToken(context, keyVaultClient, newAccessToken).then(
//       () => newAccessToken
//     )
//   })
// }

// function initializeKeyVault() {
//   return getKeyVaultCredentials().then(
//     credentials => new KeyVault.KeyVaultClient(credentials)
//   )
// }

// function getCachedToken(context, keyVaultClient) {
//   return keyVaultClient
//     .getSecret(KEY_VAULT_URI, tokenSecretName, "")
//     .then(secret => secret.value)
//     .catch(err => {
//       if (err.statusCode && err.statusCode === 404) {
//         context.log(
//           "access_token not found in Azure Key Vault. Getting and caching a new token ..."
//         )
//         return getAndCacheNewToken(context, keyVaultClient)
//       }
//       context.log(err)
//       context.log(
//         `an error occured while getting the cached access-token from Azure Key Vault. Retrying with a fresh access_token...`
//       )

//       return getNewToken(context)
//     })
// }
