import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Daily Task Planner API',
        version: '1.0.0',
        description: 'Production-ready API for managing tasks, lists, and labels.',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          Task: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              completed: { type: 'boolean' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              listId: { type: 'string' },
              order: { type: 'integer' },
              date: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateTask: {
            type: 'object',
            required: ['name', 'listId'],
            properties: {
              name: { type: 'string' },
              listId: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              date: { type: 'string', format: 'date-time' },
              labelIds: { type: 'array', items: { type: 'string' } },
            },
          },
          UpdateTask: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              completed: { type: 'boolean' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              listId: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              labelIds: { type: 'array', items: { type: 'string' } },
            },
          },
          TaskList: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              color: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateList: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              color: { type: 'string' },
            },
          },
          UpdateList: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              color: { type: 'string' },
            },
          },
          Label: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              color: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          CreateLabel: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              color: { type: 'string' },
            },
          },
          UpdateLabel: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              color: { type: 'string' },
            },
          },
          ActivityLog: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              taskId: { type: 'string' },
              action: { type: 'string' },
              details: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
