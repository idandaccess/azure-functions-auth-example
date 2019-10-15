import { AzureFunction, Context } from "@azure/functions"
import * as rp from "request-promise"
import { ManagedIdentityCredential } from "@azure/identity"
import { SecretsClient } from "@azure/keyvault-secrets"

const env = process.env

const options = {
  audience: env.DOG_API_ID,
  algorithms: ["RS256"],
  domain: env.AUTH_ISSUER_DOMAIN_AUTH0,
  publicKey: getPublicKey(),
}
const validateJwt = require("azure-functions-auth")(options)
const apiUrl = env.CAT_API_URL

async function getToken(ctx: Context): Promise<any> {
  // DefaultAzureCredential expects the following three environment variables:
  // * AZURE_TENANT_ID: The tenant ID in Azure Active Directory
  // * AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
  // * AZURE_CLIENT_SECRET: The client secret for the registered application
  const credential = new ManagedIdentityCredential()
  const url = env.DOG_KEY_VAULT_ACCESS_TOKENS_URI
  const client = new SecretsClient(url, credential)
  const secret = await client.getSecret(env.CAT_API_ACCESS_TOKEN_NAME)
  return secret.value
}

const main: AzureFunction = async function(
  context: Context,
  req: any
): Promise<object> {
  if (req.user) {
    try {
      const options = {
        uri: apiUrl,
        headers: {
          Authorization: `Bearer ${await getToken(context)}`,
          "x-functions-key": env.CAT_API_FUNC_KEY,
        },
      }
      try {
        return { body: await rp(options) }
      } catch (error) {
        context.log.error(error)
        throw new Error(`an error occured requesting "${apiUrl}".`)
      }
    } catch (error) {
      const errorId = "logToCloudAndGetErrorId()"
      context.log.error(
        "a severe error occured. it was logged to the central logging facility.",
        error
      )
      throw new Error(
        `an internal error occured. please ask the service provider for help. errorId:"${errorId}".`
      )
    }
  } else {
    return Promise.resolve({
      status: 400,
      body: {
        message: "Arrgh 👎 Something is wrong with the Authorization token",
      },
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

export default validateJwt(main, true)

function getPublicKey(): string {
  return env.AUTH_ISSUER_PUBKEY_AUTH0.replace(/\\\\n/g, "\n").replace(
    /\\n/g,
    "\n"
  )
}
