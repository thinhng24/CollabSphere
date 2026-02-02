import { useState } from "react";
import { getSubjects, createSubject } from "../services/api";
import type { Subject } from "../services/api";

const ImportExcel = () => {
    const [file, setFile] = useState<File | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const loadSubjects = async () => {
        try {
            const res = await getSubjects();
            setSubjects(res.data);
        } catch (error) {
            console.error("Load subjects failed:", error);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        try {
            // Demo giả lập dữ liệu từ Excel
            const subjectData: Omit<Subject, "id">[] = [
                {
                    name: "Introduction to Computer Science",
                    code: "CS101",
                    description: "Basic CS course"
                },
                {
                    name: "Data Structures",
                    code: "CS102",
                    description: "Learn about data structures"
                }
            ];

            for (const s of subjectData) {
                await createSubject(s);
            }

            alert("Import thành công!");
            loadSubjects();

        } catch (error) {
            console.error("Import thất bại:", error);
            alert("Import thất bại!");
        }
    };

    return (
        <div>
            <h2>Import Subjects từ Excel</h2>

            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <button onClick={handleImport} disabled={!file} style={{ marginLeft: 10 }}>
                Import
            </button>
            <button onClick={loadSubjects} style={{ marginLeft: 10 }}>
                Load Subjects
            </button>

            <table border={1} cellPadding={8} style={{ marginTop: 20 }}>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((s) => (
                        <tr key={s.id}>
                            <td>{s.code}</td>
                            <td>{s.name}</td>
                            <td>{s.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ImportExcel;
