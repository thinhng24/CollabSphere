import { useState } from "react";
import { getSubjects, createSubject } from "../services/api";
import type { Subject } from "../services/api";

const ImportExcel = () => {
    const [file, setFile] = useState<File | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Xử lý khi chọn file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    // Xử lý import file
    const handleImport = async () => {
        if (!file) return;

        try {
            // Ở đây bạn có thể parse Excel, ví dụ dùng SheetJS (xlsx) để lấy dữ liệu
            // Giả sử bạn đã có mảng subjectData từ file
            const subjectData: Omit<Subject, "id">[] = [
                {
                    name: "Introduction to Computer Science",
                    code: "CS101",
                    description: "Basic CS course"
                }
            ];

            const createdSubjects: Subject[] = [];

            for (const s of subjectData) {
                const res = await createSubject(s);
                createdSubjects.push(res.data);
            }

            setSubjects(createdSubjects);
            alert("Import thành công!");
        } catch (error) {
            console.error("Import thất bại:", error);
            alert("Import thất bại!");
        }
    };

    // Load subjects từ API
    const loadSubjects = async () => {
        try {
            const res = await getSubjects();
            setSubjects(res.data);
        } catch (error) {
            console.error("Lấy danh sách thất bại:", error);
        }
    };

    return (
        <div>
            <h2>Import Subjects từ Excel</h2>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <button onClick={handleImport} disabled={!file}>
                Import
            </button>
            <button onClick={loadSubjects}>Load Subjects</button>

            <ul>
                {subjects.map((s) => (
                    <li key={s.id}>{s.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default ImportExcel;
