export const categories = {
  spunbond: {
    name: 'Spunbond',
    h1: 'Goodie Bag Spunbond Custom',
    desc: 'Tas spunbond ringan, kuat, dan bisa dipakai berulang. Cocok untuk goodie bag event, seminar, promosi brand, dan kebutuhan retail, lengkap dengan opsi sablon logo.',
    body: 'Spunbond adalah bahan kain non-woven yang ringan dan ekonomis, sehingga banyak dipilih untuk goodie bag dalam jumlah besar. Ukuran, warna, dan sablon bisa disesuaikan dengan identitas brand kamu. Untuk reseller, MOQ dan harga per pcs tertera jelas di setiap produk.',
  },
  paperbag: {
    name: 'Paperbag',
    h1: 'Paperbag Custom',
    desc: 'Paperbag dengan tampilan rapi dan premium untuk toko, hampers, souvenir, dan packaging brand. Ukuran dan desain bisa dicustom sesuai kebutuhan.',
    body: 'Paperbag memberi kesan profesional pada produk yang kamu jual atau bagikan. Cocok untuk toko fashion, kuliner, souvenir pernikahan, hingga hampers. Kamu bisa menyesuaikan ukuran, motif, dan logo agar kemasan memperkuat brand.',
  },
  coolerbag: {
    name: 'Coolerbag',
    h1: 'Coolerbag Custom',
    desc: 'Coolerbag untuk membawa makanan dan minuman tetap dingin. Cocok untuk katering, frozen food, delivery, dan merchandise brand.',
    body: 'Coolerbag banyak dipakai pelaku usaha kuliner, katering, dan toko frozen food untuk pengiriman maupun merchandise. Tersedia berbagai ukuran, dan tampilannya bisa disesuaikan dengan logo atau motif brand kamu.',
  },
} as const;
export type CategorySlug = keyof typeof categories;
