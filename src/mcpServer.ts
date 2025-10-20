#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// MCP Server for Papyrus Tools
class PapyrusToolsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'papyrus-tools-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupRequestHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'compile_file',
            description: 'Compile the currently active Papyrus script file',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the Papyrus file to compile (optional, uses active file if not provided)',
                },
              },
            },
          },
          {
            name: 'switch_game',
            description: 'Switch the active Papyrus game profile',
            inputSchema: {
              type: 'object',
              properties: {
                game: {
                  type: 'string',
                  enum: ['Skyrim', 'Fallout', 'Starfield'],
                  description: 'The game to switch to',
                },
              },
              required: ['game'],
            },
          },
          {
            name: 'get_game_config',
            description: 'Get the current game configuration and paths',
            inputSchema: {
              type: 'object',
              properties: {
                game: {
                  type: 'string',
                  enum: ['Skyrim', 'Fallout', 'Starfield'],
                  description: 'The game to get config for (optional, uses current game if not provided)',
                },
              },
            },
          },
          {
            name: 'rebuild_index',
            description: 'Rebuild the Papyrus script symbol index',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'scan_diagnostics',
            description: 'Scan configured script folders for Papyrus diagnostics',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_help',
            description: 'Get help with Papyrus scripting concepts and syntax',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'The specific topic to get help with (optional)',
                },
              },
            },
          },
          {
            name: 'generate_code',
            description: 'Generate Papyrus code snippets or templates',
            inputSchema: {
              type: 'object',
              properties: {
                description: {
                  type: 'string',
                  description: 'Description of the code to generate',
                },
                game: {
                  type: 'string',
                  enum: ['Skyrim', 'Fallout', 'Starfield'],
                  description: 'Target game for the generated code (optional)',
                },
              },
              required: ['description'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'compile_file':
            return await this.handleCompileFile();
          case 'switch_game':
            return await this.handleSwitchGame(args);
          case 'get_game_config':
            return await this.handleGetGameConfig(args);
          case 'rebuild_index':
            return await this.handleRebuildIndex();
          case 'scan_diagnostics':
            return await this.handleScanDiagnostics();
          case 'get_help':
            return await this.handleGetHelp(args);
          case 'generate_code':
            return await this.handleGenerateCode(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        } catch (error) {
          throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
  }

  private setupRequestHandlers() {
    // Handle initialization
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      return {
        protocolVersion: request.params.protocolVersion,
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'papyrus-tools-mcp',
          version: '0.1.0',
        },
      };
    });
  }

  private async handleCompileFile() {
    return {
      content: [
        {
          type: 'text',
          text: `To compile a Papyrus file:\n\n1. Open the .psc file in VS Code\n2. Use Command Palette: "Papyrus: Compile Current File" (Ctrl+Shift+P)\n3. Or click the compile button in the editor title bar\n\nThe compiled .pex file will be generated in your configured output directory.`,
        },
      ],
    };
  }

  private async handleSwitchGame(args: any) {
    const { game } = args;
    const validGames = ['Skyrim', 'Fallout', 'Starfield'];

    if (!validGames.includes(game)) {
      throw new Error(`Invalid game: ${game}. Valid options: ${validGames.join(', ')}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `To switch to ${game}:\n\n1. Open Command Palette (Ctrl+Shift+P)\n2. Run: "Papyrus: Switch Game Profile"\n3. Select "${game}" from the dropdown\n\nThis will update your compiler paths and script directories for ${game} development.`,
        },
      ],
    };
  }

  private async handleGetGameConfig(args: any) {
    const game = args.game || 'current';

    return {
      content: [
        {
          type: 'text',
          text: `To view ${game} game configuration:\n\n1. Open VS Code Settings (Ctrl+,)\n2. Search for "papyrusTools.${game.toLowerCase()}"\n3. Or use Command Palette: "Papyrus: Open Current Game Settings"\n\nConfiguration includes:\n- Compiler executable path\n- Script source directories\n- Output directories\n- Namespace settings`,
        },
      ],
    };
  }

  private async handleRebuildIndex() {
    return {
      content: [
        {
          type: 'text',
          text: `To rebuild the Papyrus script index:\n\n1. Open Command Palette (Ctrl+Shift+P)\n2. Run: "Papyrus: Rebuild Script Index"\n\nThis will refresh the symbol database for cross-script references and improve IntelliSense accuracy.`,
        },
      ],
    };
  }

  private async handleScanDiagnostics() {
    return {
      content: [
        {
          type: 'text',
          text: `To scan scripts for diagnostics:\n\n1. Open Command Palette (Ctrl+Shift+P)\n2. Run: "Papyrus: Scan Scripts for Diagnostics"\n\nResults will appear in the Problems panel (Ctrl+Shift+M) showing syntax errors, missing references, and other issues.`,
        },
      ],
    };
  }

  private async handleGetHelp(args: any) {
    const { topic } = args;

    let helpText = '# Papyrus Scripting Help\n\n';

    if (topic) {
      helpText += `## ${topic}\n\n`;
      // Add specific help based on topic
      switch (topic.toLowerCase()) {
        case 'syntax':
          helpText += '### Basic Syntax\n\n';
          helpText += '- **Script Declaration**: `ScriptName MyScript` (extends ParentScript)\n';
          helpText += '- **Properties**: `[Global|Conditional|Hidden] Type Property PropertyName`\n';
          helpText += '- **Functions**: `Function MyFunction(ParamType paramName)` ... `EndFunction`\n';
          helpText += '- **Events**: `Event MyEvent(ParamType paramName)` ... `EndEvent`\n';
          break;
        case 'properties':
          helpText += '### Properties\n\n';
          helpText += 'Properties are variables accessible from other scripts:\n\n';
          helpText += '```\n[Flags] Type Property PropertyName [Auto|= DefaultValue]\n```\n\n';
          helpText += '**Flags:** Auto, Conditional, Global, Hidden, ReadOnly\n';
          break;
        case 'functions':
          helpText += '### Functions\n\n';
          helpText += 'Functions contain reusable code:\n\n';
          helpText += '```\n[Global] ReturnType Function FunctionName(ParameterType paramName, ...)\n    ; Function body\n    Return value ; if not void\nEndFunction\n```\n';
          break;
        default:
          helpText += `I don't have specific help for "${topic}". Try topics like: syntax, properties, functions, events, debugging.\n`;
      }
    } else {
      helpText += '## Available Topics\n\n';
      helpText += '- `syntax` - Basic Papyrus syntax\n';
      helpText += '- `properties` - Property declarations and usage\n';
      helpText += '- `functions` - Function definitions and calls\n';
      helpText += '- `events` - Event handlers\n';
      helpText += '- `debugging` - Debugging techniques\n\n';
      helpText += 'Use `get_help` with a specific topic for detailed information.\n';
    }

    return {
      content: [
        {
          type: 'text',
          text: helpText,
        },
      ],
    };
  }

  private async handleGenerateCode(args: any) {
    const { description, game = 'Starfield' } = args;

    let codeTemplate = `; Generated Papyrus code for ${game}
; Description: ${description}

ScriptName GeneratedScript

; Properties
Actor Property PlayerRef Auto

; Events
Event OnInit()
    ; Initialization code
    Debug.Trace("Script initialized")
EndEvent

; Functions
Function GeneratedFunction()
    ; Generated function implementation
    ; TODO: Implement based on: ${description}
EndFunction
`;

    return {
      content: [
        {
          type: 'text',
          text: `## Generated Papyrus Code Template\n\n\`\`\`papyrus\n${codeTemplate}\n\`\`\`\n\n**Note**: This is a basic template. Copy this into a .psc file in VS Code and customize it for your needs.`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Papyrus Tools MCP server running on stdio');
  }
}

// Start the server
const server = new PapyrusToolsServer();
server.run().catch(console.error);