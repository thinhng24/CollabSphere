import axios from "axios";
import type { AxiosResponse } from "axios";

const API_BASE = "http://localhost:5149/api";

/* =======================
   SUBJECT
======================= */

export interface Subject {
    id: number;
    name: string;
    code: string;
    description?: string;
}

export const getSubjects = (): Promise<AxiosResponse<Subject[]>> => {
    return axios.get(`${API_BASE}/Subject`);
};

export const createSubject = (
    data: Omit<Subject, "id">
): Promise<AxiosResponse<Subject>> => {
    return axios.post(`${API_BASE}/Subject`, data);
};

/* =======================
   CLASS
======================= */

export interface Class {
    id: number;
    classCode: string;
    className: string;
    lecturerName?: string;
    studentCount: number;
    subjectId: number;
}

export const getClasses = (): Promise<AxiosResponse<Class[]>> => {
    return axios.get(`${API_BASE}/Class`);
};

export const createClass = (
    data: Omit<Class, "id">
): Promise<AxiosResponse<Class>> => {
    return axios.post(`${API_BASE}/Class`, data);
};
