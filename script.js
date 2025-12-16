// ===== CONFIGURATION =====
// IMPORTANT: Replace these with your actual values
const SUPABASE_URL = 'https://vxuqaphvuyfjoufjyvxb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4dXFhcGh2dXlmam91Zmp5dnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTAzODYsImV4cCI6MjA4MTQ4NjM4Nn0.OzNNnTYJPAWawuSjd4C-rpDwDZvkmcw9VgcR9MBpTTc';
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1442445067855069224/PjyGQtjqPGfaCunmwGxO68ztEY1MhMHfQnmI60PvzybEeVwS0eDpjQXk0C8QOnv2HRuY';

// ===== SUPABASE CLIENT =====
// Simple fetch-based Supabase client for static hosting
const supabase = {
  from: (table) => ({
    select: async (columns = '*', options = {}) => {
      try {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${columns}`;
        
        // Add filters if provided
        if (options.eq) {
          Object.entries(options.eq).forEach(([key, value]) => {
            url += `&${key}=eq.${value}`;
          });
        }
        
        const response = await fetch(url, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch data');
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
  
  const games = await supabase.from('games').select('*', { eq: { status: 'Published' } });
  
  if (games.length === 0) {
    container.innerHTML = '<p class="loading">No published games yet.</p>';
    return;
  }
  
  container.innerHTML = games.map(game => `
    <div class="game-card">
      <img src="${game.thumbnail || 'https://via.placeholder.com/400x200?text=Game+Thumbnail'}" 
           alt="${game.name}" 
           class="game-thumbnail">
      <div class="game-info">
        <h3 class="game-name">${game.name}</h3>
        <span class="game-status status-published">${game.status}</span>
        ${game.link ? `<br><a href="${game.link}" target="_blank" class="btn btn-primary" style="margin-top: 1rem; display: inline-block; padding: 0.5rem 1rem; font-size: 0.9rem;">Play Game</a>` : ''}
      </div>
    </div>
  `).join('');
}

// Load client work games
async function loadClientGames() {
  const container = document.getElementById('client-games');
  if (!container) return;
  
  const games = await supabase.from('games').select('*', { eq: { status: 'Client Work' } });
  
  if (games.length === 0) {
    container.innerHTML = '<p class="loading">No client work to display yet.</p>';
    return;
  }
  
  container.innerHTML = games.map(game => `
    <div class="game-card">
      <img src="${game.thumbnail || 'https://via.placeholder.com/400x200?text=Client+Work'}" 
           alt="${game.name}" 
           class="game-thumbnail">
      <div class="game-info">
        <h3 class="game-name">${game.name}</h3>
        <span class="game-status status-client">${game.status}</span>
        ${game.link ? `<br><a href="${game.link}" target="_blank" class="btn btn-primary" style="margin-top: 1rem; display: inline-block; padding: 0.5rem 1rem; font-size: 0.9rem;">View Project</a>` : ''}
      </div>
    </div>
  `).join('');
}

// Load projects
async function loadProjects() {
  const container = document.getElementById('projects');
  if (!container) return;
  
  const projects = await supabase.from('projects').select('*');
  
  if (projects.length === 0) {
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
}

// Load team
async function loadTeam() {
  const container = document.getElementById('team');
  if (!container) return;
  
  const team = await supabase.from('team').select('*');
  
  if (team.length === 0) {
    container.innerHTML = '<p class="loading">No team members to display yet.</p>';
    return;
  }
  
  container.innerHTML = team.map(member => `
    <div class="team-card" onclick="openDeveloperProfile(${member.id})">
      <img src="${member.avatar || 'https://via.placeholder.com/150?text=Avatar'}" 
           alt="${member.name}" 
           class="dev-avatar">
      <div class="team-info">
        <h3 class="dev-name">${member.name}</h3>
        <p class="dev-role">${member.role}</p>
        <p class="dev-skills">${member.skills}</p>
      </div>
    </div>
  `).join('');
}

// Open developer profile modal
async function openDeveloperProfile(devId) {
  const modal = document.getElementById('dev-modal');
  if (!modal) return;
  
  // Get developer info
  const devData = await supabase.from('team').select('*', { eq: { id: devId } });
  if (devData.length === 0) return;
  
  const dev = devData[0];
  
  // Populate developer info
  document.getElementById('modal-avatar').src = dev.avatar || 'https://via.placeholder.com/150?text=Avatar';
  document.getElementById('modal-name').textContent = dev.name;
  document.getElementById('modal-role').textContent = dev.role;
  document.getElementById('modal-skills').textContent = dev.skills;
  
  // Load developer works
  const worksContainer = document.getElementById('modal-works');
  worksContainer.innerHTML = '<div class="loading">Loading portfolio...</div>';
  
  const works = await supabase.from('works').select('*', { eq: { dev_id: devId } });
  
  if (works.length === 0) {
    worksContainer.innerHTML = '<p class="loading">No portfolio items yet.</p>';
  } else {
    worksContainer.innerHTML = works.map(work => {
      // Determine if video is YouTube or direct URL
      let videoHtml = '';
      if (work.video_url.includes('youtube.com') || work.video_url.includes('youtu.be')) {
        // Extract YouTube ID
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
        // Direct video URL
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
  
  // Show modal
  modal.classList.add('active');
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
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  // Get form data
  const formData = {
    gameType: document.getElementById('game-type').value,
    gameDescription: document.getElementById('game-description').value,
    budget: document.getElementById('budget').value,
    teamType: document.getElementById('team-type').value,
    devRole: document.getElementById('dev-role').value || 'N/A',
    experience: document.getElementById('experience').value || 'N/A',
    discordUsername: document.getElementById('discord-username').value
  };
  
  // Create Discord embed
  const embed = {
    title: '🎮 New Commission Request',
    color: 4886847, // Blue color
    fields: [
      {
        name: '📋 Game Type',
        value: formData.gameType,
        inline: true
      },
      {
        name: '💰 Budget',
        value: formData.budget,
        inline: true
      },
      {
        name: '👥 Team Selection',
        value: formData.teamType === 'full-team' ? 'Full Team' : 'Specific Developer',
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };
  
  // Add developer-specific fields if applicable
  if (formData.teamType === 'specific-dev') {
    embed.fields.push(
      {
        name: '🎯 Developer Role',
        value: formData.devRole,
        inline: true
      },
      {
        name: '⭐ Min. Experience',
        value: `${formData.experience} years`,
        inline: true
      }
    );
  }
  
  // Add description and contact
  embed.fields.push(
    {
      name: '📝 Game Description',
      value: formData.gameDescription.substring(0, 1024) // Discord field limit
    },
    {
      name: '💬 Discord Contact',
      value: formData.discordUsername,
      inline: false
    }
  );
  
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
    
    if (response.ok) {
      messageDiv.className = 'form-message success';
      messageDiv.textContent = '✅ Commission request sent successfully! We\'ll contact you on Discord soon.';
      form.reset();
      
      // Hide dev fields if they were shown
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
  // Load content based on current page
  if (document.getElementById('published-games')) {
    loadPublishedGames();
  }
  
  if (document.getElementById('projects')) {
    loadProjects();
  }
  
  if (document.getElementById('team')) {
    loadTeam();
  }
  
  // Modal close handlers
  const modal = document.getElementById('dev-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});

// Make functions globally available
window.openDeveloperProfile = openDeveloperProfile;
window.loadClientGames = loadClientGames;
window.handleCommissionSubmit = handleCommissionSubmit;