import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="card">
      <h1>Nothing here</h1>
      <p className="muted">That page does not exist.</p>
      <Link to="/">Back to the board</Link>
    </section>
  );
}

export default NotFoundPage;
