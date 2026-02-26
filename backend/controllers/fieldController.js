const Field = require("../models/Field");

// 📌 Get all fields (public)
exports.getAllFields = async (req, res) => {
  try {
    const fields = await Field.find({ isActive: true }).select("-owner");
    res.json(fields);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Get single field
exports.getFieldById = async (req, res) => {
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

// 📌 Create field (admin only)
exports.createField = async (req, res) => {
  try {
    const { name, location, description, type, pricePerHour, capacity, image } = req.body;

    if (!name || !location || !type || !pricePerHour) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const field = new Field({
      name,
      location,
      description,
      type,
      pricePerHour,
      capacity: capacity || 1,
      image,
      owner: req.user._id,
    });

    const saved = await field.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Update field (admin only)
exports.updateField = async (req, res) => {
  try {
    const { name, location, description, type, pricePerHour, capacity, image, isActive } = req.body;

    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Check if user is owner
    if (field.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this field" });
    }

    field.name = name || field.name;
    field.location = location || field.location;
    field.description = description || field.description;
    field.type = type || field.type;
    field.pricePerHour = pricePerHour || field.pricePerHour;
    field.capacity = capacity || field.capacity;
    field.image = image || field.image;
    if (isActive !== undefined) field.isActive = isActive;

    const updated = await field.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Delete field (admin only)
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // Check if user is owner
    if (field.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this field" });
    }

    await Field.findByIdAndDelete(req.params.id);
    res.json({ message: "Field deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Search fields by location or type
exports.searchFields = async (req, res) => {
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
