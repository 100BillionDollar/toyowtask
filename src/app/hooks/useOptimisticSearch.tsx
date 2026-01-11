"use client"

import * as React from "react"

type UseOptimisticSearchOptions<T> = {
  initialData: T[]
  fetcher: (query: string) => Promise<T[]>
}

export function useOptimisticSearch<T>({
  initialData,
  fetcher,
}: UseOptimisticSearchOptions<T>) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const search = async (query: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher(query)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    search,
  }
}
