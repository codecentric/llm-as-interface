import { AzureChatOpenAI } from "@langchain/openai"
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { OllamaFunctions } from "@langchain/community/experimental/chat_models/ollama_functions"
import { zodToJsonSchema } from "zod-to-json-schema"
import { JsonOutputFunctionsParser } from "@langchain/core/output_parsers/openai_functions"
import { PromptTemplate } from "@langchain/core/prompts"

const startTimeTool = new DynamicStructuredTool({
  name: "startOfWork",
  description: "Returns only the start time",
  schema: z.object({
    start: z.number().describe("The start time in 24h format"),
  }),
  func: async ({ start }) => `Outcome of: ${start})`,
})
const endTimeTool = new DynamicStructuredTool({
  name: "endOfWork",
  description: "Returns only the end time",
  schema: z.object({
    end: z.number().describe("The end time in 24h format"),
  }),
  func: async ({ end }) => `Outcome of: ${end})`,
})
const breakTool = new DynamicStructuredTool({
  name: "break",
  description: "Return a break that was done during work",
  schema: z.object({
    start: z.number().describe("The start time in 24h format"),
    end: z.number().describe("The end time in 24h format"),
  }),
  func: async ({ end }) => `Outcome of: ${end})`,
})

export const promptWithExample = [
  new SystemMessage(`Deine Aufgabe ist es, die Arbeitszeit zu berechnen. Folge dazu ausschließlich den angegebenen Regeln. Nutze die Tools für die Berechnung. 

## Regeln ##
Mache alle Berechnungen auf einmal.
Die Zeit wird im 24h Format angegeben: Zum Beispiel: "20:00".
`),
  new HumanMessage(
    "Ich habe um 9 gestartet und um 10:15 Uhr aufgehört zu arbeiten.",
  ),
  new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "startOfWork",
        args: {
          start: "09:00",
        },
        id: "1",
      },
      {
        name: "endOfWork",
        args: {
          end: "10:15",
        },
        id: "1",
      },
    ],
  }),
  new ToolMessage({
    tool_call_id: "1",
    content: "",
  }),
]

const ollama = new OllamaFunctions({
  temperature: 0.1,
  model: "cas/discolm-german-laser",
}).bind({
  functions: [
    {
      name: "times",
      description: "Returns only the start time",
      parameters: {
        type: "object",
        properties: zodToJsonSchema(
          z.object({
            start: z.number().describe("The start time in 24h format"),
          }),
        ),
      },
    },
    {
      name: "endOfWork",
      description: "Returns only the end time",
      parameters: {
        type: "object",
        properties: zodToJsonSchema(
          z.object({
            end: z.number().describe("The end time in 24h format"),
          }),
        ),
      },
    },
  ],
})

const sampleInput = `Ich habe um fünf nach 8 gestartet und dann 3 Stunden gearbeitet. Nach einer halben Stunde Pause habe ich nochmal geschuftet. Um 13 Uhr hatte ich eine Stunde Mittagspause nur um dann nochmal 2h zu arbeiten.`

async function main() {
  // const model = new AzureChatOpenAI()
  // const llmWithTools = model.bindTools([startTimeTool, endTimeTool, breakTool])
  // const result = await llmWithTools.invoke([
  //   ...promptWithExample,
  //   new HumanMessage(sampleInput),
  // ])
  const prompt =
    PromptTemplate.fromTemplate(`Deine Aufgabe ist es, die Arbeitszeit zu berechnen. Folge dazu ausschließlich den angegebenen Regeln. Nutze die Tools für die Berechnung. 

## Regeln ##
Mache alle Berechnungen auf einmal.
Die Zeit wird im 24h Format angegeben, z.B. "20:00".
Gib die start zeit und die endzeit an.
{input}`)
  const chain = prompt.pipe(ollama)
  const result = await chain.invoke({ input: sampleInput })
  // const result = await ollama.invoke([
  //   ...promptWithExample,
  //   new HumanMessage(sampleInput),
  // ])
  console.log(result)
}
main()
