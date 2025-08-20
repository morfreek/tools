import React from 'react';

export const defaultConfig = {
    general: {
        phpVersion: '8.2',
        nodeVersion: '18',
        useNode: false,
        environment: 'production',
        branch: 'main',
        repository: '',
        runOptimize: true,
        runMigrate: true,
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

export default {
    defaultConfig
};