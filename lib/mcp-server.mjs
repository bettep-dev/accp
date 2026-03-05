#!/usr/bin/env node

/**
 * accp MCP Server
 *
 * Exposes accp compiler functionality via Model Context Protocol (MCP).
 * LLMs can use accp tools to compile, validate, and generate code
 * from .api/.code/.struct DSL files.
 *
 * Transport: stdio (JSON-RPC over stdin/stdout)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs/promises";

const require = createRequire(import.meta.url);
const core = require("./core.js");
const pkg = require("../package.json");

/* ============================================================
 * Server instance
 * ============================================================ */

const server = new McpServer({
  name: "accp-mcp-server",
  version: pkg.version,
});

/* ============================================================
 * Tools
 * ============================================================ */

server.tool(
  "accp_compile",
  "Parse and compile accp project files (.api, .code, .struct) into a structured JSON object (OBJ). " +
    'The project directory must contain an "api/" folder with .api files. ' +
    "Import statements in .api files reference .code and .struct files relative to the project root.",
  {
    projectDir: z
      .string()
      .describe(
        "Absolute path to the accp project directory (must contain api/ folder)",
      ),
  },
  async ({ projectDir }) => {
    try {
      const result = core.compile(projectDir);

      if (!result.success) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: false, errors: result.errors },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Compilation error: ${error.message}` },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_validate",
  "Validate accp project files for syntax errors without generating code. " +
    "Returns validation results including any syntax errors found and project statistics.",
  {
    projectDir: z
      .string()
      .describe(
        "Absolute path to the accp project directory (must contain api/ folder)",
      ),
  },
  async ({ projectDir }) => {
    try {
      const result = core.validate(projectDir);

      const stats = {};

      if (result.success && result.data) {
        stats.apiClasses = (result.data.API || []).length;
        stats.functions = (result.data.API || []).reduce(
          (sum, api) => sum + api.FUNC.length,
          0,
        );
        stats.codeClasses = (result.data.CODE || []).length;
        stats.structs = (result.data.STRUCT || []).length;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: result.success,
                errors: result.errors || [],
                stats,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Validation error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_generate",
  "Compile accp project files and run pattern files to generate source code. " +
    'Patterns are JavaScript files in the "pattern/" folder that transform the compiled OBJ into actual code files. ' +
    "Generated files are placed relative to the project directory.",
  {
    projectDir: z
      .string()
      .describe(
        "Absolute path to the accp project directory (must contain api/ and pattern/ folders)",
      ),
  },
  async ({ projectDir }) => {
    try {
      const result = core.generate(projectDir);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: result.success,
                generated: result.generated || [],
                errors: result.errors || [],
              },
              null,
              2,
            ),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Generation error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_list_patterns",
  "List available pattern files (.js) in the project. " +
    "Patterns define how compiled OBJ is transformed into actual source code (e.g., Node.js, Flutter, Swagger).",
  {
    projectDir: z
      .string()
      .describe("Absolute path to the accp project directory"),
  },
  async ({ projectDir }) => {
    try {
      const patternDir = path.join(projectDir, "pattern");
      const patterns = [];

      try {
        const entries = await fs.readdir(patternDir);

        for (const entry of entries) {
          if (entry.startsWith("._")) continue;
          if (!entry.endsWith(".js")) continue;

          const filePath = path.join(patternDir, entry);
          const stat = await fs.stat(filePath);

          patterns.push({
            name: path.basename(entry, ".js"),
            path: filePath,
            size: stat.size,
          });
        }
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { patterns: [], error: `Pattern directory not found: ${e.message}` },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ patterns }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error listing patterns: ${error.message}` },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_read_file",
  "Read the contents of an accp source file (.api, .code, or .struct). " +
    "Only files with accp extensions can be read for safety.",
  {
    filePath: z
      .string()
      .describe("Absolute path to the .api, .code, or .struct file"),
  },
  async ({ filePath }) => {
    const ext = path.extname(filePath);

    if (![".api", ".code", ".struct"].includes(ext)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Only .api, .code, and .struct files can be read. Got: ${ext}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const content = await fs.readFile(filePath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error reading file: ${error.message}` },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_write_file",
  "Write or create an accp source file (.api, .code, or .struct). " +
    "Only files with accp extensions can be written for safety. " +
    "Parent directories are created automatically if needed.",
  {
    filePath: z
      .string()
      .describe("Absolute path for the .api, .code, or .struct file"),
    content: z.string().describe("The file content to write"),
  },
  async ({ filePath, content }) => {
    const ext = path.extname(filePath);

    if (![".api", ".code", ".struct"].includes(ext)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Only .api, .code, and .struct files can be written. Got: ${ext}`,
          },
        ],
        isError: true,
      };
    }

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");

      return {
        content: [
          { type: "text", text: `File written successfully: ${filePath}` },
        ],
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error writing file: ${error.message}` },
        ],
        isError: true,
      };
    }
  },
);

server.tool(
  "accp_parse_string",
  "Parse accp DSL content from a string (without needing files on disk). " +
    "Supports .api, .code, or .struct content. Useful for validating snippets or previewing results.",
  {
    content: z.string().describe("The accp DSL content string to parse"),
    type: z
      .enum(["api", "code", "struct"])
      .describe("The type of accp content"),
    baseDir: z
      .string()
      .optional()
      .describe(
        "Base directory for resolving import paths (only needed for .api with imports)",
      ),
  },
  async ({ content, type, baseDir }) => {
    try {
      let result;

      switch (type) {
        case "api":
          result = core.parseApi(content, { baseDir });
          break;
        case "code":
          result = core.parseCode(content);
          break;
        case "struct":
          result = core.parseStruct(content);
          break;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Parse error: ${error.message}` }],
        isError: true,
      };
    }
  },
);

