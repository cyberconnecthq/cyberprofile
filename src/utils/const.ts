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
    },
    avatar: {
      type: "string",
    },
    background: {
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
          type: "string",
        },
        content: {
          type: "object",
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
