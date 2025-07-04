import React from 'react';

export const defaultConfig = {
    general: {
        phpVersion: '8.3',
        nodeVersion: '20',
        environment: 'integration',
        branch: 'integracion',
        useNode: true,
        composerHome: '.composer'
    },
    build: {
        installDeps: true,
        compileAssets: true,
        cache: {
            paths: [
                'vendor/',
                'node_modules/',
                '.composer/'
            ]
        },
        artifacts: [
            'vendor/',
            'node_modules/',
            'public/build/',
            '.env'
        ]
    },
    deploy: {
        server: '',
        user: '',
        path: '',
        ssh_key: '',
        env: {
            APP_ENV: 'integracion',
            APP_URL: ''
        }
    }
};

export const defaultEnvValues = {
    "DB_RETRACTO_CONNECTION": "oracle",
};

export default {
    defaultConfig,
    defaultEnvValues
};