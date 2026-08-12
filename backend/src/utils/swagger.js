import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env.js';

const bearerSecurity = [{ bearerAuth: [] }];

const paginationParameters = [
  {
    in: 'query',
    name: 'page',
    schema: { type: 'integer', minimum: 1, default: 1 }
  },
  {
    in: 'query',
    name: 'pageSize',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  }
];

const idParameter = {
  in: 'path',
  name: 'id',
  required: true,
  schema: { type: 'integer', minimum: 1 }
};

const doctorIdParameter = {
  in: 'path',
  name: 'doctorId',
  required: true,
  schema: { type: 'integer', minimum: 1 }
};

const genericObjectSchema = {
  type: 'object',
  additionalProperties: true
};

function successResponse(description, schema = { $ref: '#/components/schemas/GenericSuccessResponse' }) {
  return {
    description,
    content: {
      'application/json': {
        schema
      }
    }
  };
}

function requestBody(description, schema = genericObjectSchema, required = true) {
  return {
    required,
    description,
    content: {
      'application/json': {
        schema
      }
    }
  };
}

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MediCare Hub API',
      version: '0.1.0',
      description: 'API REST del progetto accademico MediCare Hub per la clinica fittizia Centro Medico Aurora.'
    },
    servers: [
      {
        url: env.apiPublicUrl,
        description: env.isProduction ? 'Public production server' : 'Configured application server'
      }
    ],
    tags: [
      { name: 'Health', description: 'Controlli di base del processo HTTP.' },
      { name: 'Status', description: 'Stato applicativo e controlli diagnostici.' },
      { name: 'Auth', description: 'Autenticazione e sessione utente.' },
      { name: 'Access', description: 'Verifiche di accesso per ruolo.' },
      { name: 'Users', description: 'Gestione utenti interni.' },
      { name: 'Doctors', description: 'Gestione medici, prestazioni e disponibilita\'.' },
      { name: 'Patients', description: 'Gestione anagrafica pazienti.' },
      { name: 'Appointments', description: 'Gestione agenda e appuntamenti.' },
      { name: 'Availabilities', description: 'Aggiornamento e rimozione disponibilita\'.' },
      { name: 'Specialties', description: 'Catalogo specializzazioni.' },
      { name: 'Medical Services', description: 'Catalogo prestazioni mediche.' },
      { name: 'Dashboard', description: 'Aggregazioni e reportistica operativa.' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        GenericSuccessResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: genericObjectSchema
          }
        },
        GenericPaginatedResponse: {
          type: 'object',
          required: ['data', 'meta'],
          properties: {
            data: {
              type: 'array',
              items: genericObjectSchema
            },
            meta: {
              type: 'object',
              required: ['page', 'pageSize', 'totalItems', 'totalPages'],
              properties: {
                page: { type: 'integer', example: 1 },
                pageSize: { type: 'integer', example: 20 },
                totalItems: { type: 'integer', example: 42 },
                totalPages: { type: 'integer', example: 3 }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Resource not found' },
                details: {
                  type: 'array',
                  items: genericObjectSchema
                }
              }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['status', 'project', 'clinic', 'timestamp'],
              properties: {
                status: { type: 'string', example: 'ok' },
                project: { type: 'string', example: 'MediCare Hub' },
                clinic: { type: 'string', example: 'Centro Medico Aurora' },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        StatusResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['status', 'apiVersion', 'environment', 'database', 'timestamp'],
              properties: {
                status: { type: 'string', example: 'ok' },
                apiVersion: { type: 'string', example: 'v1' },
                environment: { type: 'string', example: 'development' },
                database: {
                  type: 'object',
                  additionalProperties: true
                },
                timestamp: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        StatusChecksResponse: {
          allOf: [{ $ref: '#/components/schemas/GenericPaginatedResponse' }]
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@aurora.test' },
            password: { type: 'string', format: 'password', example: 'Demo123!' }
          }
        },
        LoginResponse: {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'object',
              required: ['token', 'user'],
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: {
                  type: 'object',
                  required: ['id', 'firstName', 'lastName', 'email', 'role'],
                  properties: {
                    id: { type: 'integer', example: 1 },
                    firstName: { type: 'string', example: 'Aurora' },
                    lastName: { type: 'string', example: 'Admin' },
                    email: { type: 'string', format: 'email', example: 'admin@aurora.test' },
                    role: {
                      type: 'string',
                      enum: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'],
                      example: 'ADMIN'
                    }
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Bearer token mancante, invalido o scaduto.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        Forbidden: {
          description: 'Ruolo non autorizzato per la risorsa richiesta.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ValidationError: {
          description: 'Payload o parametri non validi.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFound: {
          description: 'Risorsa non trovata.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check del processo HTTP',
          responses: {
            200: successResponse('Processo HTTP attivo.', {
              $ref: '#/components/schemas/HealthResponse'
            })
          }
        }
      },
      '/api/v1/status': {
        get: {
          tags: ['Status'],
          summary: 'Stato applicativo generale',
          responses: {
            200: successResponse('Stato applicativo.', {
              $ref: '#/components/schemas/StatusResponse'
            })
          }
        }
      },
      '/api/v1/status/checks': {
        get: {
          tags: ['Status'],
          summary: 'Controlli diagnostici applicativi',
          responses: {
            200: successResponse('Elenco controlli.', {
              $ref: '#/components/schemas/StatusChecksResponse'
            })
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login con email e password',
          requestBody: requestBody('Credenziali di accesso.', {
            $ref: '#/components/schemas/LoginRequest'
          }),
          responses: {
            200: successResponse('Login riuscito.', {
              $ref: '#/components/schemas/LoginResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Profilo dell utente autenticato',
          security: bearerSecurity,
          responses: {
            200: successResponse('Profilo pubblico utente.'),
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        }
      },
      '/api/v1/admin/check': {
        get: {
          tags: ['Access'],
          summary: 'Verifica accesso ADMIN',
          security: bearerSecurity,
          responses: {
            200: successResponse('Accesso ADMIN confermato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/medical/check': {
        get: {
          tags: ['Access'],
          summary: 'Verifica accesso DOCTOR',
          security: bearerSecurity,
          responses: {
            200: successResponse('Accesso DOCTOR confermato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/users': {
        get: {
          tags: ['Users'],
          summary: 'Lista utenti interni',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'role',
              schema: { type: 'string', enum: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] }
            },
            {
              in: 'query',
              name: 'isActive',
              schema: { type: 'boolean' }
            }
          ],
          responses: {
            200: successResponse('Lista utenti paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Users'],
          summary: 'Crea un utente interno',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione utente.'),
          responses: {
            201: successResponse('Utente creato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Dettaglio utente',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio utente.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Users'],
          summary: 'Aggiorna un utente',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento utente.'),
          responses: {
            200: successResponse('Utente aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Aggiorna lo stato attivo di un utente',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              isActive: { type: 'boolean', example: false }
            }
          }),
          responses: {
            200: successResponse('Stato utente aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/users/{id}/password': {
        patch: {
          tags: ['Users'],
          summary: 'Aggiorna la password di un utente',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con la nuova password.', {
            type: 'object',
            properties: {
              password: { type: 'string', format: 'password', example: 'NuovaPassword123!' }
            }
          }),
          responses: {
            200: successResponse('Password aggiornata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors': {
        get: {
          tags: ['Doctors'],
          summary: 'Lista medici',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'specialtyId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'isActive',
              schema: { type: 'boolean' }
            }
          ],
          responses: {
            200: successResponse('Lista medici paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Doctors'],
          summary: 'Crea un medico',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione medico.'),
          responses: {
            201: successResponse('Medico creato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/me': {
        get: {
          tags: ['Doctors'],
          summary: 'Profilo operativo del medico autenticato',
          security: bearerSecurity,
          responses: {
            200: successResponse('Profilo medico corrente.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/doctors/me/available-services': {
        get: {
          tags: ['Doctors'],
          summary: 'Prestazioni assegnabili al medico autenticato',
          security: bearerSecurity,
          responses: {
            200: successResponse('Lista prestazioni assegnabili.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        }
      },
      '/api/v1/doctors/me/services': {
        put: {
          tags: ['Doctors'],
          summary: 'Sostituisce le prestazioni del medico autenticato',
          security: bearerSecurity,
          requestBody: requestBody('Array di `medicalServiceIds`.'),
          responses: {
            200: successResponse('Prestazioni aggiornate.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/{doctorId}/availabilities': {
        get: {
          tags: ['Doctors'],
          summary: 'Lista disponibilita di un medico',
          security: bearerSecurity,
          parameters: [
            doctorIdParameter,
            {
              in: 'query',
              name: 'dateFrom',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'dateTo',
              schema: { type: 'string', format: 'date' }
            }
          ],
          responses: {
            200: successResponse('Lista disponibilita.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Doctors'],
          summary: 'Crea una disponibilita per un medico',
          security: bearerSecurity,
          parameters: [doctorIdParameter],
          requestBody: requestBody('Payload disponibilita.'),
          responses: {
            201: successResponse('Disponibilita creata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/{doctorId}/available-slots': {
        get: {
          tags: ['Doctors'],
          summary: 'Slot disponibili per una data e una prestazione',
          security: bearerSecurity,
          parameters: [
            doctorIdParameter,
            {
              in: 'query',
              name: 'date',
              required: true,
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'medicalServiceId',
              required: true,
              schema: { type: 'integer', minimum: 1 }
            }
          ],
          responses: {
            200: successResponse('Slot disponibili.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/{id}': {
        get: {
          tags: ['Doctors'],
          summary: 'Dettaglio medico',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio medico.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Doctors'],
          summary: 'Aggiorna un medico',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento medico.'),
          responses: {
            200: successResponse('Medico aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/{id}/status': {
        patch: {
          tags: ['Doctors'],
          summary: 'Aggiorna lo stato attivo del medico',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              isActive: { type: 'boolean', example: true }
            }
          }),
          responses: {
            200: successResponse('Stato medico aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/doctors/{id}/services': {
        put: {
          tags: ['Doctors'],
          summary: 'Sostituisce le prestazioni di un medico',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con array `medicalServiceIds`.'),
          responses: {
            200: successResponse('Prestazioni medico aggiornate.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/availabilities/{id}': {
        put: {
          tags: ['Availabilities'],
          summary: 'Aggiorna una disponibilita',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento disponibilita.'),
          responses: {
            200: successResponse('Disponibilita aggiornata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        },
        delete: {
          tags: ['Availabilities'],
          summary: 'Elimina una disponibilita',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Disponibilita eliminata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/patients': {
        get: {
          tags: ['Patients'],
          summary: 'Lista pazienti',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'isActive',
              schema: { type: 'boolean' }
            }
          ],
          responses: {
            200: successResponse('Lista pazienti paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Patients'],
          summary: 'Crea un paziente',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione paziente.'),
          responses: {
            201: successResponse('Paziente creato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/patients/{id}': {
        get: {
          tags: ['Patients'],
          summary: 'Dettaglio paziente',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio paziente.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Patients'],
          summary: 'Aggiorna un paziente',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento paziente.'),
          responses: {
            200: successResponse('Paziente aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/patients/{id}/status': {
        patch: {
          tags: ['Patients'],
          summary: 'Aggiorna lo stato attivo del paziente',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              isActive: { type: 'boolean', example: true }
            }
          }),
          responses: {
            200: successResponse('Stato paziente aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/specialties': {
        get: {
          tags: ['Specialties'],
          summary: 'Lista specializzazioni',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'isActive',
              schema: { type: 'boolean' }
            }
          ],
          responses: {
            200: successResponse('Lista specializzazioni paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Specialties'],
          summary: 'Crea una specializzazione',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione specializzazione.'),
          responses: {
            201: successResponse('Specializzazione creata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/specialties/{id}': {
        get: {
          tags: ['Specialties'],
          summary: 'Dettaglio specializzazione',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio specializzazione.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Specialties'],
          summary: 'Aggiorna una specializzazione',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento specializzazione.'),
          responses: {
            200: successResponse('Specializzazione aggiornata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/specialties/{id}/status': {
        patch: {
          tags: ['Specialties'],
          summary: 'Aggiorna lo stato attivo della specializzazione',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              isActive: { type: 'boolean', example: true }
            }
          }),
          responses: {
            200: successResponse('Stato specializzazione aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/medical-services': {
        get: {
          tags: ['Medical Services'],
          summary: 'Lista prestazioni mediche',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'specialtyId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'isActive',
              schema: { type: 'boolean' }
            }
          ],
          responses: {
            200: successResponse('Lista prestazioni paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }
          }
        },
        post: {
          tags: ['Medical Services'],
          summary: 'Crea una prestazione medica',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione prestazione.'),
          responses: {
            201: successResponse('Prestazione creata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/medical-services/{id}': {
        get: {
          tags: ['Medical Services'],
          summary: 'Dettaglio prestazione medica',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio prestazione.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Medical Services'],
          summary: 'Aggiorna una prestazione medica',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento prestazione.'),
          responses: {
            200: successResponse('Prestazione aggiornata.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/medical-services/{id}/status': {
        patch: {
          tags: ['Medical Services'],
          summary: 'Aggiorna lo stato attivo della prestazione',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              isActive: { type: 'boolean', example: true }
            }
          }),
          responses: {
            200: successResponse('Stato prestazione aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'Lista appuntamenti',
          security: bearerSecurity,
          parameters: [
            ...paginationParameters,
            {
              in: 'query',
              name: 'search',
              schema: { type: 'string' }
            },
            {
              in: 'query',
              name: 'doctorId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'patientId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'status',
              schema: {
                type: 'string',
                enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
              }
            },
            {
              in: 'query',
              name: 'from',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              in: 'query',
              name: 'to',
              schema: { type: 'string', format: 'date-time' }
            }
          ],
          responses: {
            200: successResponse('Lista appuntamenti paginata.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' }
          }
        },
        post: {
          tags: ['Appointments'],
          summary: 'Crea un appuntamento',
          security: bearerSecurity,
          requestBody: requestBody('Payload di creazione appuntamento.'),
          responses: {
            201: successResponse('Appuntamento creato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Dettaglio appuntamento',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Dettaglio appuntamento.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        },
        put: {
          tags: ['Appointments'],
          summary: 'Aggiorna un appuntamento',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload di aggiornamento appuntamento.'),
          responses: {
            200: successResponse('Appuntamento aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        },
        delete: {
          tags: ['Appointments'],
          summary: 'Elimina un appuntamento',
          security: bearerSecurity,
          parameters: [idParameter],
          responses: {
            200: successResponse('Appuntamento eliminato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            404: { $ref: '#/components/responses/NotFound' }
          }
        }
      },
      '/api/v1/appointments/{id}/status': {
        patch: {
          tags: ['Appointments'],
          summary: 'Aggiorna lo stato di un appuntamento',
          security: bearerSecurity,
          parameters: [idParameter],
          requestBody: requestBody('Payload con il nuovo stato.', {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
                example: 'CONFIRMED'
              },
              operationalNotes: {
                type: 'string',
                example: 'Conferma telefonica ricevuta.'
              }
            }
          }),
          responses: {
            200: successResponse('Stato appuntamento aggiornato.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/dashboard/summary': {
        get: {
          tags: ['Dashboard'],
          summary: 'Sintesi dashboard',
          security: bearerSecurity,
          parameters: [
            {
              in: 'query',
              name: 'dateFrom',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'dateTo',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'doctorId',
              schema: { type: 'integer', minimum: 1 }
            }
          ],
          responses: {
            200: successResponse('Sintesi dashboard.'),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/dashboard/appointments-trend': {
        get: {
          tags: ['Dashboard'],
          summary: 'Andamento appuntamenti',
          security: bearerSecurity,
          parameters: [
            {
              in: 'query',
              name: 'dateFrom',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'dateTo',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'doctorId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'groupBy',
              schema: { type: 'string', enum: ['day', 'month'], default: 'day' }
            }
          ],
          responses: {
            200: successResponse('Serie temporale appuntamenti.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/dashboard/by-specialty': {
        get: {
          tags: ['Dashboard'],
          summary: 'Aggregazione per specializzazione',
          security: bearerSecurity,
          parameters: [
            {
              in: 'query',
              name: 'dateFrom',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'dateTo',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'doctorId',
              schema: { type: 'integer', minimum: 1 }
            }
          ],
          responses: {
            200: successResponse('Aggregazione per specializzazione.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/dashboard/upcoming': {
        get: {
          tags: ['Dashboard'],
          summary: 'Prossimi appuntamenti',
          security: bearerSecurity,
          parameters: [
            {
              in: 'query',
              name: 'dateFrom',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'dateTo',
              schema: { type: 'string', format: 'date' }
            },
            {
              in: 'query',
              name: 'doctorId',
              schema: { type: 'integer', minimum: 1 }
            },
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 }
            }
          ],
          responses: {
            200: successResponse('Lista prossimi appuntamenti.', {
              $ref: '#/components/schemas/GenericPaginatedResponse'
            }),
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' }
          }
        }
      }
    }
  },
  apis: []
};

export const swaggerSpec = swaggerJsdoc(options);
