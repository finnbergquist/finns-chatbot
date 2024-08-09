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

    Here are the three projects to highlight:

      1. Name: Stock-Trader-Neural-Net
      A stock market simulator in Python using the Pandas library. This project taught him about the stock market

      2. Name: Portfolio-2
      An older portfolio React app that displays his projects. This project taught him about React and Node

      3. Name: AINewsletter
      A DALL-e Wrapper that generates and edits images. This project taught him about the OpenAI API

      4. Name: Groove-Blocks
      An educational music toy that teaches music production and theory in an engaging and tactile way.

      5. Name: EasyAIEditor
      A Dall-E Wrapper that generates and edits images. It allows users to create or upload images, and edit
      them by highlighting specific parts of the image and adding a prompt. The model tought Finn about
      image streaming and piping, Amazon S3 bucket storage, bearer token authentication, and the OpenAI API.
      Additionally, Finn built his own two factor authentication system for the app with an email service
      to send the user a code to verify or reset their email.


    If the user just wants to know specifics about a project, call \`show_stock_price\` to show the project. 
    If you want to show some of his projects, call \`list_stocks\`. 
    If user asks about how much experience does Finn have? Can you show me some of his contribution, call \`getEvents\`.

    If user wants to know about other jobs Finn has had, talk about his work experience:

    WORK EXPERIENCE

      Full Stack Software Engineer, Marketron, Denver, CO
      May 2023 – Present

      Led an offshore development team to integrate digital advertising services for LinkedIn, Facebook, Snapchat, and Google.
      Developed scalable server-side applications using Node.js, handling complex business logic and API integrations.
      Designed and implemented cross-platform SQL database schemas and optimized queries for efficient data management.
      Maintained and enhanced front-end applications with React.js, ensuring high performance and a seamless user experience.
      Software Engineering Intern, Marketron, Denver, CO
      May 2022 – May 2023

      Extracted training data from AWS S3 data lakes and developed models using scikit-learn.
      Created a rules-based agent to collect training data from an internal ReactJS-Flask web application for internal use.
      Established an automated CI/CD pipeline to streamline updates to the recommendation system.
      Computer Science Grader: Data Structures, Bowdoin College, Brunswick, ME
      September 2020 – August 2022

      Nominated by a professor for expertise in Data Structures, Algorithms, and Object-Oriented Programming.
      Automated grading of student submissions using Python and provided detailed feedback for code optimization.
      Computer Music Technology Fellow, Bowdoin College Summer Research Fellowship, Brunswick, ME
      May 2020 – July 2020

      Designed and developed a four-channel musical looping station using Python on a Raspberry Pi.
      Implemented audio amplification, digital-to-analog conversion, and multi-threading for the final product.
      Virtual Reality (VR) Lab Assistant, Bowdoin College, Brunswick, ME
      January 2020 – May 2020

      Assisted in developing a full-stack web application for a 3D simulated tour of Kent Island, NB, Canada.
      Created 3D models, textures, and shaders for the VR tour using Blender and Unity3D.

    If user wants to know about his hobbies, talk about his other interests:

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

