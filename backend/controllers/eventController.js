const Event = require("../models/eventModel");

// CREATE EVENT
exports.createEvent = async (req, res) => {
  try {
    const { title, description, eventDateTime, location } = req.body;
    const normalizedTitle = String(title || "").trim();
    const normalizedDescription = String(description || "").trim();
    const normalizedLocation = String(location || "").trim();
    const parsedEventDateTime = new Date(eventDateTime);

    if (!normalizedTitle || Number.isNaN(parsedEventDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "title and a valid eventDateTime are required",
      });
    }

    const newEvent = await Event.create({
      title: normalizedTitle,
      description: normalizedDescription || null,
      eventDateTime: parsedEventDateTime,
      location: normalizedLocation,
    });

    res.status(201).json({
      success: true,
      event: newEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL EVENTS
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ eventDateTime: 1 });

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE EVENT
exports.updateEvent = async (req, res) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) {
      const title = String(req.body.title || "").trim();
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "title cannot be empty",
        });
      }
      updates.title = title;
    }

    if (req.body.description !== undefined) {
      const description = String(req.body.description || "").trim();
      updates.description = description || null;
    }

    if (req.body.location !== undefined) {
      updates.location = String(req.body.location || "").trim();
    }

    if (req.body.eventDateTime !== undefined) {
      const parsedEventDateTime = new Date(req.body.eventDateTime);
      if (Number.isNaN(parsedEventDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "eventDateTime must be a valid date",
        });
      }
      updates.eventDateTime = parsedEventDateTime;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE EVENT
exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
