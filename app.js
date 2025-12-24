const apiBase = 'http://localhost:5000/api';
let currentProjectId = null;
let currentMilestoneId = null;
let currentUserRole = 'lecturer'; // 'lecturer' or 'headDept'
let aiSuggestions = [];
let selectedSuggestions = new Set();
const token = localStorage.getItem('token') || 'YOUR_JWT_TOKEN'; // Get from localStorage or use default

// Helper functions for show/hide using classes
function showElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.remove('hidden');
        if (element.classList.contains('user-profile-section') || element.classList.contains('modal')) {
            element.classList.add('flex-visible');
        } else {
            element.classList.add('visible');
        }
    }
}

function hideElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.add('hidden');
        element.classList.remove('visible', 'flex-visible');
    }
}

function showFlex(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.classList.remove('hidden');
        element.classList.add('flex-visible');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeForms();
    loadInitialPage();
    
    // Search functionality
    const searchInput = document.getElementById('projectSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Filter projects based on search
            const searchTerm = e.target.value.toLowerCase();
            // This will be handled when projects are loaded
        });
    }
});

function enableProjectEdit() {
    showElement('projectNameSection');
    showElement('objectiveSection');
    showElement('projectActions');
}

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page) {
                switchPage(page);
            } else if (item.classList.contains('logout')) {
                handleLogout();
            }
        });
    });
}

