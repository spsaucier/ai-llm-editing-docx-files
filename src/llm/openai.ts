import OpenAI from 'openai';
import { DocumentCommand } from '../commands/schema';
import { config } from '../config';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async parseInstructions(text: string): Promise<DocumentCommand[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a document processing assistant that converts natural language instructions into structured JSON commands.
Given instructions about modifying a document, output a JSON object with a "commands" array containing DocumentCommand objects.

For text replacements, use:
- type: "paragraph" with matchText for exact text matches
- type: "heading" with value for heading replacements

The output format MUST be a JSON object:
{
  "commands": [
    {
      "documentId": "document.docx",
      "action": "insert" | "modify" | "delete",
      "location": {
        "type": "heading" | "section" | "sentence" | "paragraph",
        "value"?: string,  // For heading type
        "number"?: string | number,  // For section type
        "position": "before" | "after" | "replace" | "start" | "end",
        "matchText"?: string,  // For sentence/paragraph type
        "section"?: string | number,  // For sentence/paragraph type
        "paragraphNumber"?: number,  // For paragraph type
        "sentenceNumber"?: number,  // For sentence type
        "matchLevel"?: boolean  // For heading type
      },
      "content"?: {  // Required for insert/modify
        "text": string,
        "style": {
          "matchSource"?: boolean,
          "specific"?: {
            "bold"?: boolean,
            "italic"?: boolean,
            "underline"?: boolean,
            "color"?: string,
            "font"?: string,
            "size"?: number,
            "style"?: string,
            "spacing"?: {
              "before"?: number,
              "after"?: number,
              "line"?: number
            },
            "alignment"?: "left" | "center" | "right" | "justify"
          }
        }
      }
    }
  ]
}

Example for text replacement:
Input: Replace "old text" with "new text"
Output: {
  "commands": [{
    "documentId": "document.docx",
    "action": "modify",
    "location": {
      "type": "paragraph",
      "matchText": "old text",
      "position": "replace"
    },
    "content": {
      "text": "new text",
      "style": { "matchSource": true }
    }
  }]
}

Be precise with locations and ensure all commands are valid. Output must be valid JSON.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.commands || [];
  }

  async validateCommand(command: DocumentCommand): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a document command validator. Given a DocumentCommand object, analyze it for:
1. Logical consistency
2. Potential issues
3. Safety concerns
4. Improvement suggestions

The output format MUST be a JSON object:
{
  "isValid": boolean,  // Set to false if any critical issues are found
  "issues": string[],  // List of identified problems, MUST be an array even if empty
  "suggestions": string[]  // List of improvement suggestions, MUST be an array even if empty
}

Example valid response:
{
  "isValid": true,
  "issues": [],
  "suggestions": ["Consider adding validation checks"]
}

Example invalid response:
{
  "isValid": false,
  "issues": ["Section number 999 is too high"],
  "suggestions": ["Use a section number below 100"]
}

For section numbers > 100, consider them invalid as they likely don't exist.
For heading replacements, ensure the heading exists in preConditions.
For content insertions, validate text length and style consistency.

Output must be valid JSON with all fields present.`,
        },
        {
          role: 'user',
          content: JSON.stringify(command),
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      isValid: result.isValid ?? false,
      issues: result.issues ?? [],
      suggestions: result.suggestions ?? [],
    };
  }

  async explainCommand(command: DocumentCommand): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Explain what this document command will do in clear, concise terms.
Focus on:
1. The type of change (insert/modify/delete)
2. Where it will be applied
3. What content will be added/modified
4. Any style changes
5. Validation requirements`,
        },
        {
          role: 'user',
          content: JSON.stringify(command),
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || '';
  }
}
