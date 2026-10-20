
import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

function AdminDashboard({ onBack }) {
  const [enquiries, setEnquiries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/enquiries");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load enquiries.");
        }

        setEnquiries(data.enquiries || []);
      } catch (err) {
        setError("Could not load enquiries. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return enquiries;

    return enquiries.filter((item) =>
      [
        item.customerName,
        item.companyName,
        item.email,
        item.product,
        item.phone,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [enquiries, search]);

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">INNOVISION INDUSTRIES</p>
          <h1>Enquiry Dashboard</h1>
          <p className="admin-subtitle">
            Manage and review customer enquiries.
          </p>
        </div>

        <button className="back-button" onClick={onBack}>
          Back to Chatbot
        </button>
      </header>

      <section className="admin-stats">
        <article className="stat-card">
          <span>Total Enquiries</span>
          <strong>{enquiries.length}</strong>
        </article>

        <article className="stat-card">
          <span>Matching Results</span>
          <strong>{filteredEnquiries.length}</strong>
        </article>
      </section>

      <section className="admin-content">
        <div className="table-heading">
          <div>
            <h2>Customer Enquiries</h2>
            <p>Review the details submitted by customers.</p>
          </div>

          <input
            type="search"
            className="enquiry-search"
            placeholder="Search enquiries..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search enquiries"
          />
        </div>

        {loading ? (
          <p className="admin-message">Loading enquiries...</p>
        ) : error ? (
          <p className="admin-message error-message">{error}</p>
        ) : filteredEnquiries.length === 0 ? (
          <p className="admin-message">No enquiries found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="enquiry-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Product</th>
                  <th>Enquiry Details</th>
                  <th>Submitted At</th>
                </tr>
              </thead>

              <tbody>
                {filteredEnquiries.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{item.customerName}</td>
                    <td>{item.companyName}</td>
                    <td>
                      <div>{item.email}</div>
                      <small>{item.phone}</small>
                    </td>
                    <td>{item.product}</td>
                    <td className="details-cell">{item.enquiryDetails}</td>
                    <td>{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
