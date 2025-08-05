import React from 'react';

export const CodePreview = ({ content }) => (
    <div className="bg-dark">
        <pre
            style={{
                margin: 0,
                backgroundColor: '#1e1e1e',
                color: '#d4d4d4',
                fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                lineHeight: '1.5',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '100%'
            }}
        >
            {content.split('\n').map((line, i) => (
                <div 
                    key={i} 
                    style={{
                        display: 'flex',
                        borderLeft: '1px solid #404040',
                        backgroundColor: line.trim().startsWith('#') ? '#1e1e1e' : 'transparent'
                    }}
                >
                    <span 
                        style={{
                            width: '40px',
                            paddingRight: '1rem',
                            color: '#858585',
                            textAlign: 'right',
                            userSelect: 'none',
                            borderRight: '1px solid #404040',
                            marginRight: '1rem'
                        }}
                    >
                        {i + 1}
                    </span>
                    <span style={{ flex: 1 }}>
                        {line.split(' ').map((word, j) => {
                            let color = '#d4d4d4';
                            if (word.startsWith('#')) {
                                color = '#6A9955';
                            } else if (['stage:', 'script:', 'artifacts:', 'variables:', 'before_script:', 'environment:'].includes(word)) {
                                color = '#569cd6';
                            } else if (word.startsWith('"') || word.startsWith("'")) {
                                color = '#ce9178';
                            } else if (word.startsWith('-')) {
                                color = '#c586c0';
                            } else if (word.includes(':')) {
                                color = '#9cdcfe';
                            }
                            return (
                                <span key={j} style={{ color }}>
                                    {word}{' '}
                                </span>
                            );
                        })}
                    </span>
                </div>
            ))}
        </pre>
    </div>
);
