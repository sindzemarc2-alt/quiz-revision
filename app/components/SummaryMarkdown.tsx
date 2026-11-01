import type { ReactNode } from "react";

type SummaryBlock =
  | { type: "heading"; level: number; text: string; key: number }
  | { type: "paragraph"; text: string; key: number }
  | { type: "list"; ordered: boolean; items: { text: string; depth: number }[]; key: number }
  | { type: "divider"; key: number };

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function parseBlocks(markdown: string): SummaryBlock[] {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: SummaryBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index++;
      continue;
    }

    if (/^(?:---+|___+|\*\*\*+)$/.test(line)) {
      blocks.push({ type: "divider", key: index });
      index++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 4),
        text: heading[2].replace(/\s+#+$/, ""),
        key: index,
      });
      index++;
      continue;
    }

    const listItem = lines[index].match(/^(\s*)(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (listItem) {
      const ordered = Boolean(listItem[3]);
      const items: { text: string; depth: number }[] = [];
      while (index < lines.length) {
        const currentItem = lines[index].match(/^(\s*)(?:([-*+])|(\d+)[.)])\s+(.+)$/);
        if (!currentItem || Boolean(currentItem[3]) !== ordered) break;
        items.push({
          text: currentItem[4],
          depth: Math.min(3, Math.floor(currentItem[1].length / 2)),
        });
        index++;
      }
      blocks.push({ type: "list", ordered, items, key: index - items.length });
      continue;
    }

    const paragraph = [line];
    index++;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (
        !nextLine ||
        /^(?:#{1,6}\s|(?:---+|___+|\*\*\*+)$)/.test(nextLine) ||
        /^\s*(?:[-*+]|\d+[.)])\s+/.test(lines[index])
      ) {
        break;
      }
      paragraph.push(nextLine);
      index++;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" "), key: index - paragraph.length });
  }

  return blocks;
}

export default function SummaryMarkdown({ content }: { content: string }) {
  return (
    <div className="summary-markdown">
      {parseBlocks(content).map((block) => {
        if (block.type === "divider") return <hr className="summary-divider" key={block.key} />;

        if (block.type === "heading") {
          const Heading = `h${block.level}` as "h1" | "h2" | "h3" | "h4";
          return (
            <Heading className={`summary-heading summary-heading-${block.level}`} key={block.key}>
              {renderInline(block.text, `heading-${block.key}`)}
            </Heading>
          );
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List className="summary-list" key={block.key}>
              {block.items.map((item, index) => (
                <li
                  className="summary-list-item"
                  key={`${block.key}-${index}`}
                  style={{ marginInlineStart: `${item.depth * 18}px` }}
                >
                  {renderInline(item.text, `list-${block.key}-${index}`)}
                </li>
              ))}
            </List>
          );
        }

        return (
          <p className="summary-paragraph" key={block.key}>
            {renderInline(block.text, `paragraph-${block.key}`)}
          </p>
        );
      })}
    </div>
  );
}
