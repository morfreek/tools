import React from 'react';
import WordGenerator from '@/components/word-generator';

const WordGeneratorPage = () => {
    return (
        <div className="container-fluid p-4">
            <div className="row">
                <div className="col-12">
                    <WordGenerator />
                </div>
            </div>
        </div>
    );
};

export default WordGeneratorPage;
