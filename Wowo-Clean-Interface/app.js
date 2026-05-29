const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

function checkAuthLayout() {
    const token = localStorage.getItem('token');
    const loginSection = document.getElementById('login-section');
    const mainDashboard = document.getElementById('main-dashboard');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');

    if (token) {
        mainDashboard.classList.remove('d-none');
        btnLogout.classList.remove('d-none');
        loginSection.classList.remove('justify-content-center');
        document.getElementById('login_email').disabled = true;
        document.getElementById('login_password').disabled = true;
        btnLogin.classList.add('d-none');
        fetchContainers();
    } else {
        mainDashboard.classList.add('d-none');
        btnLogout.classList.add('d-none');
        loginSection.classList.add('justify-content-center');
        document.getElementById('login_email').disabled = false;
        document.getElementById('login_password').disabled = false;
        btnLogin.classList.remove('d-none');
    }
}

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login_email').value;
    const password = document.getElementById('login_password').value;

    try {
        const response = await api.post('/login', { email, password });
        if (response.status === 200) {
            localStorage.setItem('token', response.data.token);
            alert("Login Berhasil!");
            checkAuthLayout();
        }
    } catch (error) {
        alert("Login Gagal! Periksa email dan password Anda.");
    }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
        await api.post('/logout');
    } catch (error) {
        console.error("Logout backend error, clearing local state.");
    }
    localStorage.removeItem('token');
    alert("Berhasil keluar.");
    checkAuthLayout();
});

async function fetchContainers() {
    try {
        const response = await api.get('/gateway/containers');
        const containers = response.data;
        
        const listElement = document.getElementById('container-list');
        const totalWeightElement = document.getElementById('weight-value');
        
        let totalWeight = 0;
        listElement.innerHTML = ''; 

        containers.forEach(item => {
            totalWeight += parseInt(item.weight_kg);
            const isDisabled = item.status === 'Archived' ? 'disabled' : '';

            listElement.innerHTML += `
                <div class="card p-3 mb-3 bg-white shadow-sm">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 class="mb-1 fw-bold text-primary">[${item.container_id}] ${item.waste_type}</h5>
                            <p class="mb-0 text-muted">
                                Berat: <strong>${item.weight_kg} kg</strong> | 
                                Status: <span class="badge ${item.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${item.status}</span>
                            </p>
                        </div>
                        <div class="d-flex gap-2">
                            <button onclick="archiveContainer('${item.container_id}')" 
                                    class="btn btn-warning btn-sm" 
                                    ${isDisabled}>
                                Archive
                            </button>
                            <button onclick="deleteContainer('${item.container_id}')" 
                                    class="btn btn-danger btn-sm">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        totalWeightElement.innerText = totalWeight.toLocaleString('id-ID');

    } catch (error) {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            checkAuthLayout();
        }
    }
}

document.getElementById('btn-save').addEventListener('click', async () => {
    const containerData = {
        container_id: document.getElementById('container_id').value,
        waste_type: document.getElementById('waste_type').value,
        weight_kg: document.getElementById('weight_kg').value
    };

    document.getElementById('err-container_id').innerText = '';
    document.getElementById('err-weight_kg').innerText = '';

    try {
        const response = await api.post('/gateway/containers', containerData);
        if (response.status === 201) {
            alert("Data Kontainer Berhasil Disimpan!");
            document.getElementById('container_id').value = '';
            document.getElementById('weight_kg').value = '';
            fetchContainers();
        }
    } catch (error) {
        if (error.response && error.response.status === 422) {
            const errors = error.response.data.errors;
            if (errors.container_id) document.getElementById('err-container_id').innerText = errors.container_id[0];
            if (errors.weight_kg) document.getElementById('err-weight_kg').innerText = errors.weight_kg[0];
        } else if (error.response && error.response.status === 403) {
            alert("Akses Ditolak: Hanya Admin yang boleh menambah kontainer!");
        } else {
            alert("Terjadi kesalahan pada server.");
        }
    }
});

async function archiveContainer(id) {
    try {
        await api.patch(`/gateway/containers/${id}`);
        alert(`Kontainer ${id} telah diarsipkan.`);
        fetchContainers();
    } catch (error) {
        if (error.response && error.response.status === 403) {
            alert("Akses Ditolak: Hanya Admin yang boleh mengarsipkan kontainer!");
        }
    }
}

async function deleteContainer(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus kontainer ${id}?`)) {
        try {
            await api.delete(`/gateway/containers/${id}`);
            alert("Data berhasil dihapus.");
            fetchContainers();
        } catch (error) {
            if (error.response && error.response.status === 403) {
                alert("Akses Ditolak: Hanya Admin yang boleh menghapus kontainer!");
            }
        }
    }
}

checkAuthLayout();