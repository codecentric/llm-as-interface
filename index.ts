import { AzureChatOpenAI } from "@langchain/openai"
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"

const workdayTool = new DynamicStructuredTool({
  name: "workDay",
  description:
    "Returns start and end time of a work day. Only use once per day.",
  schema: z.object({
    start: z.string().describe("The start time"),
    end: z.string().describe("The time when the work day ended"),
  }),
  func: async () => "",
})
const breakTool = new DynamicStructuredTool({
  name: "break",
  description: "Return a break that was done during work",
  schema: z.object({
    start: z.string().describe("The start time in 24h format"),
    end: z.string().describe("The end time in 24h format"),
  }),
  func: async () => "",
})

export const promptWithExample = [
  new SystemMessage(
    `Deine Aufgabe ist es, die Arbeitszeit zu berechnen. Nutze die Tools für die Berechnung.`,
  ),
  new HumanMessage(
    "Ich habe um fünf nach 8 gestartet und dann 3 Stunden gearbeitet. Nach einer halben Stunde Pause habe ich nochmal geschuftet. Um 13 Uhr hatte ich eine Stunde Mittagspause nur um dann nochmal 2h ranzuglotzen.",
  ),
  new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "workDay",
        args: { start: "8:05", end: "16:00" },
        id: "1",
      },
      {
        name: "break",
        args: { start: "11:05", end: "11:35" },
        id: "2",
      },
      {
        name: "break",
        args: { start: "13:00", end: "14:00" },
        id: "3",
      },
    ],
  }),
  new ToolMessage({
    tool_call_id: "1",
    content: "",
  }),
  new ToolMessage({
    tool_call_id: "2",
    content: "",
  }),
  new ToolMessage({
    tool_call_id: "3",
    content: "",
  }),
  new AIMessage({
    content: `Done`,
  }),
]

const sampleInput = `Gestern habe ich um 7 Uhr angefangen. Dann gabs ne kleine Unterbrechung drei Stunden später für 5 Minuten. Nach 4 Stunden habe ich dann nochmal 30 Minuten Pause gemacht. Um 15 Uhr war dann Feierabend.`

async function main() {
  const model = new AzureChatOpenAI()
  const llmWithTools = model.bindTools([workdayTool, breakTool])
  const result = await llmWithTools.invoke([
    ...promptWithExample,
    new HumanMessage(sampleInput),
  ])
  console.log(result.tool_calls)
}
main()
