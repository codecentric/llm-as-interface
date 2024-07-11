import { extractWorkTimeInMinutes } from "./workTime"
import { run } from "@backroad/backroad"

async function main() {
  startChatUI(extractWorkTimeInMinutes)
}

function startChatUI(askForCalculations: Function) {
  run(async (br) => {
    const messages = br.getOrDefault("messages", [
      { by: "ai", content: "Beschreibe deinen Arbeitstag!" },
    ])

    messages.forEach((message) => {
      br.chatMessage({ by: message.by }).write({ body: message.content })
    })

    const input = br.chatInput({ id: "input" })
    if (input) {
      const response = await askForCalculations(input)
      br.setValue("messages", [
        ...messages,
        { by: "human", content: input },
        { by: "ai", content: `Du hast ${response / 60} Stunden gearbeitet` },
      ])
    }
  })
}

main()
