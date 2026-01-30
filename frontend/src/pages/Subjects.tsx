import { useEffect, useState } from "react";
import { getSubjects, createSubject } from "../services/api";
import type { Subject } from "../services/api";

const Subjects = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getSubjects();
                setSubjects(res.data);
            } catch (error) {
                console.error("Load subjects failed:", error);
            }
        };

        fetchData();
    }, []);

    const handleAdd = async () => {
        if (!name || !code) {
            alert("Nhập đủ name và code");
            return;
        }

        try {
            await createSubject({ name, code, description });

            setName("");
            setCode("");
            setDescription("");

            const res = await getSubjects();
            setSubjects(res.data);
        } catch (error) {
            console.error("Create failed:", error);
        }
    };

    return (
        <div>
            <h2>Subjects</h2>

            <div style={{ marginBottom: 20 }}>
                <input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    placeholder="Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <button onClick={handleAdd}>Add</button>
            </div>

            <ul>
                {subjects.map((s) => (
                    <li key={s.id}>
                        {s.name} ({s.code})
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Subjects;