function switchPage(page) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
        hideElement(section);
    });
    
    // Update menu - remove active from all
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page and set active menu
    switch(page) {
        case 'lecturer':
            showElement('lecturerPage');
            document.getElementById('lecturerMenu').classList.add('active');
            currentUserRole = 'lecturer';
            loadLecturerProjects();
            break;
        case 'headDept':
            showElement('headDeptPage');
            document.getElementById('headDeptMenu').classList.add('active');
            currentUserRole = 'headDept';
            loadHeadDeptProjects();
            break;
        case 'dashboard':
        case 'projects':
            showElement('lecturerPage');
            document.getElementById('lecturerMenu').classList.add('active');
            loadLecturerProjects();
            break;
        case 'subjects':
        case 'classes':
        case 'teams':
        case 'reports':
            // Placeholder for other pages
            alert(`${page.charAt(0).toUpperCase() + page.slice(1)} page coming soon!`);
            break;
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

function loadInitialPage() {
    switchPage('lecturer');
}

// Loading & Error Handling
function showLoading() {
    showFlex('loading');
}

function hideLoading() {
    hideElement('loading');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    showElement(errorDiv);
    setTimeout(() => {
        hideElement(errorDiv);
    }, 5000);
}

// API Helper
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    if (options.body) {
        finalOptions.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(`${apiBase}${endpoint}`, finalOptions);
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
}

// Lecturer Page - Load Projects
async function loadLecturerProjects() {
    showLoading();
    try {
        const projects = await apiCall('/projects');
        displayLecturerProjects(projects);
    } catch (error) {
        showError('Failed to load projects: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayLecturerProjects(projects) {
    const container = document.getElementById('lecturerProjectsList');
    
    if (projects.length === 0) {
        container.innerHTML = '<p>No projects found. Create your first project!</p>';
        return;
    }
    
    const table = `
        <table class="projects-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Dereïement.</th>
                    <th>Creator</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${projects.map(project => `
                    <tr onclick="viewProjectDetail(${project.id})">
                        <td>${escapeHtml(project.name)}</td>
                        <td>${escapeHtml(project.department || 'Computer Science')}</td>
                        <td>User ${project.creatorId}</td>
                        <td>
                            ${getStatusBadge(project)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="pagination">
            <button>&lt;</button>
            <span>1</span>
            <button>&gt;</button>
        </div>
    `;
    
    container.innerHTML = table;
}

function getStatusBadge(project) {
    if (project.isApproved) {
        return '<span class="status status-approve">Approved</span>';
    } else if (project.isDenied) {
        return '<span class="status status-reject">Denied</span>';
    } else if (project.isSubmitted) {
        return '<span class="status status-pending">Pending Review</span>';
    } else {
        return '<span class="status status-pending">Draft</span>';
    }
}

// Head Dept Page - Load Projects for Review
async function loadHeadDeptProjects() {
    showLoading();
    try {
        const projects = await apiCall('/projects');
        const pendingProjects = projects.filter(p => p.isSubmitted && !p.isApproved && !p.isDenied);
        displayHeadDeptProjects(pendingProjects);
    } catch (error) {
        showError('Failed to load projects: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayHeadDeptProjects(projects) {
    const container = document.getElementById('headDeptProjectsList');
    
    if (projects.length === 0) {
        container.innerHTML = '<p>No projects pending review.</p>';
        return;
    }
    
    const table = `
        <table class="projects-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Creator</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${projects.map(project => `
                    <tr>
                        <td onclick="viewProjectDetail(${project.id})" style="cursor: pointer;">${escapeHtml(project.name)}</td>
                        <td>User ${project.creatorId}</td>
                        <td>${formatDate(project.createdDate)}</td>
                        <td onclick="event.stopPropagation()">
                            <div class="review-actions">
                                <button class="btn-primary" onclick="approveProject(${project.id})">Approve</button>
                                <button class="btn-danger" onclick="denyProject(${project.id})">Deny</button>
                                <button class="btn-secondary" onclick="viewProjectDetail(${project.id})">View Details</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Project Detail Page
async function viewProjectDetail(projectId) {
    currentProjectId = projectId;
    showLoading();
    
    try {
        const project = await apiCall(`/projects/${projectId}`);
        
        // Hide all pages
        document.querySelectorAll('.page-section').forEach(section => {
            hideElement(section);
        });
        
        // Show project detail page
        showElement('projectDetailPage');
        
        // Show user profile section for lecturer
        const userProfileSection = document.getElementById('userProfileSection');
        const userProfileActions = document.getElementById('userProfileActions');
        if (currentUserRole === 'lecturer') {
            showFlex('userProfileSection');
            if (!project.isSubmitted) {
                showFlex('userProfileActions');
            } else {
                hideElement('userProfileActions');
            }
        } else {
            hideElement('userProfileSection');
        }
        
        // Populate project data in display mode
        document.getElementById('projectNameDisplay').textContent = project.name || '';
        document.getElementById('projectObjectiveDisplay').textContent = project.description || '';
        document.getElementById('projectDepartmentDisplay').textContent = project.department || 'Computer Science';
        
        // Populate project data in edit mode
        const nameInput = document.getElementById('projectNameInput');
        const objectiveInput = document.getElementById('projectObjectiveInput');
        nameInput.value = project.name || '';
        objectiveInput.value = project.description || '';
        
        // Show/hide edit sections
        const isEditable = currentUserRole === 'lecturer' && !project.isSubmitted;
        if (isEditable) {
            showElement('projectNameSection');
            showElement('objectiveSection');
        } else {
            hideElement('projectNameSection');
            hideElement('objectiveSection');
        }
        
        // Show/hide AI suggestion button based on role
        const aiBtn = document.getElementById('aiSuggestionBtn');
        if (currentUserRole === 'lecturer' && !project.isSubmitted) {
            showElement(aiBtn);
        } else {
            hideElement(aiBtn);
        }
        
        // Show/hide milestone actions
        const milestoneActions = document.getElementById('milestoneActions');
        if (currentUserRole === 'lecturer' && !project.isSubmitted) {
            showElement(milestoneActions);
        } else {
            hideElement(milestoneActions);
        }
        
        // Show/hide project actions
        const projectActions = document.getElementById('projectActions');
        if (currentUserRole === 'lecturer' && !project.isSubmitted) {
            showElement(projectActions);
        } else {
            hideElement(projectActions);
        }
        
        // Store current project for updates
        window.currentProject = project;
        
        // Load milestones
        displayMilestones(project.milestones || []);
        
    } catch (error) {
        showError('Failed to load project: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayMilestones(milestones) {
    const tbody = document.getElementById('milestonesTableBody');
    
    if (milestones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #666;">No milestones yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = milestones.map(milestone => {
        return `
        <tr>
            <td>
                <div class="milestone-name-cell">
                    <div class="milestone-progress">
                        <div class="milestone-progress-bar" style="width: ${milestone.isCompleted ? '100' : '50'}%"></div>
                    </div>
                    <span>${escapeHtml(milestone.title)}</span>
                </div>
            </td>
            <td>
                <span class="status ${milestone.isCompleted ? 'status-completed' : 'status-active'}">
                    ${milestone.isCompleted ? 'Completed' : 'Active'}
                </span>
            </td>
        </tr>
    `;
    }).join('');
}

// Create Project
function openCreateProjectModal() {
    showFlex('createProjectModal');
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectObjective').value = '';
    document.getElementById('projectSyllabus').value = '';
}

function closeCreateProjectModal() {
    hideElement('createProjectModal');
}

function initializeForms() {
    // Create Project Form
    document.getElementById('createProjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createProject();
    });
    
    // Add Milestone Form
    document.getElementById('addMilestoneForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addMilestone();
    });
    
    // Edit Milestone Form
    document.getElementById('editMilestoneForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateMilestone();
    });
}

async function createProject() {
    const name = document.getElementById('newProjectName').value;
    const department = document.getElementById('newProjectDepartment').value;
    const objective = document.getElementById('newProjectObjective').value;
    const code = document.getElementById('newProjectCode').value;
    const syllabus = document.getElementById('projectSyllabus').value;
    
    if (!name || !objective || !department) {
        showError('Project name, department, and objective are required');
        return;
    }
    
    showLoading();
    try {
        const project = await apiCall('/projects', {
            method: 'POST',
            body: {
                name: name,
                description: objective,
                department: department,
                code: code,
                creatorId: 1 // TODO: Get from auth context
            }
        });
        
        closeCreateProjectModal();
        
        // If syllabus provided, show AI suggestions
        if (syllabus.trim()) {
            await getAISuggestions(syllabus, project.id);
        } else {
            await loadLecturerProjects();
            showError('Project created successfully!');
        }
    } catch (error) {
        showError('Failed to create project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Update Project
async function updateProject() {
    if (!currentProjectId) return;
    
    const name = document.getElementById('projectNameInput').value;
    const description = document.getElementById('projectObjectiveInput').value;
    
    if (!name || !description) {
        showError('Project name and objective are required');
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/${currentProjectId}`, {
            method: 'PUT',
            body: {
                name: name,
                description: description
            }
        });
        showError('Project updated successfully!');
        await viewProjectDetail(currentProjectId);
    } catch (error) {
        showError('Failed to update project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Submit Project for Review
async function submitProjectForReview() {
    if (!currentProjectId) return;
    
    if (!confirm('Are you sure you want to submit this project for review? You won\'t be able to edit it after submission.')) {
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/${currentProjectId}/submit`, {
            method: 'PUT'
        });
        showError('Project submitted for review!');
        await viewProjectDetail(currentProjectId);
    } catch (error) {
        showError('Failed to submit project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Approve/Deny Project (Head Dept)
async function approveProject(projectId) {
    if (!confirm('Are you sure you want to approve this project?')) {
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/${projectId}/approve`, {
            method: 'PUT'
        });
        showError('Project approved!');
        await loadHeadDeptProjects();
    } catch (error) {
        showError('Failed to approve project: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function denyProject(projectId) {
    if (!confirm('Are you sure you want to deny this project?')) {
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/${projectId}/deny`, {
            method: 'PUT'
        });
        showError('Project denied!');
        await loadHeadDeptProjects();
    } catch (error) {
        showError('Failed to deny project: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    
    showLoading();
    try {
        // Note: Backend might not have delete endpoint, adjust if needed
        showError('Delete functionality not implemented in backend');
        await loadLecturerProjects();
    } catch (error) {
        showError('Failed to delete project: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Milestones
function openAddMilestoneModal() {
    const projectName = document.getElementById('projectNameDisplay').textContent || 'Project';
    showFlex('addMilestoneModal');
    document.getElementById('milestoneName').value = '';
    document.getElementById('milestoneProject').value = projectName;
    document.getElementById('milestoneStatus').value = 'Active';
}

function closeAddMilestoneModal() {
    hideElement('addMilestoneModal');
}

async function addMilestone() {
    const title = document.getElementById('milestoneName').value;
    const status = document.getElementById('milestoneStatus').value;
    
    if (!title) {
        showError('Milestone name is required');
        return;
    }
    
    showLoading();
    try {
        // Calculate due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        
        await apiCall(`/projects/${currentProjectId}/milestones`, {
            method: 'POST',
            body: {
                title: title,
                description: '',
                dueDate: dueDate.toISOString().split('T')[0],
                isCompleted: status === 'Completed'
            }
        });
        
        closeAddMilestoneModal();
        await viewProjectDetail(currentProjectId);
        showError('Milestone added successfully!');
    } catch (error) {
        showError('Failed to add milestone: ' + error.message);
    } finally {
        hideLoading();
    }
}

function openEditMilestoneModal(id, title, description, dueDate) {
    currentMilestoneId = id;
    showFlex('editMilestoneModal');
    document.getElementById('editMilestoneName').value = title;
    document.getElementById('editMilestoneDescription').value = description || '';
    document.getElementById('editMilestoneDueDate').value = dueDate.split('T')[0]; // Format date
}

function closeEditMilestoneModal() {
    hideElement('editMilestoneModal');
    currentMilestoneId = null;
}

async function updateMilestone() {
    const title = document.getElementById('editMilestoneName').value;
    const description = document.getElementById('editMilestoneDescription').value;
    const dueDate = document.getElementById('editMilestoneDueDate').value;
    
    if (!title || !dueDate) {
        showError('Milestone name and due date are required');
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/milestones/${currentMilestoneId}`, {
            method: 'PUT',
            body: {
                title: title,
                description: description,
                dueDate: dueDate
            }
        });
        
        closeEditMilestoneModal();
        await viewProjectDetail(currentProjectId);
        showError('Milestone updated successfully!');
    } catch (error) {
        showError('Failed to update milestone: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function deleteMilestone(milestoneId) {
    if (!confirm('Are you sure you want to delete this milestone?')) {
        return;
    }
    
    showLoading();
    try {
        await apiCall(`/projects/milestones/${milestoneId}`, {
            method: 'DELETE'
        });
        
        await viewProjectDetail(currentProjectId);
        showError('Milestone deleted successfully!');
    } catch (error) {
        showError('Failed to delete milestone: ' + error.message);
    } finally {
        hideLoading();
    }
}

// AI Suggestions
async function openAISuggestionModal() {
    // Get syllabus from project or prompt user
    // In a real app, this might come from a syllabus field or file upload
    const syllabus = prompt('Please enter the syllabus content for AI milestone suggestions:');
    if (!syllabus || !syllabus.trim()) {
        return;
    }
    
    await getAISuggestions(syllabus, currentProjectId);
}

async function getAISuggestions(syllabus, projectId) {
    showLoading();
    try {
        const response = await apiCall('/projects/ai-suggest-milestones', {
            method: 'POST',
            body: {
                syllabus: syllabus
            }
        });
        
        aiSuggestions = response.milestones || [];
        selectedSuggestions.clear();
        
        displayAISuggestions();
        showFlex('aiSuggestionModal');
    } catch (error) {
        showError('Failed to get AI suggestions: ' + error.message);
    } finally {
        hideLoading();
    }
}

function displayAISuggestions() {
    const container = document.getElementById('aiSuggestionsList');
    
    if (aiSuggestions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 24px;">No suggestions available.</p>';
        return;
    }
    
    container.innerHTML = aiSuggestions.map((suggestion, index) => `
        <div class="ai-suggestion-item ${selectedSuggestions.has(index) ? 'selected' : ''}" onclick="toggleSuggestion(${index})">
            <input type="checkbox" class="ai-suggestion-checkbox" ${selectedSuggestions.has(index) ? 'checked' : ''} onclick="event.stopPropagation(); toggleSuggestion(${index})">
            <span class="ai-suggestion-text">${escapeHtml(suggestion)}</span>
        </div>
    `).join('');
}

function toggleSuggestion(index) {
    if (selectedSuggestions.has(index)) {
        selectedSuggestions.delete(index);
    } else {
        selectedSuggestions.add(index);
    }
    displayAISuggestions();
}

function closeAISuggestionModal() {
    hideElement('aiSuggestionModal');
    selectedSuggestions.clear();
    aiSuggestions = [];
}

async function importSelectedMilestones() {
    if (selectedSuggestions.size === 0) {
        showError('Please select at least one milestone to import');
        return;
    }
    
    showLoading();
    try {
        const selected = Array.from(selectedSuggestions).map(i => aiSuggestions[i]);
        
        // Calculate dates (spread milestones over 3 months)
        const today = new Date();
        const daysBetween = 30; // ~1 month between milestones
        
        for (let i = 0; i < selected.length; i++) {
            const dueDate = new Date(today);
            dueDate.setDate(today.getDate() + (i + 1) * daysBetween);
            
            await apiCall(`/projects/${currentProjectId}/milestones`, {
                method: 'POST',
                body: {
                    title: selected[i],
                    description: `AI-suggested milestone: ${selected[i]}`,
                    dueDate: dueDate.toISOString().split('T')[0]
                }
            });
        }
        
        closeAISuggestionModal();
        await viewProjectDetail(currentProjectId);
        showError(`Successfully imported ${selected.length} milestone(s)!`);
    } catch (error) {
        showError('Failed to import milestones: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Navigation
function goBackToList() {
    hideElement('projectDetailPage');
    if (currentUserRole === 'lecturer') {
        showElement('lecturerPage');
        loadLecturerProjects();
    } else if (currentUserRole === 'headDept') {
        showElement('headDeptPage');
        loadHeadDeptProjects();
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        hideElement(e.target);
    }
});
