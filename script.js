// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://vxuqaphvuyfjoufjyvxb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dXFhcGh2dXlmam91Zmp5dnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTAzODYsImV4cCI6MjA4MTQ4NjM4Nn0.OzNNnTYJPAWawuSjd4C-rpDwDZvkmcw9VgcR9MBpTTc';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1442445067855069224/PjyGQtjqPGfaCunmwGxO68ztEY1MhMHfQnmI60PvzybEeVwS0eDpjQXk0C8QOnv2HRuY';

// ===== HELPER FUNCTIONS =====
function getPlaceholderAvatar() {
  return 'https://ui-avatars.com/api/?name=User&size=150&background=4a9eff&color=fff';
}

function getPlaceholderThumbnail() {
  return 'https://ui-avatars.com/api/?name=Game&size=400&background=1a1f2e&color=4a9eff';
}

// ===== SUPABASE CLIENT =====
const supabase = {
  from: (table) => ({
    select: async (columns = '*') => {
      try {
        const url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
        
        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error(`Error fetching ${table}:`, error);
          return [];
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error fetching from ${table}:`, error);
        return [];
      }
    }
  })
};

// ===== MAIN PAGE FUNCTIONS =====

// Load published games
async function loadPublishedGames() {
  const container = document.getElementById('published-games');
  if (!container) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/games?select=*&status=eq.Published`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const games = await response.json();
    
    if (!games || games.length === 0) {
      container.innerHTML = '<p class="loading">No published games yet.</p>';
      return;
    }
    
    container.innerHTML = games.map(game => `
      <div class="game-card">
        <img src="${game.thumbnail || getPlaceholderThumbnail()}" 
             alt="${game.name}" 
             class="game-thumbnail"
             onerror="this.src='${getPlaceholderThumbnail()}'">
        <div class="game-info">
          <h3 class="game-name">${game.name}</h3>
          <span class="game-status status-published">${game.status}</span>
          ${game.link ? `<br><a href="${game.link}" target="_blank" class="btn btn-primary" style="margin-top: 1rem; display: inline-block; padding: 0.5rem 1rem; font-size: 0.9rem;">Play Game</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading published games:', error);
    container.innerHTML = '<p class="loading">Error loading games.</p>';
  }
}

// Load client work games
async function loadClientGames() {
  const container = document.getElementById('client-games');
  if (!container) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/games?select=*&status=eq.Client Work`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const games = await response.json();
    
    if (!games || games.length === 0) {
      container.innerHTML = '<p class="loading">No client work to display yet.</p>';
      return;
    }
    
    container.innerHTML = games.map(game => `
      <div class="game-card">
        <img src="${game.thumbnail || getPlaceholderThumbnail()}" 
             alt="${game.name}" 
             class="game-thumbnail"
             onerror="this.src='${getPlaceholderThumbnail()}'">
        <div class="game-info">
          <h3 class="game-name">${game.name}</h3>
          <span class="game-status status-client">${game.status}</span>
          ${game.link ? `<br><a href="${game.link}" target="_blank" class="btn btn-primary" style="margin-top: 1rem; display: inline-block; padding: 0.5rem 1rem; font-size: 0.9rem;">View Project</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading client games:', error);
    container.innerHTML = '<p class="loading">Error loading games.</p>';
  }
}

// Load projects
async function loadProjects() {
  const container = document.getElementById('projects');
  if (!container) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const projects = await response.json();
    
    if (!projects || projects.length === 0) {
      container.innerHTML = '<p class="loading">No projects to display yet.</p>';
      return;
    }
    
    container.innerHTML = projects.map(project => {
      const statusClass = project.status.toLowerCase().replace(' ', '-');
      return `
        <div class="project-card">
          <div class="project-info">
            <h3 class="project-name">${project.name}</h3>
            <span class="project-status status-${statusClass}">${project.status}</span>
            <p class="project-description">${project.description}</p>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading projects:', error);
    container.innerHTML = '<p class="loading">Error loading projects.</p>';
  }
}

// Load team (only approved developers)
async function loadTeam() {
  const container = document.getElementById('team');
  if (!container) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/team?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const team = await response.json();
    
    if (!team || team.length === 0) {
      container.innerHTML = '<p class="loading">No team members to display yet.</p>';
      return;
    }
    
    container.innerHTML = team.map(member => `
      <div class="team-card" onclick="openDeveloperProfile('${member.id}')">
        <img src="${member.avatar || getPlaceholderAvatar()}" 
             alt="${member.name}" 
             class="dev-avatar"
             onerror="this.src='${getPlaceholderAvatar()}'">
        <div class="team-info">
          <h3 class="dev-name">${member.name}</h3>
          <p class="dev-role">${member.role}</p>
          <p class="dev-skills">${member.skills || 'No skills listed'}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading team:', error);
    container.innerHTML = '<p class="loading">Error loading team.</p>';
  }
}

// Load developers with their works (for developers-works page)
async function loadDevelopersWorks() {
  const container = document.getElementById('developers-works');
  if (!container) return;
  
  try {
    const teamResponse = await fetch(`${SUPABASE_URL}/rest/v1/team?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const team = await teamResponse.json();
    
    if (!team || team.length === 0) {
      container.innerHTML = '<p class="loading">No developers to display yet.</p>';
      return;
    }
    
    // Load works for each developer
    let html = '';
    for (const dev of team) {
      const worksResponse = await fetch(`${SUPABASE_URL}/rest/v1/works?select=*&dev_id=eq.${dev.id}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      const works = await worksResponse.json();
      
      if (works && works.length > 0) {
        html += `
          <div class="developer-section">
            <div class="developer-header" onclick="openDeveloperProfile('${dev.id}')">
              <img src="${dev.avatar || getPlaceholderAvatar()}" 
                   alt="${dev.name}" 
                   class="dev-avatar-medium"
                   onerror="this.src='${getPlaceholderAvatar()}'">
              <div>
                <h3 class="dev-name-large">${dev.name}</h3>
                <p class="dev-role">${dev.role}</p>
                <p class="dev-skills">${dev.skills || ''}</p>
              </div>
            </div>
            <div class="dev-works-preview">
              ${works.slice(0, 3).map(work => {
                let videoHtml = '';
                if (work.video_url.includes('youtube.com') || work.video_url.includes('youtu.be')) {
                  let videoId = '';
                  if (work.video_url.includes('youtu.be/')) {
                    videoId = work.video_url.split('youtu.be/')[1].split('?')[0];
                  } else if (work.video_url.includes('watch?v=')) {
                    videoId = work.video_url.split('watch?v=')[1].split('&')[0];
                  }
                  videoHtml = `<iframe class="work-video-preview" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
                } else {
                  videoHtml = `<video class="work-video-preview" controls><source src="${work.video_url}" type="video/mp4"></video>`;
                }
                
                return `
                  <div class="work-preview-item">
                    <h4 class="work-title-small">${work.title}</h4>
                    ${videoHtml}
                    <p class="work-description-small">${work.description.substring(0, 100)}${work.description.length > 100 ? '...' : ''}</p>
                  </div>
                `;
              }).join('')}
            </div>
            ${works.length > 3 ? `<button class="btn btn-primary view-all-btn" onclick="openDeveloperProfile('${dev.id}')">View All ${works.length} Works</button>` : ''}
          </div>
        `;
      }
    }
    
    if (html === '') {
      container.innerHTML = '<p class="loading">No developer works to display yet.</p>';
    } else {
      container.innerHTML = html;
    }
  } catch (error) {
    console.error('Error loading developers works:', error);
    container.innerHTML = '<p class="loading">Error loading developer works.</p>';
  }
}

// Open developer profile modal
async function openDeveloperProfile(devId) {
  const modal = document.getElementById('dev-modal');
  if (!modal) return;
  
  try {
    const devResponse = await fetch(`${SUPABASE_URL}/rest/v1/team?select=*&id=eq.${devId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const devData = await devResponse.json();
    if (!devData || devData.length === 0) return;
    
    const dev = devData[0];
    
    document.getElementById('modal-avatar').src = dev.avatar || getPlaceholderAvatar();
    document.getElementById('modal-avatar').onerror = function() { this.src = getPlaceholderAvatar(); };
    document.getElementById('modal-name').textContent = dev.name;
    document.getElementById('modal-role').textContent = dev.role;
    document.getElementById('modal-skills').textContent = dev.skills || 'No skills listed';
    
    const worksContainer = document.getElementById('modal-works');
    worksContainer.innerHTML = '<div class="loading">Loading portfolio...</div>';
    
    const worksResponse = await fetch(`${SUPABASE_URL}/rest/v1/works?select=*&dev_id=eq.${devId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const works = await worksResponse.json();
    
    if (!works || works.length === 0) {
      worksContainer.innerHTML = '<p class="loading">No portfolio items yet.</p>';
    } else {
      worksContainer.innerHTML = works.map(work => {
        let videoHtml = '';
        if (work.video_url.includes('youtube.com') || work.video_url.includes('youtu.be')) {
          let videoId = '';
          if (work.video_url.includes('youtu.be/')) {
            videoId = work.video_url.split('youtu.be/')[1].split('?')[0];
          } else if (work.video_url.includes('watch?v=')) {
            videoId = work.video_url.split('watch?v=')[1].split('&')[0];
          } else if (work.video_url.includes('embed/')) {
            videoId = work.video_url.split('embed/')[1].split('?')[0];
          }
          videoHtml = `<iframe class="work-video" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
        } else {
          videoHtml = `<video class="work-video" controls><source src="${work.video_url}" type="video/mp4">Your browser does not support the video tag.</video>`;
        }
        
        return `
          <div class="work-item">
            <h4 class="work-title">${work.title}</h4>
            ${videoHtml}
            <p class="work-description">${work.description}</p>
          </div>
        `;
      }).join('');
    }
    
    modal.classList.add('active');
  } catch (error) {
    console.error('Error opening developer profile:', error);
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('dev-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ===== COMMISSION FORM HANDLER =====
async function handleCommissionSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = form.querySelector('.btn-submit');
  const messageDiv = document.getElementById('form-message');
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';



  const formData = {
    gameType: document.getElementById('game-type').value,
    gameDescription: document.getElementById('game-description').value,
    budget: document.getElementById('budget').value,
    teamType: document.getElementById('team-type').value,
    devRole: document.getElementById('dev-role').value || 'N/A',
    experience: document.getElementById('experience').value || 'N/A',
    discordUsername: document.getElementById('discord-username').value
  };
  
  const embed = {
    title: '🎮 New Commission Request',
    color: 4886847,
    fields: [
      { name: '📋 Game Type', value: formData.gameType, inline: true },
      { name: '💰 Budget', value: formData.budget, inline: true },
      { name: '👥 Team Selection', value: formData.teamType === 'full-team' ? 'Full Team' : 'Specific Developer', inline: true }
    ],
    timestamp: new Date().toISOString()
  };
  
  if (formData.teamType === 'specific-dev') {
    embed.fields.push(
      { name: '🎯 Developer Role', value: formData.devRole, inline: true },
      { name: '⭐ Min. Experience', value: `${formData.experience} years`, inline: true }
    );
  }
  
  embed.fields.push(
    { name: '📝 Game Description', value: formData.gameDescription.substring(0, 1024) },
    { name: '💬 Discord Contact', value: formData.discordUsername, inline: false }
  );
  
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    
    if (response.ok) {
      messageDiv.className = 'form-message success';
      messageDiv.textContent = '✅ Commission request sent successfully! We\'ll contact you on Discord soon.';
      form.reset();
      document.getElementById('dev-fields').style.display = 'none';
    } else {
      throw new Error('Failed to send request');
    }
  } catch (error) {
    console.error('Error sending commission request:', error);
    messageDiv.className = 'form-message error';
    messageDiv.textContent = '❌ Failed to send request. Please try again or contact us directly.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Commission Request';
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('published-games')) loadPublishedGames();
  if (document.getElementById('projects')) loadProjects();
  if (document.getElementById('team')) loadTeam();
  
  const modal = document.getElementById('dev-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }
});

window.openDeveloperProfile = openDeveloperProfile;
window.loadClientGames = loadClientGames;
window.loadDevelopersWorks = loadDevelopersWorks;
window.handleCommissionSubmit = handleCommissionSubmit;