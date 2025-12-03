const API_KEY = "AIzaSyAtORwZVVHe9JOEMTmlABiNVk4Vh8AltLk";
let typingTimer;
let currentVideoId = null;
let player;
let isPlaying = false;
let updateInterval;
let isMuted = false;
let currentVolume = 70;

// YouTube IFrame API callback
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '220',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'modestbranding': 1,
            'rel': 0,
            'showinfo': 0,
            'fs': 0,
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    console.log("YouTube Player is ready");
    player.setVolume(currentVolume);
    updateVolumeDisplay();
    startProgressUpdate();
}

function onPlayerStateChange(event) {
    const icon = document.getElementById('playPauseIcon');
    
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        icon.className = 'fas fa-pause';
        startProgressUpdate();
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        icon.className = 'fas fa-play';
        stopProgressUpdate();
    } else if (event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        icon.className = 'fas fa-play';
        stopProgressUpdate();
    }
}

function startProgressUpdate() {
    if (updateInterval) clearInterval(updateInterval);
    
    updateInterval = setInterval(() => {
        if (player && player.getCurrentTime && player.getDuration) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            
            // Update progress bar
            const progressBar = document.getElementById('progressBar');
            const progress = (currentTime / duration) * 100;
            progressBar.style.width = `${progress}%`;
            
            // Update buffered progress
            updateBufferedProgress();
            
            // Update time display
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            document.getElementById('durationTime').textContent = formatTime(duration);
        }
    }, 1000);
}

function updateBufferedProgress() {
    if (player && player.getVideoLoadedFraction) {
        const buffered = player.getVideoLoadedFraction() * 100;
        document.getElementById('bufferedBar').style.width = `${buffered}%`;
    }
}

function stopProgressUpdate() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function searchMusic() {
    const query = document.getElementById("searchInput").value;
    const results = document.getElementById("results");

    clearTimeout(typingTimer);

    typingTimer = setTimeout(() => {
        if (query.trim() === "") {
            results.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music empty-icon"></i>
                    <p class="empty-text">Search for music to get started</p>
                </div>
            `;
            return;
        }

        document.getElementById("loading").style.display = "block";

        fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=60&q=${encodeURIComponent(query)}&key=${API_KEY}`)
            .then(res => res.json())
            .then(data => {
                document.getElementById("loading").style.display = "none";

                if (!data.items || data.items.length === 0) {
                    results.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-search empty-icon"></i>
                            <p class="empty-text">No results found for "${query}"</p>
                        </div>
                    `;
                    return;
                }

                results.innerHTML = "";

                data.items.forEach(item => {
                    const videoId = item.id.videoId;
                    const title = item.snippet.title;
                    const thumbnail = item.snippet.thumbnails.medium.url;
                    const channel = item.snippet.channelTitle;
                    const duration = generateRandomDuration();

                    results.innerHTML += `
                        <div class="result-item" onclick="playVideo('${videoId}', '${escapeHtml(title)}', '${escapeHtml(channel)}')">
                            <div class="thumbnail-container">
                                <img src="${thumbnail}" alt="${escapeHtml(title)}">
                                <div class="play-overlay">
                                    <i class="fas fa-play play-icon"></i>
                                </div>
                            </div>
                            <div class="video-info">
                                <div class="video-title">${escapeHtml(title)}</div>
                                <div class="video-channel">
                                    <i class="fas fa-user-circle channel-icon"></i>
                                    ${escapeHtml(channel)}
                                </div>
                                <div class="video-duration">${duration}</div>
                            </div>
                        </div>
                    `;
                });
            })
            .catch(error => {
                document.getElementById("loading").style.display = "none";
                results.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle empty-icon"></i>
                        <p class="empty-text">Error loading results. Please try again.</p>
                    </div>
                `;
                console.error("Error fetching data:", error);
            });
    }, 500);
}

function playVideo(videoId, title, channel) {
    currentVideoId = videoId;

    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(videoId);
    } else {
        // Fallback jika player belum siap
        if (!player) {
            player = new YT.Player('player', {
                height: '220',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'fs': 0,
                    'playsinline': 1
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        } else {
            player.loadVideoById(videoId);
        }
    }

    document.querySelector(".player-title").textContent = title;
    document.querySelector(".player-channel").textContent = channel;

    document.querySelector(".player-container").style.display = "block";

    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 300);
}

function togglePlay() {
    if (player && typeof player.getPlayerState === 'function') {
        const state = player.getPlayerState();
        
        if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
}

function closePlayer() {
    if (player && typeof player.stopVideo === 'function') {
        player.stopVideo();
    }
    
    // Reset progress bar
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('bufferedBar').style.width = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    document.getElementById('durationTime').textContent = '0:00';
    
    document.querySelector(".player-container").style.display = "none";
    document.querySelector(".player-title").textContent = "No song selected";
    document.querySelector(".player-channel").textContent = "Select a song from the search results";
    currentVideoId = null;
    
    // Reset play/pause icon
    document.getElementById("playPauseIcon").className = "fas fa-pause";
    isPlaying = false;
    
    stopProgressUpdate();
}

// Progress bar click handler untuk seek
function setupProgressBar() {
    const progressBarWrapper = document.getElementById('progressBarWrapper');
    const hoverTime = document.getElementById('hoverTime');
    
    progressBarWrapper.addEventListener('click', function(e) {
        if (player && player.getDuration) {
            const rect = this.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = clickX / width;
            const duration = player.getDuration();
            const seekTo = duration * percentage;
            
            player.seekTo(seekTo, true);
            
            // Update progress bar immediately
            const progressBar = document.getElementById('progressBar');
            progressBar.style.width = `${percentage * 100}%`;
            
            // Update current time
            document.getElementById('currentTime').textContent = formatTime(seekTo);
        }
    });
    
    progressBarWrapper.addEventListener('mousemove', function(e) {
        if (player && player.getDuration) {
            const rect = this.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const width = rect.width;
            const percentage = mouseX / width;
            const duration = player.getDuration();
            const hoverSeconds = duration * percentage;
            
            // Update hover time display
            hoverTime.textContent = formatTime(hoverSeconds);
            hoverTime.style.left = `${percentage * 100}%`;
        }
    });
    
    progressBarWrapper.addEventListener('mouseenter', function() {
        hoverTime.style.opacity = '1';
    });
    
    progressBarWrapper.addEventListener('mouseleave', function() {
        hoverTime.style.opacity = '0';
    });
}

// Volume control functions
function setupVolumeControl() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeLevel = document.getElementById('volumeLevel');
    
    volumeLevel.style.width = `${currentVolume}%`;
    
    volumeSlider.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const volume = Math.min(100, Math.max(0, (clickX / width) * 100));
        
        setVolume(volume);
    });
}

