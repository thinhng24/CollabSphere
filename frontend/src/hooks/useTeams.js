// src/hooks/useTeams.js
import { useState, useEffect } from "react";
import teamService from "../services/teamService";

export const useTeams = () => {
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await teamService.getMyTeams();
      setTeams(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const data = await teamService.getStudents();
      setStudents(data);
    } catch (err) {
      setError(err);
    }
  };

  const createTeam = async (teamData) => {
    try {
      const team = await teamService.createTeam(teamData);
      setTeams((prev) => [...prev, team]);
      return team;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const updateTeam = async (teamId, teamData) => {
    try {
      await teamService.updateTeam(teamId, teamData);
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, ...teamData } : t))
      );
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      await teamService.deleteTeam(teamId);
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const addMember = async (teamId, userId) => {
    try {
      await teamService.addMember(teamId, userId);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const removeMember = async (teamId, memberId) => {
    try {
      await teamService.removeMember(teamId, memberId);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchStudents();
  }, []);

  return {
    teams,
    students,
    loading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
  };
};
