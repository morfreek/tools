import React from 'react';

const YAML_KEYWORDS = ['stage:', 'script:', 'artifacts:', 'variables:', 'before_script:', 'environment:'];

// Color de cada palabra con los tokens de sintaxis del sistema visual (claro y oscuro)
const tokenColor = (word) => {
    if (word.startsWith('#')) return 'var(--suave)';
    if (YAML_KEYWORDS.includes(word)) return 'var(--json-clave)';
    if (word.startsWith('"') || word.startsWith("'")) return 'var(--json-texto)';
    if (word.startsWith('-')) return 'var(--json-literal)';
    if (word.includes(':')) return 'var(--json-numero)';
    return undefined;
};

export const CodePreview = ({ content }) => (
    <pre className="codigo codigo-preview m-0">
        {content.split('\n').map((line, i) => (
            <div key={i} className="codigo-linea">
                <span className="codigo-numero">{i + 1}</span>
                <span className="flex-grow-1">
                    {line.split(' ').map((word, j) => (
                        <span key={j} style={{ color: tokenColor(word) }}>{word}{' '}</span>
                    ))}
                </span>
            </div>
        ))}
    </pre>
);
