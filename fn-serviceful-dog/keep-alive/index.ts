import { AzureFunction, Context } from "@azure/functions"

const timerTrigger: AzureFunction = async function(
  context: Context,
  myTimer: any
): Promise<void> {
  var timeStamp = new Date().toISOString()
  context.log("Keep-alive function ran!", timeStamp)
}

export default timerTrigger
