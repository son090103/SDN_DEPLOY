const User = require("./../model/User");
const Room = require("./../model/Room");
const Booking = require("./../model/UserBooking");

module.exports.createBooking = async (req, res) => {
  console.log("đang chạy vào createbooking");
  try {
    const { customerId, roomId, checkInDate, checkOutDate, status } = req.body;

    if (!customerId || !roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await User.findById(customerId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Kiểm tra room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // 4. Kiểm tra ngày hợp lệ
    const inDate = new Date(checkInDate);
    const outDate = new Date(checkOutDate);
    if (!(inDate < outDate)) {
      return res
        .status(400)
        .json({ message: "checkInDate must be earlier than checkOutDate" });
    }

    // 5. Kiểm tra phòng trống (nếu đã có booking trùng ngày thì không cho đặt)
    const overlapping = await Booking.findOne({
      roomId,
      status: { $in: ["pending", "confirmed"] },
      checkInDate: { $lt: outDate },
      checkOutDate: { $gt: inDate },
    });
    if (overlapping) {
      return res
        .status(409)
        .json({ message: "Room is not available for the selected dates" });
    }

    // 6. Tạo booking
    const booking = await Booking.create({
      customerId,
      roomId,
      checkInDate: inDate,
      checkOutDate: outDate,
      status: status ?? "pending",
    });

    // 7. Trả kết quả
    return res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};
module.exports.deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // 1. Tìm booking theo ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Kiểm tra ngày check-in
    const now = new Date();
    if (now >= booking.checkInDate) {
      return res.status(400).json({
        message: "Cannot cancel: check-in date has started or passed",
      });
    }

    // 3. Đánh dấu booking là cancelled (không xóa để giữ lịch sử)
    booking.status = "cancelled";
    await booking.save();

    // 4. Trả kết quả
    return res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
};
module.exports.getAllBooking = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find({})
        .skip(skip)
        .limit(limit)
        .populate("customerId", "name email")
        .populate("roomId", "name type"),
      Booking.countDocuments(),
    ]);

    if (total === 0) {
      return res.json({
        message: "No bookings found",
        data: [],
        pagination: { total: 0, page, limit, pages: 0 },
      });
    }

    const pages = Math.ceil(total / limit);

    res.json({
      data: bookings,
      pagination: {
        total, // tổng số booking
        page, // trang hiện tại
        limit, // số bản ghi mỗi trang
        pages, // tổng số trang
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

module.exports.getBookingsByDate = async (req, res) => {
  try {
    const { start, end } = req.query;

    // 1. Kiểm tra tham số bắt buộc
    if (!start || !end) {
      return res
        .status(400)
        .json({
          message: "start and end query params are required (ISO date string)",
        });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // 2. Ràng buộc: start < end
    if (!(startDate < endDate)) {
      return res
        .status(400)
        .json({ message: "checkInDate must be earlier than checkOutDate" });
    }

    // 3. Tìm booking có khoảng ngày chồng lấn với [start, end)
    // Điều kiện: checkInDate < end AND checkOutDate > start
    const bookings = await Booking.find({
      checkInDate: { $lt: endDate },
      checkOutDate: { $gt: startDate },
    })
      .sort({ checkInDate: 1 })
      .populate("customerId", "name email")
      .populate("roomId", "name type");

    // 4. Nếu không có
    if (bookings.length === 0) {
      return res.json({
        message: "No bookings found in this date range",
        data: [],
      });
    }

    // 5. Trả kết quả
    res.json({
      data: bookings,
      count: bookings.length,
      range: { start: startDate, end: endDate },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};
