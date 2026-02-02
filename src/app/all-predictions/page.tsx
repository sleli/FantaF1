import { redirect } from 'next/navigation'

export default async function AllPredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const event = params.event
  const urlParams = new URLSearchParams()
  urlParams.set('tab', 'all')
  if (typeof event === 'string') {
    urlParams.set('event', event)
  }
  redirect(`/predictions?${urlParams.toString()}`)
}
