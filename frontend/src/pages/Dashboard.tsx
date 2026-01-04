export default function Dashboard() {
    return (
        <div>
            <h1>Overview</h1>

            <div style={{ display: "flex", gap: 20 }}>
                <div style={cardStyle}>
                    <h3>Total Subjects</h3>
                    <p style={numberStyle}>12</p>
                </div>

                <div style={cardStyle}>
                    <h3>Total Classes</h3>
                    <p style={numberStyle}>5</p>
                </div>
            </div>
        </div>
    );
}

const cardStyle = {
    background: "white",
    padding: 20,
    borderRadius: 12,
    width: 200,
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const numberStyle = {
    fontSize: 32,
    fontWeight: "bold",
};
