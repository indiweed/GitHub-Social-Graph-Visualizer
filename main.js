const container = document.getElementById('graph-canvas');
const data = { nodes: [], edges: [] };
const options = {
    nodes: { 
        shape: 'dot', 
        size: 20,
        font: { size: 14, color: '#fff' }
    },
    edges: { 
        arrows: 'to',
        smooth: true
    },
    physics: { enabled: true },
    interaction: { hover: true }
};

const network = new vis.Network(container, data, options);

network.on('click', function(params) {
    if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        showNodeDetails(nodeId);
    }
});

class GitHubAPI {
    constructor(token = null) {
        this.baseURL = 'https://api.github.com';
        this.headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (token) {
            this.headers['Authorization'] = `token ${token}`;
        }
    }

    async getForks(repo) {
        const response = await fetch(`${this.baseURL}/repos/${repo}/forks`, {
            method: 'GET',
            headers: this.headers
        });
        const data = await response.json();
        return data;
    }

    async getContributors(repo) {
        const response = await fetch(`${this.baseURL}/repos/${repo}/contributors`, {
            method: 'GET',
            headers: this.headers
        });
        const data = await response.json();
        return data;
    }

    async getRepos(username) {
        const response = await fetch(`${this.baseURL}/users/${username}/repos`, {
            method: 'GET',
            headers: this.headers
        });
        const data = await response.json();
        return data;
    }
}

document.getElementById('build-graph-btn').addEventListener('click', async () => {
    try {
        const api = new GitHubAPI();

        const inputRepo = document.getElementById('repo-input');
        const inputRepoValue = inputRepo.value.trim();
        
        if (!inputRepoValue) {
            showNotification('Введите название репозитория', 'warning');
            return;
        }

        console.log('Анализируем репозиторий:', inputRepoValue);

        const showForks = document.getElementById('show-forks');
        const showContributions = document.getElementById('show-contributions');

        data.nodes = [];
        data.edges = [];
        
        const forks = showForks.checked ? await api.getForks(inputRepoValue) : [];
        const contributors = showContributions.checked ? await api.getContributors(inputRepoValue) : [];

        console.log('Получено форков:', forks?.length || 0);
        console.log('Получено контрибьюторов:', contributors?.length || 0);

        data.nodes.push({
            id: 0,
            label: inputRepoValue.split('/')[1] || inputRepoValue,
            title: inputRepoValue,
            group: 'main',
            value: 20,
            color: '#ff6b6b'
        });

        if (Array.isArray(forks) && forks.length > 0) {
            forks.forEach((fork, i) => {
                data.nodes.push({
                    id: i + 1,
                    label: fork.owner?.login || `Fork ${i+1}`,
                    title: fork.full_name,
                    group: 'fork',
                    value: 10,
                    color: '#4ecdc4'
                });

                data.edges.push({
                    from: 0,
                    to: i + 1,
                    label: 'forked',
                    color: '#6e44ff',
                    arrows: 'to',
                    width: 2
                });
            });
        }

        if (Array.isArray(contributors)) {
            contributors.forEach((contributor, i) => {
                const nodeId = forks.length + i + 1;
                data.nodes.push({
                    id: nodeId,
                    label: contributor.login,
                    title: `${contributor.contributions} contributions`,
                    group: 'contributor',
                    value: 8,
                    color: '#6e44ff'
                });

                data.edges.push({
                    from: nodeId, // контрибьютор
                    to: 0, // главный репозиторий
                    label: 'contributed',
                    color: '#ffd166',
                    arrows: 'to',
                    width: 2
                });
            });
        }

        network.setData(data);
        
        document.getElementById('node-count').textContent = data.nodes.length;
        document.getElementById('edge-count').textContent = data.edges.length;

        
        console.log('Граф построен. Узлов:', data.nodes.length, 'Связей:', data.edges.length);
        
    } catch (error) {
        console.error('Ошибка при построении графа:', error);
        showNotification(`Ошибка: ${error.message}`, 'error');
    }
});

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showNodeDetails(nodeId) {
    
    const node = data.nodes.find(n => n.id === nodeId);
    if (node) {
        console.log('Выбран узел:', node);
    }
}

document.getElementById('zoom-in').addEventListener('click', () => {
    network.moveTo({ scale: network.getScale() * 1.3 });
});

document.getElementById('zoom-out').addEventListener('click', () => {
    network.moveTo({ scale: network.getScale() * 0.7 });
});

document.getElementById('center-graph').addEventListener('click', () => {
    network.fit();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    data.nodes = [];
    data.edges = [];
    network.setData(data);
    document.getElementById('node-count').textContent = '0';
    document.getElementById('edge-count').textContent = '0';
    document.getElementById('graph-placeholder').style.display = 'flex';
});