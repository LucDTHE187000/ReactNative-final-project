import Field from "../models/Field.js";

// 📌 Get all fields (public)
export const getAllFields = async (req, res) => {
  try {
    const fields = await Field.find({ isActive: true });
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get single field
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }
    res.json(field);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Create field (fieldOwner & admin)
export const createField = async (req, res) => {
  try {
    const { name, location, description, type, pricePerHour, capacity } = req.body;

    if (!name || !location || !type || !pricePerHour) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get image from file upload if exists
    let imageUrl = null;
    if (req.file) {
      // Path should be relative: /uploads/images/filename
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    const field = new Field({
      name,
      location,
      description,
      type,
      pricePerHour,
      capacity: capacity || 1,
      image: imageUrl,
      owner: req.user._id,
    });

    const saved = await field.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update field (fieldOwner & admin)
export const updateField = async (req, res) => {
  try {
    const { name, location, description, type, pricePerHour, capacity, isActive } = req.body;

    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Check if user is owner or admin
    if (req.user.role !== "admin" && field.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this field" });
    }

    field.name = name || field.name;
    field.location = location || field.location;
    field.description = description || field.description;
    field.type = type || field.type;
    field.pricePerHour = pricePerHour || field.pricePerHour;
    field.capacity = capacity || field.capacity;
    
    // Update image if new file is uploaded
    if (req.file) {
      field.image = `/uploads/images/${req.file.filename}`;
    }
    
    if (isActive !== undefined) field.isActive = isActive;

    const updated = await field.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Delete field (fieldOwner xóa sân của mình, admin xóa bất kỳ)
export const deleteField = async (req, res) => {
  try {
    console.log("🗑️ DELETE field request:", req.params.id, "by user:", req.user?._id, "role:", req.user?.role);
    const field = await Field.findById(req.params.id);
    if (!field) {
      console.log("🗑️ Field not found:", req.params.id);
      return res.status(404).json({ message: "Field not found" });
    }

    // fieldOwner chỉ xóa sân của chính mình, admin xóa bất kỳ
    if (req.user.role !== "admin" && field.owner.toString() !== req.user._id.toString()) {
      console.log("🗑️ Not authorized. Field owner:", field.owner, "User:", req.user._id);
      return res.status(403).json({ message: "Bạn không có quyền xóa sân này" });
    }

    await Field.findByIdAndDelete(req.params.id);
    console.log("🗑️ Field deleted successfully:", req.params.id);
    res.json({ message: "Field deleted" });
  } catch (error) {
    console.error("🗑️ Delete error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 📌 Search fields by location or type
export const searchFields = async (req, res) => {
  try {
    const { location, type } = req.query;
    let query = { isActive: true };

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    if (type) {
      query.type = type;
    }

    const fields = await Field.find(query);
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
