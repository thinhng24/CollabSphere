const apiBase = 'http://localhost:5000/api';
let currentProjectId = null;
let currentMilestoneId = null;
const token = 'YOUR_JWT_TOKEN'; // Thay bằng token thực tế từ Auth-Service

function showLoading() { document.getElementById('loading').style.display = 'block'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }
function showError(message) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').textContent = message;
    setTimeout(() => document.getElementById('error').style.display = 'none', 3000);
}

document.getElementById('loadProjects').addEventListener('click', async () => {
    showLoading();
    try {
        const response = await fetch(`${apiBase}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load projects');
        const projects = await response.json();
        const list = document.getElementById('projectsList');
        list.innerHTML = projects.map(p => `<li><a href="#" onclick="loadProject(${p.id})">${p.name}</a> - Approved: ${p.isApproved}</li>`).join('');
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

async function loadProject(id) {
    currentProjectId = id;
    showLoading();
    try {
        const response = await fetch(`${apiBase}/projects/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const project = await response.json();
        document.getElementById('editName').value = project.name;
        document.getElementById('editDesc').value = project.description;
        document.getElementById('projectApproved').textContent = project.isApproved;
        document.getElementById('projectDetails').style.display = 'block';
        loadMilestones(project.milestones);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

function loadMilestones(milestones) {
    const list = document.getElementById('milestonesList');
    list.innerHTML = milestones.map(m => `<li>${m.title} - Due: ${m.dueDate} - Completed: ${m.isCompleted} <button onclick="editMilestone(${m.id}, '${m.title}', '${m.description}', '${m.dueDate}')">Edit</button></li>`).join('');
}

function editMilestone(id, title, desc, dueDate) {
    currentMilestoneId = id;
    document.getElementById('editMilestoneTitle').value = title;
    document.getElementById('editMilestoneDesc').value = desc;
    document.getElementById('editMilestoneDueDate').value = dueDate;
    document.getElementById('editMilestone').style.display = 'block';
}

document.getElementById('editProjectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const project = {
        name: document.getElementById('editName').value,
        description: document.getElementById('editDesc').value
    };
    showLoading();
    try {
        const response = await fetch(`${apiBase}/projects/${currentProjectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(project)
        });
        if (!response.ok) throw new Error('Failed to update project');
        alert('Project updated!');
        loadProject(currentProjectId);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

document.getElementById('approveProject').addEventListener('click', async () => {
    showLoading();
    try {
        await fetch(`${apiBase}/projects/${currentProjectId}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Project approved!');
        loadProject(currentProjectId);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

document.getElementById('aiAnalyze').addEventListener('click', async () => {
    showLoading();
    try {
        const response = await fetch(`${apiBase}/projects/${currentProjectId}/ai-analyze`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        document.getElementById('aiResult').innerHTML = `<p><strong>AI Suggestion:</strong> ${result.analysis}</p>`;
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

document.getElementById('addMilestoneForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const milestone = {
        title: document.getElementById('milestoneTitle').value,
        description: document.getElementById('milestoneDesc').value,
        dueDate: document.getElementById('milestoneDueDate').value
    };
    if (!milestone.title || !milestone.dueDate) {
        showError('Title and Due Date are required');
        return;
    }
    showLoading();
    try {
        await fetch(`${apiBase}/projects/${currentProjectId}/milestones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(milestone)
        });
        alert('Milestone added!');
        loadProject(currentProjectId);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

document.getElementById('editMilestoneForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const milestone = {
        title: document.getElementById('editMilestoneTitle').value,
        description: document.getElementById('editMilestoneDesc').value,
        dueDate: document.getElementById('editMilestoneDueDate').value
    };
    showLoading();
    try {
        await fetch(`${apiBase}/projects/milestones/${currentMilestoneId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(milestone)
        });
        alert('Milestone updated!');
        document.getElementById('editMilestone').style.display = 'none';
        loadProject(currentProjectId);
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});