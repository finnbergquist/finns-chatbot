import { format, parseISO } from 'date-fns'
import GitHubCalendar from 'react-github-calendar';


interface Event {
  date: string
  headline: string
  description: string
}

export function Events({ props: events }: { props: Event[] }) {
  return (
    <div className="-mt-2 flex w-full flex-col gap-2 py-4">
      <div className="flex flex-col gap-1 rounded-lg ">
        <div style={{ width: '950px', transform: 'scale(0.75)', transformOrigin: 'top left' }}>
          <GitHubCalendar username="finnbergquist" />
        </div>
      </div>
    </div>
  )
}