function setVolume(volume) {
    currentVolume = volume;
    
    if (player && typeof player.setVolume === 'function') {
        player.setVolume(volume);
    }
    
    document.getElementById('volumeLevel').style.width = `${volume}%`;
    updateVolumeIcon();
    
    // Show volume change feedback
    const volumeIcon = document.getElementById('volumeIcon');
    volumeIcon.style.transform = 'scale(1.2)';
    setTimeout(() => {
        volumeIcon.style.transform = 'scale(1)';
    }, 200);
}

function toggleMute() {
    if (player && typeof player.isMuted === 'function') {
        if (player.isMuted()) {
            player.unMute();
            isMuted = false;
            document.getElementById('volumeLevel').style.width = `${currentVolume}%`;
        } else {
            player.mute();
            isMuted = true;
            document.getElementById('volumeLevel').style.width = '0%';
        }
        updateVolumeIcon();
    }
}

function updateVolumeIcon() {
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (isMuted || currentVolume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (currentVolume < 50) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function updateVolumeDisplay() {
    if (player && typeof player.isMuted === 'function') {
        isMuted = player.isMuted();
        if (!isMuted && typeof player.getVolume === 'function') {
            currentVolume = player.getVolume();
        }
    }
    updateVolumeIcon();
}

function generateRandomDuration() {
    const minutes = Math.floor(Math.random() * 10) + 1;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupProgressBar();
    setupVolumeControl();
    
    document.getElementById("searchInput").addEventListener('input', searchMusic);
    
    // Auto search on load
    setTimeout(() => {
        document.getElementById("searchInput").value = "pyphone";
        searchMusic();
    }, 800);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Space bar to play/pause
    if (e.code === 'Space' && document.querySelector('.player-container').style.display === 'block') {
        e.preventDefault();
        togglePlay();
    }
    
    // Left arrow to rewind 5 seconds
    if (e.code === 'ArrowLeft' && player) {
        e.preventDefault();
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime - 5, true);
    }
    
    // Right arrow to forward 5 seconds
    if (e.code === 'ArrowRight' && player) {
        e.preventDefault();
        const currentTime = player.getCurrentTime();
        player.seekTo(currentTime + 5, true);
    }
    
    // M to mute/unmute
    if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
    }
    
    // Up arrow to increase volume
    if (e.code === 'ArrowUp' && player) {
        e.preventDefault();
        const newVolume = Math.min(100, currentVolume + 10);
        setVolume(newVolume);
    }
    
    // Down arrow to decrease volume
    if (e.code === 'ArrowDown' && player) {
        e.preventDefault();
        const newVolume = Math.max(0, currentVolume - 10);
        setVolume(newVolume);
    }
});

// Fallback jika YouTube