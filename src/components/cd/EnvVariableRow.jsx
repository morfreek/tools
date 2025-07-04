import React from 'react';
import { Form, Button } from 'react-bootstrap';

const EnvVariableRow = React.memo(({ envKey, value, onRemove, canRemove = true, onChange, isInvalid }) => (
    <Form.Group className="mb-3">
        <div className="d-flex justify-content-between align-items-center gap-2">
            <div className="flex-grow-1">
                <Form.Label>
                    {envKey} <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                    size="sm"
                    type="text"
                    value={value}
                    onChange={e => onChange(envKey, e.target.value)}
                    isInvalid={isInvalid}
                />
            </div>
            {canRemove && (
                <Button
                    size="sm"
                    variant="danger"
                    className="py-0 mt-4"
                    onClick={() => onRemove(envKey)}
                >
                    ×
                </Button>
            )}
        </div>
    </Form.Group>
), (prevProps, nextProps) => {
    return prevProps.value === nextProps.value &&
        prevProps.envKey === nextProps.envKey &&
        prevProps.canRemove === nextProps.canRemove &&
        prevProps.isInvalid === nextProps.isInvalid;
});

export default EnvVariableRow;
