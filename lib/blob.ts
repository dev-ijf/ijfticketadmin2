import { put, del, list } from "@vercel/blob"

export const uploadToBlob = async (filename: string, file: File | Buffer) => {
  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  })
  return blob
}

export const deleteFromBlob = async (url: string) => {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  })
}

export const listBlobs = async (prefix?: string) => {
  const { blobs } = await list({
    prefix,
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  })
  return blobs
}
