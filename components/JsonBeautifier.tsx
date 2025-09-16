"use client"

interface JsonBeautifierProps {
  data: any
}

export function JsonBeautifier({ data }: JsonBeautifierProps) {
  let content: string
  let objectToDisplay: any

  if (typeof data === "string") {
    try {
      objectToDisplay = JSON.parse(data)
    } catch (e) {
      return (
        <pre className="whitespace-pre-wrap break-all bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96">
          {data}
        </pre>
      )
    }
  } else {
    objectToDisplay = data
  }

  try {
    content = JSON.stringify(objectToDisplay, null, 2)
  } catch (e) {
    content = "Error: Could not stringify JSON object."
  }

  return (
    <pre className="whitespace-pre-wrap break-all bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96 border">
      {content}
    </pre>
  )
}
