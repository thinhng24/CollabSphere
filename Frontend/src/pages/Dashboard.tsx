export default function Dashboard() {
    return (
        <div style={pageStyle}>
            <h1 style={titleStyle}>Overview</h1>

            <div style={cardGridStyle}>
                <div style={cardStyle}>
                    <p style={cardLabel}>Total Subjects</p>
                    <p style={cardNumber}>12</p>
                </div>

                <div style={cardStyle}>
                    <p style={cardLabel}>Total Classes</p>
                    <p style={cardNumber}>5</p>
                </div>
            </div>
        </div>
    );
}


const pageStyle = {
    background: "#f5f6fa",
    minHeight: "100vh",
    padding: "32px",
};

const titleStyle = {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 24,
};

const cardGridStyle = {
    display: "flex",
    gap: 24,
};

const cardStyle = {
    background: "#ffffff",
    padding: "24px 28px",
    borderRadius: 16,
    width: 240,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
};

const cardLabel = {
    fontSize: 14,
    color: "#6b7280", // xám nhạt
    marginBottom: 8,
};

const cardNumber = {
    fontSize: 36,
    fontWeight: 700,
    color: "#111827",
};

