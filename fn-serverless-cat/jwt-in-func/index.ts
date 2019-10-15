import { AzureFunction, Context } from "@azure/functions"
import { cat } from "../shared"
const env = process.env

const options = {
  audience: env.CAT_API_ID,
  algorithms: ["RS256"],
  domain: env.AUTH_ISSUER_DOMAIN_AUTH0,
  publicKey: getPublicKey(),
}
const validateJwt = require("azure-functions-auth")(options)

const main: AzureFunction = async function(
  context: Context,
  req: any
): Promise<void> {
  if (req.user) {
    context.res = {
      status: 200,
      body: cat,
      headers: {
        "Content-Type": "application/text",
      },
    }
    context.done(null)
  } else {
    context.res = {
      status: 400,
      body: {
        message: "Arrgh 👎 Something is wrong with the Authorization token",
      },
      headers: {
        "Content-Type": "application/json",
      },
    }
    context.done(null)
  }
}

export default validateJwt(main)

function getPublicKey(): string {
  return env.AUTH_ISSUER_PUBKEY_AUTH0.replace(/\\\\n/g, "\n").replace(
    /\\n/g,
    "\n"
  )
}
