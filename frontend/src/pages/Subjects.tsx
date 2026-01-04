import { useEffect, useState } from "react";
import { getSubjects } from "../services/api";
import type { Subject } from "../services/api";

const Subjects = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        getSubjects().then((res) => {
            setSubjects(res.data);
        });
    }, []);

    return (
        <div>
            <h2>Subjects</h2>
            <ul>
                {subjects.map((s) => (
                    <li key={s.id}>{s.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default Subjects;
