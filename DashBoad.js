import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://vxuqaphvuyfjoufjyvxb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dXFhcGh2dXlmam91Zmp5dnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTAzODYsImV4cCI6MjA4MTQ4NjM4Nn0.OzNNnTYJPAWawuSjd4C-rpDwDZvkmcw9VgcR9MBpTTc';
const ADMIN_EMAIL = 'karimullah.achkzai@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentSection = 'profile';

// ===== INITIALIZATION =====
async function init() {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    
    // Get user profile
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (profile) {
        currentUser.profile = profile;
    }
    
    // Update UI
    document.getElementById('user-name').textContent = profile?.name || currentUser.email;
    document.getElementById('user-role').textContent = profile?.role || 'developer';
    
    // Load menu based on role
    loadMenu(profile?.role);
    
    // Load initial section
    if (profile?.role === 'admin') {
        showSection('admin-overview');
    } else {
        showSection('profile');
    }
}

// ===== MENU =====
function loadMenu(role) {
    const menuEl = document.getElementById('sidebar-menu');
    
    if (role === 'admin') {
        menuEl.innerHTML = `
            <li><a href="#" onclick="showSection('admin-overview')" class="active">📊 Overview</a></li>
            <li><a href="#" onclick="showSection('admin-games')">🎮 Manage Games</a></li>
            <li><a href="#" onclick="showSection('admin-team')">👥 Team Members</a></li>
            <li><a href="#" onclick="showSection('admin-commissions')">📋 Commissions</a></li>
        `;
    } else {
        menuEl.innerHTML = `
            <li><a href="#" onclick="showSection('profile')" class="active">👤 My Profile</a></li>
            <li><a href="#" onclick="showSection('works')">💼 My Works</a></li>
        `;
    }
}

// ===== NAVIGATION =====
window.showSection = async (section) => {
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    event?.target?.classList.add('active');
    
    // Show selected section
    const sectionMap = {
        'profile': 'profile-section',
        'works': 'works-section',
        'admin-overview': 'admin-overview-section',
        'admin-games': 'admin-games-section',
        'admin-team': 'admin-team-section',
        'admin-commissions': 'admin-commissions-section'
    };
    
    const sectionEl = document.getElementById(sectionMap[section]);
    if (sectionEl) {
        sectionEl.classList.add('active');
    }
    
    // Update header
    const titles = {
        'profile': 'My Profile',
        'works': 'My Portfolio',
        'admin-overview': 'Admin Dashboard',
        'admin-games': 'Manage Games',
        'admin-team': 'Team Members',
        'admin-commissions': 'Commission Requests'
    };
    
    document.getElementById('section-title').textContent = titles[section] || 'Dashboard';
    
    // Load section data
    if (section === 'profile') {
        loadProfile();
    } else if (section === 'works') {
        loadWorks();
    } else if (section === 'admin-overview') {
        loadAdminOverview();
    } else if (section === 'admin-games') {
        loadAdminGames();
    } else if (section === 'admin-team') {
        loadAdminTeam();
    }
};

// ===== PROFILE MANAGEMENT =====
async function loadProfile() {
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (profile) {
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-role').value = profile.role || '';
        document.getElementById('profile-skills').value = profile.skills || '';
    }
}

// Profile form submission
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const messageDiv = document.getElementById('profile-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    try {
        let avatarUrl = null;
        
        // Upload avatar if selected
        const avatarFile = document.getElementById('avatar-upload').files[0];
        if (avatarFile) {
            avatarUrl = await uploadFile(avatarFile, 'avatars', `avatar_${currentUser.id}`);
        }
        
        // Update profile
        const updateData = {
            name: document.getElementById('profile-name').value,
            role: document.getElementById('profile-role').value,
            skills: document.getElementById('profile-skills').value
        };
        
        if (avatarUrl) {
            updateData.avatar = avatarUrl;
        }
        
        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Also update team table if exists
        await supabase
            .from('team')
            .upsert({
                id: currentUser.id,
                name: updateData.name,
                role: updateData.role,
                skills: updateData.skills,
                avatar: avatarUrl || undefined
            }, { onConflict: 'id' });
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Profile updated successfully!';
    } catch (error) {
        messageDiv.className = 'form-message error';
        messageDiv.textContent = `❌ ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Profile';
    }
});

// Avatar preview
document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('avatar-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// ===== WORKS MANAGEMENT =====
async function loadWorks() {
    const { data: works } = await supabase
        .from('works')
        .select('*')
        .eq('dev_id', currentUser.id);
    
    const worksList = document.getElementById('works-list');
    
    if (!works || works.length === 0) {
        worksList.innerHTML = '<p class="loading">No portfolio works yet. Add your first one!</p>';
        return;
    }
    
    worksList.innerHTML = works.map(work => `
        <div class="work-item">
            <h4 class="work-title">${work.title}</h4>
            <p class="work-description">${work.description}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                Video: ${work.video_url.includes('youtube') ? 'YouTube' : 'Uploaded'}
            </p>
            <button class="btn action-btn btn-reject" onclick="deleteWork(${work.id})">Delete</button>
        </div>
    `).join('');
}

window.showAddWorkForm = () => {
    document.getElementById('add-work-form').style.display = 'block';
};

window.hideAddWorkForm = () => {
    document.getElementById('add-work-form').style.display = 'none';
    document.getElementById('work-form').reset();
};

window.toggleVideoInput = () => {
    const source = document.getElementById('video-source').value;
    const uploadBox = document.getElementById('video-upload-box');
    const youtubeInput = document.getElementById('youtube-input');
    
    if (source === 'youtube') {
        uploadBox.style.display = 'none';
        youtubeInput.style.display = 'block';
    } else {
        uploadBox.style.display = 'block';
        youtubeInput.style.display = 'none';
    }
};

// Work form submission
document.getElementById('work-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const messageDiv = document.getElementById('work-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    try {
        let videoUrl;
        const source = document.getElementById('video-source').value;
        
        if (source === 'youtube') {
            videoUrl = document.getElementById('youtube-url').value;
        } else {
            const videoFile = document.getElementById('video-upload').files[0];
            if (!videoFile) throw new Error('Please select a video file');
            videoUrl = await uploadFile(videoFile, 'works-videos', `work_${Date.now()}`);
        }
        
        const { error } = await supabase
            .from('works')
            .insert([{
                dev_id: currentUser.id,
                title: document.getElementById('work-title').value,
                description: document.getElementById('work-description').value,
                video_url: videoUrl
            }]);
        
        if (error) throw error;
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Work added successfully!';
        
        setTimeout(() => {
            hideAddWorkForm();
            loadWorks();
        }, 1500);
    } catch (error) {
        messageDiv.className = 'form-message error';
        messageDiv.textContent = `❌ ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Work';
    }
});

