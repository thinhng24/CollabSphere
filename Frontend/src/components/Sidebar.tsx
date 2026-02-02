import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
    const { pathname } = useLocation();

    const itemStyle = (path: string) => ({
        padding: "12px 16px",
        borderRadius: 8,
        background: pathname === path ? "#334155" : "transparent",
        marginBottom: 8,
        cursor: "pointer",
    });

    return (
        <div
            style={{
                width: 240,
                background: "#0f172a",
                color: "white",
                padding: 20,
            }}
        >
            <h2 style={{ marginBottom: 30 }}>CollabSphere</h2>

            <Link to="/" style={{ textDecoration: "none", color: "white" }}>
                <div style={itemStyle("/")}>Dashboard</div>
            </Link>

            <Link to="/subjects" style={{ textDecoration: "none", color: "white" }}>
                <div style={itemStyle("/subjects")}>Subjects</div>
            </Link>

            <Link to="/import" style={{ textDecoration: "none", color: "white" }}>
                <div style={itemStyle("/import")}>Import Excel</div>
            </Link>
        </div>
    );
}
