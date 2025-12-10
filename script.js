// Data Energi Terbarukan
const energiData = [
    {
        judul: "Pembangkit Mikrohidro",
        deskripsi: "Memanfaatkan aliran sungai untuk listrik desa.",
        img: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi1mv-fKa_6ERzlgqRWX0115F-ljElCpKxkXV7Jn9gwsgmVINIiTiJrXfmw4QGira0mSv3rE3ndSTh5d0SkrESy5rU1uuXQmOKhwoyGyoyfBb_7Qhc3b1QIf1Vc0iLMwUsarhfkiOEc6k7hwm7x7mVx8X2Y4Lgry52E0cfN6ATxyF1I2RIhHJMNqtPwDLs/w1200-h630-p-k-no-nu/cara%20kerja%20pembangkit%20listrik%20tenaga%20mikrohidro.webp"
    },
    {
        judul: "PLTS Desa Terpencil",
        deskripsi: "Energi surya untuk daerah terpencil.",
        img: "https://images.bisnis.com/photos/2023/09/17/195198/antarafoto-plts-likupang-16092023-adw-2.jpg"
    },
    {
        judul: "Biogas Komunal",
        deskripsi: "Mengolah limbah organik menjadi bahan bakar.",
        img: "https://awsimages.detik.net.id/visual/2020/01/20/9d825e8f-4664-4ebd-9b75-ba2364086288_169.jpeg?w=800&q=90"
    }
];

// Data Kearifan Lokal
const kearifanData = [
    {
        judul: "Sasi - Maluku",
        deskripsi: "Budaya tutup-buka wilayah untuk melindungi alam.",
        img: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=800&q=80"
    },
    {
        judul: "Subak - Bali",
        deskripsi: "Sistem irigasi tradisional berbasis harmoni.",
        img: "https://img.freepik.com/premium-photo/cultural-landscape-bali-subak-irrigation-sy-unesco-natural-trust-ecological-heritage_868611-10815.jpg"
    },
    {
        judul: "Leuweung Larangan",
        deskripsi: "Hutan adat yang dijaga turun-temurun.",
        img: "https://assets-a1.kompasiana.com/items/album/2024/05/15/ilustrasi-leuweung-larangan-66446b6dde948f6e905e5ae2.jpeg?t=o&v=1200"
    }
];

// Membangun card otomatis
function loadCards(id, data) {
    const container = document.getElementById(id);

    data.forEach(item => {
        container.innerHTML += `
            <div class="card">
                <img src="${item.img}">
                <div class="card-content">
                    <h3>${item.judul}</h3>
                    <p>${item.deskripsi}</p>
                </div>
            </div>
        `;
    });
}

// Scroll
function scrollToSection(id) {
    document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// Load saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
    loadCards("energiList", energiData);
    loadCards("kearifanList", kearifanData);
});
