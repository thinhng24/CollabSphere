export default function Header() {
    return (
        <div
            style={{
                height: 64,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                borderBottom: "1px solid #e5e7eb",
            }}
        >
            <h3 style={{ margin: 0 }}>Dashboard</h3>
            <div>👤 Admin</div>
        </div>
    );
}
