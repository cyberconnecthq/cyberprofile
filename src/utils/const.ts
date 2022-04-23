export const version = "0.1.0";
export const swaggerSpec = {
  apiFolder: "src/pages/api",
  schemaFolders: ["src/models"],
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CyberProfile API",
      version: version,
    },
  },
};

export const NotFoundError = new Error("Not Found");

export const cyberProfileSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CyberProfileSchema",
  type: "object",
  properties: {
    handle: {
      type: "string",
    },
    type: {
      type: "string",
      pattern: "(PERSONAL|ORGANIZATION)",
    },
    profilePicture: {
      type: "string",
    },
    backgroundPicture: {
      type: "string",
    },
    sector: {
      type: "string",
    },
    network: {
      type: "array",
      items: {
        type: "string",
      },
    },
    blocks: {
      type: "array",
      items: {
        $ref: "#/definitions/block",
      },
    },
  },
  definitions: {
    block: {
      type: "object",
      properties: {
        displayName: {
          type: "string",
        },
        type: {
          $ref: "#/definitions/blockType",
        },
        content: {
          type: "object",
          properties: {
            link: {
              $ref: "#/definitions/link",
            },
            links: {
              type: "array",
              items: {
                $ref: "#/definitions/link",
              },
            },
            members: {
              type: "array",
              items: {
                $ref: "#/definitions/member",
              },
            },
          },
        },
      },
    },
    blockType: {
      type: "string",
      pattern: "(LINK|MIRROR|MEDIUM|TWEET|TEAM|BACKER)",
    },
    link: {
      type: "string",
    },
    member: {
      type: "object",
      properties: {
        address: {
          type: "string",
        },
        name: {
          type: "string",
        },
        title: {
          type: "string",
        },
        avatar: {
          type: "string",
        },
      },
    },
  },
};

export const cyberProfileDefinition = {
  name: "Cyber Profile",
  schema:
    "ceramic://kjzl6cwe1jw146elfioarvmv6zspy3pkh986ex082bogtuallfmgquik74i3fyr",
  description: "Cyber profile information",
};
