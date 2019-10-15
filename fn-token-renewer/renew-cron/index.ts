import { AzureFunction, Context } from "@azure/functions"
import * as rp from "request-promise"
import { ManagedIdentityCredential } from "@azure/identity"
import { SecretsClient } from "@azure/keyvault-secrets"
import * as jwt from "jwt-decode"

const env = process.env
const tokenEndpoint = env.IDP_TOKEN_ENDPOINT
const audience = env.CAT_API_ID
const clientId = env.DOG_CLIENT_ID

const timerTrigger: AzureFunction = async function(
  context: Context,
  myTimer: any
): Promise<void> {
  context.log("token-renewer ran!")

  let token: string
  const timeOffset = 60 * 60

  try {
    token = await getCachedToken(context)

    const lifetime: number = parseInt(jwt(token).exp)

    if (Date.now() >= (lifetime - timeOffset) * 1000) {
      await getNewToken(context)
      context.log("token was refreshed because it was not valid anymore.")
    } else {
      context.log("token was not refreshed because it's still valid.")
    }
  } catch (error) {
    if (error.toString().includes("Secret not found")) {
      token = await getNewToken(context)
      context.log("token was refreshed because it was missing.")
    } else {
      throw error
    }
  }
}

export default timerTrigger

async function getClientSecret(ctx: Context): Promise<any> {
  const credential = new ManagedIdentityCredential()
  const url = env.TOKEN_RENEWER_KEY_VAULT_URI
  const client = new SecretsClient(url, credential)
  const secret = await client.getSecret(env.DOG_CLIENT_SECRET_NAME)
  return secret.value
}

async function getCachedToken(ctx: Context): Promise<any> {
  const credential = new ManagedIdentityCredential()
  const url = env.DOG_KEY_VAULT_ACCESS_TOKENS_URI
  const client = new SecretsClient(url, credential)
  const secret = await client.getSecret(env.CAT_API_ACCESS_TOKEN_NAME)
  return secret.value
}

async function getNewToken(context: Context) {
  const options = {
    method: "POST",
    url: tokenEndpoint,
    headers: { "content-type": "application/json" },
    body:
      `{"client_id":"${clientId}","client_secret":"${await getClientSecret(
        context
      )}"` + `,"audience":"${audience}","grant_type":"client_credentials"}`,
  }

  return rp(options)
    .then(res => {
      const newToken = JSON.parse(res)["access_token"]
      return setToken(context, newToken).then(() => {
        return newToken
      })
    })
    .catch(err => {
      context.log(err)
      throw new Error(
        `an error occured while getting a new access_token for client ${clientId}.`
      )
    })
}

async function setToken(ctx: Context, token: string): Promise<any> {
  const credential = new ManagedIdentityCredential()
  const url = env.DOG_KEY_VAULT_ACCESS_TOKENS_URI
  const client = new SecretsClient(url, credential)
  return await client.setSecret(env.CAT_API_ACCESS_TOKEN_NAME, token)
}
