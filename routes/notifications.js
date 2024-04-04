const express = require("express");
const router = express.Router();
const { Notification } = require("../models/notification");
const { User } = require("../models/user");

router.get("/:id", async (req, res) => {
  try {
    console.log(req.params.id, "user id");
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update all notifications for the user to set isRead to true
    await Notification.updateMany({ user: userId }, { isRead: true });

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
      .populate("user")
      .lean();

    // console.log(notifications);

    res.send(notifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/unread/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    console.log(unreadCount, "count");

    res.json({ unreadCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
