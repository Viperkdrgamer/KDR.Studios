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
    console.log('🚀 Initializing dashboard...');
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
        console.error('Session error:', sessionError);
    }
    
    console.log('Session:', session);
    
    if (!session) {
        console.log('No session found, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = session.user;
    console.log('✅ Current user:', currentUser);
    console.log('📧 User email:', currentUser.email);
    console.log('🔑 Admin email:', ADMIN_EMAIL);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (profileError) {
        console.error('❌ Profile error:', profileError);
    } else {
        console.log('✅ Profile loaded:', profile);
        currentUser.profile = profile;
    }
    
    // Update UI
    document.getElementById('user-name').textContent = profile?.name || currentUser.email;
    document.getElementById('user-role').textContent = profile?.role || 'developer';
    
    const isAdmin = currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    console.log('🔐 Is admin?', isAdmin);
    console.log('👤 User role from DB:', profile?.role);
    
    // Load menu based on role
    loadMenu(profile?.role);
    
    // Load initial section
    if (profile?.role === 'admin') {
        console.log('Loading admin overview...');
        showSection('admin-overview');
    } else {
        console.log('Loading user profile...');
        showSection('profile');
    }
}

// ===== MENU =====
function loadMenu(role) {
    const menuEl = document.getElementById('sidebar-menu');
    
    if (role === 'admin') {
        console.log('📋 Loading admin menu');
        menuEl.innerHTML = `
            <li><a href="#" onclick="showSection('admin-overview')" class="active">📊 Overview</a></li>
            <li><a href="#" onclick="showSection('admin-games')">🎮 Manage Games</a></li>
            <li><a href="#" onclick="showSection('admin-team')">👥 Team Members</a></li>
            <li><a href="#" onclick="showSection('admin-commissions')">📋 Commissions</a></li>
        `;
    } else {
        console.log('📋 Loading developer menu');
        menuEl.innerHTML = `
            <li><a href="#" onclick="showSection('profile')" class="active">👤 My Profile</a></li>
            <li><a href="#" onclick="showSection('works')">💼 My Works</a></li>
        `;
    }
}

// ===== NAVIGATION =====
window.showSection = async (section) => {
    console.log(`🔄 Switching to section: ${section}`);
    currentSection = section;
    
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    
    // Update active menu item
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (event?.target) {
        event.target.classList.add('active');
    }
    
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
    console.log('📝 Loading profile...');
    
    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Profile load error:', error);
            return;
        }
        
        console.log('✅ Profile data:', profile);
        
        if (profile) {
            document.getElementById('profile-name').value = profile.name || '';
            document.getElementById('profile-role').value = profile.role || '';
            document.getElementById('profile-skills').value = profile.skills || '';
            
            if (profile.avatar) {
                const preview = document.getElementById('avatar-preview');
                preview.src = profile.avatar;
                preview.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Profile form submission
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const messageDiv = document.getElementById('profile-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';
    
    console.log('📤 Submitting profile update...');
    
    try {
        const updateData = {
            name: document.getElementById('profile-name').value,
            role: document.getElementById('profile-role').value,
            skills: document.getElementById('profile-skills').value
        };
        
        console.log('Update data:', updateData);
        
        // Upload avatar if selected
        const avatarFile = document.getElementById('avatar-upload').files[0];
        if (avatarFile) {
            console.log('📸 Uploading avatar...');
            try {
                const avatarUrl = await uploadFile(avatarFile, 'avatars', `avatar_${currentUser.id}`);
                if (avatarUrl) {
                    updateData.avatar = avatarUrl;
                    console.log('✅ Avatar uploaded:', avatarUrl);
                }
            } catch (uploadError) {
                console.error('❌ Avatar upload failed:', uploadError);
                // Continue without avatar update
            }
        }
        
        // Update profile
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', currentUser.id)
            .select();
        
        if (error) {
            console.error('❌ Update error:', error);
            throw error;
        }
        
        console.log('✅ Profile updated:', data);
        
        // Also update team table if exists
        const { error: teamError } = await supabase
            .from('team')
            .upsert({
                id: currentUser.id,
                name: updateData.name,
                role: updateData.role,
                skills: updateData.skills,
                avatar: updateData.avatar || null
            }, { onConflict: 'id' });
        
        if (teamError) {
            console.error('Team update warning:', teamError);
        } else {
            console.log('✅ Team table synced');
        }
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Profile updated successfully!';
        
        // Update current user profile
        currentUser.profile = { ...currentUser.profile, ...updateData };
        
    } catch (error) {
        console.error('❌ Error:', error);
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
    console.log('💼 Loading works...');
    
    const { data: works, error } = await supabase
        .from('works')
        .select('*')
        .eq('dev_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Works load error:', error);
    }
    
    console.log('Works loaded:', works);
    
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
    document.getElementById('work-message').textContent = '';
    document.getElementById('work-message').className = 'form-message';
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
    
    console.log('📤 Adding new work...');
    
    try {
        let videoUrl;
        const source = document.getElementById('video-source').value;
        
        if (source === 'youtube') {
            videoUrl = document.getElementById('youtube-url').value;
            console.log('Using YouTube URL:', videoUrl);
        } else {
            const videoFile = document.getElementById('video-upload').files[0];
            if (!videoFile) throw new Error('Please select a video file');
            console.log('📹 Uploading video file...');
            videoUrl = await uploadFile(videoFile, 'works-videos', `work_${Date.now()}`);
            console.log('✅ Video uploaded:', videoUrl);
        }
        
        const workData = {
            dev_id: currentUser.id,
            title: document.getElementById('work-title').value,
            description: document.getElementById('work-description').value,
            video_url: videoUrl
        };
        
        console.log('Work data:', workData);
        
        const { data, error } = await supabase
            .from('works')
            .insert([workData])
            .select();
        
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Work added:', data);
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Work added successfully!';
        
        setTimeout(() => {
            hideAddWorkForm();
            loadWorks();
        }, 1500);
    } catch (error) {
        console.error('❌ Error:', error);
        messageDiv.className = 'form-message error';
        messageDiv.textContent = `❌ ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Work';
    }
});

window.deleteWork = async (id) => {
    if (!confirm('Delete this work?')) return;
    
    console.log('🗑️ Deleting work:', id);
    
    const { error } = await supabase
        .from('works')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete work');
    } else {
        console.log('✅ Work deleted');
        loadWorks();
    }
};

// ===== ADMIN FUNCTIONS =====
async function loadAdminOverview() {
    console.log('📊 Loading admin overview...');
    
    const { data: games } = await supabase.from('games').select('*');
    const { data: team } = await supabase.from('team').select('*');
    
    console.log('Games count:', games?.length);
    console.log('Team count:', team?.length);
    
    document.getElementById('total-games').textContent = games?.length || 0;
    document.getElementById('total-team').textContent = team?.length || 0;
    document.getElementById('pending-commissions').textContent = '0';
}

async function loadAdminGames() {
    console.log('🎮 Loading admin games...');
    
    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Games load error:', error);
    }
    
    console.log('Games loaded:', games);
    
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
    console.log('👥 Loading admin team...');
    
    const { data: team, error } = await supabase
        .from('team')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Team load error:', error);
    }
    
    console.log('Team loaded:', team);
    
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
        const countEl = document.getElementById(`works-count-${member.id}`);
        if (countEl) {
            countEl.textContent = works?.length || 0;
        }
    });
}

window.showAddGameForm = () => {
    document.getElementById('add-game-form').style.display = 'block';
};

window.hideAddGameForm = () => {
    document.getElementById('add-game-form').style.display = 'none';
    document.getElementById('game-form').reset();
    document.getElementById('game-message').textContent = '';
    document.getElementById('game-message').className = 'form-message';
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
    
    console.log('📤 Adding new game...');
    
    try {
        const thumbnailFile = document.getElementById('thumbnail-upload').files[0];
        if (!thumbnailFile) throw new Error('Please select a thumbnail');
        
        console.log('🖼️ Uploading thumbnail...');
        const thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', `game_${Date.now()}`);
        console.log('✅ Thumbnail uploaded:', thumbnailUrl);
        
        const gameData = {
            name: document.getElementById('game-name').value,
            status: document.getElementById('game-status').value,
            link: document.getElementById('game-link').value || null,
            thumbnail: thumbnailUrl
        };
        
        console.log('Game data:', gameData);
        
        const { data, error } = await supabase
            .from('games')
            .insert([gameData])
            .select();
        
        if (error) {
            console.error('❌ Insert error:', error);
            throw error;
        }
        
        console.log('✅ Game added:', data);
        
        messageDiv.className = 'form-message success';
        messageDiv.textContent = '✅ Game added successfully!';
        
        setTimeout(() => {
            hideAddGameForm();
            loadAdminGames();
        }, 1500);
    } catch (error) {
        console.error('❌ Error:', error);
        messageDiv.className = 'form-message error';
        messageDiv.textContent = `❌ ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Game';
    }
});

window.deleteGame = async (id) => {
    if (!confirm('Delete this game?')) return;
    
    console.log('🗑️ Deleting game:', id);
    
    const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Delete error:', error);
        alert('Failed to delete game');
    } else {
        console.log('✅ Game deleted');
        loadAdminGames();
    }
};

// ===== FILE UPLOAD UTILITY =====
async function uploadFile(file, bucket, fileName) {
    console.log(`📤 Uploading to ${bucket}/${fileName}...`);
    
    try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${fileName}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });
        
        if (error) {
            console.error('Upload error:', error);
            throw error;
        }
        
        console.log('Upload data:', data);
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
        
        console.log('✅ Public URL:', publicUrl);
        
        return publicUrl;
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

// ===== LOGOUT =====
window.logout = async () => {
    console.log('👋 Logging out...');
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// Initialize on load
console.log('🎬 Starting dashboard initialization...');
init().catch(error => {
    console.error('❌ Initialization failed:', error);
});