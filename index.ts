import { extractWorkTimeInMinutes } from "./workTime"
import readline from "node:readline/promises"

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const userInput = await rl.question(`How was you day?\n`)
  const workTime = await extractWorkTimeInMinutes(userInput)

  console.log(`\nYou worked ${workTime.toFixed(0)} minutes.`)
  rl.close()
}
main()
