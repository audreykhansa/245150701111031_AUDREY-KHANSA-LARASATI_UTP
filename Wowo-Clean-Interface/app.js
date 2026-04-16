const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api', 
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

async function fetchContainers() {
    try {
        const response = await api.get('/containers/search');
        const containers = response.data;
        
        const listElement = document.getElementById('container-list');
        const totalWeightElement = document.getElementById('weight-value');
        
        let totalWeight = 0;
        listElement.innerHTML = ''; 

        containers.forEach(item => {
            totalWeight += parseInt(item.weight_kg);

            const isDisabled = item.status === 'Archived' ? 'disabled' : '';

            listElement.innerHTML += `
                <div class="card p-3 mb-3">
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
        console.error("Gagal memuat data:", error);
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
        const response = await api.post('/containers', containerData);
        
        if (response.status === 201) {
            alert("Data Kontainer Berhasil Disimpan!");
            document.getElementById('container_id').value = '';
            document.getElementById('weight_kg').value = '';
            fetchContainers();
        }
    } catch (error) {
        if (error.response && error.response.status === 422) {
            const errors = error.response.data.errors;
            
            if (errors.container_id) {
                document.getElementById('err-container_id').innerText = errors.container_id[0];
            }
            if (errors.weight_kg) {
                document.getElementById('err-weight_kg').innerText = errors.weight_kg[0];
            }
        } else {
            alert("Terjadi kesalahan pada server.");
        }
    }
});

async function archiveContainer(id) {
    try {
        await api.patch(`/containers/${id}`);
        alert(`Kontainer ${id} telah diarsipkan.`);
        fetchContainers();
    } catch (error) {
        console.error("Gagal mengarsipkan:", error);
    }
}

async function deleteContainer(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus kontainer ${id}?`)) {
        try {
            await api.delete(`/containers/${id}`);
            alert("Data berhasil dihapus.");
            fetchContainers();
        } catch (error) {
            console.error("Gagal menghapus:", error);
        }
    }
}

fetchContainers();