// Simple 3D Game with Three.js
// Enhanced with coins, enemies, particles, score and lives

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// Game state
const gameState = {
    score: 0,
    lives: 3,
    gameOver: false
};

// Player (cube)
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0, 0);
player.castShadow = true;
scene.add(player);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Camera position
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Coins array
const coins = [];
const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });

// Create coins
function createCoin() {
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    const angle = Math.random() * Math.PI * 2;
    const distance = 5 + Math.random() * 10;
    coin.position.set(
        Math.cos(angle) * distance,
        0.5,
        Math.sin(angle) * distance
    );
    coin.rotation.x = Math.PI / 2;
    scene.add(coin);
    coins.push(coin);
}

// Create initial coins
for (let i = 0; i < 10; i++) {
    createCoin();
}

// Enemies array
const enemies = [];
const enemyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const enemyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });

// Create enemy
function createEnemy() {
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * 5;
    enemy.position.set(
        Math.cos(angle) * distance,
        0,
        Math.sin(angle) * distance
    );
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
}

// Create initial enemies
for (let i = 0; i < 5; i++) {
    createEnemy();
}

// Particle system
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(position, color) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random velocity
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.3
            );
            particle.life = 60; // frames
            
            scene.add(particle);
            this.particles.push(particle);
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.position.add(particle.velocity);
            particle.velocity.y -= 0.01; // gravity
            particle.life--;
            
            if (particle.life <= 0) {
                scene.remove(particle);
                this.particles.splice(i, 1);
            }
        }
    }
}

const particleSystem = new ParticleSystem();

// UI Elements
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');

function updateUI() {
    scoreElement.textContent = 'Score: ' + gameState.score;
    livesElement.textContent = 'Lives: ' + gameState.lives;
}

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Move player
function movePlayer() {
    const speed = 0.15;
    if (keys['w'] || keys['ArrowUp']) player.position.z -= speed;
    if (keys['s'] || keys['ArrowDown']) player.position.z += speed;
    if (keys['a'] || keys['ArrowLeft']) player.position.x -= speed;
    if (keys['d'] || keys['ArrowRight']) player.position.x += speed;
    
    // Keep player in bounds
    const limit = 20;
    player.position.x = Math.max(-limit, Math.min(limit, player.position.x));
    player.position.z = Math.max(-limit, Math.min(limit, player.position.z));
}

// Check collision
function checkCollision(obj1, obj2, distance) {
    return obj1.position.distanceTo(obj2.position) < distance;
}

// Update enemies - move toward player
function updateEnemies() {
    enemies.forEach(enemy => {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position);
        direction.normalize();
        direction.multiplyScalar(0.05); // enemy speed
        enemy.position.add(direction);
    });
}

// Check coin collection
function checkCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        if (checkCollision(player, coins[i], 1)) {
            gameState.score += 10;
            particleSystem.createExplosion(coins[i].position, 0xffff00);
            scene.remove(coins[i]);
            coins.splice(i, 1);
            updateUI();
            // Spawn new coin
            createCoin();
        }
    }
}

// Check enemy collision
function checkEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (checkCollision(player, enemies[i], 1.2)) {
            gameState.lives--;
            particleSystem.createExplosion(enemies[i].position, 0xff0000);
            scene.remove(enemies[i]);
            enemies.splice(i, 1);
            updateUI();
            
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
                alert('Game Over! Final Score: ' + gameState.score);
                location.reload();
            } else {
                // Spawn new enemy after a delay
                setTimeout(createEnemy, 2000);
            }
        }
    }
}

// Animate coins (rotation)
function animateCoins() {
    coins.forEach(coin => {
        coin.rotation.z += 0.03;
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!gameState.gameOver) {
        movePlayer();
        updateEnemies();
        checkCoins();
        checkEnemies();
        animateCoins();
        particleSystem.update();
        
        // Rotate player slightly
        player.rotation.y += 0.02;
    }
    
    renderer.render(scene, camera);
}

// Initialize and start
updateUI();
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
