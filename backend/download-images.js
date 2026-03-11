const fs = require("fs");
const path = require("path");
const https = require("https");

// Folder để lưu ảnh
const imagesDir = path.join(__dirname, "uploads/images");

// Tạo folder nếu không tồn tại
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Danh sách ảnh sân bóng 
const images = [
  {
    name: "field1.jpg",
    url: "https://images.unsplash.com/photo-1516937941344-00b4e0337e9d?w=500&h=300&fit=crop",
  },
  {
    name: "field2.jpg",
    url: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=300&fit=crop",
  },
  {
    name: "field3.jpg",
    url: "https://images.unsplash.com/photo-1535747686101-042d8d8d1e5e?w=500&h=300&fit=crop",
  },
  {
    name: "field4.jpg",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop",
  },
  {
    name: "field5.jpg",
    url: "https://images.unsplash.com/photo-1516937941344-00b4e0337e9d?w=500&h=300&fit=crop",
  },
  {
    name: "field6.jpg",
    url: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=300&fit=crop",
  },
  {
    name: "field7.jpg",
    url: "https://images.unsplash.com/photo-1535747686101-042d8d8d1e5e?w=500&h=300&fit=crop",
  },
  {
    name: "field8.jpg",
    url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop",
  },
  {
    name: "field9.jpg",
    url: "https://images.unsplash.com/photo-1516937941344-00b4e0337e9d?w=500&h=300&fit=crop",
  },
  {
    name: "field10.jpg",
    url: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=300&fit=crop",
  },
  {
    name: "field11.jpg",
    url: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=300&fit=crop",
  }
];

// Hàm tải ảnh
const downloadImage = (filename, url) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(imagesDir, filename);

    // Kiểm tra nếu file đã tồn tại
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${filename} đã tồn tại, bỏ qua...`);
      resolve(filename);
      return;
    }

    const file = fs.createWriteStream(filepath);

    https
      .get(url, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`✅ Tải thành công: ${filename}`);
          resolve(filename);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}); // Xóa file nếu lỗi
        console.error(`❌ Lỗi tải ${filename}:`, err.message);
        reject(err);
      });
  });
};

// Tải tất cả ảnh
const downloadAllImages = async () => {
  console.log("\n📥 Bắt đầu tải ảnh sân bóng đá...\n");

  try {
    for (const image of images) {
      await downloadImage(image.name, image.url);
    }

    console.log("\n✅ Tất cả ảnh đã tải xong!\n");
    console.log(`📁 Ảnh được lưu tại: ${imagesDir}\n`);
  } catch (error) {
    console.error("\n❌ Có lỗi xảy ra khi tải ảnh:", error.message);
    process.exit(1);
  }
};

downloadAllImages();
