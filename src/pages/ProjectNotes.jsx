import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import api from '@/api';
import moment from 'moment';

export default function ProjectNotes() {
    const { id } = useParams(); // ID del proyecto desde la URL
    const [notes, setNotes] = useState([]);
    const [noteText, setNoteText] = useState('');

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/projects/${id}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addNote = async () => {
        if (!noteText.trim()) return;
        try {
            await api.post(`/projects/${id}/notes`, {
                detail: noteText,
                created_at: new Date().toISOString()
            });
            setNoteText('');
            fetchNotes();
        } catch (err) {
            console.error(err);
            alert('Error al guardar nota');
        }
    };

    useEffect(() => {
        if (id) fetchNotes();
    }, [id]);

    return (
        <div className="container mt-4">
            <div className="card p-3 mb-4">
                <h5 className="mb-3">Notas del Proyecto</h5>

                {/* <ReactQuill value={noteText} onChange={setNoteText} theme="snow" /> */}

                <button className="btn btn-sm btn-success mt-2" onClick={addNote}>
                    Guardar nota
                </button>

                <hr />

                {notes.map((note, i) => (
                    <div key={i} className="mb-3">
                        <div className="small text-muted">
                            {moment(note.created_at).format('DD-MM-YYYY HH:mm')}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: note.detail }} />
                        <hr />
                    </div>
                ))}
            </div>
        </div>
    );
}
