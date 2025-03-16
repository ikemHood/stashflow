import { swaggerUI } from '@hono/swagger-ui';

// Swagger document definition
const swaggerDoc = {
    openapi: '3.0.0',
    info: {
        title: 'Stashflow API',
        version: '1.0.0',
        description: 'API documentation for the Stashflow cryptocurrency savings application'
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3000',
            description: 'API Server'
        }
    ],
    tags: [
        { name: 'Authentication', description: 'User authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Devices', description: 'Device/session management endpoints' },
        { name: 'Milestones', description: 'Savings goals management' },
        { name: 'Wallets', description: 'Cryptocurrency wallet management' },
        { name: 'Transactions', description: 'Deposit and withdrawal operations' }
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
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string' },
                    isVerified: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' }
                }
            },
            Session: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    deviceName: { type: 'string' },
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                    hasPin: { type: 'boolean' }
                }
            },
            Device: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    deviceName: { type: 'string' },
                    userAgent: { type: 'string' },
                    lastUsedAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    hasPin: { type: 'boolean' },
                    isCurrentDevice: { type: 'boolean' }
                }
            },
            Milestone: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    userId: { type: 'integer' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    targetAmount: { type: 'number' },
                    currentAmount: { type: 'number' },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    currency: { type: 'string', enum: ['USDT', 'USDC', 'DAI', 'BUSD'] },
                    savingMethod: { type: 'string', enum: ['manual', 'automatic', 'recurring'] },
                    savingFrequency: { type: 'string', enum: ['daily', 'weekly', 'bi-weekly', 'monthly'] }
                }
            },
            Wallet: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    userId: { type: 'integer' },
                    walletType: { type: 'string' },
                    walletAddress: { type: 'string' },
                    isDefault: { type: 'boolean' },
                    metadata: { type: 'object' }
                }
            },
            Transaction: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    milestoneId: { type: 'integer' },
                    amount: { type: 'number' },
                    transactionType: { type: 'string', enum: ['deposit', 'withdrawal'] },
                    status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
                    txHash: { type: 'string' },
                    walletAddress: { type: 'string' }
                }
            }
        }
    },
    paths: {
        // Authentication endpoints
        '/api/v1/users/signup': {
            post: {
                tags: ['Authentication'],
                summary: 'Register a new user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'name', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    name: { type: 'string', minLength: 2 },
                                    password: { type: 'string', minLength: 6 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'User created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                user: { $ref: '#/components/schemas/User' },
                                                session: { $ref: '#/components/schemas/Session' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/users/login': {
            post: {
                tags: ['Authentication'],
                summary: 'User login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'password'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    password: { type: 'string' },
                                    deviceName: {
                                        type: 'string',
                                        description: 'Optional name for this device/session'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                user: { $ref: '#/components/schemas/User' },
                                                session: { $ref: '#/components/schemas/Session' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/users/email/verify': {
            post: {
                tags: ['Authentication'],
                summary: 'Verify email with code',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['code'],
                                properties: {
                                    code: { type: 'string', minLength: 6, maxLength: 6, description: 'Verification code received via email' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Email verified successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid or expired verification code'
                    },
                    '401': {
                        description: 'Authentication required'
                    }
                }
            }
        },
        '/api/v1/users/email/resend': {
            post: {
                tags: ['Authentication'],
                summary: 'Resend verification code',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Verification code sent',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Authentication required'
                    }
                }
            }
        },
        '/api/v1/users/password/forgot': {
            post: {
                tags: ['Authentication'],
                summary: 'Request password reset',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Password reset link sent'
                    }
                }
            }
        },
        '/api/v1/users/password/reset': {
            post: {
                tags: ['Authentication'],
                summary: 'Reset password with code',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'code', 'newPassword'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    code: { type: 'string' },
                                    newPassword: { type: 'string', minLength: 6 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Password reset successful'
                    }
                }
            }
        },
        '/api/v1/users/me': {
            get: {
                tags: ['Users'],
                summary: 'Get current user profile',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'User profile retrieved',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: { $ref: '#/components/schemas/User' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/users/token/refresh': {
            post: {
                tags: ['Authentication'],
                summary: 'Refresh access token using refresh token and PIN',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['refreshToken', 'pin'],
                                properties: {
                                    refreshToken: { type: 'string' },
                                    pin: {
                                        type: 'string',
                                        minLength: 6,
                                        maxLength: 6,
                                        pattern: '^[0-9]{6}$',
                                        description: 'A 6-digit PIN specific to the device/session'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Token refreshed successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                accessToken: { type: 'string' },
                                                refreshToken: { type: 'string' },
                                                deviceName: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Invalid refresh token or PIN'
                    }
                }
            }
        },
        '/api/v1/users/logout': {
            post: {
                tags: ['Devices'],
                summary: 'Logout (invalidate current session)',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Logged out successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Authentication required'
                    }
                }
            }
        },
        '/api/v1/users/logout-all': {
            post: {
                tags: ['Devices'],
                summary: 'Logout from all devices (invalidate all sessions)',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Logged out from all devices successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        description: 'Authentication required'
                    }
                }
            }
        },
        // // Milestones endpoints
        // '/api/v1/milestones': {
        //     get: {
        //         tags: ['Milestones'],
        //         summary: 'Get all user milestones',
        //         security: [{ bearerAuth: [] }],
        //         responses: {
        //             '200': {
        //                 description: 'List of milestones',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: {
        //                                     type: 'array',
        //                                     items: { $ref: '#/components/schemas/Milestone' }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     post: {
        //         tags: ['Milestones'],
        //         summary: 'Create a new milestone',
        //         security: [{ bearerAuth: [] }],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         required: ['name', 'targetAmount', 'startDate', 'endDate'],
        //                         properties: {
        //                             name: { type: 'string', minLength: 2 },
        //                             description: { type: 'string' },
        //                             targetAmount: { type: 'number', minimum: 0 },
        //                             startDate: { type: 'string', format: 'date' },
        //                             endDate: { type: 'string', format: 'date' },
        //                             currency: { type: 'string', enum: ['USDT', 'USDC', 'DAI', 'BUSD'] },
        //                             savingMethod: { type: 'string', enum: ['manual', 'automatic', 'recurring'] },
        //                             savingFrequency: { type: 'string', enum: ['daily', 'weekly', 'bi-weekly', 'monthly'] }
        //                         }
        //                     }
        //                 }
        //             }
        //         },
        //         responses: {
        //             '201': {
        //                 description: 'Milestone created',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Milestone' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // '/api/v1/milestones/{id}': {
        //     get: {
        //         tags: ['Milestones'],
        //         summary: 'Get milestone by ID',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'id',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         responses: {
        //             '200': {
        //                 description: 'Milestone details',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Milestone' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     put: {
        //         tags: ['Milestones'],
        //         summary: 'Update milestone',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'id',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         properties: {
        //                             name: { type: 'string', minLength: 2 },
        //                             description: { type: 'string' },
        //                             targetAmount: { type: 'number', minimum: 0 },
        //                             startDate: { type: 'string', format: 'date' },
        //                             endDate: { type: 'string', format: 'date' },
        //                             currency: { type: 'string', enum: ['USDT', 'USDC', 'DAI', 'BUSD'] },
        //                             savingMethod: { type: 'string', enum: ['manual', 'automatic', 'recurring'] },
        //                             savingFrequency: { type: 'string', enum: ['daily', 'weekly', 'bi-weekly', 'monthly'] }
        //                         }
        //                     }
        //                 }
        //             }
        //         },
        //         responses: {
        //             '200': {
        //                 description: 'Milestone updated',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Milestone' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     delete: {
        //         tags: ['Milestones'],
        //         summary: 'Delete milestone',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'id',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         responses: {
        //             '200': {
        //                 description: 'Milestone deleted',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },

        // // Wallet endpoints
        // '/api/v1/wallets': {
        //     get: {
        //         tags: ['Wallets'],
        //         summary: 'Get all user wallets',
        //         security: [{ bearerAuth: [] }],
        //         responses: {
        //             '200': {
        //                 description: 'List of wallets',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: {
        //                                     type: 'array',
        //                                     items: { $ref: '#/components/schemas/Wallet' }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     },
        //     post: {
        //         tags: ['Wallets'],
        //         summary: 'Connect a new wallet',
        //         security: [{ bearerAuth: [] }],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         required: ['walletType', 'walletAddress'],
        //                         properties: {
        //                             walletType: { type: 'string' },
        //                             walletAddress: { type: 'string' },
        //                             metadata: { type: 'object' }
        //                         }
        //                     }
        //                 }
        //             }
        //         },
        //         responses: {
        //             '201': {
        //                 description: 'Wallet connected',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Wallet' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // '/api/v1/wallets/{id}/default': {
        //     put: {
        //         tags: ['Wallets'],
        //         summary: 'Set default wallet',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'id',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Wallet ID'
        //             }
        //         ],
        //         responses: {
        //             '200': {
        //                 description: 'Default wallet updated',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // '/api/v1/wallets/{id}': {
        //     delete: {
        //         tags: ['Wallets'],
        //         summary: 'Disconnect wallet',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'id',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Wallet ID'
        //             }
        //         ],
        //         responses: {
        //             '200': {
        //                 description: 'Wallet disconnected',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },

        // // Transaction endpoints
        // '/api/v1/transactions/milestones/{milestoneId}/deposit': {
        //     post: {
        //         tags: ['Transactions'],
        //         summary: 'Deposit funds to milestone',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'milestoneId',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         required: ['amount'],
        //                         properties: {
        //                             amount: { type: 'number', minimum: 0 },
        //                             walletAddress: { type: 'string' },
        //                             txHash: { type: 'string' },
        //                             metadata: { type: 'object' }
        //                         }
        //                     }
        //                 }
        //             }
        //         },
        //         responses: {
        //             '201': {
        //                 description: 'Deposit successful',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Transaction' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // '/api/v1/transactions/milestones/{milestoneId}/withdraw': {
        //     post: {
        //         tags: ['Transactions'],
        //         summary: 'Withdraw funds from milestone',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'milestoneId',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         required: ['amount'],
        //                         properties: {
        //                             amount: { type: 'number', minimum: 0 },
        //                             walletAddress: { type: 'string' },
        //                             txHash: { type: 'string' },
        //                             metadata: { type: 'object' }
        //                         }
        //                     }
        //                 }
        //             }
        //         },
        //         responses: {
        //             '201': {
        //                 description: 'Withdrawal successful',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: { $ref: '#/components/schemas/Transaction' }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // },
        // '/api/v1/transactions/milestones/{milestoneId}/transactions': {
        //     get: {
        //         tags: ['Transactions'],
        //         summary: 'Get milestone transactions',
        //         security: [{ bearerAuth: [] }],
        //         parameters: [
        //             {
        //                 in: 'path',
        //                 name: 'milestoneId',
        //                 required: true,
        //                 schema: { type: 'integer' },
        //                 description: 'Milestone ID'
        //             }
        //         ],
        //         responses: {
        //             '200': {
        //                 description: 'List of transactions',
        //                 content: {
        //                     'application/json': {
        //                         schema: {
        //                             type: 'object',
        //                             properties: {
        //                                 message: { type: 'string' },
        //                                 data: {
        //                                     type: 'array',
        //                                     items: { $ref: '#/components/schemas/Transaction' }
        //                                 }
        //                             }
        //                         }
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }

        // Device management endpoints
        '/api/v1/users/device/pin': {
            post: {
                tags: ['Devices'],
                summary: 'Set 6-digit PIN for current device',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['pin'],
                                properties: {
                                    pin: {
                                        type: 'string',
                                        minLength: 6,
                                        maxLength: 6,
                                        pattern: '^[0-9]{6}$',
                                        description: 'A 6-digit PIN for this device/session'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'PIN set successfully for this device',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/users/devices': {
            get: {
                tags: ['Devices'],
                summary: 'Get all active devices/sessions',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of active devices',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                devices: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Device' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        '/api/v1/users/device/rename': {
            post: {
                tags: ['Devices'],
                summary: 'Rename a device/session',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['sessionId', 'deviceName'],
                                properties: {
                                    sessionId: { type: 'string', description: 'Session ID of the device' },
                                    deviceName: { type: 'string', minLength: 1 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Device renamed successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '404': {
                        description: 'Session not found'
                    }
                }
            }
        },
        '/api/v1/users/device/logout': {
            post: {
                tags: ['Devices'],
                summary: 'Logout from a specific device',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['sessionId'],
                                properties: {
                                    sessionId: { type: 'string', description: 'Session ID of the device to logout' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Successfully logged out from device',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    '404': {
                        description: 'Session not found'
                    }
                }
            }
        }
    }
};

// Export the Swagger UI handler and document
export const swagger = {
    ui: swaggerUI({ url: '/api-docs/swagger.json' }),
    doc: swaggerDoc
}; 