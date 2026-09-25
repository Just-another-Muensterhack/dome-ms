type WebsiteUrlLinkProps = {
  url: string,
  label?: string,
}

export const WebsiteUrlLink = ({
  url,
  label,
}: WebsiteUrlLinkProps) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="typography-body text-primary block truncate hover:underline"
    >
      {label ?? url}
    </a>
  )
}
