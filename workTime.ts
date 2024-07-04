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
    start: z.string().describe("The start time when the work day started"),
    end: z.string().describe("The time when the work day ended"),
    breaks: z
      .array(
        z.object({
          start: z.string().describe("The start time of the break"),
          end: z.string().describe("The end time of the break"),
        }),
      )
      .describe("The breaks that were taken during the work day"),
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
        args: {
          start: "8:05",
          end: "16:00",
          breaks: [
            { start: "11:05", end: "11:35" },
            { start: "13:00", end: "14:00" },
          ],
        },
        id: "1",
      },
    ],
  }),
  new ToolMessage({
    tool_call_id: "1",
    content: "",
  }),
  new AIMessage({
    content: `Done`,
  }),
]

const sampleInput = `Gestern habe ich um 7 Uhr angefangen. Dann gabs ne kleine Unterbrechung drei Stunden später für 5 Minuten. 4 Stunden nach der Pause habe ich dann nochmal 30 Minuten Pause gemacht. Um 15 Uhr war dann Feierabend.`

export async function extractWorkTimeInMinutes(text: string) {
  const model = new AzureChatOpenAI().bindTools([workdayTool])
  const result = await model.invoke([
    ...promptWithExample,
    new HumanMessage(text),
  ])
  const { start, end, breaks } = result.tool_calls[0].args
  return calculateTotalWorkDayTime(start, end, breaks)
}

function calculateTotalWorkDayTime(start, end, breaks) {
  const totalTime = calculateWorkedMinutes(start, end)
  const breakTime = breaks.reduce((acc, curr) => {
    return acc + calculateWorkedMinutes(curr.start, curr.end)
  }, 0)
  return totalTime - breakTime
}

function calculateWorkedMinutes(start, end) {
  const startTimes = getHoursAndMinutesFromTime(start)
  const endTimes = getHoursAndMinutesFromTime(end)
  const totalWorkDayTime =
    new Date().setHours(endTimes.hours, endTimes.minutes) -
    new Date().setHours(startTimes.hours, startTimes.minutes)
  return totalWorkDayTime / 1000 / 60
}

function getHoursAndMinutesFromTime(time) {
  const [hours, minutes] = time.split(":")
  return { hours: parseInt(hours), minutes: parseInt(minutes) }
}
