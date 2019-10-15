import { AzureFunction, Context, HttpRequest } from "@azure/functions"
const atob = require("atob")
import { cat } from "../shared"
const env = process.env

const main: AzureFunction = async function(
  context: Context,
  // req: HttpRequest
  req: any
): Promise<void> {
  // TODO error handling
  req.user = JSON.parse(atob(req.headers["x-jwt-payload"]))

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

export default main
