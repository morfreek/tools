import { FaEye } from 'react-icons/fa';

const getStatusMetrics = (results) => {
    const counts = {};
    results.forEach(r => {
        counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
};

const statusColors = {
    bien: 'success',
    regular: 'warning',
    incompleto: 'danger',
    noaplica: 'info',
};

export default function ReviewCards({ reviews, startReview }) {
    return (
        <div className="row">
            {reviews.map(review => {
                const metrics = getStatusMetrics(review.results);
                const total = review.results.length;
                return (
                    <div key={review.id} className="col-md-4 mb-4">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">Revisión: {review.applied_at}</h5>

                                <div className="mb-3">
                                    {Object.entries(metrics).map(([status, count]) => {
                                        const bg = statusColors[status] || 'secondary';
                                        const text = ['warning', 'info', 'light'].includes(bg)
                                            ? 'text-dark'
                                            : 'text-light';
                                        const percentage = ((count / total) * 100).toFixed(1);
                                        return (
                                            <span
                                                key={status}
                                                className={`badge bg-${bg} ${text} me-2`}
                                            >
                                                {status.toUpperCase()}: {count} ({percentage}%)
                                            </span>
                                        );
                                    })}
                                </div>

                                <button
                                    className="btn btn-sm btn-primary d-inline-flex align-items-center"
                                    onClick={() => startReview(review)}
                                >
                                    <FaEye className="me-2" />
                                    Ver Detalle
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