window.deleteWork = async (id) => {
    if (!confirm('Delete this work?')) return;
    
    const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', id);
    
    if (!error) {
        loadWorks();
    }
};

// ===== ADMIN FUNCTIONS =====
async function loadAdminOverview() {
    const { data: games } = await supabase.from('games').select('*');
    const { data: team } = await supabase.from('team').select('*');
    
    document.getElementById('total-games').textContent = games?.length || 0;
    document.getElementById('total-team').textContent = team?.length || 0;
    document.getElementById('pending-commissions').textContent = '0';
}

async function loadAdminGames() {
    const { data: games } = await supabase.from('games').select('*');
    const tbody = document.getElementById('games-tbody');
    
    if (!games || games.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No games yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = games.map(game => `
        <tr>
            <td>${game.name}</td>
            <td><span class="game-status status-${game.status.toLowerCase().replace(' ', '-')}">${game.status}</span></td>
            <td>${game.link ? `<a href="${game.link}" target="_blank" style="color: var(--accent);">Link</a>` : '-'}</td>
            <td>
                <button class="btn action-btn btn-reject" onclick="deleteGame(${game.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

async function loadAdminTeam() {
    const { data: team } = await supabase.from('team').select('*');
    const tbody = document.getElementById('team-tbody');
    
    if (!team || team.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No team members yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = team.map(member => `
        <tr>
            <td>${member.name}</td>
            <td>${member.role}</td>
            <td>${member.skills || '-'}</td>
            <td id="works-count-${member.id}">Loading...</td>
        </tr>
    `).join('');
    
    // Load works count for each member
    team.forEach(async (member) => {
        const { data: works } = await supabase
            .from('works')
            .select('id')
            .eq('dev_id', member.id);
        document.getElementById(`works-count-${member.id}`).textContent = works?.length || 0;
    });
}

window.showAddGameForm = () => {
    document.getElementById('add-game-form').style.display = 'block';
};

window.hideAddGameForm = () => {
    document.getElementById('add-game-form').style.display = 'none';
    document.getElementById('game-form').reset();
};

// Thumbnail preview
document.getElementById('thumbnail-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('thumbnail-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Game form submission
document.getElementById('game-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const messageDiv = document.getElementById('game-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    
    try {
        const thumbnailFile = document.getElementById('thumbnail-upload').files[0];
        if (!thumbnailFile) throw new Error('Please select a thumbnail');
        
        const thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', `game_${Date.now()}`);
        
        const { error } = await supabase
            .from('games')
            .insert([{
                name: document.getElementById('game-name').value,
                status: document.getElementById('game-status').value,
                link: document.getElementById('game-link').value || null,
                thumbnail: thumbnailUrl
            }]);
        
        if (error) throw error;
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Game added successfully!';
        
        setTimeout(() => {
            hideAddGameForm();
            loadAdminGames();
        }, 1500);
    } catch (error) {
        messageDiv.className = 'form-message error';
        messageDiv.textContent = `❌ ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Game';
    }
});

window.deleteGame = async (id) => {
    if (!confirm('Delete this game?')) return;
    
    const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);
    
    if (!error) {
        loadAdminGames();
    }
};

// ===== FILE UPLOAD UTILITY =====
async function uploadFile(file, bucket, fileName) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${fileName}.${fileExt}`;
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    
    return publicUrl;
}

// ===== LOGOUT =====
window.logout = async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// Initialize on load
init();