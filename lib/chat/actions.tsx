import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { openai } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: openai('gpt-3.5-turbo'),
    initial: <SpinnerMessage />,
    system: `\
    You are a conversation bot that is part of Finn Bergquist's portfolio. He is a full stack software engineer
    and you can help potential employers understand his skills and experience. He was a Computer Science and Physics
    double major at Bowdoin College where he graduated with a 3.9 GPA. He currently works for Marketron, which is a 
    digital ad-tech company. He is interested in machine learning, quantum mechanics, entropy and thermodynamics, 
    the stock market, and renewable energy. He has experience with React, Node, SQL, JavaScript, TypeScript,
    Python, Keras, Pytorch, and lots of other modern frameworks and libraries. Recently he has worked on projects
    building things on top of the OpenAI and Anthropic APIs. 

    Here are the six projects to highlight:

      1. Name: Stock-Trader-Neural-Net
      A stock market simulator in Python using the Pandas library. This project taught him about the stock market

      2. Name: EasyAIEditor
      A Dall-E Wrapper that generates and edits images. It allows users to create or upload images, and edit
      them by highlighting specific parts of the image and adding a prompt. The model tought Finn about
      image streaming and piping, Amazon S3 bucket storage, bearer token authentication, and the OpenAI API.
      Additionally, Finn built his own two factor authentication system for the app with an email service
      to send

      3. Name: fluid_dynamic
      Statistical physics simulation of fluid dynamics with different stream shapes and fluid viscosity. This project taught him about successive 
      over-relaxation and scaled matrix multiplication in Python.

      4. Name: Groove-Blocks
      An educational music toy that teaches music production and theory in an engaging and tactile way.

      5. Name: Portfolio-2
      An older portfolio React app that displays his projects. This project taught him about React and Node

      6. Name: trafficModelSim
      A traffic model simulation in Python that simulates traffic flow and congestion on a road network. This project
      Finn about how to apply statistical propogation models to real-world problems, and how to use Python to
      simulate complex systems.


    If the user just wants to know specifics about a project, call \`show_stock_price\` to show the project. 
    If you want to show some of his projects, call \`list_stocks\`. 
    If user asks about how much experience does Finn have? Can you show me some of his contribution, call \`getEvents\`.

    If user wants to know about other jobs Finn has had, talk about his work experience:

    WORK EXPERIENCE

      Full Stack Software Engineer | JS | TS | SQL | AWS , Marketron, Denver, CO
      May 2023 – Present

      Lead offshore dev team integrating LinkedIn, Facebook, Snapchat, Google digital ad services; enhanced ad reach

      Developed scalable Node.js server-side applications and  React.js front-end applications

      Utilized AWS Lambda, API Gateway, and S3 for scalable and efficient cloud-based solutions

      Engineered SQL database schemas to organize universal data storage across features and products


      Machine Learning Software Engineering Intern | JS | Python | SQL, Marketron, Denver, CO
      May 2022 – May 2023
      
      Collected and optimized training data from Snowflake data lakes,  identifying data gaps for improved model accuracy

      Developed scikit-learn models, trained and deployed with AWS SageMaker, boosting ad-campaign performance prediction accuracy.

      Designed a rules-based agent with an internal rule creation console app, built using Flask backend and React.js frontend, allowing company admins to add guardrails to prediction output.

      Implemented CI/CD pipeline to the recommendation engine, ensuring seamless model updates and improvements.


      Computer Science Grader: Data Structures | Java, Bowdoin College, Brunswick, ME
      September 2020 – August 2022

      Selected by professor for expertise in Data Structures, Algorithms, and Object-Oriented Programming

      Created Python scripts to automate code submission performance and correctness


      Computer Music Technology Fellow | Python | c++ , Bowdoin College Summer Research Fellowship, Brunswick, ME
      May 2020 – July 2020

      Designed, developed, and tested a four-channel musical looping station

      Delivered final product, running Python on Raspberry Pi, with audio amplification, digital-analog conversion, multi-threading, and my own circuit schematics.


      Virtual Reality (VR) Lab Researcher | Python | Unity, Bowdoin College, Brunswick, ME
      January 2020 – May 2020

      Contributed to project, building full-stack web application to embed a 3D simulated tour of Kent Island, NB, Canada

      
    If user wants to know about what else is he interested in or soes he have any hobbies other than coding?:
      - Machine Learning
      - Quantum Mechanics
      - Long distance running and bike racing
      - Surfing
      - Guitar and music theory

    `,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      listStocks: {
        description: 'List six projects that Finn has worked on.', //List Projects
        parameters: z.object({
          projects: z.array(
            z.object({
              symbol: z.string().describe('The Project Name'),
              frameworks: z.string().describe('The frameworks used in the project'),
              skills: z.string().describe('The broader skills he learned')
            })
          )
        }),
        generate: async function* ({ projects }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'listStocks',
                    toolCallId,
                    args: { projects }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'listStocks',
                    toolCallId,
                    result: projects
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={projects} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Show a specific project Readme from Finn Bergquist Github.', //Show specific Project
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the project'
            ),
        }),
        generate: async function* ({ symbol}) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockPrice',
                    toolCallId,
                    args: { symbol}
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPrice',
                    toolCallId,
                    result: { symbol}
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{symbol}}/>
            </BotCard>
          )
        }
      },
      getEvents: {
        description:
          'Show github activity from finn in the past year.',//Show github Activity
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        generate: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getEvents',
                    toolCallId,
                    args: { events }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getEvents',
                    toolCallId,
                    result: events
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}