/* ============================================================
 * Resources - DSL Syntax Documentation
 * ============================================================ */

const SYNTAX_DOCS = {
  api: `# .api File Syntax

The .api file defines API endpoints with their request/response schemas.

## Structure

\`\`\`
import code/filename.code
import struct/filename.struct

API {

  ClassName class description {

    BASE http://localhost:8080/path

    FunctionName 100 function description {

      COMP true

      GET|POST|PUT|PATCH|DELETE endpoint/path

      REQ {
        paramName Type description
        paramName [Type] array description
        paramName Type description {
          0= explain value
          1> explain value
        }
      }

      RES {
        paramName Type description
      }

      OPT {
        optionName true
        optionName false
      }

      PROC {
        100 ClassName.FunctionName
      }

      MARK {
        key description text
      }
    }
  }
}
\`\`\`

## Rules
- File must start with \`API {\`
- Each class must have a unique NAME and a \`BASE\` URL
- Each function must have a unique NAME and numeric CODE
- Functions must declare exactly one HTTP method (GET/POST/PUT/PATCH/DELETE)
- Path parameters use \`:paramName\` syntax and must be declared in REQ block
- COMP (completion status): \`true\` or \`false\`

## Data Types
\`Int\`, \`Float\`, \`Double\`, \`String\`, \`Boolean\`, \`Data\` (object), or custom struct names.
Array types use brackets: \`[Int]\`, \`[String]\`, \`[CustomStruct]\`
`,

  code: `# .code File Syntax

The .code file defines error/status codes with multilingual messages.

## Structure

\`\`\`
CODE {

  ClassName code description {

    1 ERROR_NAME {
      ko Korean description
      ja Japanese description
      en English description
    }

    2 ANOTHER_ERROR {
      ko Korean description
      en English description
    }
  }
}
\`\`\`

## Rules
- File must start with \`CODE {\`
- Each class must have a unique NAME
- Each code entry has a numeric CODE, a NAME, and language-keyed messages
- Code numbers must be unique across all classes
- Code names must be unique within a class
`,

  struct: `# .struct File Syntax

The .struct file defines reusable data structures.

## Structure

\`\`\`
STRUCT {

  StructName Description text {

    fieldName Type field description
    fieldName [Type] array field description
    fieldName Type description with options {
      0= explain value equals
      1> explain value greater than
      2< explain value less than
      3! explain value not equal
    }
  }
}
\`\`\`

## Rules
- File must start with \`STRUCT {\`
- Each struct must have a unique NAME
- Fields have: name, type, and description
- Array types use brackets: \`[Type]\`
- Option blocks define value constraints

## Data Types
\`Int\`, \`Float\`, \`Double\`, \`String\`, \`Boolean\`, \`Data\` (object), or other struct names.
`,
};

server.resource(
  "api-syntax",
  "accp://syntax/api",
  {
    description: "Documentation for .api file syntax in accp DSL",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: SYNTAX_DOCS.api,
      },
    ],
  }),
);

server.resource(
  "code-syntax",
  "accp://syntax/code",
  {
    description: "Documentation for .code file syntax in accp DSL",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: SYNTAX_DOCS.code,
      },
    ],
  }),
);

server.resource(
  "struct-syntax",
  "accp://syntax/struct",
  {
    description: "Documentation for .struct file syntax in accp DSL",
    mimeType: "text/markdown",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: SYNTAX_DOCS.struct,
      },
    ],
  }),
);

/* ============================================================
 * Prompts
 * ============================================================ */

server.prompt(
  "create-api",
  "Generate an accp .api file definition from a natural language description",
  {
    description: z
      .string()
      .describe("Natural language description of the API to create"),
    entityName: z
      .string()
      .describe("Main entity/resource name (e.g., User, Product)"),
  },
  ({ description, entityName }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            "You are an expert in accp DSL syntax.",
            "Create a complete .api file definition for the following:",
            "",
            `Entity: ${entityName}`,
            `Description: ${description}`,
            "",
            "Use proper accp .api syntax with:",
            "- Appropriate HTTP methods (GET/POST/PUT/PATCH/DELETE)",
            "- Request and response schemas with proper data types",
            "- Path parameters where appropriate",
            "- Meaningful function codes and descriptions",
            "- COMP status set to true for completed endpoints",
            "",
            "Reference the .api syntax resource (accp://syntax/api) for correct formatting.",
          ].join("\n"),
        },
      },
    ],
  }),
);

server.prompt(
  "create-struct",
  "Generate an accp .struct file definition from a natural language description",
  {
    description: z
      .string()
      .describe("Natural language description of the data structure"),
    structName: z
      .string()
      .describe("Name of the struct (e.g., UserProfile, OrderItem)"),
  },
  ({ description, structName }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            "You are an expert in accp DSL syntax.",
            "Create a .struct file definition for:",
            "",
            `Struct: ${structName}`,
            `Description: ${description}`,
            "",
            "Use proper accp .struct syntax with appropriate field types and descriptions.",
            "Reference the .struct syntax resource (accp://syntax/struct) for correct formatting.",
          ].join("\n"),
        },
      },
    ],
  }),
);

/* ============================================================
 * Entry Point
 * ============================================================ */

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`accp MCP Server v${pkg.version} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
