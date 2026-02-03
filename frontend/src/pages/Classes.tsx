import { useEffect, useState } from "react";
import { getClasses, createClass } from "../services/api";
import type { Class } from "../services/api";

const Classes = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [classCode, setClassCode] = useState("");
    const [className, setClassName] = useState("");

    const loadClasses = async () => {
        try {
            const res = await getClasses();
            setClasses(res.data);
        } catch (error) {
            console.error("Load classes failed:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await loadClasses();
        };
        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!classCode || !className) {
            alert("Nhập đủ dữ liệu");
            return;
        }

        try {
            await createClass({
                classCode,
                className,
                lecturerName: "",
                studentCount: 0,
                subjectId: 1,
            });

            setClassCode("");
            setClassName("");

            loadClasses();
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    return (
        <div>
            <h2>Classes</h2>

            <input
                placeholder="Class Code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
            />
            <input
                placeholder="Class Name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
            />
            <button onClick={handleAdd}>Add</button>

            <ul>
                {classes.map((c) => (
                    <li key={c.id}>
                        {c.className} ({c.classCode})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Classes;
