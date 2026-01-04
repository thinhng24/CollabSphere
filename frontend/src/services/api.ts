import axios from "axios";
import type { AxiosResponse } from "axios";

const API_BASE = "http://localhost:5149";

// 🔥 SỬA TYPE Ở ĐÂY
export interface Subject {
    id: number;
    name: string;
    code: string;          // ⬅️ BẮT BUỘC (match backend)
    description?: string;  // ⬅️ optional
}

export const getSubjects = (): Promise<AxiosResponse<Subject[]>> => {
    return axios.get(`${API_BASE}/api/subjects`);
};

export const createSubject = (
    data: Omit<Subject, "id">
): Promise<AxiosResponse<Subject>> => {
    return axios.post(`${API_BASE}/api/subjects`, data);
};
