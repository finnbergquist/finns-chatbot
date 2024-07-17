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
  Project,
  Experience
} from '@/components/portfolio'

import { z } from 'zod'
import { ProjectsSkeleton } from '@/components/portfolio/projects-skeleton'
import { Projects } from '@/components/portfolio/projects'
import { ExperiencesSkeleton } from '@/components/portfolio/experiences-skeleton'
import { Experiences } from '@/components/portfolio/experiences'
import { ExperienceSkeleton } from '@/components/portfolio/experience-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/portfolio/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'

async function showProjects() {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const loading = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Loading projects...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    loading.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Loading projects... almost there...
        </p>
      </div>
    )

    await sleep(1000)

    const projects = [
      { title: 'Project 1', description: 'Description of project 1' },
      { title: 'Project 2', description: 'Description of project 2' },
      // Add more projects here
    ]

    loading.done(
      <div>
        <p className="mb-2">
          Here are some of my projects.
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        I have loaded my projects.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has viewed the projects.]`
        }
      ]
    })
  })

  return {
    loadingUI: loading.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function showExperience() {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const loading = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Loading experience...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    loading.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Loading experience... almost there...
        </p>
      </div>
    )

    await sleep(1000)

    const experiences = [
      { title: 'Experience 1', description: 'Description of experience 1' },
      { title: 'Experience 2', description: 'Description of experience 2' },
      // Add more experiences here
    ]

    loading.done(
      <div>
        <p className="mb-2">
          Here is my professional experience.
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        I have loaded my experience.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has viewed the experience.]`
        }
      ]
    })
  })

  return {
    loadingUI: loading.value,
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
    system: 
    `
    You are a conversation bot to talk about a software engineer, Finn Bergquist, and why you should hire him.
    He is a software engineer with experience in full-stack development, and he is passionate about building products that make a difference.

    Messages inside [] means that it's a UI element or a user event. For example:
    - "[Project: A Cool Project]" means that an interface of a project is shown to the user.
    - "[Experience: Software Engineer at XYZ]" means that an interface of an experience is shown to the user.
    
    If the user requests projects from Finn, call \`show_projects_ui\` to show the projects UI.
    If you want to show Finn's work experience, call \`list_experiences\`.
    If you want to show events, call \`get_events\`.
    If the user wants to do something not related to projects or experience, respond that you are a demo and cannot do that.
    
    Besides that, you can also chat with users and do some calculations if needed.`,
    
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
      listProjects: {
        description: 'List my projects and show them to the user.',
        parameters: z.object({
          projects: z.array(
            z.object({
              title: z.string().describe('The title of the project'),
              description: z.string().describe('The description of the project')
            })
          )
        }),
        generate: async function* ({ projects }) {
          yield (
            <BotCard>
              <ProjectsSkeleton />
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
                    toolName: 'listProjects',
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
                    toolName: 'listProjects',
                    toolCallId,
                    result: projects
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Projects props={projects} />
            </BotCard>
          )
        }
      },
      showExperience: {
        description:
          'Show my professional experience.',
        parameters: z.object({
          experiences: z.array(
            z.object({
              title: z.string().describe('The title of the experience'),
              description: z.string().describe('The description of the experience')
            })
          )
        }),
        generate: async function* ({ experiences }) {
          yield (
            <BotCard>
              <ExperienceSkeleton />
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
                    toolName: 'showExperience',
                    toolCallId,
                    args: { experiences }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showExperience',
                    toolCallId,
                    result: experiences
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Experiences props={experiences} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    newMessage: {
      id: nanoid(),
      display: result
    }
  }
}

const AI = createAI({
  messages: [
    {
      id: nanoid(),
      role: 'system',
      content: `Welcome! I'm Finn Bergquist's portfolio bot. Ask me anything about Finn's projects or experience.`
    }
  ],
  tools: {
    showProjects,
    showExperience
  }
})

export default AI
