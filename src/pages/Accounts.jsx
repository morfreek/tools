import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Placeholder } from 'react-bootstrap';
import { FaEdit, FaExchangeAlt, FaKey, FaPlus } from 'react-icons/fa';
import { useSession } from '@c/SessionContext';
import { useToast } from '@c/ToastContext';
import { listAccounts, transferAccountProjects } from '@/services/accounts.service';
import { apiErrorMessage } from '@u/apiError';
import AccountModal from '@c/account/AccountModal';
import ResetPasswordModal from '@c/account/ResetPasswordModal';
import TransferModal from '@c/account/TransferModal';

// Gestión de cuentas de acceso (solo administradores). Cada cuenta ve y gestiona
// solo los proyectos de los que es dueña; aquí se crean, desactivan y se traspasan.
export default function Accounts() {
    const { account: me } = useSession();
    const { showToast } = useToast();
    const [accounts, setAccounts] = useState(null);
    const [error, setError] = useState('');
    // { kind: 'crear' | 'editar' | 'clave' | 'transferir', account }
    const [modal, setModal] = useState(null);

    const load = useCallback(async () => {
        try {
            setAccounts(await listAccounts());
            setError('');
        } catch (err) {
            setError(apiErrorMessage(err, 'No se pudieron cargar las cuentas'));
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const close = () => setModal(null);
    const target = modal?.account;

    const transfer = async (accountId) => {
        const { transferred } = await transferAccountProjects(target.id, accountId);
        const destino = accounts.find((a) => a.id === accountId);
        showToast('success', `${transferred} proyecto${transferred === 1 ? '' : 's'} transferido${transferred === 1 ? '' : 's'} a ${destino?.name}`);
        load();
    };

    return (
        <>
            <div className="titulo-seccion">
                <h2>Cuentas <span className="sub">Acceso a Proyectos: cada cuenta gestiona solo sus proyectos</span></h2>
            </div>
            <Card>
                <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h2 className="h6 fw-semibold mb-0">Cuentas <span className="sub fw-normal">{accounts?.length ?? ''}</span></h2>
                    <Button size="sm" className="d-inline-flex align-items-center" onClick={() => setModal({ kind: 'crear' })}>
                        <FaPlus className="me-2" />Nueva cuenta
                    </Button>
                </Card.Header>
                {error ? (
                    <Card.Body><div className="aviso aviso-rojo mb-0">{error}</div></Card.Body>
                ) : !accounts ? (
                    <Card.Body><Placeholder animation="glow"><Placeholder xs={12} /><Placeholder xs={9} /></Placeholder></Card.Body>
                ) : (
                    <div className="table-responsive">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th className="text-end">Proyectos</th>
                                    <th className="text-end"><span className="visually-hidden">Acciones</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((a) => (
                                    <tr key={a.id} className={a.active ? undefined : 'inactivo'}>
                                        <td>{a.name}{a.id === me.id && <span className="sub ms-2">(usted)</span>}</td>
                                        <td><code>{a.username}</code></td>
                                        <td><Badge bg={a.role === 'admin' ? 'info' : 'secondary'}>{a.role === 'admin' ? 'Administrador' : 'Usuario'}</Badge></td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-1">
                                                <Badge bg={a.active ? 'success' : 'secondary'}>{a.active ? 'Activa' : 'Desactivada'}</Badge>
                                                {a.active && a.must_change_password && <Badge bg="warning">Contraseña temporal</Badge>}
                                            </div>
                                        </td>
                                        <td className="text-end">{a.project_count}</td>
                                        <td className="text-end text-nowrap">
                                            <Button variant="link" size="sm" className="accion accion-editar" title={`Editar ${a.username}`} onClick={() => setModal({ kind: 'editar', account: a })}>
                                                <FaEdit />
                                            </Button>
                                            <Button variant="link" size="sm" className="accion" title={`Restablecer contraseña de ${a.username}`} onClick={() => setModal({ kind: 'clave', account: a })} disabled={a.id === me.id}>
                                                <FaKey />
                                            </Button>
                                            <Button variant="link" size="sm" className="accion" title={a.project_count ? `Transferir los proyectos de ${a.username}` : 'Sin proyectos que transferir'} onClick={() => setModal({ kind: 'transferir', account: a })} disabled={!a.project_count}>
                                                <FaExchangeAlt />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <AccountModal
                show={modal?.kind === 'crear' || modal?.kind === 'editar'}
                onClose={close}
                onSaved={load}
                account={modal?.kind === 'editar' ? target : null}
                self={target?.id === me.id}
            />
            <ResetPasswordModal show={modal?.kind === 'clave'} onClose={close} onSaved={load} account={target} />
            <TransferModal
                show={modal?.kind === 'transferir'}
                onClose={close}
                title="Transferir proyectos"
                description={target && `Los ${target.project_count} proyectos de ${target.name} pasarán a la cuenta elegida, que será su única dueña. ${target.name} dejará de verlos.`}
                accounts={(accounts || []).filter((a) => a.active && a.id !== target?.id)}
                acceptText="Transferir proyectos"
                onConfirm={transfer}
            />
        </>
    );
}
