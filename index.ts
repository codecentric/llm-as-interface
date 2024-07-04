import { extractWorkTimeInMinutes } from "./workTime"

async function main() {
  const workTime = await extractWorkTimeInMinutes()
  console.log(`You worked ${workTime.toFixed(0)} minutes.`)
}
main()
