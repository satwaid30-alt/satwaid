export const SPECIES_DATA = [
    {
        id: "s1",
        slug: "ball-python",
        name: "Ball Python",
        scientificName: "Python regius",
        category: "Ular",
        lifespan: "20-30 Tahun",
        size: "90-150 cm",
        description:
            "Salah satu jenis ular peliharaan paling populer di dunia karena sifatnya yang tenang dan variasi warna (morf) yang luar biasa.",
        image: "/images/snakes.png",
        origin: ["Afrika Tengah", "Afrika Barat"],
        diet: ["Tikus", "Mencit"],
        habitat: "Sabana dan padang rumput",
        careTips: [
            "Kelembaban harus dijaga antara 60-80%.",
            "Sediakan tempat persembunyian yang sempit agar ular merasa aman.",
            "Suhu area hangat sekitar 31-33°C.",
        ],
    },
    {
        id: "s2",
        slug: "bearded-dragon",
        name: "Bearded Dragon",
        scientificName: "Pogona vitticeps",
        category: "Kadal",
        lifespan: "10-15 Tahun",
        size: "40-60 cm",
        description:
            "Kadal yang sangat interaktif dan ramah. Terkenal dengan 'janggut' di bawah lehernya yang bisa dikembangkan.",
        image: "/images/lizards.png",
        origin: ["Australia"],
        diet: ["Serangga (Jangkrik, Dubia)", "Sayuran Hijau", "Buah-buahan"],
        habitat: "Gurun dan daerah semak kering",
        careTips: [
            "Butuh lampu UVB berkualitas tinggi untuk penyerapan kalsium.",
            "Basking spot (titik jemur) harus mencapai 38-42°C.",
            "Berikan sayuran segar setiap hari sesuai usia mereka.",
        ],
    },
    {
        id: "s3",
        slug: "red-eared-slider",
        name: "Kura-kura Brazil",
        scientificName: "Trachemys scripta elegans",
        category: "Kura-kura",
        lifespan: "20-40 Tahun",
        size: "20-30 cm",
        description:
            "Kura-kura Brazil sama sekali tidak berasal dari Brasil. Nama 'Brazil' melekat di Indonesia mungkin karena pada awalnya, banyak dari spesies ini diekspor melalui negara tersebut atau karena kemiripannya dengan spesies asli Amerika Selatan. Nama ilmiahnya, Trachemys scripta elegans, diberikan oleh seorang naturalis Jerman, Maximilian zu Wied-Neuwied, pada tahun 1839 .",
        image: "/images/KurakuraBrazil.png",
        origin: ["Amerika Utara"],
        diet: ["Pelet Kura-kura", "Ikan Kecil / Udang", "Sayuran (Sawi, Kangkung)"],
        habitat: "Kolam, rawa, dan sungai berarus tenang",
        careTips: [
            "Butuh filtrasi air yang sangat kuat karena mereka cepat mengotori air.",
            "Sediakan area daratan (basking area) untuk berjemur di bawah lampu heat dan UVB.",
            "Kualitas air adalah kunci kesehatan tempurung mereka.",
        ],
        healthIssues: [
            "Pelunakan Tempurung: Biasanya disebabkan oleh kekurangan kalsium dan sinar UVB.",
            "Infeksi Mata: Mata bengkak atau selalu tertutup, sering kali akibat air kotor atau kekurangan vitamin A.",
            "Gangguan Pernapasan: Napas berbunyi, lemas, atau berenang miring, bisa jadi gejala pneumonia.",
            "Luka Luar: Adanya luka atau borok pada kulit atau tempurung.",
            "Parasit: Penelitian menunjukkan kura-kura ini dapat terinfeksi berbagai parasit internal seperti Haemogregarina sp., Myxidium sp., dan cacing darah Spirorchis sp., terutama jika dalam kondisi stres"
        ],
        breedingGuide: [
            "Perkawinan: Jantan akan menggunakan cakar panjangnya untuk bercumbu di depan betina. Perkawinan biasanya terjadi di dalam air.",
            "Penentuan Jenis Kelamin oleh Suhu (Temperature-Dependent Sex Determination - TSD): Kura-kura Brazil memiliki mekanisme unik di mana jenis kelamin anak tidak ditentukan oleh kromosom, melainkan oleh suhu inkubasi telur.\n• Suhu di bawah 28°C akan menghasilkan jantan semua.\n• Suhu di atas 32°C cenderung menghasilkan betina semua.\n• Suhu di antara rentang tersebut akan menghasilkan campuran jantan dan betina. Masa inkubasi berkisar antara 55-80 hari"
        ],
        references: [
            "Rhodin, A.G.J., dkk. (2017). Turtles of the World: Annotated Checklist and Atlas of Taxonomy, Synonymy, Distribution, and Conservation Status (8th Ed.). Chelonian Research Monographs. (Sumber utama untuk taksonomi dan sebaran geografis asli).",
            "Ernst, C.H., & Lovich, J.E. (2009). Turtles of the United States and Canada (2nd Ed.). Johns Hopkins University Press. (Menjelaskan secara rinci habitat alami di Sungai Mississippi dan sekitarnya)",
            "Bull, J.J., & Vogt, R.C. (1979). Temperature-dependent sex determination in turtles. Science. (Penelitian fundamental tentang penentuan jenis kelamin berdasarkan suhu/TSD)"
        ],
        morphGroups: [
            {
                category: "Normal / Wildtype",
                items: [
                    {
                        name: "Normal / Wildtype (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Berwarna hijau gelap dengan garis merah tegas di belakang mata.",
                            "Karapas (Tempurung Atas)": "Berwarna hijau zaitun/tua dengan corak garis kuning/putih pada tiap scute.",
                            "Plastron (Tempurung Bawah)": "Berwarna dasar kuning dengan corak bercak hitam bulat yang simetris.",
                            "Sekujur Tubuh": "Berwarna hijau gelap dengan garis-garis kuning/putih memanjang yang rapi.",
                        },
                        geneticInfo: "Genetik wildtype (alami) tanpa mutasi morph.",
                        image: "/images/Kurakura-Brazil/01-Normal.png"
                    }
                ]
            },
            {
                category: "Recessive",
                items: [
                    {
                        name: "Leucistic (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Putih pucat atau krem; garis kepala sangat samar atau hampir tidak terlihat, terkadang masih tampak bayangan garis merah di belakang mata.",
                            "Karapas (Tempurung Atas)": "Berwarna putih bersih atau krem pucat tanpa corak/garis sama sekali.",
                            "Plastron (Tempurung Bawah)": "Berwarna putih polos atau kuning gading sangat pucat tanpa bercak hitam.",
                            "Sekujur Tubuh": "Berwarna putih/krem solid tanpa garis atau pola warna lain.",
                        },
                        geneticInfo: "Recessive",
                        kelompok: "Leucistic  (Kura-kura akan berwarna putih mulus, namun biasanya memiliki mata berwarna biru atau hitam (bukan merah))",
                        image: "/images/Kurakura-Brazil/02-Leucistic.png"
                    },
                    {
                        name: "Albino (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Berwarna kuning cerah dengan garis merah oranye yang sangat kontras di belakang mata.",
                            "Karapas (Tempurung Atas)": "Berwarna kuning keemasan atau kuning pucat; corak garis/oseli berwarna putih susu atau kuning terang.",
                            "Plastron (Tempurung Bawah)": "Berwarna kuning polos bersih; sama sekali tidak memiliki bercak hitam (melanin).",
                            "Sekujur Tubuh": "Berwarna kuning cerah dengan garis-garis putih atau krem di sepanjang leher dan kaki.",
                        },
                        geneticInfo: "Recessive",
                        kelompok: "Amelanistic (tidak memiliki pigmen hitam atau cokelat)",
                        image: "/images/Kurakura-Brazil/03-Albino.png"
                    },
                    {
                        name: "Caramel Pink (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Berwarna pink pucat, peach, atau lavender muda; tanda “red ear” biasanya terlihat pink atau merah muda terang di belakang mata.",
                            "Karapas (Tempurung Atas)": "Berwarna putih krem atau cokelat muda karamel dengan pola garis halus berwarna merah muda.",
                            "Plastron (Tempurung Bawah)": "Berwarna putih polos atau merah muda pucat tanpa ada bercak hitam.",
                            "Sekujur Tubuh": "Berwarna putih/krem dengan garis-garis merah muda (pink) lembut di seluruh kulit.",
                        },
                        geneticInfo: "Recessive",
                        kelompok: "Amelanistic (tidak memiliki pigmen hitam atau cokelat)",
                        image: "/images/Kurakura-Brazil/03-Albino.png"
                    },

                ]
            },
            {
                category: "Ontogenetic",
                items: [
                    {
                        name: "Melanistic (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Berwarna hitam pekat; garis merah di kepala tertutup atau menjadi sangat gelap.",
                            "Karapas (Tempurung Atas)": "Berwarna hitam solid atau cokelat tua polos tanpa corak/garis.",
                            "Plastron (Tempurung Bawah)": "Berwarna hitam pekat secara keseluruhan (full hitam).",
                            "Sekujur Tubuh": "Berwarna hitam atau abu-abu gelap tanpa garis-garis kuning pada kulit.",
                        },
                        geneticInfo: "Ontogenetic",
                        kelompok: "Melanistic (Peningkatan Pigmen)",
                        image: "/images/Kurakura-Brazil/04-Melanistic.png"
                    }
                ]
            },
            {
                category: "Polygenic",
                items: [
                    {
                        name: "Pastel (Red-Eared Slider)",
                        details: {
                            "Fisik Kepala": "Hijau cerah, garis merah di telinga tampak lebih muda/terang.",
                            "Karapas (Tempurung Atas)": "Hijau pucat hingga krem, corak hitam sangat tipis atau pudar.",
                            "Plastron (Tempurung Bawah)": "Kuning bersih, bercak hitam minimal atau hilang sama sekali.",
                            "Sekujur Tubuh": "Hijau muda kekuningan, garis-garis tubuh terlihat lebih lembut.",
                        },
                        geneticInfo: "Polygenic / line-bred trait",
                        kelompok: "Hypomelanistic (Pengurangan Pigmen)",
                        image: "/images/Kurakura-Brazil/05-Pastel.png"
                    }
                ]
            },

        ],
    },
    {
        id: "s4",
        slug: "leopard-gecko",
        name: "Leopard Gecko",
        scientificName: "Eublepharis macularius",
        category: "Gecko",
        lifespan: "15-20 Tahun",
        size: "20-25 cm",
        description: `Leopard Gecko pertama kali dideskripsikan oleh seorang zoologis dan kurator asal Inggris bernama Edward Blyth pada tahun 1854.

Identitas Ilmiah: Blyth memberikan nama ilmiah Eublepharis macularius. Eublepharis berasal dari bahasa Yunani yang berarti "kelopak mata sejati" (karena kemampuan uniknya untuk berkedip). Macularius berasal dari bahasa Latin yang berarti "berbintik" atau "penuh noda," merujuk pada pola kulitnya yang seperti macan tutul.

Konteks Sejarah: Edward Blyth menemukan spesimen ini saat ia bertugas sebagai kurator museum di Asiatic Society of Bengal di India.

Bapak Leopard Gecko Modern: Jika Edward Blyth adalah orang yang menemukannya di alam liar secara ilmiah, maka Ron Tremper dianggap sebagai "Bapak Leopard Gecko" dalam dunia hobi. Pada akhir tahun 1970-an dan awal 1980-an, Ron Tremper mulai melakukan pembiakan selektif secara besar-besaran di Amerika Serikat. Dialah yang bertanggung jawab mengubah reputasi Leopard Gecko dari sekadar "kadal gurun biasa" menjadi hewan peliharaan populer dengan berbagai warna (morph) yang kita kenal sekarang.`,
        image: "/images/Leopard-Gecko/Leopardgecko-1.jpg",

        origin: ["Pakistan", "India", "Afganistan"],
        diet: [
            "Jangkrik",
            "Ulat Hongkong",
            "Kecoa Dubia",
            "Suplemen (Kalsium dan vitamin D3)",
        ],
        habitat: "Daerah berbatu dan kering",
        careTips: [
            "Butuh alas (substrate) yang aman dan tidak tertelan.",
            "Gunakan heating mat di bawah kandang untuk membantu pencernaan.",
            "Sediakan kotak lembab (moist hide) untuk membantu proses ganti kulit (shedding).",
        ],
        healthIssues: [
            "Impaction: Penyumbatan saluran pencernaan karena menelan substrat yang salah (seperti pasir atau kerikil kecil).",
            "MBD (Metabolic Bone Disease): Penyakit tulang metabolik akibat kurang kalsium dan vitamin D3, menyebabkan tulang lunak dan bengkok.",
            "Shedding Tidak Sempurna (Dysecdysis): Sisa kulit mati yang gagal mengelupas dapat mencekik aliran darah pada jari kaki dan menyebabkan putus.",
            "Cryptosporidiosis: Penyakit usus yang diakibatkan oleh parasit, sering ditandai dengan penurunan berat badan drastis (Stick Tail)."
        ],
        breedingGuide: [
            "Seleksi Indukan: \n• Usia Minimal 1 tahun (baik jantan maupun betina)",
            "Proses Perjodohan: \n• Masukkan jantan ke kandang betina. Jantan biasanya akan menggetarkan ekornya dengan cepat (terdengar seperti suara buzzing) sebagai tanda rayuan. \n• Biarkan mereka bersama selama 3–5 hari, atau sampai Anda melihat proses perkawinan terjadi. Jangan menyatukan dua jantan dalam satu kandang karena mereka akan bertarung.",
            "Inkubasi Telur: \n• 26°C - 27°C	Dominan Betina (Female)	55 - 70 hari   \n• 29°C - 30°C	Campuran (Mix)	45 - 55 hari \n• 31°C - 32°C	Dominan Jantan (Male)	35 - 45 hari",
            "Media Inkubasi: \n• Vermiculite : Memiliki daya serap air sangat tinggi. \n• Perlite : Paling bersih dan stabil menjaga kelembapan. \n• Campur dengan air dengan perbandingan 1:1 berdasarkan berat (bukan volume) untuk mencapai kelembaban yang ideal.",
            "Nutrisi Indukan: Betina yang sedang mengandung membutuhkan asupan kalsium tambahan dua kali lipat untuk memproduksi telur yang sehat tanpa mengambil kalsium dari tulangnya sendiri.",
            "Penanganan Hatchling (Bayi): Setelah menetas, bayi gecko tidak akan makan sampai mereka berganti kulit untuk pertama kalinya (biasanya 3–5 hari setelah menetas). Nutrisi mereka masih terpenuhi dari sisa kuning telur di perutnya."
        ],
        morphGroups: [
            {
                category: "Recessive",
                items: [
                    {
                        name: "Albino (Tremper)",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna kuning terang atau putih dengan bercak cokelat muda (tidak ada pigmen hitam).",
                            Mata: "Biasanya berwarna perak dengan urat merah muda/merah",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Leopard-Gecko/Tremper-Albino-01.png",
                    },
                    {
                        name: "Bell Albino",
                        details: {
                            "Tampilan Fisik":
                                "Warna tubuh cenderung lavender dengan bintik-bintik cokelat gelap yang lebih tegas dibanding Tremper.",
                            Mata: "Mata cenderung berwarna merah muda atau merah terang (paling kontras).",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Leopard-Gecko/Bell-Albino-002.png",
                    },
                    {
                        name: "Rainwater Albino",
                        details: {
                            "Tampilan Fisik":
                                "warna kuning pucat dengan pola merah muda/cokelat soft.",
                            Mata: "Mata paling gelap di antara albino lainnya (seringkali berwarna gelap/kelabu).",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Leopard-Gecko/Rainwater Albino-003.png",
                    },

                    {
                        name: "Eclipse",
                        details: {
                            "Tampilan Fisik":
                                "Mempengaruhi pigmentasi mata dan seringkali menyebabkan adanya nose white (hidung putih) atau kaki putih (high white).",
                            Mata: "Solid Black/ Snake Eyes (Sebagian).",
                        },
                        geneticInfo: "Recessive (Mutasi Pigmen)",
                        image: "/images/Leopard-Gecko/Eclipse-006.png",
                    },
                    {
                        name: "Noir Desir Black Eye (NDBE)",
                        details: {
                            "Tampilan Fisik":
                                "Warna tubuh oranye terang dari garis keturunan tangerine.",
                            Mata: "Hitam pekat dengan bentuk pupil yang unik (berbeda dari Eclipse).",
                        },
                        geneticInfo: "Recessive (Mutasi Mata Hitam)",
                        image: "/images/Leopard-Gecko/NDBE-007.png",
                    },
                    {
                        name: "Blizzard",
                        details: {
                            "Tampilan Fisik":
                                "Benar-benar polos tanpa pola. Warna bervariasi dari putih bersih, kuning pucat, hingga keunguan (Charcoal).",
                            Mata: "Solid Black (Eclipse)/ Normal",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Leopard-Gecko/Blizzard-005.png",
                    },
                    {
                        name: "Murphy Patternless",
                        details: {
                            "Tampilan Fisik":
                                "Saat menetas biasanya memiliki pola acak atau bercak cokelat/abu pada tubuh, namun saat dewasa menjadi polos tanpa corak sama sekali. Biasanya berwarna abu-abu, ungu muda, atau kuning.",
                            Mata: "Normal (mengikuti base morph).",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Leopard-Gecko/Murphy Patternless-004.png",
                    },
                ],
            },
            {
                category: "Combo Recessive",
                items: [
                    {
                        name: "Diablo Blanco",
                        details: {
                            "Tampilan Fisik":
                                "Seluruh tubuh berwarna putih solid atau putih salju tanpa pola (patternless) dan tanpa bintik sama sekali. Kulitnya sering terlihat agak merah muda (pinkish) karena sangat bersihnya pigmen tubuh.",
                            Mata: "Solid Red / Ruby Red",
                        },
                        image: "/images/Leopard-Gecko/033-DiabloBlanco.png",
                        geneticInfo: "Tremper Albino (Recessive) + Blizzard (Recessive) + Eclipse (Recessive) + [Patternless Stripe]",
                    },
                    {
                        name: "Banana Blizzard",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh benar-benar polos tanpa pola (patternless). Memiliki warna dasar kuning pucat hingga kuning cerah yang merata di seluruh tubuh, memberikan tampilan visual seperti \"pisang\" yang bersih.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/034-BananaBlizzard.png",
                        geneticInfo: "Murphy Patternless (Recessive) + Blizzard (Recessive)",
                    },
                ],
            },
            {
                category: "Combo Co-Dominant + Recessive",
                items: [
                    {
                        name: "Super Platinum",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh memiliki warna dasar putih bersih, perak, atau abu-abu metalik dengan pola bintik sangat kecil atau hampir hilang. Beberapa individu menunjukkan tampilan hampir patternless dengan efek warna platinum / silver.",
                            Mata: "Solid Black",
                        },
                        image: "/images/Leopard-Gecko/035-SuperPlatinum.png",
                        geneticInfo: "Super Mack Snow (Co-dominant) + Murphy Patternless (Recessive)",
                    },
                ],
            },

            {
                category: "Co-Dominant",
                items: [
                    {
                        name: "Mack Snow",
                        details: {
                            "Tampilan Fisik":
                                "Warna kuning berkurang, didominasi putih atau abu-abu dengan pola bercak atau garis hitam yang kontras. Saat menetas, biasanya berwarna putih dan hitam.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Co-Dominan",
                        image: "/images/Leopard-Gecko/008-MackSnow.1.png",
                    },
                    {
                        name: "Super Snow (Super Mack Snow)",
                        details: {
                            "Tampilan Fisik":
                                "Bentuk homozigot dari Mack Snow. Tubuh putih bersih dengan bintik-bintik hitam simetris di seluruh tubuh.",
                            Mata: "Solid hitam (Eclipse)",
                        },
                        image: "/images/Leopard-Gecko/009-SuperSnow.1.png",
                        geneticInfo: "Co-Dominan (bentuk homozigot dari Mack Snow)",
                    },
                ],
            },
            {
                category: "Dominant",
                items: [

                    {
                        name: "Enigma",
                        details: {
                            "Tampilan Fisik":
                                "Pola yang khas dengan bercak-bercak besar yang menyambung dan warna kepala yang cerah (biasanya oranye). Penting: Gen ini terkait dengan sindrom neurologis (Enigma Syndrome).",
                            Mata: "Kadang memiliki rona kemerahan atau orange.",
                        },
                        image: "/images/Leopard-Gecko/010-Enigma.2.png",
                        geneticInfo: "Dominan",

                    },
                    {
                        name: "White & Yellow (W&Y)",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna putih yang sangat bersih di sisi samping tubuh (High White sides). Garis punggung biasanya lebih terang dan warna oranye/kuning terlihat lebih (neon).",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/011-WhiteYellow.png",
                        geneticInfo: "Dominan",

                    },
                    {
                        name: "Tug Snow",
                        details: {
                            "Tampilan Fisik":
                                "Warna tubuh didominasi oleh nuansa putih, abu-abu lembut, krem pastel, dan pengurangan warna kuning yang signifikan. Mempertahankan tone warna yang lebih dingin dibanding Mack Snow.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/012-TugSnow.png",
                        geneticInfo: "Dominan",

                    },
                ],
            },
            {
                category: "Dominant / Co-Dominant",
                items: [
                    {
                        name: "Gem Snow",
                        details: {
                            "Tampilan Fisik":
                                "Menghasilkan warna putih yang kontras. Uniknya, GEM Snow sering menunjukkan warna lavender atau kuning pucat saat dewasa, dengan pola bintik yang cenderung lebih pecah.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/013-GemSnow.png",
                        geneticInfo: "Dominan / Co-Dominan",

                    },
                ],
            },
            {
                category: "Polygenic",
                items: [
                    {
                        name: "Tangerine",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki nuansa warna oranye pada tubuh, mulai dari semburat hingga dominan oranye. Sering menjadi dasar untuk morph kombinasi seperti Super Hypo Tangerine.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/014-Tangerine.png",
                        geneticInfo: "Polygenic",

                    },
                    {
                        name: "Baldy",
                        details: {
                            "Tampilan Fisik":
                                "Tidak memiliki bintik atau pola sama sekali di area kepala. Paling sering terlihat pada morph Super Hypo.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/016-Baldy.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Bold Stripe",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki garis hitam tebal di sepanjang sisi tubuh (punggung bagian tengah biasanya bersih/putih).",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/015-BoldStripe.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Black Night",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna hitam pekat hingga charcoal dengan tingkat melanin sangat tinggi. Pola tubuh sangat minim atau hampir tidak ada.",
                            Mata: "Hitam solid",
                        },
                        image: "/images/Leopard-Gecko/017-BlackNight.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Carrot Tail",
                        details: {
                            "Tampilan Fisik":
                                "Ciri utama adalah adanya warna oranye terang pada ekor, dimulai dari pangkalnya. Untuk bisa disebut carrot tail, setidaknya 15% hingga 30% dari pangkal ekor harus tertutupi warna oranye solid.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/018-CarrotTail.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Carrot Head",
                        details: {
                            "Tampilan Fisik":
                                "Seekor gecko baru bisa disebut Carrot Head jika ia menetas dengan warna oranye di kepalanya dan mempertahankan warna tersebut hingga dewasa.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/019-CarrotHead.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Emerine",
                        details: {
                            "Tampilan Fisik":
                                "Ciri utama adalah adanya warna hijau pada tubuh, yang dapat muncul dalam berbagai corak, mulai dari hijau kekuningan pucat, hijau zaitun, hingga hijau lumut.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/020-Emerine.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Lavender",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar atau corak berupa nuansa ungu atau lavender pada tubuh. Warna ini bisa muncul dalam berbagai intensitas, mulai dari pastel pucat hingga violet yang lebih mencolok.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/021-Lavender.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Red Stripe",
                        details: {
                            "Tampilan Fisik":
                                "Ciri khas morph ini adalah adanya dua garis berwarna merah atau oranye tua yang membentang di sepanjang sisi tubuh, mengapit garis punggung (dorsal stripe).",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/022-RedStripe.1.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Reverse Stripe",
                        details: {
                            "Tampilan Fisik":
                                "Nama Reverse Stripe secara harfiah berarti (garis terbalik). Ini adalah kebalikan dari pola Stripe pada umumnya. Jika pada Stripe biasa terdapat garis berwarna terang di punggung yang diapit oleh dua garis gelap di sisinya, maka pada Reverse Stripe justru sebaliknya: terdapat garis gelap di sepanjang punggung yang diapit oleh dua garis terang di sisi tubuhnya.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/023-ReverseStripe.png",
                        geneticInfo: "Polygenic",
                    },
                    {
                        name: "Inferno",
                        details: {
                            "Tampilan Fisik":
                                "Warna tubuh didominasi oleh nuansa merah menyala, oranye tua, dan kuning yang intens.",
                            Mata: "Normal",
                        },
                        image: "/images/Leopard-Gecko/024-Inferno.1.png",
                        geneticInfo: "Polygenic",
                    },
                ],
            },
            {
                category: "Combo Polygenic",
                items: [
                    {
                        name: "Super Hypo Tangerine Carrot Tail (SHTCT)",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna oranye/kuning tanpa bintik hitam sama sekali di punggung (Super Hypo). Bagian ekor memiliki minimal 15% warna oranye padat (Carrot Tail).",
                            Mata: "Normal (coklat / abu-abu)",
                        },
                        image: "/images/Leopard-Gecko/026-SHTCT.png",
                        geneticInfo: "Super Hypo (Polygenic) + Tangerine (Polygenic) + Carrot Tail (Polygenic)",

                    },
                ],
            },
            {
                category: "Combo Morph Polygenic + Recessive ",
                items: [
                    {
                        name: "Sunglow",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna oranye cerah atau kuning pekat tanpa bintik hitam (clean body), seringkali memiliki ekor wortel (carrot tail).",
                            Mata: "Mata albino dengan warna merah muda, merah, atau perak kemerahan tergantung strain albino (Tremper, Bell, Rainwater)",
                        },
                        image: "/images/Leopard-Gecko/025-Sunglow.png",
                        geneticInfo: "Kombinasi SHTCT (Polygenic) + Albino (Recessive)",

                    },
                    {
                        name: "Sunrise",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki tampilan tubuh yang benar-benar bersih tanpa pola (patternless). Warnanya merupakan gradasi oranye cerah hingga kuning keemasan yang merata di seluruh tubuh, hasil dari pengaruh pigmen Tangerine pada dasar tubuh Blazing Blizzard.",
                            Mata: "Mata Albino (khas Tremper Albino)",
                        },
                        image: "/images/Leopard-Gecko/027-Sunrise.png",
                        geneticInfo: "Tangerine (Polygenic) + Albino (Recessive) + Blizzard (Recessive)",

                    },
                    {
                        name: "RAPTOR",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna oranye atau kuning cerah tanpa bintik hitam (patternless). Biasanya memiliki warna oranye pekat pada bagian ekor (Carrot Tail) dan terkadang di bagian kepala (Carrot Head).",
                            Mata: "Solid Red / Ruby Eyes",
                        },
                        image: "/images/Leopard-Gecko/028-RAPTOR.png",
                        geneticInfo: "Tremper Albino (Recessive) + Eclipse (Recessive) + Patternless Stripe (Polygenic) + Tangerine (Polygenic)",

                    },
                    {
                        name: "Rainwater Tangerine Hypo",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar oranye atau kuning cerah yang lembut. Tubuh bersih dari bintik hitam (Hypo), dengan pola garis atau bercak berwarna cokelat sangat muda atau merah muda pucat.",
                            Mata: "Merah muda, ruby, atau pinkish-silver khas albino Rainwater",
                        },
                        image: "/images/Leopard-Gecko/37-RainwaterTangerineHypo.png",
                        geneticInfo: "Rainwater Albino (Recessive) + Tangerine & Hypo (Polygenic)",

                    },
                    {
                        name: "Bold Stripe Tremper",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh memiliki warna dasar kuning hingga oranye pucat dengan dua garis memanjang di sepanjang punggung khas Bold Stripe. Karena albino, garis tersebut berwarna coklat muda atau lavender, bukan hitam. Tampilan keseluruhan bersih dengan pola stripe yang jelas.",
                            Mata: "Merah muda, ruby, atau pink-silver khas Tremper Albino",
                        },
                        image: "/images/Leopard-Gecko/38-BoldStripeTremper.png",
                        geneticInfo: "Tremper Albino (Recessive) + Bold Stripe (Polygenic/Line-bred)",

                    },
                ],
            },
            {
                category: "Combo Morph Dominant + Recessive",
                items: [
                    {
                        name: "BEE (Black Eyed Enigma)",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki pola bintik hitam yang acak, kecil, dan tersebar tidak beraturan (Enigma spots). Warna dasar tubuh biasanya putih atau kuning cerah. Memiliki ciri khas (High White) seperti hidung putih (white nose), kaki putih, dan ekor yang cenderung putih bersih.",
                            Mata: "Solid Black/ Snake Eyes",
                        },
                        image: "/images/Leopard-Gecko/029-BEE.jpg",
                        geneticInfo: "Enigma (Dominant) + Eclipse (Recessive)",

                    },
                ],
            },
            {
                category: "Combo Morph Dominant + Co-Dominant + Recessive",
                items: [
                    {
                        name: "Black Hole",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar tubuh putih atau perak (efek Mack Snow) dengan bintik hitam acak khas Enigma. Menampilkan ciri Eclipse seperti hidung putih (white nose), kaki putih, dan ekor yang dominan putih bersih.",
                            Mata: "Solid Black/ Snake Eyes",
                        },
                        image: "/images/Leopard-Gecko/030-BlackHole.png",
                        geneticInfo: "Mack Snow (Co-dominant) + Enigma (Dominant) + Eclipse (Recessive)",

                    },
                    {
                        name: "Dreamsicle",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar putih salju (efek Mack Snow) yang dihiasi dengan bercak atau gradasi warna oranye cerah hingga kuning pastel. Polanya sangat acak (Enigma) dan memiliki ciri khas Eclipse seperti hidung putih, kaki putih, dan ekor yang dominan putih bersih.",
                            Mata: "Solid Red / Ruby Red",
                        },
                        image: "/images/Leopard-Gecko/036-Dreamsicle.png",
                        geneticInfo: "Mack Snow (Co-dominant) + Enigma (Dominant) + RAPTOR (Tremper Albino + Eclipse + Patternless Stripe + Tangerine)",

                    },
                ],
            },
            {
                category: "Combo Morph Dominant + Polygenic + Recessive",
                items: [
                    {
                        name: "White & Yellow Bell Stripe",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki garis (stripe) berwarna cokelat kemerahan di sepanjang sisi punggung. Ciri khas W&Y terlihat pada sisi tubuh yang sangat putih (high white), garis putih di pangkal ekor, dan warna tubuh yang sangat bersih/cerah.",
                            Mata: "Bell Albino Eyes",
                        },
                        image: "/images/Leopard-Gecko/39-WhiteYellowBellStripe.png",
                        geneticInfo: "White & Yellow (Dominant) + Bell Albino (Recessive) + Stripe (Polygenic)",

                    },
                ],
            },
            {
                category: "Combo Morph Co-Dominant + Recessive",
                items: [
                    {
                        name: "Super Snow Eclipse (Total Eclipse)",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh berwarna putih bersih dengan pola bintik-bintik hitam kecil yang merata. Memiliki ciri khas (High White) yang sangat menonjol: hidung putih bersih (white nose), kaki putih, dan ujung ekor putih.",
                            Mata: "Solid Black",
                        },
                        image: "/images/Leopard-Gecko/031-SuperSnowEclipse.png",
                        geneticInfo: "Super Mack Snow (Co-dominant) + Eclipse (Recessive)",

                    },
                    {
                        name: "Super Snow Tremper",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh memiliki warna dasar putih bersih hingga krem pucat. Karena pengaruh Albino, bintik-bintik kecil yang merata di tubuhnya tidak berwarna hitam, melainkan berwarna cokelat muda, merah bata, atau krem gelap (beige).",
                            Mata: "Mata biasanya merah muda, merah terang, atau silver kemerahan khas strain albino Tremper",
                        },
                        image: "/images/Leopard-Gecko/032-SuperSnowTremper.png",
                        geneticInfo: "Super Mack Snow (Co-dominant) + Tremper Albino (Recessive)",

                    },
                ],
            },
            {
                category: "Combo Co-Dominant + Polygenic",
                items: [
                    {
                        name: "Super Snow Black Night",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh didominasi warna abu-abu arang (charcoal), slate, hingga mendekati hitam pekat. Tampilannya sering terlihat 'berasap' (smoky). Meskipun Black Night bertujuan untuk hitam solid, kehadiran gen Super Snow terkadang menyisakan pola bintik yang sangat samar atau area putih tipis di bagian perut dan moncong.",
                            Mata: "Solid Black",
                        },
                        image: "/images/Leopard-Gecko/037-SuperSnowBN.png",
                        geneticInfo: "Super Mack Snow (Co-dominant) + Black Night (Line-bred Polygenic)",
                    },
                ],
            },
        ],
        references: [
            'Blyth, E. (1854): "Proceedings of the Society. Report of the Curator, Zoological Department". Jurnal ini adalah catatan asli di mana nama Eublepharis macularius pertama kali dipublikasikan.',
        ],
    },
    {
        id: "s5",
        slug: "crested-gecko",
        name: "Crested Gecko",
        scientificName: "Correlophus ciliatus",
        category: "Gecko",
        lifespan: "15-20 Tahun",
        size: "20-25 cm",
        description: `Crested Gecko (Correlophus ciliatus) dalam dunia herpetologi memiliki catatan sejarah yang sangat unik. Spesies ini pertama kali diidentifikasi secara ilmiah pada tahun 1866 oleh seorang ahli zoologi berkebangsaan Prancis, Alphonse Guichenot. Beliau menyematkan nama "ciliatus" yang berasal dari bahasa Latin dengan arti "bulu mata halus", merujuk pada fitur fisik paling menonjol berupa barisan sisik di atas mata mereka yang menyerupai bulu mata.

Namun, setelah penemuan awal di abad ke- 19 tersebut, keberadaan tokek ini di habitat aslinya di New Caledonia seolah menghilang tanpa jejak.Selama lebih dari 128 tahun, tidak ada laporan resmi mengenai perjumpaan spesimen hidup di alam liar.Kondisi hutan yang mulai rusak serta ancaman dari spesies invasif membuat komunitas ilmiah internasional secara resmi menyatakan bahwa Crested Gecko telah punah dari ekosistem bumi.

Keajaiban dalam dunia zoologi kemudian terjadi pada tahun 1994. Sebuah tim ekspedisi yang dipimpin oleh Robert Seipp dan Philippe de Vosjoli berhasil menemukan kembali populasi Crested Gecko yang masih bertahan hidup di wilayah Isle of Pines, New Caledonia, pasca terjadinya badai tropis besar.Penemuan ini mengejutkan para peneliti dan memberikan spesies ini julukan "The Lazarus Species"—sebuah istilah untuk spesies yang ditemukan kembali setelah lama dianggap punah.

Pasca penemuan kembali tersebut, beberapa spesimen dibawa ke luar negeri untuk tujuan penelitian dan upaya penangkaran.Para ahli segera menyadari bahwa Crested Gecko merupakan reptil yang sangat adaptif dan memiliki tingkat produktivitas yang tinggi dalam proses pengembangbiakan.Meskipun saat ini status mereka di alam liar masih dikategorikan sebagai Vulnerable(Rentan) oleh IUCN, keberhasilan program breeding di seluruh dunia telah memastikan kelestarian spesies ini, sekaligus menempatkannya sebagai salah satu reptil peliharaan paling populer di kancah internasional hingga saat ini.`,
        image: "/images/Crested Gecko (2).png",
        origin: ["New Caledonia (Pulau Grand Terre dan Pulau Pines)"],
        diet: [
            "Complete Crested Gecko Diet (CGD) adalah fondasi diet untuk Crested Gecko peliharaan. CGD adalah pakan bubuk khusus yang diformulasikan untuk menjadi makanan lengkap dan seimbang, meniru keragaman makanan mereka di alam liar yang terdiri dari buah, nektar, serbuk sari, dan serangga",
            "Serangga (Jangkrik, Dubia)",
            "Buah Aman (Sedikit): Pepaya, Mangga, Pir, Melon, Persik",
            "Pisang (Jarang, hanya sebagai camilan)",
            "Hindari: Jeruk (Asam) & Biji Beracun",
        ],
        habitat: "Hutan hujan tropis",
        careTips: [
            "Membutuhkan kandang vertikal tinggi (arboreal) dengan banyak tempat memanjat dan bersembunyi.",
            "Suhu ideal adalah 22-26°C (suhu ruangan), jangan biarkan terlalu panas melebihi 28°C.",
            "Kelembaban harus dijaga antara 60-80% dengan menyemprotkan (misting) air 1-2 kali setiap hari.",
            "UVB (Opsional tapi Direkomendasikan): Lampu UVB 5-7% selama 10-12 jam sehari sangat dianjurkan. UVB membantu sintesis Vitamin D3 yang penting untuk penyerapan kalsium dan mencegah penyakit tulang metabolik (MBD).",
        ],
        healthIssues: [
            "MBD (Metabolic Bone Disease): Penyakit tulang metabolik akibat kurang kalsium dan vitamin D3, menyebabkan tulang lunak dan bengkok.",
            "Shedding Tidak Sempurna (Dysecdysis): Sisa kulit mati yang gagal mengelupas dapat mencekik aliran darah pada jari kaki dan menyebabkan putus.",
            "Floppy Tail Syndrome (FTS): Ekor yang terkulai ke arah kepala saat gecko menempel terbalik di kaca. Biasanya karena desain kandang yang kurang tempat bertengger horizontal.",
            "Dehidrasi: Gejala berupa mata cekung dan kulit yang tampak keriput/tidak elastis."
        ],
        breedingGuide: [
            "Seleksi Indukan: \n\n• Betina Minimal berusia 1,5 tahun dan memiliki berat badan 38-48 gram. \n• Jantan Minimal berusia 1,5-2 tahun dengan berat sekitar 35 gram.",
            "Siklus Bertelur: Betina akan bertelur sepasang (2 butir) setiap 30–45 hari selama musim kawin (Musim Semi hingga Musim Gugur).",
            "Media Inkubasi: \n• Gunakan perlite, vermiculite, atau Pangea Hatch yang lembap (rasio air dan media biasanya 1:1 berdasarkan berat) \n• Jangan membalik posisi telur setelah diletakkan di media inkubasi. Tandai bagian atas telur dengan spidol agar posisi embrio tidak terganggu",
            "Inkubasi Telur: Suhu inkubasi menentukan jenis kelamin anakan (Temperature-Dependent Sex Determination),\n• 24-26°C (72-79°F), Cenderung menghasilkan betina.\n• 27-29°C (80-84°F), Cenderung menghasilkan jantan.\n• Suhu Ruangan (22-27°C), Akan menghasilkan campuran jantan dan betina (durasi 60-120 hari). Semakin hangat suhu, semakin cepat menetas.",
            "Perawatan Hatchling (Bayi) : \n• Setelah menetas, biarkan bayi tetap di dalam wadah inkubasi selama 24 jam sampai kantung kuning telurnya terserap sempurna. \n• Pindahkan ke kandang kecil (tipe shoebox) dengan alas tisu basah. \n• Bayi biasanya baru akan mulai makan setelah ganti kulit pertama mereka (sekitar 3–5 hari setelah menetas) ",
        ],
        morphGroups: [
            {
                category: "Recessive",
                items: [
                    {
                        name: "Axanthic",
                        details: {
                            "Tampilan Fisik":
                                "Warna dasar abu-abu, perak, atau hitam-putih (grayscale) tanpa warna kuning, oranye, atau merah.",
                        },
                        geneticInfo: "Recessive",
                        image: "/images/Crested-Gecko/1-Axanthic.png",
                    },

                ],
            },
            {
                category: "Polygenic",
                items: [
                    {
                        name: "Buckskin",
                        details: {
                            "Tampilan Fisik":
                                "Tubuh didominasi warna tan atau cokelat muda (buckskin) dengan nuansa krem. Pola biasanya minimal atau sangat halus sehingga terlihat seperti warna dasar yang lembut dan natural.",
                        },
                        geneticInfo: "Polygenic (line-bred trait)",
                        image: "/images/Crested-Gecko/2-Buckskin.png",
                    },
                    {
                        name: "Bicolor",
                        details: {
                            "Tampilan Fisik":
                                "Biasanya, bagian punggung (dorsal) berwarna lebih gelap atau lebih pekat, sementara bagian samping (lateral) dan perut berwarna lebih terang atau merupakan warna yang berbeda . Pola ini bisa sangat halus, hanya berupa perbedaan satu atau dua tingkat warna dari warna dasarnya, sehingga terkadang sulit dibedakan dari Patternless . Warna yang umum ditemui adalah kombinasi seperti coklat/krem, abu-abu/putih, atau oranye/kuning.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (line-bred trait)",
                        image: "/images/Crested-Gecko/3-Bicolor.png",
                    },
                    {
                        name: "Chevron",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki pola berbentuk huruf 'V' atau panah yang berjajar rapi di sepanjang area dorsal, sementara bagian upper dan lower lateral tetap bersih dari pola (seperti Flame).",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (line-bred trait)",
                        image: "/images/Crested-Gecko/5-Chevron.png",
                    },
                    {
                        name: "Creamsicle",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki kombinasi warna oranye cerah pada area upper dan lower lateral, kontras dengan bagian dorsal yang berwarna krem putih atau kuning sangat pucat tanpa pola gelap.",
                            Mata: "Normal/ Silver/ Gold",
                        },
                        geneticInfo: "Polygenic (line-bred trait)",
                        image: "/images/Crested-Gecko/7-Creamsicle.png",
                    },
                    {
                        name: "Cold Fusion",
                        details: {
                            "Tampilan Fisik":
                                "Warna tubuh menunjukkan nuansa dingin (cool tones) seperti biru pucat, lavender, abu-abu kebiruan, atau pastel.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (line-bred color trait)",
                        image: "/images/Crested-Gecko/8-ColdFusion.png",
                    },
                    {
                        name: "Dalmatian",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki bintik-bintik hitam kecil (spot) yang tersebar secara acak di area dorsal, upper, hingga lower lateral dengan jumlah yang relatif sedikit.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (line-bred)",
                        image: "/images/Crested-Gecko/9-Dalmatian.png",
                    },
                    {
                        name: "Harlequin",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki pola kontras di area dorsal dan lower lateral. Pola pada samping tubuh (lateral) menutupi sekitar 30-50% warna dasar, serta muncul corak pada bagian kaki.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Line Bred)",
                        image: "/images/Crested-Gecko/11-Harlequin.png",
                    },
                    {
                        name: "Extreme Harlequin",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki pola kontras yang sangat luas; area upper lateral dan lower lateral tertutup pola lebih dari 80%, serta sering kali pola tersebut menyatu hingga ke bagian kaki dan perut.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Result of selective selection/ Line Bred)",
                        image: "/images/Crested-Gecko/10-ExtremeHarlequin.png",
                    },
                    {
                        name: "Furred",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki sisik ekstra yang tumbuh menonjol di sepanjang area dorsal dan upper lateral, memberikan kesan tampilan yang lebih tebal dan kasar menyerupai tekstur kain atau 'bulu' pendek.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Scale trait)",
                        image: "/images/Crested-Gecko/12-Furred.png",
                    },
                    {
                        name: "Halloween",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar tubuh hitam atau cokelat sangat gelap pada area lateral, dengan pola kontras berwarna oranye cerah pada area dorsal dan sebagian sisi tubuh.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Line Bred)",
                        image: "/images/Crested-Gecko/13-Halloween.png",
                    },
                    {
                        name: "Flame",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna dasar gelap (merah, cokelat, atau oranye) dengan pola dorsal lebih terang seperti krem, kuning, atau oranye yang menyerupai nyala api. Pola biasanya terlihat di punggung dan ekor.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Line Bred)",
                        image: "/images/Crested-Gecko/14-Flame.png",
                    },
                    {
                        name: "Lavender",
                        details: {
                            "Tampilan Fisik":
                                "Seluruh area dorsal dan lateral memiliki warna dasar abu-abu keunguan (soft purple) yang konsisten, baik saat kondisi fired up maupun fired down.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Line Bred)",
                        image: "/images/Crested-Gecko/15-Lavender.png",
                    },
                    {
                        name: "Patternless",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna tubuh yang solid dan seragam. Benar-benar bersih dari corak, bintik (spots), atau garis di seluruh bagian tubuhnya,Warna dapat berupa merah, kuning, orange, olive, chocolate, cream, hingga hampir hitam.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Selective breeding)",
                        image: "/images/Crested-Gecko/18-Patternless.png",
                    },
                    {
                        name: "Pinstripe",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki dua garis lurus menonjol (biasanya krem/putih) yang terbentuk dari sisik yang terangkat (raised scales) di sepanjang tepi dorsal, dari kepala hingga pangkal ekor.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Structural pattern trait)",
                        image: "/images/Crested-Gecko/19-Pinstripe.png",
                    },

                    {
                        name: "Fringing",
                        details: {
                            "Tampilan Fisik":
                                "Deretan sisik berwarna kontras (biasanya putih atau krem) yang membentuk garis lurus di sepanjang bagian belakang paha atau kaki belakang.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Polygenic (Trait struktural)",
                        image: "/images/Crested-Gecko/20-Fringing.png",
                    },


                ],
            },
            {
                category: "Dominant",
                items: [
                    {
                        name: "Black Base",
                        details: {
                            "Tampilan Fisik":
                                "Warna dasar tubuh berkisar dari cokelat tua hingga hitam pekat. Sering menjadi latar belakang (base color) bagi berbagai pola seperti Harlequin, Brindle, atau Phantom.",
                            Mata: "Normal, Gelap / Charcoal",
                        },
                        geneticInfo: "Dominant",
                        image: "/images/Crested-Gecko/4-BlackBase.png",
                    },
                    {
                        name: "Orange Patterning",
                        details: {
                            "Tampilan Fisik":
                                "Pola tubuh berwarna kuning-oranye hingga merah-oranye terang pada dorsal, sisi tubuh, atau kaki. Warna dapat berkisar dari light orange sampai tangerine.",
                            Mata: "Normal, Gelap / Charcoal",
                        },
                        geneticInfo: "Dominant",
                        image: "/images/Crested-Gecko/17-OrangePatterning.png",
                    },


                ],
            },
            {
                category: "Co-Dominant",
                items: [
                    {
                        name: "Cappuccino",
                        details: {
                            "Tampilan Fisik":
                                "Warna dasar biasanya cream, cokelat muda, hingga cokelat gelap dengan pola kontras lembut. Sering memiliki tanda putih berbentuk “Y” di pangkal ekor dan pola lateral yang lebih minimal.",
                            Mata: "Normal, Abu-abu gelap / Hitam",
                        },
                        geneticInfo: "Co-Dominant",
                        image: "/images/Crested-Gecko/6-Cappuccino.png",
                    },
                    {
                        name: "Lilly White",
                        details: {
                            "Tampilan Fisik":
                                "Memiliki warna putih bersih (solid white) yang sangat dominan pada area dorsal dan lateral. Bagian perut biasanya berwarna putih tanpa noda pigmen.",
                            Mata: "Normal",
                        },
                        geneticInfo: "Co-Dominant",
                        image: "/images/Crested-Gecko/16-Lilly White.png",
                    },

                ],
            },
        ],
        references: [
            'Guichenot, A. (1866). Notice sur un nouveau genre de sauriens de la famille des geckotiens du Muséum de Paris. Mémoires de la Société Scientifique Naturelle de Cherbourg.',
            'Seipp, R., & Kjellberg, P. (1994). Rhacodactylus ciliatus (Guichenot 1866) wiederentdeckt! Fernseh-und-Kino-Technik (FKT).',
            'IUCN Red List of Threatened Species. (Tahun update terakhir bisa dicek di situs resmi iucnredlist.org).',
        ],
    },
];
