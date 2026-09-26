export const uploadExtensions = [
  'html', 'htm', 'css', 'js', 'mjs', 'map', 'json', 'webmanifest', 'xml', 'txt', 'csv', 'md', 'pdf',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp',
  'mp4', 'webm', 'ogv', 'mov', 'm4v', 'mp3', 'ogg', 'oga', 'wav', 'm4a', 'aac', 'flac', 'vtt',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
] as const

const uploadExtensionSet = new Set<string>(uploadExtensions)

export const uploadAccept = uploadExtensions.map((extension) => `.${extension}`).join(',')

export type WebsiteUploadItem = {
  path: string,
  file: File,
}

export const isUploadPath = (path: string): boolean => {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : ''
  return uploadExtensionSet.has(extension)
}

const fileOf = (entry: FileSystemFileEntry): Promise<File> => (
  new Promise((resolve, reject) => {
    entry.file(resolve, reject)
  })
)

const readAll = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => (
  new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = []
    const read = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(entries)
          return
        }
        entries.push(...batch)
        read()
      }, reject)
    }
    read()
  })
)

const itemsFromEntry = async (entry: FileSystemEntry, parent: string): Promise<WebsiteUploadItem[]> => {
  const path = parent.length > 0 ? `${parent}/${entry.name}` : entry.name
  if (entry.isFile) {
    return [{ path, file: await fileOf(entry as FileSystemFileEntry) }]
  }
  if (!entry.isDirectory) {
    return []
  }
  const children = await readAll((entry as FileSystemDirectoryEntry).createReader())
  const nested = await Promise.all(children.map((child) => itemsFromEntry(child, path)))
  return nested.flat()
}

export const itemsFromFileList = (list: FileList | null): WebsiteUploadItem[] => (
  [...(list ?? [])].map((file) => ({
    path: file.webkitRelativePath.length > 0 ? file.webkitRelativePath : file.name,
    file,
  }))
)

export const itemsFromDataTransfer = async (transfer: DataTransfer): Promise<WebsiteUploadItem[]> => {
  const entries = [...transfer.items]
    .filter((item) => item.kind === 'file')
    .map((item) => item.webkitGetAsEntry())
    .filter((entry): entry is FileSystemEntry => entry !== null)
  if (entries.length === 0) {
    return itemsFromFileList(transfer.files)
  }
  const nested = await Promise.all(entries.map((entry) => itemsFromEntry(entry, '')))
  return nested.flat()
}
