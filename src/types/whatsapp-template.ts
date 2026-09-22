export interface IWhatsAppTemplateButton {
  type?: string;
  text?: string;
  url?: string;
  phoneNumber?: string;
  example?: string[];
}

export interface IWhatsAppTemplateComponent {
  type: string;
  format?: string;
  text?: string;
  example?: unknown;
  buttons?: IWhatsAppTemplateButton[];
}

export interface IWhatsAppTemplateVariable {
  key: string;
  component: string;
  buttonIndex?: number;
  index?: number;
  name?: string;
  label: string;
  example?: string;
  kind: "text" | "media";
}

export interface IWhatsAppTemplate {
  _id?: string;
  id?: string;
  externalId?: string;
  wabaId?: string;
  name: string;
  language: string;
  status: string;
  category?: string;
  parameterFormat?: string;
  qualityScore?: string;
  rejectedReason?: string;
  components: IWhatsAppTemplateComponent[];
  variables: IWhatsAppTemplateVariable[];
  lastSyncedAt?: string;
}

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][\w]*|\d+)\s*\}\}/g;

function applyValues(text: string | undefined, values: Record<string, string>, prefix: string): string {
  if (!text) return "";
  return text.replace(PLACEHOLDER_RE, (_full, token: string) => {
    const exact = values[`${prefix}.${token}`];
    if (exact) return exact;
    if (values[token]) return values[token];
    return `{{${token}}}`;
  });
}

export function renderWhatsAppTemplatePreview(
  template: Pick<IWhatsAppTemplate, "components" | "name">,
  values: Record<string, string> = {}
): string {
  const parts: string[] = [];
  for (const component of template.components || []) {
    const type = String(component.type || "").toUpperCase();
    if (type === "HEADER") {
      const format = String(component.format || "TEXT").toUpperCase();
      if (format === "TEXT") {
        const text = applyValues(component.text, values, "header");
        if (text) parts.push(text);
      } else if (values["header.media"]) {
        parts.push(values["header.media"]);
      }
    }
    if (type === "BODY") {
      const text = applyValues(component.text, values, "body");
      if (text) parts.push(text);
    }
    if (type === "FOOTER" && component.text) parts.push(component.text);
    if (type === "BUTTONS") {
      for (const button of component.buttons || []) {
        if (button.text) parts.push(button.text);
      }
    }
  }
  return parts.join("\n\n").trim() || template.name;
}
