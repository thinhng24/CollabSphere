// src/services/teamService.js
import api from "./api";

const teamService = {
  getMyTeams: async () => {
    const { data } = await api.get("/teams");
    return data;
  },

  getTeamById: async (teamId) => {
    const { data } = await api.get(`/teams/${teamId}`);
    return data;
  },

  // ⭐ THÊM CÁI NÀY
  getTeamContribution: async (teamId) => {
    const { data } = await api.get(`/teams/${teamId}/contribution`);
    return data;
  },

  createTeam: async (teamData) => {
    const { data } = await api.post("/teams", teamData);
    return data;
  },

  updateTeam: async (teamId, teamData) => {
    const { data } = await api.put(`/teams/${teamId}`, teamData);
    return data;
  },

  deleteTeam: async (teamId) => {
    const { data } = await api.delete(`/teams/${teamId}`);
    return data;
  },

  addMember: async (teamId, userId) => {
    const { data } = await api.post(`/teams/${teamId}/members`, { userId });
    return data;
  },

  removeMember: async (teamId, memberId) => {
    const { data } = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return data;
  },

  getStudents: async () => {
    const { data } = await api.get("/teams/students");
    return data;
  },
};

export default teamService;
